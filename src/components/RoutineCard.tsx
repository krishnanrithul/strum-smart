import { Routine } from "@/data/routines";

type Props = {
  routine: Routine;
  onClick: () => void;
};

export const RoutineCard = ({ routine, onClick }: Props) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-sm bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 cursor-pointer transition-colors duration-150"
    >
      <p className="text-base font-medium text-zinc-100">{routine.name}</p>
      <p className="text-xs text-zinc-500 mt-1 leading-snug">{routine.description}</p>
      <p className="text-[10px] tracking-widest text-zinc-600 uppercase mt-3">
        {routine.exercises.length} exercises
      </p>
    </button>
  );
};
