import { useState, useEffect } from "react";
import { Library, TrendingUp, LogOut, Sun, Moon, Zap, ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StorageService, Exercise } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { signOut } = useAuth();
  const [isDark, setIsDark] = useState(true);
  const [todaysStats, setTodaysStats] = useState({ duration: 0, maxBpm: 0 });
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("light");
    } else {
      html.classList.remove("light");
    }
    setIsDark(!isDark);
  };

  useEffect(() => {
    const loadData = async () => {
      const sessions = await StorageService.getSessions();
      const exercises = await StorageService.getExercises();

      const today = new Date().toISOString().split("T")[0];
      const todaysSessions = sessions.filter((s) => s.date.startsWith(today));
      const duration = todaysSessions.reduce((acc, s) => acc + s.duration, 0);

      let maxBpm = 0;
      exercises.forEach((e) => {
        const todayHistory = e.history.filter((h) => h.date.startsWith(today));
        todayHistory.forEach((h) => {
          if (h.bpm > maxBpm) maxBpm = h.bpm;
        });
      });

      setTodaysStats({ duration, maxBpm });
      setTotalSessions(sessions.length);

      const inProgress = exercises
        .filter((e) => e.status === "In Progress")
        .sort((a, b) => {
          const lastA = a.history[a.history.length - 1]?.date ?? "";
          const lastB = b.history[b.history.length - 1]?.date ?? "";
          return new Date(lastB).getTime() - new Date(lastA).getTime();
        })
        .slice(0, 5);

      setRecentExercises(inProgress);
    };

    loadData();
  }, []);

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/library", icon: Library, label: "Library" },
    { path: "/progress", icon: TrendingUp, label: "Progress" },
  ];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return mins > 0 ? `${mins}m` : "0m";
  };

  const getBpmProgress = (exercise: Exercise) => {
    const current = exercise.current_bpm;
    const target = exercise.target_bpm;
    const initial = exercise.history[0]?.bpm ?? current;
    if (target <= initial) return 0;
    return Math.min(100, Math.round(((current - initial) / (target - initial)) * 100));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
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
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">

        {/* Hero stat — Today's Max BPM */}
        <section className="relative overflow-hidden rounded-2xl bg-card border border-border p-6">
          {/* Background glow */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Today's Peak</p>
            <div className="flex items-end gap-3">
              <span
                className="text-8xl font-black text-primary leading-none"
                style={{ textShadow: "0 0 40px hsl(var(--primary) / 0.4)" }}
              >
                {todaysStats.maxBpm > 0 ? todaysStats.maxBpm : "—"}
              </span>
              {todaysStats.maxBpm > 0 && (
                <span className="text-2xl font-semibold text-muted-foreground mb-3">BPM</span>
              )}
            </div>
            {/* Sub stats */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Practice Time</p>
                <p className="text-xl font-bold mt-0.5">{formatDuration(todaysStats.duration)}</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Sessions</p>
                <p className="text-xl font-bold mt-0.5">{totalSessions}</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <Link to="/library">
          <button className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Start Practice
            </div>
            <ChevronRight className="h-5 w-5 opacity-70" />
          </button>
        </Link>

        {/* In Progress */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">In Progress</h2>
            <Link to="/library" className="text-xs text-primary hover:underline">See all</Link>
          </div>

          {recentExercises.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              <p className="text-sm">No exercises in progress.</p>
              <p className="text-xs mt-1">Head to Library to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentExercises.map((exercise) => {
                const history = exercise.history;
                const lastBpm = history[history.length - 1]?.bpm ?? 0;
                const prevBpm = history.length > 1 ? history[history.length - 2].bpm : lastBpm;
                const diff = lastBpm - prevBpm;
                const progress = getBpmProgress(exercise);

                return (
                  <Link key={exercise.id} to={`/practice/${exercise.id}`}>
                    <div className="group bg-card border border-border rounded-xl p-4 hover:border-primary transition-all duration-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-sm">{exercise.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{exercise.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-primary">{lastBpm}</p>
                          <p className="text-xs text-muted-foreground">BPM</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          {diff > 0 && (
                            <span className="text-xs font-semibold text-primary">+{diff}</span>
                          )}
                          {diff < 0 && (
                            <span className="text-xs font-semibold text-destructive">{diff}</span>
                          )}
                          <span className="text-xs text-muted-foreground">→ {exercise.target_bpm}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-2 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center py-3 rounded-lg transition-all",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="h-6 w-6 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Index;