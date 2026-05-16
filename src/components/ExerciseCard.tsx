import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { Exercise } from "@/lib/storage";

type Props = {
  exercise: Exercise;
  onEdit: (exercise: Exercise, e: React.MouseEvent) => void;
  onDelete: (exercise: Exercise, e: React.MouseEvent) => void;
};

export const ExerciseCard = ({ exercise, onEdit, onDelete }: Props) => {
  const startBpm = exercise.history?.[0]?.bpm ?? exercise.currentBpm;
  const hasProgress = exercise.currentBpm !== startBpm;

  return (
    <div className="border-b border-zinc-900 relative group hover:bg-zinc-900 cursor-pointer transition-colors duration-150">
      <Link to={`/practice/${exercise.id}`} className="block py-5 px-1 pr-16">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-zinc-100 truncate">{exercise.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] tracking-widest text-zinc-600 uppercase">{exercise.category}</span>
              {exercise.is_assigned && (
                <span className="text-[10px] tracking-widest text-green-700 uppercase">From Teacher</span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            {hasProgress ? (
              <span className="text-xs font-mono text-zinc-600">{startBpm} → <span className="text-xl font-mono text-green-400">{exercise.currentBpm}</span> <span className="text-xs text-zinc-600">BPM</span></span>
            ) : (
              <span><span className="text-xl font-mono text-green-400">{exercise.currentBpm}</span><span className="text-xs text-zinc-600 ml-1">BPM</span></span>
            )}
          </div>
        </div>
      </Link>

      <button
        className="absolute top-1/2 -translate-y-1/2 right-8 h-8 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-zinc-300"
        onClick={(e) => onEdit(exercise, e)}
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        className="absolute top-1/2 -translate-y-1/2 right-0 h-8 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-500"
        onClick={(e) => onDelete(exercise, e)}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};
