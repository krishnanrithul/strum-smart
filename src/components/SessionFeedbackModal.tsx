import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SessionFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  studentId: string;
  sessionDate: string;
  existingFeedback?: {
    feedback: string;
    feedback_created_at: string;
  } | null;
  onFeedbackSaved?: () => void;
}

const SessionFeedbackModal = ({
  isOpen,
  onClose,
  sessionId,
  studentId,
  sessionDate,
  existingFeedback,
  onFeedbackSaved,
}: SessionFeedbackModalProps) => {
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (existingFeedback?.feedback) {
      setFeedback(existingFeedback.feedback);
    } else {
      setFeedback("");
    }
  }, [existingFeedback, isOpen]);

  const handleSave = async () => {
    if (!feedback.trim()) {
      setError("Feedback cannot be empty");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("sessions")
        .update({
          feedback: feedback.trim(),
          feedback_created_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (updateError) throw updateError;

      onFeedbackSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save feedback");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Remove this feedback?")) return;

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from("sessions")
        .update({
          feedback: null,
          feedback_created_at: null,
        })
        .eq("id", sessionId);

      if (updateError) throw updateError;
      onFeedbackSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete feedback");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-white/10 w-full max-w-md max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <div>
            <h2 className="text-lg font-bold text-white">Session Feedback</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(sessionDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2">
              Your Feedback
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Praise their effort, suggest improvements, or ask about techniques…"
              rows={6}
              className="w-full bg-secondary rounded-lg p-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3">
              {error}
            </div>
          )}

          {existingFeedback && (
            <p className="text-xs text-muted-foreground">
              Updated{" "}
              {new Date(existingFeedback.feedback_created_at).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 p-5 border-t border-border bg-black/20">
          {existingFeedback && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              Delete
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !feedback.trim()}
            className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? "Saving…" : "Save Feedback"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionFeedbackModal;
