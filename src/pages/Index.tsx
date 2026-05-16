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

const Index = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [statsLoading, setStatsLoading] = useState(true);
  const [todayPeakBpm, setTodayPeakBpm] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([]);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null | undefined>(undefined);
  const [bannerExpanded, setBannerExpanded] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeSubmitting, setCodeSubmitting] = useState(false);
  const [hoveredExerciseId, setHoveredExerciseId] = useState<string | null>(null);

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
            .select("duration, date")
            .eq("user_id", session.user.id),
          StorageService.getExercises(),
          (supabase as any)
            .from("profiles")
            .select("teacher_id")
            .eq("id", session.user.id)
            .single(),
        ]);
        setTeacherId(profile?.teacher_id ?? null);

        const rows = sessionRows || [];
        const today = new Date().toISOString().split("T")[0];

        const peakToday = exercises.reduce((max, e) => {
          const todayBpms = e.history
            .filter((h) => h.date.startsWith(today))
            .map((h) => h.bpm);
          return todayBpms.length ? Math.max(max, ...todayBpms) : max;
        }, 0);

        const totalSecs = rows.reduce((acc, r) => acc + (r.duration || 0), 0);

        setTodayPeakBpm(peakToday);
        setTotalMinutes(Math.floor(totalSecs / 60));
        setTotalSessions(rows.length);

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

  const handleLinkToTeacher = async () => {
    if (!session || inviteInput.length !== 6) return;
    setCodeSubmitting(true);
    setCodeError("");
    try {
      await redeemInviteCode(inviteInput.trim(), session.user.id);
      setTeacherId("linked");
    } catch {
      setCodeError("That code didn't work — check with your teacher.");
    } finally {
      setCodeSubmitting(false);
    }
  };

  const handleClearAll = async () => {
    if (!clearConfirm) { setClearConfirm(true); return; }
    const all = await StorageService.getExercises();
    await Promise.all(all.map((e) => StorageService.deleteExercise(e.id)));
    setRecentExercises([]);
    setClearConfirm(false);
  };

  const renderExerciseCard = (exercise: Exercise) => {
    const history = exercise.history;
    const lastBpm = history.length > 0 ? history[history.length - 1].bpm : exercise.currentBpm;
    const prevBpm = history.length > 1 ? history[history.length - 2].bpm : lastBpm;
    const progress = getBpmProgress(exercise);
    return (
      <Link key={exercise.id} to={`/practice/${exercise.id}`}>
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
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-sm">{exercise.title}</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs text-muted-foreground">{exercise.category}</span>
                  {exercise.is_assigned && (
                    <>
                      <span className="text-xs text-muted-foreground"> · </span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-primary">From Teacher</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-primary">{lastBpm}</p>
                <p className="text-xs text-muted-foreground">BPM</p>
              </div>
            </div>
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

      <main className="container mx-auto px-4 py-6 space-y-6">

        {/* Hero stat — Today's Max BPM */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-green-50 dark:from-zinc-900 dark:to-green-950 border border-border p-6">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Today's Peak</p>
            {statsLoading ? (
              <div className="flex items-center py-4">
                <WaveformLoader />
              </div>
            ) : (
              <>
                <div className="flex items-end gap-3">
                  <span
                    className="text-8xl font-black text-primary leading-none"
                    style={{ textShadow: "0 0 40px hsl(var(--primary) / 0.4)" }}
                  >
                    {todayPeakBpm > 0 ? todayPeakBpm : "—"}
                  </span>
                  {todayPeakBpm > 0 && (
                    <span className="text-2xl font-semibold text-muted-foreground mb-3">BPM</span>
                  )}
                </div>
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Practice Time</p>
                    <p className="text-xl font-bold mt-0.5">{totalMinutes}m</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Sessions</p>
                    <p className="text-xl font-bold mt-0.5">{totalSessions}</p>
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
            {bannerExpanded && (
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
            <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">My Exercises</h2>
            <div className="flex items-center gap-2">
              {recentExercises.length > 0 && (
                <button
                  onClick={handleClearAll}
                  onBlur={() => setClearConfirm(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={clearConfirm
                    ? { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "rgb(239,68,68)" }
                    : { background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "rgb(239,68,68)" }}
                >
                  {clearConfirm ? "Confirm?" : "Clear All"}
                </button>
              )}
              <button
                onClick={() => navigate("/library")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                See All
              </button>
            </div>
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
                  <div className="space-y-3">
                    {recentExercises.filter(e => e.is_assigned).map(renderExerciseCard)}
                  </div>
                </div>
              )}
              {recentExercises.filter(e => !e.is_assigned).length > 0 && (
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-4">Added By You</p>
                  <div className="space-y-3">
                    {recentExercises.filter(e => !e.is_assigned).map(renderExerciseCard)}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;