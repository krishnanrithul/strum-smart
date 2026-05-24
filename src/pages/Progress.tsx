import { useState, useEffect } from "react";
import { TrendingUp, Calendar, Sparkles } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MiniLogo from "@/components/MiniLogo";
import WaveformLoader from "@/components/WaveformLoader";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { StorageService, Exercise, Session } from "@/lib/storage";
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

const INSIGHTS_TEXT_KEY = "fretgym_insights";
const INSIGHTS_TS_KEY = "fretgym_insights_timestamp";
const INSIGHTS_TTL = 24 * 60 * 60 * 1000;

const Progress = () => {
  const { session } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [insightText, setInsightText] = useState<string | null>(() => {
    try {
      const text = localStorage.getItem(INSIGHTS_TEXT_KEY);
      const ts = localStorage.getItem(INSIGHTS_TS_KEY);
      if (text && ts && Date.now() - Number(ts) < INSIGHTS_TTL) return text;
    } catch {}
    return null;
  });
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState(false);

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

  const loadInsights = async () => {
    if (!session) return;

    try {
      const cachedText = localStorage.getItem(INSIGHTS_TEXT_KEY);
      const cachedTs = localStorage.getItem(INSIGHTS_TS_KEY);
      if (cachedText && cachedTs && Date.now() - Number(cachedTs) < INSIGHTS_TTL) {
        setInsightText(cachedText);
        return;
      }
    } catch {}

    setInsightLoading(true);
    setInsightError(false);
    setInsightText(null);

    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weekMins = Math.floor(
        sessions.filter(s => new Date(s.date) >= oneWeekAgo).reduce((acc, s) => acc + s.duration, 0) / 60
      );

      const uniqueDays = [...new Set(sessions.map(s => s.date.split("T")[0]))].sort().reverse();
      const todayISO = new Date().toISOString().split("T")[0];
      let streakDays = 0;
      let cur = todayISO;
      for (const day of uniqueDays) {
        if (day === cur) {
          streakDays++;
          const d = new Date(cur); d.setDate(d.getDate() - 1);
          cur = d.toISOString().split("T")[0];
        } else break;
      }

      const exerciseSummary = exercises
        .map(e => {
          const startBpm = e.history[0]?.bpm ?? e.currentBpm;
          const gain = e.currentBpm - startBpm;
          return `${e.title}: ${e.currentBpm} BPM (${gain >= 0 ? "+" : ""}${gain} from start, target ${e.targetBpm} BPM)`;
        })
        .join("; ");

      const prompt = `You are a guitar practice coach. Here is a student's recent practice data: current streak ${streakDays} days, practice time this week ${weekMins} minutes, exercises: ${exerciseSummary || "none yet"}. Give 2-3 short, specific, encouraging insights and one concrete suggestion. Format your response exactly like this — no other text:\nInsights:\n- point one\n- point two\nSuggestion:\nOne paragraph here.`;

      let text: string;

      if (import.meta.env.DEV) {
        const res = await fetch("http://localhost:11434/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama3.1",
            messages: [{ role: "user", content: prompt }],
            stream: false,
          }),
        });
        if (!res.ok) throw new Error("api_error");
        const json = await res.json();
        text = (json.message?.content || "").trim();
      } else {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 500,
          }),
        });
        if (!res.ok) throw new Error("api_error");
        const json = await res.json();
        text = (json.content?.[0]?.text || "").trim();
      }

      if (!text) throw new Error("empty_response");
      localStorage.setItem(INSIGHTS_TEXT_KEY, text);
      localStorage.setItem(INSIGHTS_TS_KEY, String(Date.now()));
      setInsightText(text);
    } catch {
      setInsightError(true);
    } finally {
      setInsightLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) loadInsights();
  }, [loading]);

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
    <div className="min-h-screen bg-background pb-24">

      <AppHeader />

      <main className="container mx-auto px-4 py-6 space-y-8">

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4">

          <div className="rounded-2xl p-5" style={glassCardWithGlow}>
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" /> This Week
            </p>
            <p className="text-4xl font-bold text-foreground leading-none mt-3">{thisWeekFormatted}</p>
            <p className="text-sm text-muted-foreground mt-2">{thisWeekSessions.length} sessions</p>
          </div>

          <div className="rounded-2xl p-5" style={glassCardWithGlow}>
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Streak
            </p>
            <p className="text-4xl font-bold text-foreground leading-none mt-3">{streak} days</p>
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

          <div className="rounded-2xl bg-card p-6" style={glassCard}>
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
                    <p className="text-2xl font-bold text-foreground mt-1">{chartData[0].bpm}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Gain</p>
                    <p className={`text-2xl font-bold mt-1 ${bpmGain >= 0 ? "text-primary" : "text-destructive"}`}>
                      {bpmGain >= 0 ? "+" : ""}{bpmGain}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Now</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{chartData[chartData.length - 1].bpm}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Training Notes */}
        <section className="space-y-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-green-500" /> Training Notes
          </p>
          <div className="rounded-2xl bg-card p-6" style={glassCard}>
            {insightLoading ? (
              <p className="text-sm text-muted-foreground">Generating insights…</p>
            ) : insightError ? (
              <p className="text-sm text-muted-foreground">Couldn't generate insights right now. Try again later.</p>
            ) : insightText ? (
              <>
                {(() => {
                  const insightsIdx = insightText.indexOf("Insights:");
                  const clean = insightsIdx > 0 ? insightText.slice(insightsIdx) : insightText;
                  const suggestionIdx = clean.indexOf("Suggestion:");
                  const insightsPart = (suggestionIdx > -1 ? clean.slice(0, suggestionIdx) : clean)
                    .replace(/^Insights:\s*/i, "").trim();
                  const suggestionPart = suggestionIdx > -1
                    ? clean.slice(suggestionIdx).replace(/^Suggestion:\s*/i, "").trim()
                    : "";
                  const insightLines = insightsPart
                    .split("\n")
                    .map(l => l.replace(/^[-*•\d.)]+\s*/, "").trim())
                    .filter(Boolean);
                  return (
                    <div className="space-y-6">
                      {insightLines.length > 0 && (
                        <ul className="space-y-3">
                          {insightLines.map((line, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-foreground leading-relaxed">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                              {line}
                            </li>
                          ))}
                        </ul>
                      )}
                      {suggestionPart && (
                        <div className="rounded-xl p-4 bg-primary/5" style={{ border: "1px solid rgba(34,197,94,0.15)" }}>
                          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2">Suggestion</p>
                          <p className="text-sm text-foreground leading-relaxed">{suggestionPart}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            ) : null}
          </div>
        </section>

      </main>
    </div>
  );
};

export default Progress;