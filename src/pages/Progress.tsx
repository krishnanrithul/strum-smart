import { ArrowLeft, TrendingUp, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const Progress = () => {
  const progressData = [
    { date: "Mon", bpm: 108 },
    { date: "Tue", bpm: 112 },
    { date: "Wed", bpm: 115 },
    { date: "Thu", bpm: 118 },
    { date: "Fri", bpm: 120 },
    { date: "Sat", bpm: 122 },
    { date: "Sun", bpm: 125 },
  ];

  const heatmapDays = Array.from({ length: 35 }, (_, i) => ({
    day: i,
    active: Math.random() > 0.3,
  }));

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Progress Analytics</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-secondary border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">This Week</span>
            </div>
            <div className="text-3xl font-bold metric-display">5.2h</div>
            <div className="text-sm text-muted-foreground mt-1">+23% from last</div>
          </Card>
          <Card className="p-4 bg-secondary border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Streak</span>
            </div>
            <div className="text-3xl font-bold metric-display">7 days</div>
            <div className="text-sm text-muted-foreground mt-1">Personal best!</div>
          </Card>
        </div>

        {/* BPM Progress Chart */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
            BPM Progress: Alternate Picking
          </h2>
          <Card className="p-6 bg-secondary border-border">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData}>
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[100, 130]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bpm"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <div className="text-sm text-muted-foreground">This Week's Gain</div>
              <div className="text-2xl font-bold metric-display">+17 BPM</div>
            </div>
          </Card>
        </section>

        {/* Practice Heatmap */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Practice Calendar</h2>
          <Card className="p-6 bg-secondary border-border">
            <div className="grid grid-cols-7 gap-2">
              {heatmapDays.map((day) => (
                <div
                  key={day.day}
                  className={`aspect-square rounded ${
                    day.active
                      ? "bg-primary/80"
                      : "bg-muted/30"
                  }`}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>Last 5 weeks</span>
              <div className="flex items-center gap-2">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-muted/30 rounded-sm" />
                  <div className="w-3 h-3 bg-primary/40 rounded-sm" />
                  <div className="w-3 h-3 bg-primary/80 rounded-sm" />
                </div>
                <span>More</span>
              </div>
            </div>
          </Card>
        </section>

        {/* Insights */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Insights</h2>
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold mb-2">You're on fire!</h3>
            <p className="text-sm text-muted-foreground">
              Your alternate picking speed has improved by 17 BPM this week. Keep up the progressive
              overload - consider bumping your starting tempo by 5%.
            </p>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Progress;
