import { useState, useEffect, useRef } from "react";
import { ChevronRight, Play } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MiniLogo from "@/components/MiniLogo";
import WaveformLoader from "@/components/WaveformLoader";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { StorageService, Exercise, clearCache } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { redeemInviteCode } from "@/hooks/useInviteCode";
import { useCountUp } from "@/hooks/useCountUp";


const formatRelativeTime = (iso: string): string => {
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diffDays === 0) return "Practiced today";
  if (diffDays === 1) return "Practiced yesterday";
  if (diffDays < 7) return `Practiced ${diffDays} days ago`;
  if (diffDays < 14) return "Practiced 1 week ago";
  if (diffDays < 30) return `Practiced ${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return "Practiced 1 month ago";
  return `Practiced ${Math.floor(diffDays / 30)} months ago`;
};

const Index = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
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
  const [completeConfirmExercise, setCompleteConfirmExercise] = useState<Exercise | null>(null);
  const [flashingExerciseId, setFlashingExerciseId] = useState<string | null>(null);
  const [hoveredExerciseId, setHoveredExerciseId] = useState<string | null>(null);
  const longPressTimer = useRef<number | null>(null);

  const loadData = async () => {
    if (!session) {
      setStatsLoading(false);
      return;
    }
    clearCache();
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

      if (exercises.length === 0) {
        setPersonalBestBpm(0);
        setPersonalBestExercise(null);
        setRecentExercises([]);
      } else {
        const activeExercises = exercises.filter(e => e.status !== "Completed" && e.history.length >= 2);
        const bestExerciseObj = activeExercises.reduce<{ title: string; bpm: number } | null>(
          (best, e) => {
            const maxBpm = Math.max(...e.history.map(h => h.bpm));
            return maxBpm > (best?.bpm ?? 0) ? { title: e.title, bpm: maxBpm } : best;
          },
          null
        );
        setPersonalBestBpm(bestExerciseObj?.bpm ?? 0);
        setPersonalBestExercise(bestExerciseObj?.title ?? null);

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

      setTodayMinutes(Math.floor(todaySecs / 60));
      setCurrentStreak(streak);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session]);

  useEffect(() => {
    if (pathname === "/") loadData();
  }, [pathname]);


  const handleConfirmComplete = () => {
    if (!completeConfirmExercise) return;
    const exerciseId = completeConfirmExercise.id;
    setCompleteConfirmExercise(null);
    setFlashingExerciseId(exerciseId);
    setTimeout(async () => {
      setFlashingExerciseId(null);
      await supabase.from("exercises").update({ status: "Completed" }).eq("id", exerciseId);
      setRecentExercises(prev => prev.filter(e => e.id !== exerciseId));
    }, 400);
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

  const getBpmProgress = (exercise: Exercise) => {
    const current = exercise.currentBpm;
    const target = exercise.targetBpm;
    const initial = exercise.history[0]?.bpm ?? current;
    if (current <= initial) return 0;
    if (!target || target <= initial) {
      return Math.min(100, Math.round(((current - initial) / initial) * 100));
    }
    return Math.min(100, Math.round(((current - initial) / (target - initial)) * 100));
  };

  // Up next — teacher-assigned & never practiced wins, else least recently practiced
  const upNextExercise = (() => {
    if (recentExercises.length === 0) return null;
    const unpracticedAssigned = recentExercises.find(e => e.is_assigned && e.history.length <= 1);
    if (unpracticedAssigned) return unpracticedAssigned;
    return [...recentExercises].sort((a, b) => {
      const lastA = a.history[a.history.length - 1]?.date ?? "";
      const lastB = b.history[b.history.length - 1]?.date ?? "";
      return new Date(lastA).getTime() - new Date(lastB).getTime();
    })[0];
  })();

  const renderExerciseCard = (exercise: Exercise, featured = false) => {
    const isHovered = hoveredExerciseId === exercise.id;
    const alpha = featured ? (isHovered ? 0.55 : 0.45) : (isHovered ? 0.4 : 0.3);
    const categoryGradient =
      exercise.category === "Warmup"
        ? `radial-gradient(circle at top right, rgba(234,179,8,${alpha}) 0%, rgba(0,0,0,0.8) 60%)`
        : exercise.category === "Technical"
        ? `radial-gradient(circle at top right, rgba(59,130,246,${alpha}) 0%, rgba(0,0,0,0.8) 60%)`
        : exercise.category === "Repertoire"
        ? `radial-gradient(circle at top right, rgba(168,85,247,${alpha}) 0%, rgba(0,0,0,0.8) 60%)`
        : `radial-gradient(circle at top right, rgba(255,255,255,${isHovered ? 0.2 : 0.1}) 0%, rgba(0,0,0,0.8) 60%)`;

    return (
      <div
        key={exercise.id}
        className="rounded-2xl overflow-hidden relative cursor-pointer"
        style={{
          height: featured ? "180px" : "120px",
          background: categoryGradient,
          border: isHovered ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.08)",
          transform: isHovered ? "translateY(-2px)" : "translateY(0)",
          boxShadow: isHovered ? "0 8px 24px rgba(0,0,0,0.4)" : "none",
          transition: "all 200ms ease",
        }}
        onClick={() => navigate(`/practice/${exercise.id}`)}
        onMouseEnter={() => setHoveredExerciseId(exercise.id)}
        onMouseDown={() => {
          longPressTimer.current = window.setTimeout(() => setCompleteConfirmExercise(exercise), 500);
        }}
        onMouseUp={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
        onMouseLeave={() => {
          setHoveredExerciseId(null);
          if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
        }}
      >
        {/* Ghost text */}
        <span
          className="absolute font-black text-white select-none pointer-events-none leading-none"
          style={{ fontSize: "64px", opacity: 0.04, top: "-8px", right: "-4px" }}
        >
          {exercise.category}
        </span>

        {featured && (
          <span className="absolute top-3 left-4 z-20 text-[10px] font-semibold tracking-widest uppercase text-primary">
            Suggested
          </span>
        )}

        {featured && (
          <div
            className="absolute right-4 top-1/2 z-20 w-12 h-12 rounded-full bg-primary flex items-center justify-center pointer-events-none"
            style={{
              transform: `translateY(-50%) scale(${isHovered ? 1.12 : 1})`,
              boxShadow: "0 4px 16px rgba(34,197,94,0.4)",
              transition: "transform 200ms ease",
            }}
          >
            <Play className="h-5 w-5 text-primary-foreground ml-0.5" fill="currentColor" />
          </div>
        )}

        {/* Right scrim behind BPM */}
        <div
          className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, rgba(0,0,0,0.6) 0%, transparent 100%)" }}
        />

        {/* Flash overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={flashingExerciseId === exercise.id
            ? { background: "rgba(34,197,94,0.25)", animation: "flashPulse 300ms ease-out forwards" }
            : { opacity: 0 }
          }
        />

        {/* Content */}
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-30 overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${getBpmProgress(exercise)}%`,
              background: exercise.category === "Warmup" ? "#eab308"
                : exercise.category === "Technical" ? "#3b82f6"
                : exercise.category === "Repertoire" ? "#a855f7"
                : "#22c55e",
            }}
          />
          {/* One-time shimmer sweep */}
          <div
            className="absolute inset-y-0 left-0 w-2/5 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
              animation: "shimmer 1.2s ease-out 500ms 1 both",
            }}
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between z-20">
          <div>
            <h3 className={`${featured ? "text-xl" : "text-base"} font-bold text-white leading-tight`}>{exercise.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{exercise.category}</p>
            {exercise.history[exercise.history.length - 1]?.date && (
              <p className="text-xs text-muted-foreground">{formatRelativeTime(exercise.history[exercise.history.length - 1].date)}</p>
            )}
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl font-black text-white leading-none">{exercise.currentBpm}</span>
            <span className="text-xs text-muted-foreground leading-none mt-0.5">BPM</span>
          </div>
        </div>
      </div>
    );
  };


  const heroValue = useCountUp(todayMinutes > 0 ? todayMinutes : currentStreak, !statsLoading);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-6 space-y-10">

        {firstName && (
          <p className="text-2xl font-bold text-white mb-4" style={{ animation: "fadeUp 400ms ease-out both" }}>
            {(() => {
              const hour = new Date().getHours();
              return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
            })()}, {firstName}.
          </p>
        )}

        {/* Hero stat — Today's Max BPM */}
        <section
          className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid rgba(255,255,255,0.05)",
            animation: "fadeUp 400ms ease-out both",
            animationDelay: "70ms",
          }}
        >
          {/* Ambient drifting glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              inset: "-40%",
              background: "radial-gradient(circle at 70% 25%, rgba(34,197,94,0.22) 0%, transparent 55%)",
              animation: "heroDrift 9s ease-in-out infinite alternate",
            }}
          />

          <div className="relative">
            {statsLoading ? (
              <div className="flex items-center py-4">
                <WaveformLoader />
              </div>
            ) : todayMinutes > 0 ? (
              <>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">Today</p>
                <div className="flex items-end gap-3">
                  <span
                    className="text-6xl sm:text-8xl font-black text-primary leading-none"
                    style={{ textShadow: "0 0 40px hsl(var(--primary) / 0.4)" }}
                  >
                    {heroValue < 60 ? heroValue : `${Math.floor(heroValue / 60)}h ${heroValue % 60}`}
                  </span>
                  <span className="text-2xl font-semibold text-muted-foreground mb-3">min</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Great work — keep it going.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">Streak</p>
                <div className="flex items-end gap-3">
                  <span
                    className="text-6xl sm:text-8xl font-black text-primary leading-none"
                    style={{ textShadow: "0 0 40px hsl(var(--primary) / 0.4)" }}
                  >
                    {heroValue}
                  </span>
                  <span className="text-2xl font-semibold text-muted-foreground mb-3">{currentStreak === 1 ? "day" : "days"}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {currentStreak > 0
                    ? "You haven't practiced today — keep your streak alive."
                    : "Practice today to start a streak."}
                </p>
              </>
            )}
            {!statsLoading && (
              <div className="flex items-center gap-10 mt-8 pt-6 border-t border-border">
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Personal Best</p>
                  <p className="text-3xl font-black text-white leading-none mt-1 whitespace-nowrap">
                    {personalBestBpm > 0 ? `${personalBestBpm} BPM` : "—"}
                  </p>
                  {personalBestBpm > 0 && personalBestExercise && (
                    <p className="text-xs text-muted-foreground mt-1">on {personalBestExercise}</p>
                  )}
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  {todayMinutes > 0 ? (
                    <>
                      <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Streak</p>
                      <p className="text-3xl font-black text-white leading-none mt-1 whitespace-nowrap">{currentStreak} {currentStreak === 1 ? "day" : "days"}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Today</p>
                      <p className="text-3xl font-black text-white leading-none mt-1 whitespace-nowrap">0m</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <Link to="/practice/free" style={{ display: "block", animation: "fadeUp 400ms ease-out both", animationDelay: "140ms" }}>
          <button
            className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity"
            style={{ animation: "ctaBreathe 3s ease-in-out infinite" }}
          >
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
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.03)",
              animation: "fadeUp 400ms ease-out both",
              animationDelay: "210ms",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Have a teacher?</span>
              {!bannerExpanded && (
                <button
                  onClick={() => setBannerExpanded(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground hover:bg-white/5 transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.15)" }}
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
        <section style={{ animation: "fadeUp 400ms ease-out both", animationDelay: "280ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">My Exercises</h2>
            </div>
            <button
              onClick={() => navigate("/library")}
              className="flex items-center gap-0.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              See All <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recentExercises.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              <p className="text-sm">No exercises yet.</p>
              <p className="text-xs mt-1">Head to Library to get started.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {upNextExercise && (
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-4">Up Next</p>
                  {renderExerciseCard(upNextExercise, true)}
                </div>
              )}
              {recentExercises.filter(e => e.is_assigned && e.id !== upNextExercise?.id).length > 0 && (
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-4">From Your Teacher</p>
                  <div className="space-y-4">
                    {recentExercises.filter(e => e.is_assigned && e.id !== upNextExercise?.id).map(e => renderExerciseCard(e))}
                  </div>
                </div>
              )}
              {recentExercises.filter(e => !e.is_assigned && e.id !== upNextExercise?.id).length > 0 && (
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-4">Added By You</p>
                  <div className="space-y-4">
                    {(() => {
                      const categoryOrder: Record<string, number> = { Warmup: 0, Technical: 1, Repertoire: 2 };
                      return recentExercises
                        .filter(e => !e.is_assigned && e.id !== upNextExercise?.id)
                        .sort((a, b) => (categoryOrder[a.category] ?? 99) - (categoryOrder[b.category] ?? 99));
                    })().map(e => renderExerciseCard(e))}
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
              onClick={() => {
                handleConfirmComplete();
              }}
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
      <style>{`
        @keyframes flashPulse { 0% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes heroDrift { from { transform: translate(0, 0); } to { transform: translate(-6%, 5%); } }
        @keyframes ctaBreathe {
          0%, 100% { box-shadow: 0 0 0px rgba(34,197,94,0); }
          50% { box-shadow: 0 0 24px rgba(34,197,94,0.35); }
        }
        @keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(350%); } }
        @media (prefers-reduced-motion: reduce) {
          main *, main { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>
    </div>
  );
};

export default Index;