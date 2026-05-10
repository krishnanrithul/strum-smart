import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import MiniLogo from "@/components/MiniLogo";
import WaveformLoader from "@/components/WaveformLoader";
import AssignExerciseModal from "@/components/AssignExerciseModal";

const glassCard = { border: "1px solid rgba(255,255,255,0.05)" };
const glassCardGlow = {
  border: "1px solid rgba(255,255,255,0.05)",
  background: "radial-gradient(circle at top right, rgba(34,197,94,0.12) 0%, transparent 60%), hsl(var(--card))",
};

const formatMins = (secs: number) => Math.floor(secs / 60);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const StudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [peakBpm, setPeakBpm] = useState(0);
  const [exercises, setExercises] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [editingTargetValue, setEditingTargetValue] = useState("");

  const loadExercises = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("exercises")
      .select("id, title, category, current_bpm, target_bpm, history, is_assigned")
      .eq("user_id", id);
    const exs = data || [];
    setExercises(exs);
    const peak = exs.reduce((max: number, e: any) => {
      const bpms = (e.history || []).map((h: any) => h.bpm);
      return bpms.length ? Math.max(max, ...bpms) : max;
    }, 0);
    setPeakBpm(peak);
  };

  const handleUpdateTarget = async (exerciseId: string) => {
    const newTarget = Math.min(240, Math.max(40, parseInt(editingTargetValue) || 80));
    await supabase.from("exercises").update({ target_bpm: newTarget }).eq("id", exerciseId);
    setEditingTargetId(null);
    loadExercises();
  };

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        const [
          { data: profile },
          { data: sessionRows },
        ] = await Promise.all([
          (supabase as any).from("profiles").select("full_name").eq("id", id).single(),
          supabase.from("sessions").select("duration, date, created_at").eq("user_id", id).order("created_at", { ascending: false }),
        ]);

        setStudentName(profile?.full_name ?? "Student");

        const rows = sessionRows || [];
        setTotalSessions(rows.length);
        setTotalMinutes(formatMins(rows.reduce((acc: number, r: any) => acc + (r.duration || 0), 0)));
        setRecentSessions(rows.slice(0, 5));

        await loadExercises();
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <WaveformLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <AppHeader title={studentName.toUpperCase()} showBack />

      <main className="container mx-auto px-4 py-6 space-y-6">

        {/* Stats Card */}
        <div className="rounded-2xl p-6" style={glassCardGlow}>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Sessions</p>
              <p className="text-3xl font-bold text-foreground mt-1">{totalSessions}</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Practice</p>
              <p className="text-3xl font-bold text-foreground mt-1">{totalMinutes}m</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Peak BPM</p>
              <p className="text-3xl font-bold text-primary mt-1">{peakBpm > 0 ? peakBpm : "—"}</p>
            </div>
          </div>
        </div>

        {/* Exercises */}
        <section>
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Exercises</p>
          {exercises.length === 0 ? (
            <div className="rounded-2xl bg-card p-5 text-center text-sm text-muted-foreground" style={glassCard}>
              No exercises yet.
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((ex) => {
                const startBpm = ex.history?.[0]?.bpm ?? ex.current_bpm;
                const fillPct = ex.target_bpm > 0
                  ? Math.min(100, Math.round((ex.current_bpm / ex.target_bpm) * 100))
                  : 0;
                const isEditing = editingTargetId === ex.id;

                return (
                  <div key={ex.id} className="rounded-2xl bg-card p-5 space-y-3" style={glassCard}>
                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-base font-semibold text-foreground">{ex.title}</p>
                        <p className="text-xs uppercase text-muted-foreground mt-0.5">{ex.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-foreground">{ex.current_bpm}</p>
                        <p className="text-xs text-muted-foreground">BPM</p>
                      </div>
                    </div>

                    {/* Progress bar + metadata */}
                    {ex.target_bpm > 0 && (
                      <div className="space-y-2">
                        <div
                          className="w-full rounded-full overflow-hidden"
                          style={{ height: "3px", background: "rgba(255,255,255,0.08)" }}
                        >
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">START: {startBpm} BPM</span>
                          {ex.is_assigned && (
                            <span className="text-xs text-primary">From Teacher</span>
                          )}
                          {isEditing ? (
                            <span className="flex items-center gap-1">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={editingTargetValue}
                                onChange={(e) => setEditingTargetValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleUpdateTarget(ex.id);
                                  if (e.key === "Escape") setEditingTargetId(null);
                                }}
                                className="w-12 text-xs text-right bg-transparent border-b border-white/20 outline-none focus:border-primary text-foreground"
                                autoFocus
                              />
                              <span className="text-xs text-muted-foreground">BPM</span>
                              <button
                                onClick={() => handleUpdateTarget(ex.id)}
                                className="text-primary text-xs ml-1"
                              >
                                ✓
                              </button>
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">TARGET: {ex.target_bpm} BPM</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Update target button */}
                    {!isEditing && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => { setEditingTargetId(ex.id); setEditingTargetValue(String(ex.target_bpm)); }}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                        >
                          Update Target
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Sessions */}
        <section>
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Recent Sessions</p>
          {recentSessions.length === 0 ? (
            <div className="rounded-2xl bg-card p-5 text-center text-sm text-muted-foreground" style={glassCard}>
              No sessions yet.
            </div>
          ) : (
            <div className="rounded-2xl bg-card divide-y divide-white/5" style={glassCard}>
              {recentSessions.map((s, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4">
                  <p className="text-sm text-muted-foreground">{s.date ? formatDate(s.date) : "—"}</p>
                  <p className="text-sm font-semibold text-foreground">{formatMins(s.duration || 0)}m</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Assign Exercise */}
        <button
          className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity"
          onClick={() => setAssignOpen(true)}
        >
          <div className="flex items-center gap-2">
            <MiniLogo color="#0a0a0a" />
            Assign Exercise
          </div>
          <ChevronRight className="h-5 w-5 opacity-70" />
        </button>

      </main>

      <AssignExerciseModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        studentId={id!}
        studentName={studentName}
      />
    </div>
  );
};

export default StudentDetail;
