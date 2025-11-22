import { useState, useEffect } from "react";
import { ArrowLeft, Play, Pause, RotateCcw, Plus, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

const Practice = () => {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleReset = () => {
    setSeconds(0);
    setIsPlaying(false);
  };

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
          <div>
            <h1 className="text-xl font-bold">Practice Session</h1>
            <p className="text-sm text-muted-foreground">Alternate Picking</p>
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
              <div className="text-6xl font-bold metric-display">{bpm}</div>
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

            <Button className="w-full h-14 text-lg font-semibold">
              {isPlaying ? "Click Active" : "Start Metronome"}
            </Button>
          </Card>
        </section>

        {/* Exercise Reference */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Exercise</h2>
          <Card className="p-6 bg-secondary border-border">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground mb-4">
              Snapshot Area
              <br />
              (Tab/Sheet Photo)
            </div>
            <Button variant="outline" className="w-full">
              Add Snapshot
            </Button>
          </Card>
        </section>

        {/* Finish Session */}
        <Button className="w-full h-16 text-lg font-semibold" size="lg">
          Complete Session
        </Button>
      </main>
    </div>
  );
};

export default Practice;
