import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { Exercise } from "@/lib/storage";

type Props = {
  exercise: Exercise;
  onEdit: (exercise: Exercise, e: React.MouseEvent) => void;
  onDelete: (exercise: Exercise, e: React.MouseEvent) => void;
};

export const ExerciseCard = ({ exercise, onEdit, onDelete }: Props) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="rounded-2xl relative overflow-hidden group transition-all duration-300"
      style={{
        background: hovered
          ? "linear-gradient(135deg, rgba(52,211,153,0.18) 0%, rgba(255,255,255,0.03) 100%)"
          : "rgba(255,255,255,0.03)",
        border: hovered ? "1px solid rgba(52,211,153,0.4)" : "1px solid rgba(255,255,255,0.06)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 8px 24px rgba(52,211,153,0.18)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Shimmer line */}
      <div
        className="absolute top-0 left-0 right-0 h-px transition-opacity duration-300"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.6), transparent)",
          opacity: hovered ? 1 : 0,
        }}
      />
      <Link to={`/practice/${exercise.id}`} className="relative z-10 flex items-center justify-between p-4 pr-20">
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-foreground truncate">{exercise.title}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {exercise.category}
            </span>
            {exercise.is_assigned && (
              <>
                <span className="text-xs text-muted-foreground"> · </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                  From Teacher
                </span>
              </>
            )}
          </div>
        </div>
        {exercise.currentBpm > 0 && (() => {
          const startBpm = exercise.history?.[0]?.bpm ?? exercise.currentBpm;
          const hasProgress = exercise.currentBpm !== startBpm;
          return (
            <div className="text-right flex-shrink-0 ml-4">
              {hasProgress ? (
                <div>
                  <span className="text-muted-foreground text-sm">{startBpm} → </span>
                  <span className="text-foreground font-bold">{exercise.currentBpm}</span>
                  <span className="text-xs text-muted-foreground"> BPM</span>
                </div>
              ) : (
                <div>
                  <span className="text-foreground font-bold">{exercise.currentBpm}</span>
                  <span className="text-xs text-muted-foreground"> BPM</span>
                </div>
              )}
            </div>
          );
        })()}
      </Link>

      <button
        className="absolute z-10 top-1/2 -translate-y-1/2 right-10 h-8 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        onClick={(e) => onEdit(exercise, e)}
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        className="absolute z-10 top-1/2 -translate-y-1/2 right-2 h-8 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        onClick={(e) => onDelete(exercise, e)}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};
