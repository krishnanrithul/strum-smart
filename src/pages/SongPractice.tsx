import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Play, Pause, RotateCcw, Plus, Minus, ChevronRight, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { StorageService, Project } from "@/lib/storage";
import { getStatusColor } from "@/lib/badges";
import { MetronomeEngine } from "@/lib/audio";

const glassCard = { border: "1px solid rgba(255,255,255,0.05)" };

const SongPractice = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [bpm, setBpm] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [loggedBpm, setLoggedBpm] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const metronomeRef = useRef<MetronomeEngine | null>(null);

  useEffect(() => {
    metronomeRef.current = new MetronomeEngine();
    return () => { metronomeRef.current?.stop(); };
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const p = await StorageService.getProject(id);
      setProject(p);
      setNotes(localStorage.getItem(`song_notes_${id}`) || "");
      const saved = localStorage.getItem(`song_bpm_${id}`);
      if (saved) setLoggedBpm(parseInt(saved));
      setLoading(false);
    };
    load();
  }, [id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    metronomeRef.current?.setBpm(bpm);
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

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) setBpm(val);
  };

  const handleBpmBlur = () => {
    if (bpm < 40) setBpm(40);
    if (bpm > 240) setBpm(240);
  };

  const logBpm = () => {
    if (!id) return;
    localStorage.setItem(`song_bpm_${id}`, String(bpm));
    setLoggedBpm(bpm);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Song not found.</p>
          <Link to="/library"><Button variant="ghost">Back to Library</Button></Link>
        </div>
      </div>
    );
  }

  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${project.title}${project.artist ? ` ${project.artist}` : ""} guitar lesson`
  )}`;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/library">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xs font-semibold tracking-widest uppercase text-foreground">Song Practice</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{project.title}{project.artist ? ` — ${project.artist}` : ""}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">

        {/* Song info */}
        <div className="rounded-2xl bg-card p-5 flex items-center justify-between" style={glassCard}>
          <div>
            <h2 className="text-lg font-bold text-foreground">{project.title}</h2>
            {project.artist && <p className="text-sm text-muted-foreground mt-0.5">{project.artist}</p>}
          </div>
          <Badge variant="outline" className={getStatusColor(project.status)}>{project.status}</Badge>
        </div>

        {/* Timer */}
        <div className="rounded-2xl bg-card p-8" style={glassCard}>
          <div className="text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2">Session Time</p>
            <div className="text-7xl font-bold text-foreground mb-6">{formatTime(seconds)}</div>
            <div className="flex gap-3 justify-center">
              <Button size="lg" onClick={() => setIsPlaying(!isPlaying)} className="h-16 w-16 rounded-full">
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
              </Button>
              <Button size="lg" variant="secondary" onClick={() => { setSeconds(0); setIsPlaying(false); }} className="h-16 w-16 rounded-full">
                <RotateCcw className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Metronome */}
        <section className="space-y-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Metronome</p>
          <div className="rounded-2xl bg-card p-6 space-y-6" style={glassCard}>
            <div className="text-center">
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2">Tempo</p>
              <Input
                type="number"
                value={bpm}
                onChange={handleBpmChange}
                onBlur={handleBpmBlur}
                className="text-6xl font-bold text-foreground h-20 w-56 text-center bg-transparent border-none focus-visible:ring-0 p-0 hover:bg-card/50 focus:bg-card/50 rounded-lg transition-colors cursor-text mx-auto"
                min={40}
                max={240}
              />
              <p className="text-sm text-muted-foreground mt-1">BPM</p>
            </div>
            <div className="space-y-4">
              <Slider value={[bpm]} onValueChange={v => setBpm(v[0])} min={40} max={240} step={1} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setBpm(Math.max(40, bpm - 5))} className="flex-1 h-12">
                  <Minus className="h-5 w-5 mr-2" />5
                </Button>
                <Button variant="outline" onClick={() => setBpm(Math.max(40, bpm - 1))} className="flex-1 h-12">
                  <Minus className="h-4 w-4 mr-2" />1
                </Button>
                <Button variant="outline" onClick={() => setBpm(Math.min(240, bpm + 1))} className="flex-1 h-12">
                  1<Plus className="h-4 w-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={() => setBpm(Math.min(240, bpm + 5))} className="flex-1 h-12">
                  5<Plus className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
            <Button
              className={`w-full h-14 text-lg font-semibold ${isMetronomeActive ? "bg-red-500 hover:bg-red-600" : ""}`}
              onClick={toggleMetronome}
            >
              {isMetronomeActive ? "Stop Metronome" : "Start Metronome"}
            </Button>
          </div>
        </section>

        {/* BPM Tracking */}
        <section className="space-y-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">My Speed</p>
          <div className="rounded-2xl bg-card p-5" style={glassCard}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-foreground leading-none">
                  {loggedBpm ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {loggedBpm ? "last logged bpm" : "not logged yet"}
                </p>
              </div>
              <button
                onClick={logBpm}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Log {bpm} BPM
              </button>
            </div>
          </div>
        </section>

        {/* Watch on YouTube */}
        <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
          <button className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity">
            <div className="flex items-center gap-2">
              <span>▶️</span>
              Watch on YouTube
            </div>
            <ChevronRight className="h-5 w-5 opacity-70" />
          </button>
        </a>

        {/* Notes */}
        <section className="space-y-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Notes</p>
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              localStorage.setItem(`song_notes_${id}`, e.target.value);
            }}
            placeholder="Add notes, chord shapes, sections to practice..."
            className="w-full rounded-2xl bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[160px]"
            style={glassCard}
          />
        </section>

      </main>
    </div>
  );
};

export default SongPractice;
