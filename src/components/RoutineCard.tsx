import { useState } from "react";
import { Routine } from "@/data/routines";

type Props = {
  routine: Routine;
  onClick: () => void;
};

export const RoutineCard = ({ routine, onClick }: Props) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full text-left p-4 rounded-xl relative overflow-hidden transition-all duration-300"
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
      <p className="text-base font-medium text-zinc-100 relative z-10">{routine.name}</p>
      <p className="text-xs text-zinc-500 mt-1 leading-snug relative z-10">{routine.description}</p>
      <p className="text-[10px] tracking-widest text-zinc-400 uppercase mt-3 relative z-10">
        {routine.exercises.length} exercises
      </p>
    </button>
  );
};
