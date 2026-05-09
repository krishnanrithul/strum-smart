import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, UserPlus, Dumbbell, Clock, LogOut, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

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
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);

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

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("teacher_id", session.user.id);

      if (!profiles) return;

      const enriched = await Promise.all(
        profiles.map(async (student) => {
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
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            Fret<span className="text-primary">Gym</span>
          </h1>
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Title + Add Student */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-primary">My Students</h2>
            <p className="text-muted-foreground mt-1">{students.length} student{students.length !== 1 ? "s" : ""}</p>
          </div>
          <Button className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Student
          </Button>
        </div>

        {/* Student List */}
        {students.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No students yet.</p>
            <p className="text-sm mt-1">Add a student to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {students.map((student) => (
              <div
                key={student.id}
                className="bg-card border border-border rounded-xl p-5 flex items-center justify-between hover:border-primary transition-colors cursor-pointer"
              >
                <div>
                  <p className="font-semibold text-lg">{student.full_name ?? "Unnamed Student"}</p>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                    <Clock className="h-3 w-3" />
                    <span>Last active: {formatDate(student.last_practice)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Dumbbell className="h-4 w-4" />
                  <span>{student.exercise_count} exercises</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;