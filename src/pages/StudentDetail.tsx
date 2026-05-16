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

const formatDuration = (mins: number) => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

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
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [editingNotesValue, setEditingNotesValue] = useState("");

  const loadExercises = async () => {
    if (!id) return;
    const [{ data }, { data: sessionData }] = await Promise.all([
      supabase
        .from("exercises")
        .select("id, title, category, current_bpm, target_bpm, history, is_assigned, teacher_notes")
        .eq("user_id", id),
      supabase
        .from("sessions")
        .select("exercises, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
    ]);
    const exs = data || [];
    const sessions = sessionData || [];
    const enriched = exs.map((ex: any) => {
      const lastSession = sessions.find(
        (s: any) => Array.isArray(s.exercises) && s.exercises.includes(ex.id)
      );
      return { ...ex, _last_practiced: lastSession?.created_at ?? null };
    });
    setExercises(enriched);
    const peak = enriched.reduce((max: number, e: any) => {
      const bpms = (e.history || []).map((h: any) => h.bpm);
      return bpms.length ? Math.max(max, ...bpms) : max;
    }, 0);
    setPeakBpm(peak);
  };

  const handleRemove = async (exerciseId: string) => {
    await (supabase as any)
      .from("assigned_exercises")
      .delete()
      .eq("exercise_id", exerciseId)
      .eq("student_id", id);
    setExercises((prev) => prev.filter((e: any) => e.id !== exerciseId));
    setConfirmRemoveId(null);
  };

  const handleUpdateNotes = async (exerciseId: string) => {
    await supabase
      .from("exercises")
      .update({ teacher_notes: editingNotesValue.trim() || null })
      .eq("id", exerciseId);
    setEditingNotesId(null);
    loadExercises();
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

  const renderExerciseCard = (ex: any) => {
    const startBpm = ex.history?.[0]?.bpm ?? ex.current_bpm;
    const fillPct = ex.target_bpm > 0 && ex.target_bpm !== startBpm
      ? Math.min(100, Math.max(0, Math.round(((ex.current_bpm - startBpm) / (ex.target_bpm - startBpm)) * 100)))
      : 0;
    const isEditing = editingTargetId === ex.id;
    const isEditingNotes = editingNotesId === ex.id;

    return (
      <div key={ex.id} className="rounded-2xl bg-card p-5 space-y-3" style={glassCard}>
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-base font-semibold text-foreground">{ex.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs uppercase text-muted-foreground">{ex.category}</p>
              {ex.is_assigned && (
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">From Teacher</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(ex._last_practiced)}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-mono font-bold text-foreground tabular-nums leading-none">{ex.current_bpm}</p>
            <p className="text-xs text-muted-foreground mt-1">BPM</p>
          </div>
        </div>

        {/* START / TARGET row + progress bar */}
        {ex.target_bpm > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">START: {startBpm} BPM</span>
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
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: "3px", background: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Inline notes editor */}
        {isEditingNotes && (
          <div className="space-y-2 pt-1">
            <textarea
              value={editingNotesValue}
              onChange={(e) => setEditingNotesValue(e.target.value)}
              placeholder="Add a note for this student…"
              rows={3}
              autoFocus
              className="w-full text-sm bg-transparent rounded-lg p-2 outline-none focus:border-primary text-foreground resize-none"
              style={{ border: "1px solid rgba(255,255,255,0.15)" }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditingNotesId(null);
              }}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingNotesId(null)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateNotes(ex.id)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Save Note ✓
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!isEditing && !isEditingNotes && (
          <div className="flex items-center justify-end gap-2">
            {ex.is_assigned && confirmRemoveId === ex.id ? (
              <>
                <button
                  onClick={() => setConfirmRemoveId(null)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "hsl(var(--muted-foreground))" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemove(ex.id)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
                  style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)", color: "rgb(239,68,68)" }}
                >
                  Confirm Remove?
                </button>
              </>
            ) : (
              <>
                {ex.is_assigned && (
                  <button
                    onClick={() => setConfirmRemoveId(ex.id)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
                    style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.4)", color: "rgb(239,68,68)" }}
                  >
                    Remove
                  </button>
                )}
                {ex.is_assigned && (
                  <button
                    onClick={() => { setEditingNotesId(ex.id); setEditingNotesValue(ex.teacher_notes ?? ""); }}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "hsl(var(--muted-foreground))" }}
                  >
                    Edit Notes
                  </button>
                )}
                <button
                  onClick={() => { setEditingTargetId(ex.id); setEditingTargetValue(String(ex.target_bpm)); }}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Update Target
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <WaveformLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <AppHeader title={studentName.toUpperCase()} breadcrumb="My Students" showBack />

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
              <p className="text-3xl font-bold text-foreground mt-1">{formatDuration(totalMinutes)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Peak BPM</p>
              <p className="text-3xl font-bold text-primary mt-1">{peakBpm > 0 ? peakBpm : "—"}</p>
            </div>
          </div>
        </div>

        {/* Exercises — Assigned by You */}
        <section className="space-y-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Assigned by You</p>
          {exercises.filter((e) => e.is_assigned).length === 0 ? (
            <div className="rounded-2xl bg-card p-5 text-center text-sm text-muted-foreground" style={glassCard}>
              No exercises assigned yet.
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.filter((e) => e.is_assigned).map(renderExerciseCard)}
            </div>
          )}
        </section>

        {/* Exercises — Student's Own */}
        {exercises.filter((e) => !e.is_assigned).length > 0 && (
          <section className="space-y-3">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Added By Student</p>
            <div className="space-y-3">
              {exercises.filter((e) => !e.is_assigned).map(renderExerciseCard)}
            </div>
          </section>
        )}

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
