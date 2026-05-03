import { useState, useEffect } from "react";
import { ArrowLeft, TrendingUp, Calendar, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { StorageService, Exercise, Session } from "@/lib/storage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Progress = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [fetchedExercises, fetchedSessions] = await Promise.all([
          StorageService.getExercises(),
          StorageService.getSessions(),
        ]);
        setExercises(fetchedExercises);
        setSessions(fetchedSessions);
        if (fetchedExercises.length > 0) {
          setSelectedExerciseId(fetchedExercises[0].id);
        }
      } catch (error) {
        console.error("Failed to load progress data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const selectedExercise = exercises.find(e => e.id === selectedExerciseId);

  // Build chart data from exercise history
  const chartData = selectedExercise?.history.map(h => ({
    date: new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    bpm: h.bpm,
  })) || [];

  // Calculate BPM gain
  const bpmGain = chartData.length >= 2
    ? chartData[chartData.length - 1].bpm - chartData[0].bpm
    : 0;

  // Calculate this week's practice time
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeekSessions = sessions.filter(s => new Date(s.date) >= oneWeekAgo);
  const thisWeekSeconds = thisWeekSessions.reduce((acc, s) => acc + s.duration, 0);
  const thisWeekHours = (thisWeekSeconds / 3600).toFixed(1);

  // Calculate streak (consecutive days)
  const calculateStreak = () => {
    if (sessions.length === 0) return 0;
    const uniqueDays = [...new Set(sessions.map(s => s.date.split("T")[0]))].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    let currentDate = today;
    for (const day of uniqueDays) {
      if (day === currentDate) {
        streak++;
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 1);
        currentDate = d.toISOString().split("T")[0];
      } else {
        break;
      }
    }
    return streak;
  };
  const streak = calculateStreak();

  // Build practice calendar (last 35 days)
  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    const dateStr = d.toISOString().split("T")[0];
    const sessionCount = sessions.filter(s => s.date.startsWith(dateStr)).length;
    return { date: dateStr, count: sessionCount };
  });

  // BPM chart Y axis domain
  const bpms = chartData.map(d => d.bpm);
  const minBpm = bpms.length > 0 ? Math.max(0, Math.min(...bpms) - 10) : 0;
  const maxBpm = bpms.length > 0 ? Math.max(...bpms) + 10 : 200;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <div className="text-3xl font-bold metric-display">{thisWeekHours}h</div>
            <div className="text-sm text-muted-foreground mt-1">{thisWeekSessions.length} sessions</div>
          </Card>
          <Card className="p-4 bg-secondary border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Streak</span>
            </div>
            <div className="text-3xl font-bold metric-display">{streak} days</div>
            <div className="text-sm text-muted-foreground mt-1">
              {streak > 0 ? "Keep it up!" : "Practice today!"}
            </div>
          </Card>
        </div>

        {/* BPM Progress Chart */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-muted-foreground">BPM Progress</h2>
            <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
              <SelectTrigger className="w-44 h-9 bg-secondary border-border text-sm">
                <SelectValue placeholder="Select exercise" />
              </SelectTrigger>
              <SelectContent>
                {exercises.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="p-6 bg-secondary border-border">
            {chartData.length < 2 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                Complete at least 2 sessions of this exercise to see progress.
              </div>
            ) : (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        domain={[minBpm, maxBpm]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem",
                        }}
                        formatter={(value) => [`${value} BPM`, "Speed"]}
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
                <div className="mt-4 grid grid-cols-3 gap-4 text-center border-t border-border pt-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Start</div>
                    <div className="text-xl font-bold metric-display">{chartData[0].bpm}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Gain</div>
                    <div className={`text-xl font-bold ${bpmGain >= 0 ? "text-primary" : "text-destructive"}`}>
                      {bpmGain >= 0 ? "+" : ""}{bpmGain} BPM
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Current</div>
                    <div className="text-xl font-bold metric-display">{chartData[chartData.length - 1].bpm}</div>
                  </div>
                </div>
              </>
            )}
          </Card>
        </section>

        {/* Practice Calendar */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Practice Calendar</h2>
          <Card className="p-6 bg-secondary border-border">
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, i) => (
                <div
                  key={i}
                  title={day.date}
                  className={`aspect-square rounded ${
                    day.count === 0
                      ? "bg-muted/30"
                      : day.count === 1
                      ? "bg-primary/40"
                      : "bg-primary/80"
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
          {exercises.length === 0 ? (
            <Card className="p-6 bg-secondary border-border text-center text-muted-foreground text-sm">
              Add exercises and complete sessions to see insights.
            </Card>
          ) : (
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-semibold mb-2">
                {streak > 3 ? "You're on fire!" : streak > 0 ? "Keep it up!" : "Time to practice!"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedExercise && bpmGain > 0
                  ? `Your ${selectedExercise.title} speed has improved by ${bpmGain} BPM. `
                  : ""}
                {streak > 0
                  ? `You've practiced ${streak} day${streak > 1 ? "s" : ""} in a row.`
                  : "Start a session today to build your streak."}
                {selectedExercise && selectedExercise.currentBpm < selectedExercise.targetBpm
                  ? ` ${selectedExercise.targetBpm - selectedExercise.currentBpm} BPM to go until your target!`
                  : selectedExercise && selectedExercise.currentBpm >= selectedExercise.targetBpm
                  ? " You've hit your target BPM — time to set a new challenge!"
                  : ""}
              </p>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
};

export default Progress;