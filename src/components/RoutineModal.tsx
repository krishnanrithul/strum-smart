import { useEffect, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Routine } from "@/data/routines";
import { getCategoryBadge } from "@/lib/badges";

type Props = {
  routine: Routine | null;
  isAdding: boolean;
  alreadyAdded: boolean;
  onClose: () => void;
  onAdd: () => void;
};

export const RoutineModal = ({ routine, isAdding, alreadyAdded, onClose, onAdd }: Props) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (routine) setTimeout(() => setVisible(true), 10);
    else setVisible(false);
  }, [routine]);

  if (!routine) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 z-10 transition-transform duration-300 ${visible ? "translate-y-0" : "translate-y-8"}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className={`text-lg font-bold ${routine.labelColor}`}>{routine.name}</p>
            <p className="text-sm text-muted-foreground">{routine.description}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 mb-6">
          {routine.exercises.map((ex, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{ex.title}</p>
                <Badge variant="outline" className={`text-xs mt-1 ${getCategoryBadge(ex.category)}`}>
                  {ex.category}
                </Badge>
              </div>
              <span className="text-sm font-mono text-muted-foreground">{ex.bpm} BPM</span>
            </div>
          ))}
        </div>
        <Button className="w-full" variant={alreadyAdded ? "secondary" : "default"}
          disabled={alreadyAdded || isAdding} onClick={onAdd}>
          {isAdding ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding...</>
            : alreadyAdded ? "Already in your library"
            : <><Plus className="h-4 w-4 mr-2" /> Add all to my library</>}
        </Button>
      </div>
    </div>
  );
};