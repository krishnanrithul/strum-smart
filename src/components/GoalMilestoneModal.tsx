import { useEffect } from "react";
import { X } from "lucide-react";
import confetti from "canvas-confetti";

interface GoalMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseTitle: string;
  targetBpm: number;
  achievedBpm: number;
}

const GoalMilestoneModal = ({
  isOpen,
  onClose,
  exerciseTitle,
  targetBpm,
  achievedBpm,
}: GoalMilestoneModalProps) => {
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const bpmGain = achievedBpm - targetBpm;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-white/10 w-full max-w-md max-h-[90vh] overflow-auto">
        {/* Header with close */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg font-bold text-white">🎉 You Did It!</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 text-center">
          {/* Achievement Message */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">YOU HIT YOUR GOAL</p>
            <p className="text-2xl font-bold text-primary">
              {targetBpm} BPM
            </p>
            <p className="text-lg font-semibold text-foreground">
              on {exerciseTitle}
            </p>
          </div>

          {/* Stats */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground mb-1">YOUR ACHIEVED</p>
              <p className="text-5xl font-black text-white leading-none">
                {achievedBpm}
              </p>
              <p className="text-sm text-muted-foreground mt-1">BPM</p>
            </div>

            {bpmGain > 0 && (
              <div className="text-sm text-green-400 font-semibold">
                {bpmGain}+ BPM above target!
              </div>
            )}
          </div>

          {/* Motivational message */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {bpmGain >= 20
              ? "You absolutely crushed it! Ready for the next challenge?"
              : bpmGain > 0
              ? "Great work reaching your goal!"
              : "You made it! Keep pushing for even higher."}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 p-5 border-t border-border bg-black/20">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 text-base font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Keep Going
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalMilestoneModal;
