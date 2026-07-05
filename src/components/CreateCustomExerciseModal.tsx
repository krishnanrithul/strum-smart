import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CreateCustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  onExerciseCreated?: () => void;
}

const CATEGORIES = [
  "Technique",
  "Warmup",
  "Repertoire",
  "Improvisation",
  "Music Theory",
];

const CreateCustomExerciseModal = ({
  isOpen,
  onClose,
  studentId,
  onExerciseCreated,
}: CreateCustomExerciseModalProps) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Technique");
  const [description, setDescription] = useState("");
  const [startingBpm, setStartingBpm] = useState("60");
  const [targetBpm, setTargetBpm] = useState("120");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!title.trim()) {
      setError("Exercise title is required");
      return;
    }

    const start = Math.max(20, Math.min(240, parseInt(startingBpm) || 60));
    const target = Math.max(20, Math.min(240, parseInt(targetBpm) || 120));

    setSaving(true);
    setError("");

    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error("Not authenticated");

      // Create the exercise
      const { data: exercise, error: createError } = await supabase
        .from("exercises")
        .insert({
          user_id: studentId,
          title: title.trim(),
          category,
          current_bpm: start,
          target_bpm: target,
          history: [],
          status: "New",
          is_assigned: true,
          is_custom: true,
          created_by: currentUser.user.id,
          custom_description: description.trim() || null,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Also create assignment record
      await (supabase as any)
        .from("assigned_exercises")
        .insert({
          student_id: studentId,
          teacher_id: currentUser.user.id,
          exercise_id: exercise.id,
          assigned_at: new Date().toISOString(),
        })
        .catch(() => {}); // Soft fail if assignment table doesn't exist

      onExerciseCreated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create exercise");
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
          <h2 className="text-lg font-bold text-white">Create Custom Exercise</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2">
              Exercise Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Alternate Picking Drills"
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes on how to practice this exercise…"
              rows={3}
              className="w-full bg-secondary rounded-lg p-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* BPM Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2">
                Starting BPM
              </label>
              <input
                type="number"
                value={startingBpm}
                onChange={(e) => setStartingBpm(e.target.value)}
                min="20"
                max="240"
                className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2">
                Target BPM
              </label>
              <input
                type="number"
                value={targetBpm}
                onChange={(e) => setTargetBpm(e.target.value)}
                min="20"
                max="240"
                className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-border bg-black/20">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !title.trim()}
            className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? "Creating…" : "Create Exercise"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCustomExerciseModal;
