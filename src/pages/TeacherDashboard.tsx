import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, LogOut, Sun, Moon } from "lucide-react";
import MiniLogo from "@/components/MiniLogo";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import WaveformLoader from "@/components/WaveformLoader";

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
  const [isDark, setIsDark] = useState(true);

  const HOVER_COLOR = "rgba(52, 211, 153, 0.18)";

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("light");
    } else {
      html.classList.remove("light");
    }
    setIsDark(!isDark);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

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
          const { data: exercises } = await supabase
            .from("exercises")
            .select("created_at")
            .eq("user_id", student.id)
            .order("created_at", { ascending: false });

          return {
            id: student.id,
            full_name: student.full_name,
            last_practice: exercises?.[0]?.created_at ?? null,
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
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MiniLogo />
            <span className="text-sm font-semibold tracking-widest text-foreground">
              Fret<span className="text-primary">Gym</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">

        {/* Title row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">My Students</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {students.length} {students.length === 1 ? "student" : "students"}
            </p>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
            <UserPlus className="h-3 w-3" />
            Add Student
          </button>
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
