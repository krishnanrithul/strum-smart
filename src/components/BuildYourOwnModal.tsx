import { useEffect, useRef, useState } from "react";
import { X, ArrowRight, ArrowLeft, Check, Loader2, Music, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Exercise = {
  id: string;
  title: string;
  default_bpm: number;
  description: string | null;
  linked_songs: Array<{ title: string; artist: string }>;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (selectedExercises: Exercise[], selectedSongs: Array<{ title: string; artist: string }>) => Promise<void>;
};

export const BuildYourOwnModal = ({ open, onClose, onAdd }: Props) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(new Set());
  const [selectedSongKeys, setSelectedSongKeys] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Mount → paint → fade/slide in (two rAF frames guarantees the browser has painted opacity-0 first)
  useEffect(() => {
    if (open) {
      setMounted(true);
      setStep(1);
      setSelectedExerciseIds(new Set());
      setSelectedSongKeys(new Set());
      fetchExercises();
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [open]);

  const fetchExercises = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("exercise_templates")
      .select("*")
      .eq("category", "Technical")
      .order("title");
    if (data) setExercises(data as Exercise[]);
    setLoading(false);
  };

  const toggleExercise = (id: string) => {
    setSelectedExerciseIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSong = (key: string) => {
    setSelectedSongKeys(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const goToStep2 = () => {
    const allKeys = new Set<string>();
    exercises
      .filter(e => selectedExerciseIds.has(e.id))
      .forEach(e => (e.linked_songs || []).forEach(s => allKeys.add(`${s.title}|${s.artist}`)));
    setSelectedSongKeys(allKeys);
    setStep(2);
  };

  const handleAdd = async () => {
    setAdding(true);
    const selectedExercises = exercises.filter(e => selectedExerciseIds.has(e.id));
    const selectedSongs = Array.from(selectedSongKeys).map(key => {
      const [title, artist] = key.split("|");
      return { title, artist };
    });
    await onAdd(selectedExercises, selectedSongs);
    setAdding(false);
    onClose();
  };

  const selectedExercisesWithSongs = exercises.filter(e => selectedExerciseIds.has(e.id));
  const totalToAdd = selectedExerciseIds.size + selectedSongKeys.size;

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ transition: "opacity 0.25s ease", opacity: visible ? 1 : 0 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        className="relative w-full sm:max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl z-10 flex flex-col"
        style={{
          maxHeight: "85vh",
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease",
          transform: visible ? "translateY(0)" : "translateY(20px)",
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold text-foreground">Build your own</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    transition: "background-color 0.3s ease",
                    backgroundColor: step === 2 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)",
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                Step {step} of 2 &middot; {step === 1 ? "Choose exercises" : "Choose songs"}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors mt-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sliding body — two panels side by side, container slides */}
        <div className="flex-1 overflow-hidden">
          <div
            className="flex h-full"
            style={{
              width: "200%",
              transform: step === 1 ? "translateX(0)" : "translateX(-50%)",
              transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            {/* Panel 1 — Exercises */}
            <div className="overflow-y-auto px-6 py-4 space-y-2.5" style={{ width: "50%" }}>
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                exercises.map(exercise => {
                  const isSelected = selectedExerciseIds.has(exercise.id);
                  return (
                    <button
                      key={exercise.id}
                      onClick={() => toggleExercise(exercise.id)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:border-border/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Dumbbell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{exercise.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {exercise.default_bpm} BPM &middot; {(exercise.linked_songs || []).length} songs included
                            </p>
                          </div>
                        </div>
                        <div
                          className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                            isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Panel 2 — Songs */}
            <div className="overflow-y-auto px-6 py-4 space-y-6" style={{ width: "50%" }}>
              <p className="text-xs text-muted-foreground">
                Songs matched to your techniques. Deselect any you don't want.
              </p>
              {selectedExercisesWithSongs.map(exercise => (
                <div key={exercise.id}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Dumbbell className="h-3 w-3 text-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                      {exercise.title}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(exercise.linked_songs || []).map(song => {
                      const key = `${song.title}|${song.artist}`;
                      const isSelected = selectedSongKeys.has(key);
                      return (
                        <button
                          key={key}
                          onClick={() => toggleSong(key)}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border bg-background hover:border-border/60"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Music className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{song.title}</p>
                              <p className="text-xs text-muted-foreground">{song.artist}</p>
                            </div>
                          </div>
                          <div
                            className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                              isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0">
          {step === 1 ? (
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
              <Button onClick={goToStep2} disabled={selectedExerciseIds.size === 0} className="flex-1 gap-2">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)} className="gap-1.5 px-4">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={handleAdd} disabled={adding || totalToAdd === 0} className="flex-1 gap-2">
                {adding
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</>
                  : <>Add {totalToAdd} item{totalToAdd !== 1 ? "s" : ""}</>
                }
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};