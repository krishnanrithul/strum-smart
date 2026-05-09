import { useEffect, useState } from "react";
import { ChevronRight, Loader2, X } from "lucide-react";
import { Routine } from "@/data/routines";

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
      <div
        className={`relative w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-6 z-10 transition-transform duration-300 ${visible ? "translate-y-0" : "translate-y-8"}`}
        style={{ border: "1px solid rgba(255,255,255,0.15)" }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-lg font-bold text-foreground">{routine.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{routine.description}</p>
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
                <p className="text-xs text-muted-foreground mt-0.5">{ex.category}</p>
              </div>
              <span className="font-mono text-sm text-foreground">
                {ex.bpm}<span className="text-xs text-muted-foreground ml-0.5">bpm</span>
              </span>
            </div>
          ))}
        </div>

        {alreadyAdded ? (
          <button
            disabled
            className="w-full flex items-center justify-center px-5 py-3 rounded-xl bg-secondary text-muted-foreground font-semibold text-sm cursor-not-allowed"
          >
            Already in your library
          </button>
        ) : (
          <button
            onClick={onAdd}
            disabled={isAdding}
            className="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              {isAdding && <Loader2 className="h-4 w-4 animate-spin" />}
              {isAdding ? "Adding..." : "Add all to my library"}
            </span>
            {!isAdding && <ChevronRight className="h-5 w-5 opacity-70" />}
          </button>
        )}
      </div>
    </div>
  );
};
