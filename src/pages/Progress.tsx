import { useState, useEffect } from "react";
import { TrendingUp, Calendar } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MiniLogo from "@/components/MiniLogo";
import WaveformLoader from "@/components/WaveformLoader";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { StorageService, Exercise, Session, clearCache } from "@/lib/storage";
import { generateInsights } from "@/lib/insights";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const glassCard = {
  border: "1px solid rgba(255,255,255,0.05)",
};

const glassCardWithGlow = {
  border: "1px solid rgba(255,255,255,0.05)",
  background: "radial-gradient(circle at top right, rgba(34,197,94,0.12) 0%, transparent 60%), hsl(var(--card))",
};


const Progress = () => {
  const { session } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      clearCache();
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

        const todayStr = new Date().toLocaleDateString("en-CA");
        const todayMins = Math.floor(
          fetchedSessions
            .filter(s => new Date(s.date).toLocaleDateString("en-CA") === todayStr)
            .reduce((acc, s) => acc + s.duration, 0) / 60
        );
        const uniqueDays = [...new Set(fetchedSessions.map(s => s.date.split("T")[0]))].sort().reverse();
        let computedStreak = 0;
        let cur = todayStr;
        for (const day of uniqueDays) {
          if (day === cur) {
            computedStreak++;
            const d = new Date(cur); d.setDate(d.getDate() - 1);
            cur = d.toISOString().split("T")[0];
          } else break;
        }
        setInsights(generateInsights(fetchedExercises, fetchedSessions, computedStreak, todayMins));
      } catch (error) {
        console.error("Failed to load progress data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);


  const selectedExercise = exercises.find(e => e.id === selectedExerciseId);

  const chartData = selectedExercise?.history.map(h => ({
    date: new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    bpm: h.bpm,
  })) || [];

  const bpmGain = chartData.length >= 2
    ? chartData[chartData.length - 1].bpm - chartData[0].bpm
    : 0;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeekSessions = sessions.filter(s => new Date(s.date) >= oneWeekAgo);
  const thisWeekSeconds = thisWeekSessions.reduce((acc, s) => acc + s.duration, 0);
  const thisWeekMins = Math.floor(thisWeekSeconds / 60);
  const thisWeekFormatted = thisWeekMins < 60
    ? `${thisWeekMins}m`
    : `${Math.floor(thisWeekMins / 60)}h ${thisWeekMins % 60}m`;

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


  const bpms = chartData.map(d => d.bpm);
  const minBpm = bpms.length > 0 ? Math.max(0, Math.min(...bpms) - 10) : 0;
  const maxBpm = bpms.length > 0 ? Math.max(...bpms) + 10 : 200;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <WaveformLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: "radial-gradient(circle at top right, rgba(34,197,94,0.07) 0%, transparent 50%), hsl(var(--background))" }}>

      <AppHeader />

      <main className="container mx-auto px-4 py-6 space-y-8">

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4">

          <div className="rounded-2xl p-5" style={glassCardWithGlow}>
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" /> This Week
            </p>
            <p className="text-4xl font-black text-foreground leading-none mt-3">{thisWeekFormatted}</p>
            <p className="text-sm text-muted-foreground mt-2">{thisWeekSessions.length} sessions</p>
          </div>

          <div className="rounded-2xl p-5" style={glassCardWithGlow}>
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Streak
            </p>
            <p className="text-4xl font-black text-foreground leading-none mt-3 whitespace-nowrap">{streak} days</p>
            <p className="text-sm text-muted-foreground mt-2">
              {streak > 0 ? "Keep it up!" : "Practice today!"}
            </p>
          </div>
        </div>

        {/* BPM Progress */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">BPM Progress</p>
            <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
              <SelectTrigger className="w-44 h-9 bg-card text-sm" style={glassCard}>
                <SelectValue placeholder="Select exercise" />
              </SelectTrigger>
              <SelectContent>
                {exercises.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl p-6" style={{ background: "radial-gradient(circle at top right, rgba(34,197,94,0.08) 0%, transparent 60%), hsl(var(--card))", border: "1px solid rgba(255,255,255,0.05)" }}>
            {chartData.length < 2 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <p className="text-sm text-muted-foreground">No sessions yet. Head to Library to start practicing.</p>
                <Link to="/library">
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
                    <MiniLogo color="#0a0a0a" />
                    Go to Library
                  </button>
                </Link>
              </div>
            ) : (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} domain={[minBpm, maxBpm]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid rgba(255,255,255,0.05)",
                          borderRadius: "0.75rem",
                        }}
                        formatter={(value) => [`${value} BPM`, "Speed"]}
                      />
                      <Line type="monotone" dataKey="bpm" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center border-t border-white/5 pt-4">
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Start</p>
                    <p className="text-4xl font-black text-foreground mt-1">{chartData[0].bpm}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Gain</p>
                    <p className={`text-4xl font-black mt-1 ${bpmGain >= 0 ? "text-primary" : "text-destructive"}`}>
                      {bpmGain >= 0 ? "+" : ""}{bpmGain}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Now</p>
                    <p className="text-4xl font-black text-foreground mt-1">{chartData[chartData.length - 1].bpm}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {insights.length > 0 && (
          <section className="space-y-4">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Insights</p>
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p className="text-sm text-white">💡 {insight}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
};

export default Progress;