import { useEffect, useState } from "react";
import { X, ArrowLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ExerciseTemplate } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import WaveformLoader from "@/components/WaveformLoader";
import MiniLogo from "@/components/MiniLogo";

interface Props {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

type SelectedTemplate = ExerciseTemplate | { title: string; custom: true };
type ExerciseCategory = "Technical" | "Warmup" | "Repertoire";
const EXERCISE_CATEGORIES: ExerciseCategory[] = ["Technical", "Warmup", "Repertoire"];

const FILTER_CATEGORIES = ["All", "Technical", "Warmup", "Repertoire"] as const;
type FilterCategory = (typeof FILTER_CATEGORIES)[number];

const GREEN = "rgba(34,197,94,";

const bpmButton = (label: string, onClick: () => void) => (
  <button
    type="button"
    onClick={onClick}
    className="h-10 w-10 rounded-xl flex items-center justify-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
  >
    {label}
  </button>
);

const AssignExerciseModal = ({ open, onClose, studentId, studentName }: Props) => {
  const { session } = useAuth();

  // Step 1 state
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("All");
  const [templates, setTemplates] = useState<ExerciseTemplate[]>([]);
  const [mounted, setMounted] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [clickedId, setClickedId] = useState<string | null>(null);

  // Step 2 state
  const [selectedTemplate, setSelectedTemplate] = useState<SelectedTemplate | null>(null);
  const [customCategory, setCustomCategory] = useState<ExerciseCategory>("Technical");
  const [targetBpm, setTargetBpm] = useState("80");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Animation
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const isVisible = open && !isAnimatingOut;

  // Reset & fetch on open
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setFilterCategory("All");
    setSelectedTemplate(null);
    setNotes("");
    setAssignError(null);
    setSuccess(false);
    setMounted(false);

    const load = async () => {
      const { data } = await supabase.from("exercise_templates").select("*").order("category");
      setTemplates(
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
      requestAnimationFrame(() => setMounted(true));
    };
    load();
  }, [open]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      setMounted(false);
      onClose();
    }, 200);
  };

  // Step 1 → 2
  const handleSelectTemplate = (template: SelectedTemplate) => {
    const id = "id" in template ? template.id : "__custom__";
    setClickedId(id);
    setTimeout(() => {
      setClickedId(null);
      setTargetBpm("default_bpm" in template ? String(template.default_bpm) : "80");
      setCustomCategory("Technical");
      setSelectedTemplate(template);
    }, 150);
  };

  // BPM helpers
  const adjustBpm = (delta: number) => {
    const v = parseInt(targetBpm) || 80;
    setTargetBpm(String(Math.min(240, Math.max(40, v + delta))));
  };

  // Assign
  const handleAssign = async () => {
    if (!session || !selectedTemplate) return;
    setSaving(true);
    setAssignError(null);

    const isCustom = "custom" in selectedTemplate;
    const category: ExerciseCategory = isCustom
      ? customCategory
      : (selectedTemplate as ExerciseTemplate).category;
    const bpm = Math.min(240, Math.max(40, parseInt(targetBpm) || 80));

    const { error } = await supabase.from("exercises").insert([{
      user_id: studentId,
      title: selectedTemplate.title,
      category,
      current_bpm: bpm,
      target_bpm: bpm,
      status: "New",
      history: [{ date: new Date().toISOString(), bpm }],
      assigned_by: session.user.id,
      teacher_notes: notes || null,
      is_assigned: true,
    }]);

    setSaving(false);

    if (error) {
      console.error("Assign exercise failed:", error);
      setAssignError(error.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => handleClose(), 1200);
  };

  // Step 1 filtering
  const filtered = templates.filter((t) => {
    const matchesQuery = query.length === 0 || t.title.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = filterCategory === "All" || t.category === filterCategory;
    return matchesQuery && matchesCategory;
  });
  const hasExactMatch = templates.some((t) => t.title.toLowerCase() === query.toLowerCase());
  const showCustom = query.length > 2 && !hasExactMatch;

  if (!open && !isAnimatingOut) return null;

  const step = selectedTemplate ? 2 : 1;
  const isCustom = selectedTemplate && "custom" in selectedTemplate;

  return (
    <>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes modalOut {
          from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          to   { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        style={{ transition: "opacity 200ms", opacity: isVisible ? 1 : 0 }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="fixed top-1/2 left-1/2 z-50 rounded-2xl bg-background p-6"
        style={{
          border: "1px solid rgba(255,255,255,0.08)",
          width: "calc(100% - 32px)",
          maxWidth: "32rem",
          animation: isAnimatingOut
            ? "modalOut 200ms ease-in forwards"
            : "modalIn 250ms ease-out forwards",
        }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <>
            <div className="flex items-start justify-between mb-5">
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                Assign to {studentName.toUpperCase()}
              </p>
              <button
                onClick={handleClose}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all flex-shrink-0 ml-3"
                style={{ border: "1px solid rgba(255,255,255,0.08)", background: "hsl(var(--card))" }}
                onMouseEnter={(e) => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.2)")}
                onMouseLeave={(e) => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises..."
              className="w-full rounded-xl px-4 py-3 text-sm text-foreground bg-transparent outline-none placeholder:text-muted-foreground mb-3"
              style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.08)" }}
              autoFocus
            />

            <div className="flex gap-2 mb-4 flex-wrap">
              {FILTER_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                  style={
                    filterCategory === cat
                      ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
                      : { background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.08)", color: "hsl(var(--muted-foreground))" }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto scrollbar-hide pr-1">
              {filtered.map((template, i) => {
                const isHovered = hoveredId === template.id;
                const isClicked = clickedId === template.id;
                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    onMouseEnter={() => setHoveredId(template.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="rounded-2xl p-5 text-left transition-all duration-200"
                    style={{
                      background: isHovered
                        ? `radial-gradient(circle at top right, ${GREEN}0.12) 0%, transparent 60%), hsl(var(--card))`
                        : "hsl(var(--card))",
                      border: isHovered ? `1px solid ${GREEN}0.4)` : "1px solid rgba(255,255,255,0.05)",
                      boxShadow: isHovered ? `0 0 18px 3px ${GREEN}0.1)` : "none",
                      transform: isClicked ? "scale(0.96)" : "scale(1)",
                      opacity: mounted ? 1 : 0,
                      animation: mounted ? `cardIn 200ms ease-out ${i * 40}ms both` : "none",
                    }}
                  >
                    <p className="text-sm font-semibold text-foreground">{template.title}</p>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mt-0.5">{template.category}</p>
                    <p className="text-xs text-muted-foreground mt-1">{template.default_bpm} BPM</p>
                  </button>
                );
              })}

              {showCustom && (
                <button
                  onClick={() => handleSelectTemplate({ title: query, custom: true })}
                  className="rounded-2xl p-5 text-left transition-all duration-200"
                  style={{
                    background: "hsl(var(--card))",
                    border: `1px dashed ${GREEN}0.4)`,
                    opacity: mounted ? 1 : 0,
                    animation: mounted ? `cardIn 200ms ease-out ${filtered.length * 40}ms both` : "none",
                  }}
                >
                  <p className="text-sm text-primary">＋ Create</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">"{query}"</p>
                </button>
              )}

              {filtered.length === 0 && !showCustom && (
                <div className="col-span-2 py-8 text-center text-sm text-muted-foreground">
                  No exercises found.
                </div>
              )}
            </div>
          </>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && selectedTemplate && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all flex-shrink-0"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", background: "hsl(var(--card))" }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                  Configure Exercise
                </p>
              </div>
              <button
                onClick={handleClose}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all flex-shrink-0"
                style={{ border: "1px solid rgba(255,255,255,0.08)", background: "hsl(var(--card))" }}
                onMouseEnter={(e) => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.2)")}
                onMouseLeave={(e) => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Selected exercise card */}
              <div
                className="rounded-2xl p-4"
                style={{
                  border: `1px solid ${GREEN}0.4)`,
                  background: `radial-gradient(circle at top right, ${GREEN}0.12) 0%, transparent 60%), hsl(var(--card))`,
                }}
              >
                <p className="text-sm font-semibold text-foreground">{selectedTemplate.title}</p>
                {!isCustom && (
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mt-0.5">
                    {(selectedTemplate as ExerciseTemplate).category}
                  </p>
                )}
              </div>

              {/* Category selector (custom only) */}
              {isCustom && (
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2">
                    Category
                  </p>
                  <div className="flex gap-2">
                    {EXERCISE_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCustomCategory(cat)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                        style={
                          customCategory === cat
                            ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
                            : { background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.08)", color: "hsl(var(--muted-foreground))" }
                        }
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Target BPM */}
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">
                  Target BPM
                </p>
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-card p-4" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex gap-2">
                    {bpmButton("−5", () => adjustBpm(-5))}
                    {bpmButton("−1", () => adjustBpm(-1))}
                  </div>
                  <div className="text-center flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={targetBpm}
                      onChange={(e) => setTargetBpm(e.target.value)}
                      onBlur={() => {
                        const v = parseInt(targetBpm);
                        setTargetBpm(String(isNaN(v) ? 80 : Math.min(240, Math.max(40, v))));
                      }}
                      className="w-24 text-5xl font-bold text-foreground text-center bg-transparent border-none outline-none"
                    />
                    <p className="text-xs text-muted-foreground tracking-widest uppercase mt-1">BPM</p>
                  </div>
                  <div className="flex gap-2">
                    {bpmButton("+1", () => adjustBpm(1))}
                    {bpmButton("+5", () => adjustBpm(5))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-2">
                  Notes for Student
                </p>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Focus on pick angle, keep wrist loose..."
                  className="w-full rounded-xl px-4 py-3 text-sm text-foreground bg-transparent outline-none placeholder:text-muted-foreground resize-none"
                  style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>

              {/* Error */}
              {assignError && (
                <p className="text-sm text-destructive text-center">{assignError}</p>
              )}

              {/* Assign button */}
              <button
                onClick={handleAssign}
                disabled={saving || success}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-70"
              >
                <div className="flex items-center gap-2">
                  {saving ? (
                    <WaveformLoader />
                  ) : success ? (
                    <span className="text-base">✓</span>
                  ) : (
                    <MiniLogo color="#0a0a0a" />
                  )}
                  {success ? `Assigned to ${studentName}` : saving ? "Saving…" : `Assign to ${studentName}`}
                </div>
                {!saving && !success && <ChevronRight className="h-5 w-5 opacity-70" />}
              </button>
            </div>
          </>
        )}

      </div>
    </>
  );
};

export default AssignExerciseModal;
