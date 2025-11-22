import { Home, Dumbbell, Library, TrendingUp } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Index = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/practice", icon: Dumbbell, label: "Practice" },
    { path: "/library", icon: Library, label: "Library" },
    { path: "/progress", icon: TrendingUp, label: "Progress" },
  ];

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
              <div className="text-3xl font-bold metric-display">45m</div>
            </Card>
            <Card className="p-4 bg-secondary border-border">
              <div className="text-sm text-muted-foreground mb-1">Max BPM</div>
              <div className="text-3xl font-bold metric-display">132</div>
            </Card>
          </div>
        </section>

        {/* Current Streak */}
        <Card className="p-6 bg-gradient-to-br from-card to-secondary border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Current Streak</div>
              <div className="text-4xl font-bold metric-display neon-glow">7 days</div>
            </div>
            <div className="text-6xl">🔥</div>
          </div>
        </Card>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Quick Start</h2>
          <div className="space-y-3">
            <Link to="/practice">
              <Button className="w-full h-16 text-lg font-semibold" size="lg">
                <Dumbbell className="mr-2 h-6 w-6" />
                Start Practice Session
              </Button>
            </Link>
          </div>
        </section>

        {/* Active Exercises */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">In Progress</h2>
          <div className="space-y-3">
            <Card className="p-4 bg-secondary border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Alternate Picking</h3>
                  <div className="text-sm text-muted-foreground">Last: 120 BPM</div>
                </div>
                <div className="text-primary font-bold text-xl">+8</div>
              </div>
            </Card>
            <Card className="p-4 bg-secondary border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Sultans of Swing - Solo</h3>
                  <div className="text-sm text-muted-foreground">Last: 95 BPM</div>
                </div>
                <div className="text-destructive font-bold text-xl">-2</div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-4 gap-2 py-2">
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
