import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import MiniLogo from "@/components/MiniLogo";
import WaveformLoader from "@/components/WaveformLoader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StorageService } from "@/lib/storage";
import { ROUTINES } from "@/data/routines";

const LEVELS = [
  { id: "beginner",     label: "Beginner",     description: "Just starting out" },
  { id: "intermediate", label: "Intermediate", description: "Been playing a few years" },
  { id: "advanced",     label: "Advanced",     description: "Serious player, need structure" },
];

const HOVER_COLOR = "rgba(52, 211, 153, 0.18)";

const Wordmark = () => (
  <div className="flex items-center gap-2">
    <MiniLogo />
    <span className="text-xs font-semibold tracking-widest text-foreground">FRETGYM</span>
  </div>
);

const Onboarding = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [level, setLevel] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hoveredLevel, setHoveredLevel] = useState<string | null>(null);
  const [hoveredGenre, setHoveredGenre] = useState<string | null>(null);

  const handleLevelSelect = (id: string) => {
    setSelectedLevel(id);
    setLevel(id);
    setTimeout(() => setStep(2), 180);
  };

 const handleGenreSelect = async (routineId: string) => {
  if (saving || !session) return;
  setSaving(true);
  try {
    // Write to auth metadata — always authorized, no RLS concerns
    const { error } = await supabase.auth.updateUser({
      data: { onboarded: true, level, genre: routineId },
    });

    if (error) {
      console.error("[Onboarding] auth updateUser error:", error);
      setSaving(false);
      return;
    }

    // Best-effort: sync to profiles table (may fail silently if RLS blocks it)
    await (supabase as any)
      .from("profiles")
      .update({ level, genre: routineId, onboarded: true })
      .eq("id", session.user.id);

    const routine = ROUTINES.find(r => r.id === routineId);
    if (routine) {
      for (const ex of routine.exercises) {
        try {
          await StorageService.addExercise({
            title: ex.title,
            category: ex.category as "Technical" | "Repertoire" | "Warmup",
            currentBpm: ex.bpm,
            status: "New",
          });
        } catch (exErr) {
          console.error("Exercise add failed:", exErr);
        }
      }
    }

    window.location.href = "/";
  } catch (err) {
    console.error("❌ Onboarding catch block:", err);
    setSaving(false);
  }
};

  return (
    <div className="min-h-screen bg-background" style={{ overflow: "hidden" }}>
      <div
        className="flex"
        style={{
          width: "200%",
          minHeight: "100vh",
          transform: step === 1 ? "translateX(0)" : "translateX(-50%)",
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >

        {/* ── Screen 1: Level ── */}
        <div
          className="flex flex-col items-center justify-center px-6 py-16"
          style={{ width: "50%", minHeight: "100vh" }}
        >
          <div className="w-full max-w-xs space-y-10">

            <Wordmark />

            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold text-foreground leading-snug">
                Let's build your practice plan
              </h1>
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                What's your level?
              </p>
            </div>

            <div className="space-y-3">
              {LEVELS.map(lv => {
                const active = selectedLevel === lv.id || hoveredLevel === lv.id;
                return (
                  <button
                    key={lv.id}
                    onClick={() => handleLevelSelect(lv.id)}
                    onMouseEnter={() => setHoveredLevel(lv.id)}
                    onMouseLeave={() => setHoveredLevel(null)}
                    className="w-full rounded-2xl p-5 text-left transition-all duration-300 relative overflow-hidden active:scale-[0.98]"
                    style={{
                      background: active
                        ? `linear-gradient(135deg, ${HOVER_COLOR} 0%, rgba(255,255,255,0.03) 100%)`
                        : "rgba(255,255,255,0.03)",
                      border: `1px solid ${active ? "rgba(52, 211, 153, 0.4)" : "rgba(255,255,255,0.06)"}`,
                      transform: active ? "translateY(-2px)" : "translateY(0)",
                      boxShadow: active ? `0 8px 24px ${HOVER_COLOR}` : "none",
                    }}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-px transition-opacity duration-300"
                      style={{
                        background: "linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.6), transparent)",
                        opacity: active ? 1 : 0,
                      }}
                    />
                    <p className="font-semibold text-foreground">{lv.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{lv.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Screen 2: Genre ── */}
        <div
          className="flex flex-col px-6 py-16"
          style={{ width: "50%", minHeight: "100vh" }}
        >
          <div className="w-full max-w-sm mx-auto space-y-10">

            {/* Top row: back arrow + wordmark */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Back</span>
              </button>
              <Wordmark />
              {/* Spacer keeps wordmark visually centred */}
              <div className="w-14" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold text-foreground leading-snug">
                What do you want to work on?
              </h1>
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                Pick a style
              </p>
            </div>

            {saving ? (
              <div className="flex items-center justify-center py-16">
                <WaveformLoader />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {ROUTINES.map(routine => {
                  const active = hoveredGenre === routine.id;
                  return (
                    <button
                      key={routine.id}
                      onClick={() => handleGenreSelect(routine.id)}
                      onMouseEnter={() => setHoveredGenre(routine.id)}
                      onMouseLeave={() => setHoveredGenre(null)}
                      className="rounded-2xl p-4 text-left transition-all duration-300 relative overflow-hidden active:scale-[0.97]"
                      style={{
                        background: active
                          ? `linear-gradient(135deg, ${HOVER_COLOR} 0%, rgba(255,255,255,0.03) 100%)`
                          : "rgba(255,255,255,0.03)",
                        border: `1px solid ${active ? "rgba(52, 211, 153, 0.4)" : "rgba(255,255,255,0.06)"}`,
                        transform: active ? "translateY(-2px)" : "translateY(0)",
                        boxShadow: active ? `0 8px 24px ${HOVER_COLOR}` : "none",
                      }}
                    >
                      <div
                        className="absolute top-0 left-0 right-0 h-px transition-opacity duration-300"
                        style={{
                          background: "linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.6), transparent)",
                          opacity: active ? 1 : 0,
                        }}
                      />
                      <p className="font-semibold text-sm text-foreground">{routine.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                        {routine.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Onboarding;
