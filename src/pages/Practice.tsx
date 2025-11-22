import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Play, Pause, RotateCcw, Plus, Minus, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { StorageService, Exercise } from "@/lib/storage";
import { SessionCompleteDialog } from "@/components/SessionCompleteDialog";
import { MetronomeEngine } from "@/lib/audio";

const Practice = () => {
  const { id } = useParams();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [loading, setLoading] = useState(true);
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

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 40 && val <= 240) {
      setBpm(val);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!exercise) {
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/library">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Practice Session</h1>
            <p className="text-sm text-muted-foreground">{exercise.title}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Timer Display */}
        <Card className="p-8 bg-gradient-to-br from-card to-secondary border-border">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">Session Time</div>
            <div className="text-7xl font-bold metric-display neon-glow mb-6">
              {formatTime(seconds)}
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => setIsPlaying(!isPlaying)}
                className="h-16 w-16 rounded-full"
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={handleReset}
                className="h-16 w-16 rounded-full"
              >
                <RotateCcw className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Metronome */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Metronome</h2>
          <Card className="p-6 bg-secondary border-border space-y-6">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Tempo</div>
              <div className="flex items-center justify-center gap-2">
                <Input
                  type="number"
                  value={bpm}
                  onChange={handleBpmChange}
                  className="text-6xl font-bold metric-display h-20 w-56 text-center bg-transparent border-none focus-visible:ring-0 p-0 hover:bg-card/50 focus:bg-card/50 rounded-lg transition-colors cursor-text"
                  min={40}
                  max={240}
                />
              </div>
              <div className="text-sm text-muted-foreground mt-1">BPM</div>
            </div>

            <div className="space-y-4">
              <Slider
                value={[bpm]}
                onValueChange={(value) => setBpm(value[0])}
                min={40}
                max={240}
                step={1}
                className="w-full"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setBpm(Math.max(40, bpm - 5))}
                  className="flex-1 h-12"
                >
                  <Minus className="h-5 w-5 mr-2" />
                  5
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setBpm(Math.max(40, bpm - 1))}
                  className="flex-1 h-12"
                >
                  <Minus className="h-4 w-4 mr-2" />
                  1
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setBpm(Math.min(240, bpm + 1))}
                  className="flex-1 h-12"
                >
                  1
                  <Plus className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setBpm(Math.min(240, bpm + 5))}
                  className="flex-1 h-12"
                >
                  5
                  <Plus className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>

            <Button
              className={`w-full h-14 text-lg font-semibold ${isMetronomeActive ? "bg-red-500 hover:bg-red-600" : ""}`}
              onClick={toggleMetronome}
            >
              {isMetronomeActive ? "Stop Metronome" : "Start Metronome"}
            </Button>
          </Card>
        </section>

        {/* Exercise Reference */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Reference Materials</h2>
          <Card className="p-6 bg-secondary border-border space-y-3">
            {exercise.songsterrUrl && (
              <a
                href={exercise.songsterrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full h-12 text-base">
                  🎸 View Songsterr Tab
                </Button>
              </a>
            )}
            {exercise.youtubeUrl && (
              <a
                href={exercise.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full h-12 text-base">
                  ▶️ Watch on YouTube
                </Button>
              </a>
            )}
            {exercise.ultimateGuitarUrl && (
              <a
                href={exercise.ultimateGuitarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full h-12 text-base">
                  📝 View Ultimate Guitar Tab
                </Button>
              </a>
            )}
            {!exercise.songsterrUrl && !exercise.youtubeUrl && !exercise.ultimateGuitarUrl && (
              <div className="text-center text-muted-foreground text-sm py-4">
                No reference materials added yet
              </div>
            )}
          </Card>
        </section>

        {/* Finish Session */}
        <Button
          className="w-full h-16 text-lg font-semibold"
          size="lg"
          onClick={() => {
            setIsPlaying(false);
            setShowCompleteDialog(true);
          }}
        >
          Complete Session
        </Button>
      </main>

      <SessionCompleteDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        exercise={exercise}
        durationSeconds={seconds}
      />
    </div>
  );
};

export default Practice;
