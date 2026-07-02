import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronRight, ChevronDown, Sparkles, LayoutDashboard, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import MiniLogo from "@/components/MiniLogo";
import WaveformLoader from "@/components/WaveformLoader";
import AssignExerciseModal from "@/components/AssignExerciseModal";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCountUp } from "@/hooks/useCountUp";

const daysSince = (iso: string | null): number =>
  iso === null ? Number.MAX_SAFE_INTEGER : Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

const aiCardGlow = {
  border: "1px solid rgba(255,255,255,0.05)",
  background: "radial-gradient(circle at top right, rgba(34,197,94,0.08) 0%, transparent 60%), hsl(var(--card))",
};

const formatMins = (secs: number) => Math.floor(secs / 60);

const formatDuration = (mins: number) => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const formatRelativeTime = (iso: string | null): string => {
  if (!iso) return "Never practiced";
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diffDays === 0) return "Last practiced: Today";
  if (diffDays === 1) return "Last practiced: Yesterday";
  if (diffDays < 7) return `Last practiced: ${diffDays} days ago`;
  if (diffDays < 14) return "Last practiced: 1 week ago";
  if (diffDays < 30) return `Last practiced: ${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return "Last practiced: 1 month ago";
  return `Last practiced: ${Math.floor(diffDays / 30)} months ago`;
};

const AI_TTL = 24 * 60 * 60 * 1000;

const callAI = async (prompt: string): Promise<string> => {
  if (import.meta.env.DEV) {
    const res = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama3.1", messages: [{ role: "user", content: prompt }], stream: false }),
    });
    if (!res.ok) throw new Error("api_error");
    const json = await res.json();
    return (json.message?.content || "").trim();
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
        max_tokens: 300,
      }),
    });
    if (!res.ok) throw new Error("api_error");
    const json = await res.json();
    return (json.content?.[0]?.text || "").trim();
  }
};

const StudentDetail = () => {
  const { id } = useParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState<"overview" | "progress">("overview");
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [peakBpm, setPeakBpm] = useState(0);
  const [lastActiveDate, setLastActiveDate] = useState<string | null>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [editingTargetValue, setEditingTargetValue] = useState("");
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [editingNotesValue, setEditingNotesValue] = useState("");
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiSuggestionLoading, setAiSuggestionLoading] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [suggestionExpanded, setSuggestionExpanded] = useState(false);

  const selectedExercise = exercises.find(e => e.id === selectedExerciseId);
  const chartData = selectedExercise?.history?.map((h: any) => ({
    date: new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    bpm: h.bpm,
  })) || [];
  const bpmGain = chartData.length >= 2 ? chartData[chartData.length - 1].bpm - chartData[0].bpm : 0;
  const animatedPeak = useCountUp(peakBpm, !loading);
  const activityDays = daysSince(lastActiveDate);
  const chartBpms = chartData.map((d: any) => d.bpm);
  const minBpm = chartBpms.length > 0 ? Math.max(0, Math.min(...chartBpms) - 10) : 0;
  const maxBpm = chartBpms.length > 0 ? Math.max(...chartBpms) + 10 : 200;

  const loadExercises = async () => {
    if (!id) return;
    const [{ data }, { data: sessionData }] = await Promise.all([
      supabase
        .from("exercises")
        .select("id, title, category, current_bpm, target_bpm, history, is_assigned, teacher_notes")
        .eq("user_id", id),
      supabase
        .from("sessions")
        .select("exercises, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
    ]);
    const exs = data || [];
    const sessions = sessionData || [];
    const enriched = exs.map((ex: any) => {
      const lastSession = sessions.find(
        (s: any) => Array.isArray(s.exercises) && s.exercises.includes(ex.id)
      );
      return { ...ex, _last_practiced: lastSession?.created_at ?? null };
    });
    setExercises(enriched);
    if (enriched.length > 0 && !selectedExerciseId) {
      const withTwoPlus = enriched.find((e: any) => (e.history || []).length >= 2);
      const withOnePlus = enriched.find((e: any) => (e.history || []).length >= 1);
      setSelectedExerciseId((withTwoPlus ?? withOnePlus ?? enriched[0]).id);
    }
    const peak = enriched.reduce((max: number, e: any) => {
      const bpms = (e.history || []).map((h: any) => h.bpm);
      return bpms.length ? Math.max(max, ...bpms) : max;
    }, 0);
    setPeakBpm(peak);
  };

  const handleRemove = async (exerciseId: string) => {
    await Promise.all([
      (supabase as any).from("assigned_exercises").delete().eq("exercise_id", exerciseId).eq("student_id", id),
      supabase.from("exercises").delete().eq("id", exerciseId),
    ]);
    setExercises((prev) => prev.filter((e: any) => e.id !== exerciseId));
    setConfirmRemoveId(null);
  };

  const handleUpdateNotes = async (exerciseId: string) => {
    await (supabase as any)
      .from("exercises")
      .update({ teacher_notes: editingNotesValue.trim() || null })
      .eq("id", exerciseId);
    setEditingNotesId(null);
    loadExercises();
  };

  const handleUpdateTarget = async (exerciseId: string) => {
    const newTarget = Math.min(240, Math.max(40, parseInt(editingTargetValue) || 80));
    await supabase.from("exercises").update({ target_bpm: newTarget }).eq("id", exerciseId);
    setEditingTargetId(null);
    loadExercises();
  };

  const loadAiSummary = async () => {
    if (!id) return;
    const cacheKey = `fretgym_student_summary_${id}`;
    const tsKey = `${cacheKey}_ts`;
    try {
      const cached = localStorage.getItem(cacheKey);
      const ts = localStorage.getItem(tsKey);
      if (cached && ts && Date.now() - Number(ts) < AI_TTL) { setAiSummary(cached); return; }
    } catch {}
    setAiSummaryLoading(true);
    try {
      const lastActive = formatRelativeTime(lastActiveDate).replace("Last practiced: ", "").replace("Never practiced", "Never");
      const exerciseList = exercises.map(e => {
        const startBpm = e.history?.[0]?.bpm ?? e.current_bpm;
        const hasTarget = e.target_bpm > startBpm;
        return `${e.title} (${e.category}): ${e.current_bpm} BPM${hasTarget ? `, target ${e.target_bpm} BPM` : ", no target set"}`;
      }).join("; ");
      const prompt = `You are a guitar teacher's assistant. Given this student's practice data, give 2-3 specific observations about their progress and one actionable suggestion for the teacher. Do not use markdown bold or asterisks. Format your response exactly like this — no other text:\nInsights:\n- point one\n- point two\nSuggestion:\nOne paragraph here.\n\nStudent: ${studentName}\nSessions: ${totalSessions}\nPractice time: ${formatDuration(totalMinutes)}\nPeak BPM: ${peakBpm > 0 ? peakBpm : "none"}\nLast active: ${lastActive}\nExercises: ${exerciseList || "none yet"}`;
      const text = await callAI(prompt);
      if (!text) throw new Error("empty");
      localStorage.setItem(cacheKey, text);
      localStorage.setItem(tsKey, String(Date.now()));
      setAiSummary(text);
    } catch { /* show nothing */ } finally { setAiSummaryLoading(false); }
  };

  const loadAiSuggestion = async () => {
    if (!id) return;
    const cacheKey = `fretgym_student_suggestion_${id}`;
    const tsKey = `${cacheKey}_ts`;
    try {
      const cached = localStorage.getItem(cacheKey);
      const ts = localStorage.getItem(tsKey);
      if (cached && ts && Date.now() - Number(ts) < AI_TTL) { setAiSuggestion(cached); return; }
    } catch {}
    setAiSuggestionLoading(true);
    try {
      const exerciseList = exercises.map(e => {
        const sessionCount = (e.history || []).length;
        return `${e.title} (${e.category}): ${e.current_bpm}/${e.target_bpm} BPM, ${sessionCount} sessions`;
      }).join("; ");
      const prompt = `You are a guitar teacher's assistant. Based on this student's current exercises and progress, suggest one specific exercise to assign next. Do not use markdown bold or asterisks. Format your response exactly like this — no other text:\nInsights:\n- exercise name and category\n- suggested starting BPM\nSuggestion:\nOne sentence explaining why this exercise is the right next step.\n\nStudent exercises: ${exerciseList || "none yet"}`;
      const text = await callAI(prompt);
      if (!text) throw new Error("empty");
      localStorage.setItem(cacheKey, text);
      localStorage.setItem(tsKey, String(Date.now()));
      setAiSuggestion(text);
    } catch { /* show nothing */ } finally { setAiSuggestionLoading(false); }
  };

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        const [
          { data: profile },
          { data: sessionRows },
        ] = await Promise.all([
          (supabase as any).from("profiles").select("full_name").eq("id", id).single(),
          supabase.from("sessions").select("id, duration, created_at, exercises").eq("user_id", id).order("created_at", { ascending: false }),
        ]);

        setStudentName(profile?.full_name ?? "Student");

        const rows = sessionRows || [];
        setTotalSessions(rows.length);
        setTotalMinutes(formatMins(rows.reduce((acc: number, r: any) => acc + (r.duration || 0), 0)));
        setLastActiveDate(rows[0]?.created_at ?? null);
        setRecentSessions(rows.slice(0, 10));

        await loadExercises();
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
    if (loading || !id) return;
    loadAiSummary();
    loadAiSuggestion();
  }, [loading, id]);

  const renderExerciseCard = (ex: any) => {
    const startBpm = ex.history?.[0]?.bpm ?? ex.current_bpm;
    const fillPct = ex.target_bpm > 0 && ex.target_bpm !== startBpm
      ? Math.min(100, Math.max(0, Math.round(((ex.current_bpm - startBpm) / (ex.target_bpm - startBpm)) * 100)))
      : 0;
    const isEditing = editingTargetId === ex.id;
    const isEditingNotes = editingNotesId === ex.id;
    const isHovered = hoveredCardId === ex.id;

    const categoryGradient =
      ex.category === "Warmup"
        ? `radial-gradient(circle at top right, rgba(234,179,8,${isHovered ? 0.4 : 0.3}) 0%, rgba(0,0,0,0.8) 60%)`
        : ex.category === "Technical"
        ? `radial-gradient(circle at top right, rgba(59,130,246,${isHovered ? 0.4 : 0.3}) 0%, rgba(0,0,0,0.8) 60%)`
        : ex.category === "Repertoire"
        ? `radial-gradient(circle at top right, rgba(168,85,247,${isHovered ? 0.4 : 0.3}) 0%, rgba(0,0,0,0.8) 60%)`
        : `radial-gradient(circle at top right, rgba(255,255,255,${isHovered ? 0.2 : 0.1}) 0%, rgba(0,0,0,0.8) 60%)`;
    const categoryColor =
      ex.category === "Warmup" ? "#eab308"
        : ex.category === "Technical" ? "#3b82f6"
        : ex.category === "Repertoire" ? "#a855f7"
        : "#22c55e";

    return (
      <div
        key={ex.id}
        className="rounded-2xl overflow-hidden bg-card"
        style={{
          border: isHovered ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.08)",
          transform: isHovered ? "translateY(-2px)" : "translateY(0)",
          boxShadow: isHovered ? "0 8px 24px rgba(0,0,0,0.4)" : "none",
          transition: "all 200ms ease",
        }}
        onMouseEnter={() => setHoveredCardId(ex.id)}
        onMouseLeave={() => setHoveredCardId(null)}
      >
        {/* Cinematic face */}
        <div className="relative" style={{ height: "110px", background: categoryGradient }}>
          {/* Ghost text */}
          <span
            className="absolute font-black text-white select-none pointer-events-none leading-none"
            style={{ fontSize: "56px", opacity: 0.04, top: "-6px", right: "-4px" }}
          >
            {ex.category}
          </span>

          {/* Right scrim behind BPM */}
          <div
            className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to left, rgba(0,0,0,0.6) 0%, transparent 100%)" }}
          />

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-30 overflow-hidden">
            <div
              className="h-full transition-all duration-500 max-w-full"
              style={{ width: `${fillPct}%`, background: categoryColor }}
            />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between z-20">
            <div>
              <h3 className="text-base font-bold text-white leading-tight">{ex.title}</h3>
              {ex.is_assigned && (
                <p className="text-[10px] font-semibold tracking-widest uppercase text-primary mt-0.5">From Teacher</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(ex._last_practiced)}</p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black text-white leading-none">{ex.current_bpm}</span>
              <span className="text-xs text-muted-foreground leading-none mt-0.5">BPM</span>
            </div>
          </div>
        </div>

        {/* Teacher controls */}
        <div className="p-4 space-y-3">
        {ex.target_bpm > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">START: {startBpm} BPM</span>
            {isEditing ? (
              <span className="flex items-center gap-1">
                <input
                  type="text"
                  inputMode="numeric"
                  value={editingTargetValue}
                  onChange={(e) => setEditingTargetValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdateTarget(ex.id);
                    if (e.key === "Escape") setEditingTargetId(null);
                  }}
                  className="w-12 text-xs text-right bg-transparent border-b border-white/20 outline-none focus:border-primary text-foreground"
                  autoFocus
                />
                <span className="text-xs text-muted-foreground">BPM</span>
                <button onClick={() => handleUpdateTarget(ex.id)} className="text-primary text-xs ml-1">✓</button>
              </span>
            ) : startBpm === ex.target_bpm ? (
              <span className="text-xs text-muted-foreground">No target set</span>
            ) : (
              <span className="text-xs text-muted-foreground">TARGET: {ex.target_bpm} BPM</span>
            )}
          </div>
        )}

        {isEditingNotes && (
          <div className="space-y-2 pt-1">
            <textarea
              value={editingNotesValue}
              onChange={(e) => setEditingNotesValue(e.target.value)}
              placeholder="Add a note for this student…"
              rows={3}
              autoFocus
              className="w-full text-sm bg-transparent rounded-lg p-2 outline-none focus:border-primary text-foreground resize-none"
              style={{ border: "1px solid rgba(255,255,255,0.15)" }}
              onKeyDown={(e) => { if (e.key === "Escape") setEditingNotesId(null); }}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingNotesId(null)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateNotes(ex.id)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Save Note ✓
              </button>
            </div>
          </div>
        )}

        {!isEditing && !isEditingNotes && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {ex.is_assigned && confirmRemoveId === ex.id ? (
              <>
                <button
                  onClick={() => setConfirmRemoveId(null)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "hsl(var(--muted-foreground))" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemove(ex.id)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
                  style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)", color: "rgb(239,68,68)" }}
                >
                  Confirm Remove?
                </button>
              </>
            ) : (
              <>
                {ex.is_assigned && (
                  <button
                    onClick={() => setConfirmRemoveId(ex.id)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
                    style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.4)", color: "rgb(239,68,68)" }}
                  >
                    Remove
                  </button>
                )}
                {ex.is_assigned && (
                  <button
                    onClick={() => { setEditingNotesId(ex.id); setEditingNotesValue(ex.teacher_notes ?? ""); }}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "hsl(var(--muted-foreground))" }}
                  >
                    Edit Notes
                  </button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm"
                  onClick={() => { setEditingTargetId(ex.id); setEditingTargetValue(String(ex.target_bpm)); }}
                >
                  Update Target
                </Button>
              </>
            )}
          </div>
        )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <WaveformLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader
        title={studentName.toUpperCase()}
        breadcrumb="My Students"
        showBack
        titleAccessory={activityDays <= 2 && totalSessions > 0 ? (
          <span
            className="h-2 w-2 rounded-full bg-primary shrink-0"
            style={{ animation: "pulseDot 2s ease-in-out infinite" }}
          />
        ) : undefined}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">

        {activeTab === "overview" && (
          <>
            {/* Student pulse hero */}
            <section
              className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid rgba(255,255,255,0.05)",
                animation: "fadeUp 400ms ease-out both",
              }}
            >
              {/* Ambient drifting glow */}
              <div
                className="absolute pointer-events-none"
                style={{
                  inset: "-40%",
                  background: "radial-gradient(circle at 70% 25%, rgba(34,197,94,0.22) 0%, transparent 55%)",
                  animation: "heroDrift 9s ease-in-out infinite alternate",
                }}
              />
              <div className="relative">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">Peak BPM</p>
                <div className="flex items-end gap-3">
                  <span
                    className="text-6xl sm:text-8xl font-black text-primary leading-none"
                    style={{ textShadow: "0 0 40px hsl(var(--primary) / 0.4)" }}
                  >
                    {peakBpm > 0 ? animatedPeak : "—"}
                  </span>
                  {peakBpm > 0 && (
                    <span className="text-2xl font-semibold text-muted-foreground mb-3">BPM</span>
                  )}
                </div>
                <p className={`text-xs mt-2 ${activityDays > 2 && totalSessions > 0 ? "text-amber-500" : "text-muted-foreground"}`}>
                  {totalSessions === 0
                    ? "No sessions yet — assign something to get started."
                    : activityDays === 0
                    ? "Practiced today — momentum is good."
                    : activityDays <= 2
                    ? "Practiced recently — momentum is good."
                    : activityDays <= 7
                    ? "Going quiet — a nudge might help."
                    : `Quiet for ${activityDays} days — worth a check-in.`}
                </p>
                <div className="flex items-center gap-8 mt-8 pt-6 border-t border-border">
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Sessions</p>
                    <p className="text-2xl font-black text-white leading-none mt-1">{totalSessions}</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Practice</p>
                    <p className="text-2xl font-black text-white leading-none mt-1 whitespace-nowrap">{formatDuration(totalMinutes)}</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Last Active</p>
                    <p className="text-2xl font-black text-white leading-none mt-1 whitespace-nowrap">
                      {formatRelativeTime(lastActiveDate).replace("Last practiced: ", "").replace("Never practiced", "Never")}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Student Summary */}
            {(aiSummaryLoading || aiSummary) && (
              <div className="rounded-2xl" style={{ ...aiCardGlow, animation: "fadeUp 400ms ease-out both", animationDelay: "70ms" }}>
                <button
                  onClick={() => setSummaryExpanded(!summaryExpanded)}
                  className="w-full flex items-center justify-between px-5 py-4"
                >
                  <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
                    <Sparkles
                      className="h-4 w-4 text-green-500"
                      style={aiSummaryLoading ? { animation: "sparklePulse 1.5s ease-in-out infinite" } : undefined}
                    /> Student Summary
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${summaryExpanded ? "rotate-180" : ""}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-200 ${summaryExpanded ? "max-h-[600px]" : "max-h-0"}`}>
                  <div className="px-5 pb-5">
                    {aiSummaryLoading ? (
                      <p className="text-sm text-muted-foreground">Generating summary…</p>
                    ) : aiSummary ? (() => {
                      const insightsIdx = aiSummary.indexOf("Insights:");
                      const clean = insightsIdx > 0 ? aiSummary.slice(insightsIdx) : aiSummary;
                      const suggestionIdx = clean.indexOf("Suggestion:");
                      const insightsPart = (suggestionIdx > -1 ? clean.slice(0, suggestionIdx) : clean).replace(/^Insights:\s*/i, "").trim();
                      const suggestionPart = suggestionIdx > -1 ? clean.slice(suggestionIdx).replace(/^Suggestion:\s*/i, "").trim() : "";
                      const insightLines = insightsPart.split("\n").map(l => l.replace(/^[-*•\d.)]+\s*/, "").trim()).filter(Boolean);
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
                    })() : null}
                  </div>
                </div>
              </div>
            )}

            {/* Exercise Suggestion */}
            {(aiSuggestionLoading || aiSuggestion) && (
              <div className="rounded-2xl" style={{ ...aiCardGlow, animation: "fadeUp 400ms ease-out both", animationDelay: "140ms" }}>
                <button
                  onClick={() => setSuggestionExpanded(!suggestionExpanded)}
                  className="w-full flex items-center justify-between px-5 py-4"
                >
                  <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
                    <Sparkles
                      className="h-4 w-4 text-green-500"
                      style={aiSuggestionLoading ? { animation: "sparklePulse 1.5s ease-in-out infinite" } : undefined}
                    /> Exercise Suggestion
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${suggestionExpanded ? "rotate-180" : ""}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-200 ${suggestionExpanded ? "max-h-[600px]" : "max-h-0"}`}>
                  <div className="px-5 pb-5">
                    {aiSuggestionLoading ? (
                      <p className="text-sm text-muted-foreground">Thinking…</p>
                    ) : aiSuggestion ? (() => {
                      const insightsIdx = aiSuggestion.indexOf("Insights:");
                      const clean = insightsIdx > 0 ? aiSuggestion.slice(insightsIdx) : aiSuggestion;
                      const suggestionIdx = clean.indexOf("Suggestion:");
                      const insightsPart = (suggestionIdx > -1 ? clean.slice(0, suggestionIdx) : clean).replace(/^Insights:\s*/i, "").trim();
                      const suggestionPart = suggestionIdx > -1 ? clean.slice(suggestionIdx).replace(/^Suggestion:\s*/i, "").trim() : "";
                      const insightLines = insightsPart.split("\n").map(l => l.replace(/^[-*•\d.)]+\s*/, "").trim()).filter(Boolean);
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
                    })() : null}
                  </div>
                </div>
              </div>
            )}

            {/* Assigned by You */}
            <section className="space-y-3" style={{ animation: "fadeUp 400ms ease-out both", animationDelay: "210ms" }}>
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Assigned by You</p>
              {exercises.filter((e) => e.is_assigned).length === 0 ? (
                <div className="rounded-2xl bg-card p-4 text-center text-sm text-muted-foreground" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                  No exercises assigned yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {exercises.filter((e) => e.is_assigned).map(renderExerciseCard)}
                </div>
              )}
            </section>

            {/* Added by Student */}
            {exercises.filter((e) => !e.is_assigned).length > 0 && (
              <section className="space-y-3" style={{ animation: "fadeUp 400ms ease-out both", animationDelay: "280ms" }}>
                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Added By Student</p>
                <div className="space-y-3">
                  {exercises.filter((e) => !e.is_assigned).map(renderExerciseCard)}
                </div>
              </section>
            )}
          </>
        )}

        {activeTab === "progress" && (
          <>
            {/* Recent Sessions */}
            <section className="space-y-3" style={{ animation: "fadeUp 400ms ease-out both" }}>
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Recent Sessions</p>
              {recentSessions.length === 0 ? (
                <div className="bg-card rounded-2xl px-4 py-3 text-center text-sm text-muted-foreground" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                  No sessions yet.
                </div>
              ) : (
                <div className="border-l border-white/10 ml-1.5 pl-4 space-y-3">
                  {recentSessions.map((s, i) => {
                    const exerciseTitles = (s.exercises || [])
                      .map((eid: string) => exercises.find(e => e.id === eid)?.title)
                      .filter(Boolean)
                      .join(", ");
                    return (
                      <div key={i} className="relative">
                        <span
                          className="absolute top-4 h-2.5 w-2.5 rounded-full bg-primary"
                          style={{ left: "-21.5px", boxShadow: "0 0 8px rgba(34,197,94,0.5)" }}
                        />
                        <div
                          className="bg-card rounded-2xl px-4 py-3 flex items-center justify-between"
                          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{exerciseTitles || "Session"}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{s.created_at ? formatDate(s.created_at) : "—"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">{formatDuration(formatMins(s.duration || 0))}</p>
                            <p className="text-xs text-muted-foreground">duration</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* BPM Progress Chart */}
            <section className="space-y-4" style={{ animation: "fadeUp 400ms ease-out both", animationDelay: "70ms" }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">BPM Progress</p>
                <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                  <SelectTrigger className="w-44 h-9 bg-card text-sm" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                    <SelectValue placeholder="Select exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    {exercises.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl p-6 bg-card" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                {chartData.length < 2 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">No sessions yet for this exercise.</p>
                ) : (
                  <>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="bpmGlow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                          </defs>
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
                          <Area type="monotone" dataKey="bpm" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#bpmGlow)" dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                        </AreaChart>
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
          </>
        )}

        {/* Assign Exercise — always visible */}
        <button
          className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity"
          style={{ animation: "fadeUp 400ms ease-out both", animationDelay: "350ms" }}
          onClick={() => setAssignOpen(true)}
        >
          <div className="flex items-center gap-2">
            <MiniLogo color="#0a0a0a" />
            Assign Exercise
          </div>
          <ChevronRight className="h-5 w-5 opacity-70" />
        </button>

      </main>

      <AssignExerciseModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        studentId={id!}
        studentName={studentName}
      />

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-[#000000] border-t border-[#222222] z-50"
        style={{ height: "calc(72px + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="container mx-auto px-4 h-full">
          <div className="flex flex-row h-full items-center justify-around">
            {([
              { tab: "overview", icon: LayoutDashboard, label: "Overview" },
              { tab: "progress", icon: TrendingUp, label: "Progress" },
            ] as const).map(({ tab, icon: Icon, label }) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex flex-col items-center justify-center py-3 transition-all ${
                    isActive ? "text-green-500" : "text-[#666666]"
                  }`}
                >
                  <div className={`flex flex-col items-center transition-all ${
                    isActive ? "rounded-xl bg-secondary px-6 py-2" : ""
                  }`}>
                    <Icon className="h-6 w-6 mb-1" fill={isActive ? "currentColor" : "none"} />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes heroDrift { from { transform: translate(0, 0); } to { transform: translate(-6%, 5%); } }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
        @keyframes sparklePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        @media (prefers-reduced-motion: reduce) {
          main *, main, header * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>
    </div>
  );
};

export default StudentDetail;
