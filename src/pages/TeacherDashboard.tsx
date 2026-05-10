import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Copy, Check, RefreshCw } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { useNavigate } from "react-router-dom";
import WaveformLoader from "@/components/WaveformLoader";
import { createInviteCode } from "@/hooks/useInviteCode";

type Student = {
  id: string;
  full_name: string | null;
  last_practice: string | null;
  exercise_count: number;
};

const TeacherDashboard = () => {
  const { session } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateCode = async () => {
    if (!session) return;
    setCodeLoading(true);
    try {
      const code = await createInviteCode(session.user.id);
      setInviteCode(code);
    } finally {
      setCodeLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const HOVER_COLOR = "rgba(52, 211, 153, 0.18)";

  useEffect(() => {
    const fetchStudents = async () => {
      if (!session) return;

      const { data: profiles } = await (supabase as any)
        .from("profiles")
        .select("id, full_name")
        .eq("teacher_id", session.user.id);

      if (!profiles) { setLoading(false); return; }

      const enriched = await Promise.all(
        profiles.map(async (student: { id: string; full_name: string | null }) => {
          const [{ data: sessions }, { data: exercises }] = await Promise.all([
            supabase
              .from("sessions")
              .select("created_at")
              .eq("user_id", student.id)
              .order("created_at", { ascending: false })
              .limit(1),
            supabase
              .from("exercises")
              .select("id")
              .eq("user_id", student.id),
          ]);

          return {
            id: student.id,
            full_name: student.full_name,
            last_practice: sessions?.[0]?.created_at ?? null,
            exercise_count: exercises?.length ?? 0,
          };
        })
      );

      setStudents(enriched);
      setLoading(false);
    };

    fetchStudents();
  }, [session]);

  const formatDate = (date: string | null) => {
    if (!date) return "No activity yet";
    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <WaveformLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-10">
      <AppHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">

        {/* Title row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">My Students</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {students.length} {students.length === 1 ? "student" : "students"}
            </p>
          </div>
        </div>

        {/* Invite code card */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: "radial-gradient(circle at top right, rgba(34,197,94,0.08) 0%, transparent 60%), hsl(var(--card))",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            Student Invite Code
          </p>
          {inviteCode ? (
            <div className="flex items-center gap-3">
              <div
                className="flex-1 flex items-center justify-center rounded-xl py-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="text-2xl font-mono font-semibold tracking-[0.3em] text-foreground">
                  {inviteCode}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCopy}
                  className="p-3 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                </button>
                <button
                  onClick={handleGenerateCode}
                  className="p-3 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerateCode}
              disabled={codeLoading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-opacity disabled:opacity-50"
            >
              {codeLoading ? "Generating…" : "Generate Invite Code"}
            </button>
          )}
          <p className="text-xs text-muted-foreground">
            Single use — share with your student during their setup.
          </p>
        </div>

        {/* Student list */}
        {students.length === 0 ? (
          <div className="rounded-2xl p-10 text-center text-sm text-muted-foreground"
            style={{ border: "1px solid rgba(255,255,255,0.05)", background: "hsl(var(--card))" }}>
            No students yet. Add a student to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {students.map((student) => (
              <div
                key={student.id}
                onClick={() => navigate(`/teacher/student/${student.id}`)}
                onMouseEnter={() => setHoveredId(student.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all duration-300 relative overflow-hidden"
                style={{
                  background: hoveredId === student.id
                    ? `linear-gradient(135deg, ${HOVER_COLOR} 0%, rgba(255,255,255,0.03) 100%)`
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${hoveredId === student.id ? "rgba(52, 211, 153, 0.4)" : "rgba(255,255,255,0.06)"}`,
                  transform: hoveredId === student.id ? "translateY(-2px)" : "translateY(0)",
                  boxShadow: hoveredId === student.id ? `0 8px 24px ${HOVER_COLOR}` : "none",
                }}
              >
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {student.full_name ?? "Unnamed Student"}
                  </p>
                  <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mt-1">
                    Last active: {formatDate(student.last_practice)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-foreground">{student.exercise_count}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Exercises</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
};

export default TeacherDashboard;
