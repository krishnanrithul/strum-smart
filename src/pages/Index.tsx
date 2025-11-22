import { useState, useEffect } from "react";
import { Home, Dumbbell, Library, TrendingUp, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StorageService, Exercise, Session } from "@/lib/storage";
import { RoutineDialog } from "@/components/RoutineDialog";

const Index = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [todaysStats, setTodaysStats] = useState({ duration: 0, maxBpm: 0 });
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([]);
  const [streak, setStreak] = useState(0);
  const [showRoutineDialog, setShowRoutineDialog] = useState(false);

  useEffect(() => {
    // Load data
    const loadData = async () => {
      const sessions = await StorageService.getSessions();
      const exercises = await StorageService.getExercises();

      // Calculate today's stats
      const today = new Date().toISOString().split("T")[0];
      const todaysSessions = sessions.filter((s) => s.date.startsWith(today));

      const duration = todaysSessions.reduce((acc, s) => acc + s.duration, 0);

      // Find max BPM from exercises updated today
      // This is an approximation since we don't store BPM per session explicitly in the session object yet,
      // but we can look at exercise history.
      let maxBpm = 0;
      exercises.forEach(e => {
        const todayHistory = e.history.filter(h => h.date.startsWith(today));
        todayHistory.forEach(h => {
          if (h.bpm > maxBpm) maxBpm = h.bpm;
        });
      });

      setTodaysStats({ duration, maxBpm });

      // Get "In Progress" exercises, sorted by last update
      const inProgress = exercises
        .filter((e) => e.status === "In Progress")
        .sort((a, b) => {
          const lastA = a.history[a.history.length - 1].date;
          const lastB = b.history[b.history.length - 1].date;
          return new Date(lastB).getTime() - new Date(lastA).getTime();
        })
        .slice(0, 3);

      setRecentExercises(inProgress);

      // Calculate streak (simplified version)
      // In a real app, we'd check consecutive days in sessions
      const uniqueDays = new Set(sessions.map(s => s.date.split("T")[0]));
      setStreak(uniqueDays.size); // Just showing total active days for now as a placeholder for streak logic
    };

    loadData();
  }, []);

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/library", icon: Library, label: "Library" }, // Changed Practice to Library for quick access
    { path: "/progress", icon: TrendingUp, label: "Progress" },
  ];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold tracking-tight">
            Fret<span className="text-primary">Gym</span>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Today's Stats */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Today's Session</h2>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-secondary border-border">
              <div className="text-sm text-muted-foreground mb-1">Practice Time</div>
              <div className="text-3xl font-bold metric-display">{formatDuration(todaysStats.duration)}</div>
            </Card>
            <Card className="p-4 bg-secondary border-border">
              <div className="text-sm text-muted-foreground mb-1">Max BPM</div>
              <div className="text-3xl font-bold metric-display">{todaysStats.maxBpm > 0 ? todaysStats.maxBpm : "-"}</div>
            </Card>
          </div>
        </section>

        {/* Current Streak */}
        <Card className="p-6 bg-gradient-to-br from-card to-secondary border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Active Days</div>
              <div className="text-4xl font-bold metric-display neon-glow">{streak} days</div>
            </div>
            <div className="text-6xl">🔥</div>
          </div>
        </Card>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Quick Start</h2>
          <div className="space-y-3">
            <Button
              className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              size="lg"
              onClick={() => setShowRoutineDialog(true)}
            >
              <Sparkles className="mr-2 h-6 w-6" />
              Generate Daily Workout
            </Button>
            <Link to="/library">
              <Button variant="secondary" className="w-full h-14 font-semibold">
                <Dumbbell className="mr-2 h-5 w-5" />
                Free Practice
              </Button>
            </Link>
          </div>
        </section>

        {/* Active Exercises */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">In Progress</h2>
          <div className="space-y-3">
            {recentExercises.length > 0 ? (
              recentExercises.map((exercise) => {
                const history = exercise.history;
                const lastBpm = history.length > 0 ? history[history.length - 1].bpm : 0;
                const prevBpm = history.length > 1 ? history[history.length - 2].bpm : lastBpm;
                const diff = lastBpm - prevBpm;

                return (
                  <Link key={exercise.id} to={`/practice/${exercise.id}`}>
                    <Card className="p-4 bg-secondary border-border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{exercise.title}</h3>
                          <div className="text-sm text-muted-foreground">Last: {lastBpm} BPM</div>
                        </div>
                        {diff !== 0 && (
                          <div className={`font-bold text-xl ${diff > 0 ? "text-primary" : "text-destructive"}`}>
                            {diff > 0 ? "+" : ""}{diff}
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })
            ) : (
              <div className="text-muted-foreground text-sm">No active exercises. Go to Library to add one!</div>
            )}
          </div>
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

      <RoutineDialog open={showRoutineDialog} onOpenChange={setShowRoutineDialog} />
    </div>
  );
};

export default Index;
