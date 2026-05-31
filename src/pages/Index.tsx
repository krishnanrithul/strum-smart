import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MiniLogo from "@/components/MiniLogo";
import WaveformLoader from "@/components/WaveformLoader";
import { Link, useNavigate } from "react-router-dom";
import { StorageService, Exercise } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { redeemInviteCode } from "@/hooks/useInviteCode";

const formatRelativeTime = (iso: string | null): string => {
  if (!iso) return "Never practiced";
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diffDays === 0) return "Last practiced: Today";
  if (diffDays === 1) return "Last practiced: Yesterday";
  if (diffDays < 7) return `Last practiced: ${diffDays} days ago`;
  if (diffDays < 14) return "Last practiced: 1 week ago";
  if (diffDays < 30) return `Last practiced: ${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return "Last practiced: 1 month ago";
  return `Last practiced: ${Math.floor(diffDays / 30)} months ago`;
};

const Index = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [statsLoading, setStatsLoading] = useState(true);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [personalBestBpm, setPersonalBestBpm] = useState(0);
  const [personalBestExercise, setPersonalBestExercise] = useState<string | null>(null);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([]);
  const [teacherId, setTeacherId] = useState<string | null | undefined>(undefined);
  const [bannerExpanded, setBannerExpanded] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeSubmitting, setCodeSubmitting] = useState(false);
  const [connectedTeacherName, setConnectedTeacherName] = useState<string | null>(null);
  const [hoveredExerciseId, setHoveredExerciseId] = useState<string | null>(null);
  const [completeConfirmExercise, setCompleteConfirmExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    if (!session) {
      setStatsLoading(false);
      return;
    }

    const loadData = async () => {
      setStatsLoading(true);
      try {
        const [{ data: sessionRows }, exercises, { data: profile }] = await Promise.all([
          supabase
            .from("sessions")
            .select("duration, created_at")
            .eq("user_id", session.user.id),
          StorageService.getExercises(),
          (supabase as any)
            .from("profiles")
            .select("teacher_id, full_name")
            .eq("id", session.user.id)
            .single(),
        ]);
        setTeacherId(profile?.teacher_id ?? null);
        const fullName: string | null = profile?.full_name ?? null;
        setFirstName(fullName ? fullName.split(" ")[0] : null);

        const rows = sessionRows || [];

        // Personal Best BPM — max across session history entries (skip index 0, which is the creation entry)
        let bestBpm = 0;
        let bestExercise: string | null = null;
        for (const e of exercises) {
          for (const h of e.history.slice(1)) {
            if (h.bpm > bestBpm) {
              bestBpm = h.bpm;
              bestExercise = e.title;
            }
          }
        }

        // Today's practice time (local timezone)
        const todayStr = new Date().toLocaleDateString("en-CA");
        const todaySecs = rows
          .filter((r) => new Date(r.created_at).toLocaleDateString("en-CA") === todayStr)
          .reduce((acc, r) => acc + (r.duration || 0), 0);

        // Current streak
        const uniqueDays = [...new Set(
          rows.map((r) => new Date(r.created_at).toLocaleDateString("en-CA"))
        )].sort().reverse();
        const now = new Date();
        const yesterdayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
          .toLocaleDateString("en-CA");
        let streak = 0;
        if (uniqueDays.includes(todayStr) || uniqueDays.includes(yesterdayStr)) {
          const startDate = new Date(
            uniqueDays.includes(todayStr) ? todayStr : yesterdayStr
          );
          let check = new Date(startDate);
          while (uniqueDays.includes(check.toLocaleDateString("en-CA"))) {
            streak++;
            check.setDate(check.getDate() - 1);
          }
        }

        setPersonalBestBpm(bestBpm);
        setPersonalBestExercise(bestExercise);
        setTodayMinutes(Math.floor(todaySecs / 60));
        setCurrentStreak(streak);

        const inProgress = exercises
          .filter((e) => e.status === "In Progress" || e.status === "New")
          .sort((a, b) => {
            if (a.status !== b.status) return a.status === "In Progress" ? -1 : 1;
            const lastA = a.history[a.history.length - 1]?.date ?? "";
            const lastB = b.history[b.history.length - 1]?.date ?? "";
            return new Date(lastB).getTime() - new Date(lastA).getTime();
          })
          .slice(0, 5);

        setRecentExercises(inProgress);
      } finally {
        setStatsLoading(false);
      }
    };

    loadData();
  }, [session]);

  const handleMarkComplete = async (exercise: Exercise) => {
    await supabase.from("exercises").update({ status: "Completed" }).eq("id", exercise.id);
    setRecentExercises(prev => prev.filter(e => e.id !== exercise.id));
    setCompleteConfirmExercise(null);
  };

  const handleLinkToTeacher = async () => {
    if (!session || inviteInput.length !== 6) return;
    setCodeSubmitting(true);
    setCodeError("");
    try {
      const { teacherName } = await redeemInviteCode(inviteInput.trim(), session.user.id);
      setConnectedTeacherName(teacherName ?? "");
      setTimeout(() => setTeacherId("linked"), 2000);
    } catch {
      setCodeError("That code didn't work — check with your teacher.");
    } finally {
      setCodeSubmitting(false);
    }
  };

  const renderExerciseCard = (exercise: Exercise) => {
    const history = exercise.history;
    const lastBpm = history.length > 0 ? history[history.length - 1].bpm : exercise.currentBpm;
    const prevBpm = history.length > 1 ? history[history.length - 2].bpm : lastBpm;
    const progress = getBpmProgress(exercise);
    return (
      <Link key={exercise.id} to={`/practice/${exercise.id}`} className="block">
        <div
          className="rounded-xl p-4 cursor-pointer relative overflow-hidden transition-all duration-300"
          onMouseEnter={() => setHoveredExerciseId(exercise.id)}
          onMouseLeave={() => setHoveredExerciseId(null)}
          style={{
            background: hoveredExerciseId === exercise.id
              ? "linear-gradient(135deg, rgba(52,211,153,0.18) 0%, rgba(255,255,255,0.03) 100%)"
              : "rgba(255,255,255,0.03)",
            border: `1px solid ${hoveredExerciseId === exercise.id ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.06)"}`,
            transform: hoveredExerciseId === exercise.id ? "translateY(-2px)" : "translateY(0)",
            boxShadow: hoveredExerciseId === exercise.id ? "0 8px 24px rgba(52,211,153,0.18)" : "none",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-px transition-opacity duration-300"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.6), transparent)",
              opacity: hoveredExerciseId === exercise.id ? 1 : 0,
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-base">{exercise.title}</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-sm text-muted-foreground">{exercise.category}</span>
                  {exercise.is_assigned && (
                    <>
                      <span className="text-xs text-muted-foreground"> · </span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-primary">From Teacher</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(history.length > 1 ? history[history.length - 1].date : null)}</p>
              </div>
              <p className="text-xl font-black text-primary leading-none">{lastBpm}</p>
            </div>
            {prevBpm !== lastBpm && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center gap-0.5 text-xs">
                  <span className="text-muted-foreground">{prevBpm} →&nbsp;</span>
                  <span className="text-foreground font-semibold">{lastBpm}</span>
                  <span className="text-muted-foreground">&nbsp;BPM</span>
                </div>
              </div>
            )}
            <div className="flex justify-end mt-2">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCompleteConfirmExercise(exercise); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Mark complete
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  const getBpmProgress = (exercise: Exercise) => {
    const current = exercise.currentBpm;
    const target = exercise.targetBpm;
    const initial = exercise.history[0]?.bpm ?? current;
    if (target <= initial) return 0;
    return Math.min(100, Math.round(((current - initial) / (target - initial)) * 100));
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-6 space-y-10">

        {firstName && <p className="text-2xl font-bold mb-4">Hey, {firstName}.</p>}

        {/* Hero stat — Today's Max BPM */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-green-950 border border-border p-6 sm:p-8">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">Personal Best</p>
            {statsLoading ? (
              <div className="flex items-center py-4">
                <WaveformLoader />
              </div>
            ) : (
              <>
                <div className="flex items-end gap-3">
                  <span
                    className="text-6xl sm:text-8xl font-black text-primary leading-none"
                    style={{ textShadow: "0 0 40px hsl(var(--primary) / 0.4)" }}
                  >
                    {personalBestBpm > 0 ? personalBestBpm : "—"}
                  </span>
                  {personalBestBpm > 0 && (
                    <span className="text-2xl font-semibold text-muted-foreground mb-3">BPM</span>
                  )}
                </div>
                {personalBestBpm > 0 && personalBestExercise && (
                  <p className="text-sm text-muted-foreground mt-2">on {personalBestExercise}</p>
                )}
                <div className="flex items-center gap-6 mt-8 pt-6 border-t border-border">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider">Today</p>
                    <p className="text-xl font-bold mt-1">
                      {todayMinutes < 60 ? `${todayMinutes}m` : `${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60}m`}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider">Streak</p>
                    <p className="text-xl font-bold mt-1">{currentStreak} {currentStreak === 1 ? "day" : "days"}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* CTA */}
        <Link to="/practice/free">
          <button className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity">
            <div className="flex items-center gap-2">
              <MiniLogo color="#0a0a0a" />
              Start Practice
            </div>
            <ChevronRight className="h-5 w-5 opacity-70" />
          </button>
        </Link>

        {/* Teacher link banner */}
        {teacherId === null && (
          <div
            className="rounded-2xl p-4"
            style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Have a teacher?</span>
              {!bannerExpanded && (
                <button
                  onClick={() => setBannerExpanded(true)}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Enter Code
                </button>
              )}
            </div>
            {connectedTeacherName !== null && (
              <p className="text-sm text-primary font-medium mt-3 text-center">
                {connectedTeacherName
                  ? `You're connected to ${connectedTeacherName}.`
                  : "You're connected to your teacher."}
              </p>
            )}
            {bannerExpanded && connectedTeacherName === null && (
              <div className="mt-3 space-y-3">
                <input
                  type="text"
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="XXXXXX"
                  maxLength={6}
                  className="w-full text-center text-2xl font-mono font-semibold tracking-[0.3em] rounded-xl py-3 bg-transparent outline-none focus:ring-1 focus:ring-primary transition-colors text-foreground"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                />
                {codeError && (
                  <p className="text-xs text-destructive">{codeError}</p>
                )}
                <button
                  onClick={handleLinkToTeacher}
                  disabled={codeSubmitting || inviteInput.length !== 6}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {codeSubmitting ? "Linking…" : "Link to Teacher"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* My Exercises */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">My Exercises</h2>
            </div>
            <button
              onClick={() => navigate("/library")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              See All
            </button>
          </div>

          {recentExercises.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              <p className="text-sm">No exercises yet.</p>
              <p className="text-xs mt-1">Head to Library to get started.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {recentExercises.filter(e => e.is_assigned).length > 0 && (
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-4">From Your Teacher</p>
                  <div className="space-y-4">
                    {recentExercises.filter(e => e.is_assigned).map(renderExerciseCard)}
                  </div>
                </div>
              )}
              {recentExercises.filter(e => !e.is_assigned).length > 0 && (
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-4">Added By You</p>
                  <div className="space-y-4">
                    {(() => {
                      const categoryOrder: Record<string, number> = { Warmup: 0, Technical: 1, Repertoire: 2 };
                      return recentExercises
                        .filter(e => !e.is_assigned)
                        .sort((a, b) => (categoryOrder[a.category] ?? 99) - (categoryOrder[b.category] ?? 99));
                    })().map(renderExerciseCard)}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {completeConfirmExercise && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setCompleteConfirmExercise(null)}
        >
          <div
            className="w-full max-w-sm mx-4 rounded-2xl p-6 space-y-4"
            style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.08)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-semibold text-foreground">Mark as complete?</p>
            <p className="text-sm text-muted-foreground">
              This will move <span className="text-foreground font-medium">{completeConfirmExercise.title}</span> to your completed exercises.
            </p>
            <button
              onClick={() => handleMarkComplete(completeConfirmExercise)}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Complete Exercise
            </button>
            <button
              onClick={() => setCompleteConfirmExercise(null)}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;