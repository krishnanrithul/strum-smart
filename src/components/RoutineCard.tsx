import { Routine } from "@/data/routines";

type Props = {
  routine: Routine;
  onClick: () => void;
};

export const RoutineCard = ({ routine, onClick }: Props) => (
  <button
    onClick={onClick}
    className={`w-full text-left rounded-xl border ${routine.accent} p-4 hover:opacity-90 transition-opacity`}
  >
    <p className={`font-semibold text-sm ${routine.labelColor}`}>{routine.name}</p>
    <p className="text-xs text-muted-foreground mt-1">{routine.description}</p>
    <p className="text-xs text-muted-foreground mt-2">{routine.exercises.length} exercises</p>
  </button>
);