interface DifficultyBadgeProps {
  difficulty?: string;
}

const DifficultyBadge = ({ difficulty }: DifficultyBadgeProps) => {
  if (!difficulty) return null;

  const colors: Record<string, string> = {
    Beginner: "bg-green-500/20 text-green-400",
    Intermediate: "bg-yellow-500/20 text-yellow-400",
    Advanced: "bg-red-500/20 text-red-400",
  };

  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded ${colors[difficulty] || colors.Intermediate}`}>
      {difficulty}
    </span>
  );
};

export default DifficultyBadge;
