import { useState } from "react";
import { Routine } from "@/data/routines";

const HOVER_COLOR = "rgba(52, 211, 153, 0.18)";

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
          ? `linear-gradient(135deg, ${HOVER_COLOR} 0%, rgba(255,255,255,0.03) 100%)`
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? "rgba(52, 211, 153, 0.4)" : "rgba(255,255,255,0.06)"}`,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? `0 8px 24px ${HOVER_COLOR}` : "none",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Shimmer line across the top on hover */}
      <div
        className="absolute top-0 left-0 right-0 h-px transition-opacity duration-300"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.6), transparent)",
          opacity: hovered ? 1 : 0,
        }}
      />

      <div className="relative z-10">
        <p className="text-sm font-semibold text-foreground">{routine.name}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-snug">{routine.description}</p>
        <p
          className="text-xs mt-3 transition-colors duration-300 text-muted-foreground"
          style={hovered ? { color: "rgba(52, 211, 153, 0.7)" } : undefined}
        >
          {routine.exercises.length} exercises
        </p>
      </div>
    </button>
  );
};