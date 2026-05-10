import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import MiniLogo from "@/components/MiniLogo";
import WaveformLoader from "@/components/WaveformLoader";
import AssignExerciseModal from "@/components/AssignExerciseModal";
import { ExerciseTemplate } from "@/lib/storage";

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

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        const [
          { data: profile },
          { data: sessionRows },
          { data: exerciseRows },
        ] = await Promise.all([
          (supabase as any).from("profiles").select("full_name").eq("id", id).single(),
          supabase.from("sessions").select("duration, date, created_at").eq("user_id", id).order("created_at", { ascending: false }),
          supabase.from("exercises").select("id, title, category, current_bpm, history").eq("user_id", id),
        ]);

        setStudentName(profile?.full_name ?? "Student");

        const rows = sessionRows || [];
        setTotalSessions(rows.length);
        setTotalMinutes(formatMins(rows.reduce((acc, r) => acc + (r.duration || 0), 0)));
        setRecentSessions(rows.slice(0, 5));

        const exs = exerciseRows || [];
        setExercises(exs);

        const peak = exs.reduce((max, e) => {
          const bpms = (e.history || []).map((h: any) => h.bpm);
          return bpms.length ? Math.max(max, ...bpms) : max;
        }, 0);
        setPeakBpm(peak);
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
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-xs font-semibold tracking-widest uppercase text-foreground">
            {studentName}
          </span>
          <MiniLogo />
        </div>
      </header>

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
            <div className="rounded-2xl bg-card divide-y divide-white/5" style={glassCard}>
              {exercises.map((ex) => (
                <div key={ex.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{ex.title}</p>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mt-0.5">{ex.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">{ex.current_bpm}</p>
                    <p className="text-xs text-muted-foreground">BPM</p>
                  </div>
                </div>
              ))}
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
        onSelect={(template: ExerciseTemplate | { title: string; custom: true }) => {
          console.log("Selected:", template);
          setAssignOpen(false);
        }}
      />
    </div>
  );
};

export default StudentDetail;
