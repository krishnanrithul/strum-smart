import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Play, Pause, RotateCcw, Plus, Minus, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StorageService, Exercise } from "@/lib/storage";
import { SessionCompleteDialog } from "@/components/SessionCompleteDialog";
import { MetronomeEngine } from "@/lib/audio";
import WaveformLoader from "@/components/WaveformLoader";

const glassCard = { border: "1px solid rgba(255,255,255,0.05)" };

const Practice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isFree = id === "free";
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [bpm, setBpm] = useState(120);
  const [bpmInput, setBpmInput] = useState("120");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [diagramExpanded, setDiagramExpanded] = useState(false);
  const metronomeRef = useRef<MetronomeEngine | null>(null);

  useEffect(() => {
    metronomeRef.current = new MetronomeEngine();
    return () => {
      if (metronomeRef.current) {
        metronomeRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (isFree) { setLoading(false); return; }
    const loadExercise = async () => {
      if (id) {
        setLoading(true);
        try {
          const data = await StorageService.getExercise(id);
          if (data) {
            setExercise(data);
            setBpm(data.currentBpm);
          }
        } catch (error) {
          console.error("Failed to load exercise:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadExercise();
  }, [id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (metronomeRef.current) {
      metronomeRef.current.setBpm(bpm);
    }
    setBpmInput(String(bpm));
  }, [bpm]);

  const toggleMetronome = () => {
    if (!metronomeRef.current) return;
    if (isMetronomeActive) {
      metronomeRef.current.stop();
      setIsMetronomeActive(false);
    } else {
      metronomeRef.current.start(bpm);
      setIsMetronomeActive(true);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleReset = () => {
    setSeconds(0);
    setIsPlaying(false);
  };

  const hasReferenceMaterials = exercise?.songsterrUrl || exercise?.ultimateGuitarUrl || exercise?.tutorialUrl || exercise?.diagramUrl;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <WaveformLoader />
      </div>
    );
  }

  if (!exercise && !isFree) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Exercise Not Found</h1>
          <Link to="/library">
            <Button>Return to Library</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-xs font-semibold tracking-widest uppercase text-foreground">Practice Session</span>
          <Zap className="h-4 w-4 text-primary" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">

        {/* Timer Card */}
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: "radial-gradient(circle at top right, rgba(34,197,94,0.12) 0%, transparent 60%), hsl(var(--card))",
            ...glassCard,
          }}
        >
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Session Time</p>
          <div className="text-7xl font-bold text-foreground mb-8 tabular-nums">
            {formatTime(seconds)}
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="h-14 w-14 rounded-full flex items-center justify-center bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
            </button>
            <button
              onClick={handleReset}
              className="h-14 w-14 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <RotateCcw className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Exercise Context */}
        {!isFree && exercise && (
          <div className="rounded-2xl bg-card px-5 py-4" style={glassCard}>
            <p className="text-base font-semibold text-foreground">{exercise.title}</p>
            {exercise.target_bpm > 0 && (
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mt-1">
                Target: {exercise.target_bpm} BPM
              </p>
            )}
          </div>
        )}

        {/* Metronome */}
        <section>
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Metronome</p>
          <div className="rounded-2xl bg-card p-6 space-y-6" style={glassCard}>

            {/* BPM display with flanking controls */}
            <div className="flex items-center justify-between gap-4">
              {/* Left pair: −5, −1 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setBpm(Math.max(40, bpm - 5))}
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  −5
                </button>
                <button
                  onClick={() => setBpm(Math.max(40, bpm - 1))}
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  −1
                </button>
              </div>

              {/* BPM number — tap to edit */}
              <div className="text-center">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={bpmInput}
                  onChange={(e) => setBpmInput(e.target.value)}
                  onBlur={() => {
                    const v = parseInt(bpmInput);
                    const clamped = isNaN(v) ? bpm : Math.min(240, Math.max(40, v));
                    setBpm(clamped);
                  }}
                  className="w-28 text-5xl font-bold text-foreground tabular-nums leading-none text-center bg-transparent border-none outline-none focus:ring-0 appearance-none"
                />
                <p className="text-xs text-muted-foreground mt-1 tracking-widest uppercase">BPM</p>
              </div>

              {/* Right pair: +1, +5 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setBpm(Math.min(240, bpm + 1))}
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  +1
                </button>
                <button
                  onClick={() => setBpm(Math.min(240, bpm + 5))}
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  +5
                </button>
              </div>
            </div>

            {/* Metronome toggle */}
            <button
              onClick={toggleMetronome}
              className="w-full h-12 rounded-xl font-semibold text-sm transition-colors"
              style={
                isMetronomeActive
                  ? { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "rgb(239,68,68)" }
                  : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "hsl(var(--foreground))" }
              }
            >
              {isMetronomeActive ? "Stop Metronome" : "Start Metronome"}
            </button>
          </div>
        </section>

        {/* Reference Materials */}
        {!isFree && exercise && (
          <section>
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Reference Materials</p>
            <div className="rounded-2xl bg-card p-5 space-y-3" style={glassCard}>
              {exercise.diagramUrl && (
                <div>
                  <button
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onClick={() => setDiagramExpanded(!diagramExpanded)}
                  >
                    {diagramExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {diagramExpanded ? "Hide" : "Show"} Diagram
                  </button>
                  {diagramExpanded && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-border">
                      <img src={exercise.diagramUrl} alt={`${exercise.title} diagram`} className="w-full object-contain bg-white" />
                    </div>
                  )}
                </div>
              )}
              {exercise.tutorialUrl && (
                <a href={exercise.tutorialUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                  <button className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    ▶️ Watch Tutorial
                  </button>
                </a>
              )}
              {exercise.songsterrUrl && (
                <a href={exercise.songsterrUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                  <button className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    🎸 View Songsterr Tab
                  </button>
                </a>
              )}
              {exercise.ultimateGuitarUrl && (
                <a href={exercise.ultimateGuitarUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                  <button className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    📝 View Ultimate Guitar Tab
                  </button>
                </a>
              )}
              {!hasReferenceMaterials && (
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.title}${exercise.artist ? ` ${exercise.artist}` : ""} guitar tutorial`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <button className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                  Search on YouTube
                  </button>
                </a>
              )}
            </div>
          </section>
        )}

        {/* Complete Session */}
        <button
          className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity"
          onClick={() => {
            setIsPlaying(false);
            if (isFree) { navigate("/"); } else { setShowCompleteDialog(true); }
          }}
        >
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Complete Session
          </div>
        </button>

      </main>

      {exercise && (
        <SessionCompleteDialog
          open={showCompleteDialog}
          onOpenChange={setShowCompleteDialog}
          exercise={exercise}
          durationSeconds={seconds}
        />
      )}
    </div>
  );
};

export default Practice;