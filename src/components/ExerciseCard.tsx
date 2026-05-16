import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { Exercise } from "@/lib/storage";

type Props = {
  exercise: Exercise;
  onEdit: (exercise: Exercise, e: React.MouseEvent) => void;
  onDelete: (exercise: Exercise, e: React.MouseEvent) => void;
};

const getBpmProgress = (exercise: Exercise) => {
  const current = exercise.currentBpm;
  const target = exercise.targetBpm;
  const initial = exercise.history?.[0]?.bpm ?? current;
  if (target <= initial) return 0;
  return Math.min(100, Math.round(((current - initial) / (target - initial)) * 100));
};

export const ExerciseCard = ({ exercise, onEdit, onDelete }: Props) => {
  const [hovered, setHovered] = useState(false);
  const startBpm = exercise.history?.[0]?.bpm ?? exercise.currentBpm;
  const progress = getBpmProgress(exercise);

  return (
    <div
      className="rounded-xl cursor-pointer relative overflow-hidden transition-all duration-300 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? "linear-gradient(135deg, rgba(52,211,153,0.18) 0%, rgba(255,255,255,0.03) 100%)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.06)"}`,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 8px 24px rgba(52,211,153,0.18)" : "none",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px transition-opacity duration-300"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.6), transparent)",
          opacity: hovered ? 1 : 0,
        }}
      />
      <Link to={`/practice/${exercise.id}`} className="block relative z-10 p-4 pr-20">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm text-foreground">{exercise.title}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs text-muted-foreground">{exercise.category}</span>
              {exercise.is_assigned && (
                <>
                  <span className="text-xs text-muted-foreground"> · </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">From Teacher</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-primary">{exercise.currentBpm}</p>
            <p className="text-xs text-muted-foreground">BPM</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center gap-0.5 text-xs">
            <span className="text-muted-foreground">{startBpm} →&nbsp;</span>
            <span className="text-foreground font-semibold">{exercise.currentBpm}</span>
            <span className="text-muted-foreground">&nbsp;BPM</span>
          </div>
        </div>
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
