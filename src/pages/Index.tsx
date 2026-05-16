import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import AppHeader from "@/components/AppHeader";
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
  const [personalBestBpm, setPersonalBestBpm] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([]);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null | undefined>(undefined);
  const [bannerExpanded, setBannerExpanded] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeSubmitting, setCodeSubmitting] = useState(false);

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
            .select("bpm_reached, duration, created_at")
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

        // Personal Best BPM
        const bestBpm = rows.reduce((max, r) => Math.max(max, r.bpm_reached || 0), 0);

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
      <Link key={exercise.id} to={`/practice/${exercise.id}`} className="block">
        <div className="border-b border-zinc-900 py-5 px-1 cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-base font-medium text-zinc-100">{exercise.title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] tracking-widest text-zinc-600 uppercase">{exercise.category}</span>
                {exercise.is_assigned && (
                  <span className="text-[10px] tracking-widest text-green-700 uppercase">From Teacher</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-mono text-green-400">{lastBpm}</span>
              <span className="text-xs text-zinc-600 ml-1">BPM</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-900 overflow-hidden">
              <div
                className="h-full bg-green-800 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-zinc-600">{prevBpm} → {lastBpm} BPM</span>
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
    <div className="min-h-screen bg-zinc-950">
      <AppHeader />

      <main className="container mx-auto px-4 pt-8 pb-6">

        {/* Hero stat — Personal Best BPM */}
        <section className="pb-4">
          <p className="text-[10px] tracking-[0.4em] text-zinc-600 uppercase mb-3">Personal Best</p>
          {statsLoading ? (
            <div className="flex items-center py-4">
              <WaveformLoader />
            </div>
          ) : (
            <>
              <div className="flex items-end gap-3">
                <span className="text-8xl font-mono font-bold text-green-400 leading-none">
                  {personalBestBpm > 0 ? personalBestBpm : "—"}
                </span>
                {personalBestBpm > 0 && (
                  <span className="text-sm font-mono text-zinc-600 mb-3">BPM</span>
                )}
              </div>
              <div className="flex items-center gap-6 mt-8 pt-6 border-t border-zinc-800">
                <div>
                  <p className="text-[10px] tracking-[0.4em] text-zinc-600 uppercase">Today</p>
                  <p className="text-2xl font-mono mt-1 text-zinc-100">
                    {todayMinutes < 60 ? `${todayMinutes}m` : `${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60}m`}
                  </p>
                </div>
                <div className="w-px h-8 bg-zinc-800" />
                <div>
                  <p className="text-[10px] tracking-[0.4em] text-zinc-600 uppercase">Streak</p>
                  <p className="text-2xl font-mono mt-1 text-zinc-100">{currentStreak} days</p>
                </div>
              </div>
            </>
          )}
        </section>

        {/* CTA */}
        <Link to="/practice/free" className="block">
          <button className="w-full flex items-center justify-between px-5 py-4 rounded-sm bg-green-700 text-white font-semibold text-base hover:bg-green-600 transition-colors">
            Start Practice
            <ChevronRight className="h-5 w-5 opacity-70" />
          </button>
        </Link>

        {/* Teacher link banner */}
        {teacherId === null && (
          <div
            className="mt-8 p-4"
            style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-500">Have a teacher?</span>
              {!bannerExpanded && (
                <button
                  onClick={() => setBannerExpanded(true)}
                  className="px-3 py-1.5 rounded-sm bg-zinc-800 text-zinc-100 text-xs font-semibold hover:bg-zinc-700 transition-colors"
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
                  className="w-full text-center text-2xl font-mono font-semibold tracking-[0.3em] rounded-sm py-3 bg-transparent outline-none focus:ring-1 focus:ring-green-700 transition-colors text-zinc-100"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                />
                {codeError && (
                  <p className="text-xs text-red-500">{codeError}</p>
                )}
                <button
                  onClick={handleLinkToTeacher}
                  disabled={codeSubmitting || inviteInput.length !== 6}
                  className="w-full py-3 rounded-sm bg-green-700 text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {codeSubmitting ? "Linking…" : "Link to Teacher"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Exercises */}
        <section className="mt-8">
          {recentExercises.length === 0 ? (
            <div className="border border-dashed border-zinc-900 py-8 text-center">
              <p className="text-sm text-zinc-600">No exercises yet.</p>
              <p className="text-xs mt-1 text-zinc-700">Head to Library to get started.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {recentExercises.filter(e => e.is_assigned).length > 0 && (
                <div>
                  <p className="text-[10px] tracking-[0.5em] text-zinc-700 uppercase mb-4">From Your Teacher</p>
                  <div>
                    {recentExercises.filter(e => e.is_assigned).map(renderExerciseCard)}
                  </div>
                </div>
              )}
              {recentExercises.filter(e => !e.is_assigned).length > 0 && (
                <div>
                  <p className="text-[10px] tracking-[0.5em] text-zinc-700 uppercase mb-4">Added By You</p>
                  <div>
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