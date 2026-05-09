import { useEffect, useState } from "react";
import { X, Plus, Loader2, ChevronDown, ChevronUp } from "lucide-react";
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
  onAdd: (selected: Exercise[], selectedSongs: Array<{ title: string; artist: string }>) => Promise<void>;
};

export const BuildYourOwnModal = ({ open, onClose, onAdd }: Props) => {
  const [visible, setVisible] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open) {
      setTimeout(() => setVisible(true), 10);
      fetchExercises();
    } else {
      setVisible(false);
      setSelectedExercises([]);
      setSelectedSongs(new Set());
      setExpandedExercise(null);
    }
  }, [open]);

  const fetchExercises = async () => {
    const { data } = await supabase
      .from("exercise_templates")
      .select("*")
      .eq("category", "Technical");
    if (data) setExercises(data as Exercise[]);
  };

  const toggleExercise = (id: string) => {
    setSelectedExercises(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    // Auto-expand when selected
    if (!selectedExercises.includes(id)) {
      setExpandedExercise(id);
    }
  };

  const toggleSong = (songTitle: string, artistName: string) => {
    const key = `${songTitle}|${artistName}`;
    setSelectedSongs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  };

  const handleAdd = async () => {
    setAdding(true);
    const selectedExerciseObjects = exercises.filter(e => selectedExercises.includes(e.id));
    const selectedSongObjects = Array.from(selectedSongs).map(key => {
      const [title, artist] = key.split("|");
      return { title, artist };
    });
    await onAdd(selectedExerciseObjects, selectedSongObjects);
    setAdding(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 z-10 transition-transform duration-300 ${visible ? "translate-y-0" : "translate-y-8"}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lg font-bold">Build Your Own</p>
            <p className="text-sm text-muted-foreground">Pick exercises and songs to add</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 mb-6">
          {exercises.map(exercise => {
            const isSelected = selectedExercises.includes(exercise.id);
            const isExpanded = expandedExercise === exercise.id;
            return (
              <div key={exercise.id}>
                {/* Exercise Header */}
                <button
                  onClick={() => toggleExercise(exercise.id)}
                  className={`w-full text-left flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isSelected ? "border-primary bg-primary/10" : "border-border bg-secondary/50 hover:border-primary/50"
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{exercise.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{exercise.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <span className="text-xs font-mono text-muted-foreground">{exercise.default_bpm} BPM</span>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                    </div>
                  </div>
                </button>

                {/* Linked Songs (expand when exercise selected) */}
                {isSelected && (
                  <div className="mt-2 ml-3 pl-3 border-l border-border/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Suggested Songs</p>
                      <button
                        onClick={() => setExpandedExercise(isExpanded ? null : exercise.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="space-y-2">
                        {exercise.linked_songs.map((song, i) => {
                          const songKey = `${song.title}|${song.artist}`;
                          const isSongSelected = selectedSongs.has(songKey);
                          return (
                            <button
                              key={i}
                              onClick={() => toggleSong(song.title, song.artist)}
                              className={`w-full text-left flex items-center justify-between p-2 rounded text-sm transition-all ${
                                isSongSelected ? "bg-primary/20 border border-primary/40" : "hover:bg-secondary"
                              }`}
                            >
                              <div>
                                <p className="font-medium text-sm">{song.title}</p>
                                <p className="text-xs text-muted-foreground">{song.artist}</p>
                              </div>
                              <div className={`w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center ${
                                isSongSelected ? "border-primary bg-primary" : "border-muted-foreground"
                              }`}>
                                {isSongSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Button
          className="w-full"
          disabled={selectedExercises.length === 0 || adding}
          onClick={handleAdd}
        >
          {adding
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding...</>
            : <><Plus className="h-4 w-4 mr-2" /> Add {selectedExercises.length > 0 ? `${selectedExercises.length} exercise${selectedExercises.length !== 1 ? "s" : ""}` : ""}{selectedSongs.size > 0 ? ` + ${selectedSongs.size} song${selectedSongs.size !== 1 ? "s" : ""}` : ""}</>
          }
        </Button>
      </div>
    </div>
  );
};