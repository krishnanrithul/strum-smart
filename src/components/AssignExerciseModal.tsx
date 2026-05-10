import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ExerciseTemplate } from "@/lib/storage";

interface Props {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  onSelect: (template: ExerciseTemplate | { title: string; custom: true }) => void;
}

const glassItem = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const AssignExerciseModal = ({ open, onClose, studentName, onSelect }: Props) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExerciseTemplate[]>([]);

  useEffect(() => {
    if (!open) { setQuery(""); setResults([]); return; }
  }, [open]);

  useEffect(() => {
    if (query.length === 0) { setResults([]); return; }

    const run = async () => {
      const { data } = await supabase
        .from("exercise_templates")
        .select("*")
        .ilike("title", `%${query}%`)
        .limit(6);

      setResults(
        (data || []).map((row: any) => ({
          id: row.id,
          title: row.title,
          category: row.category as ExerciseTemplate["category"],
          default_bpm: row.default_bpm,
          description: row.description ?? undefined,
          diagram_url: row.diagram_url ?? undefined,
          tutorial_url: row.tutorial_url ?? undefined,
        }))
      );
    };

    const t = setTimeout(run, 200);
    return () => clearTimeout(t);
  }, [query]);

  const hasExactMatch = results.some(
    (r) => r.title.toLowerCase() === query.toLowerCase()
  );
  const showCustomOption = query.length > 2 && !hasExactMatch;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background p-6 transition-transform duration-300"
        style={{ transform: open ? "translateY(0)" : "translateY(100%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
              Assign Exercise
            </p>
            <p className="text-sm text-foreground mt-0.5">{studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises or type a custom name..."
          className="w-full rounded-xl px-4 py-3 text-sm text-foreground bg-transparent outline-none placeholder:text-muted-foreground"
          style={{ border: "1px solid rgba(255,255,255,0.08)", background: "hsl(var(--card))" }}
          autoFocus={open}
        />

        {/* Results */}
        {(results.length > 0 || showCustomOption) && (
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            {results.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-left transition-colors hover:border-white/20"
                style={glassItem}
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{template.title}</p>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mt-0.5">
                    {template.category}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{template.default_bpm} BPM</p>
              </button>
            ))}

            {showCustomOption && (
              <button
                onClick={() => onSelect({ title: query, custom: true })}
                className="w-full rounded-xl px-4 py-3 text-left transition-colors"
                style={glassItem}
              >
                <p className="text-sm text-primary">＋ Create "{query}" as custom exercise</p>
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default AssignExerciseModal;
