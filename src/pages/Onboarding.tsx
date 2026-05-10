import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import MiniLogo from "@/components/MiniLogo";
import WaveformLoader from "@/components/WaveformLoader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StorageService } from "@/lib/storage";
import { ROUTINES } from "@/data/routines";
import { redeemInviteCode } from "@/hooks/useInviteCode";

const LEVELS = [
  { id: "beginner",     label: "Beginner",     description: "Just starting out" },
  { id: "intermediate", label: "Intermediate", description: "Been playing a few years" },
  { id: "advanced",     label: "Advanced",     description: "Serious player, need structure" },
];

const HOVER_COLOR = "rgba(52, 211, 153, 0.18)";

const TRANSFORMS: Record<number, string> = {
  1: "translateX(0%)",
  2: "translateX(-33.333%)",
  3: "translateX(-66.666%)",
};

const Wordmark = () => (
  <div className="flex items-center gap-2">
    <MiniLogo />
    <span className="text-xs font-semibold tracking-widest text-foreground">FRETGYM</span>
  </div>
);

const Onboarding = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [level, setLevel] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hoveredLevel, setHoveredLevel] = useState<string | null>(null);
  const [hoveredGenre, setHoveredGenre] = useState<string | null>(null);

  // Step 3 state
  const [code, setCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleLevelSelect = (id: string) => {
    setSelectedLevel(id);
    setLevel(id);
    setTimeout(() => setStep(2), 180);
  };

  const handleGenreSelect = async (routineId: string) => {
    if (saving || !session) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { onboarded: true, level, genre: routineId },
      });
      if (error) {
        console.error("[Onboarding] auth updateUser error:", error);
        setSaving(false);
        return;
      }

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

      // Slide to teacher code step instead of navigating away
      setSaving(false);
      setStep(3);
    } catch (err) {
      console.error("❌ Onboarding catch block:", err);
      setSaving(false);
    }
  };

  const handleCodeSubmit = async () => {
    if (!session || code.length < 6) return;
    setCodeLoading(true);
    setCodeError(null);
    try {
      await redeemInviteCode(code, session.user.id);
      window.location.href = "/";
    } catch (e: any) {
      setCodeError("That code didn't work — double-check with your teacher.");
      setCodeLoading(false);
    }
  };

  const handleSkip = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background" style={{ overflow: "hidden" }}>
      <div
        className="flex"
        style={{
          width: "300%",
          minHeight: "100vh",
          transform: TRANSFORMS[step],
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >

        {/* ── Screen 1: Level ── */}
        <div
          className="flex flex-col items-center justify-center px-6 py-16"
          style={{ width: "33.333%", minHeight: "100vh" }}
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
          style={{ width: "33.333%", minHeight: "100vh" }}
        >
          <div className="w-full max-w-sm mx-auto space-y-10">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Back</span>
              </button>
              <Wordmark />
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

        {/* ── Screen 3: Teacher Code ── */}
        <div
          className="flex flex-col items-center justify-center px-6 py-16"
          style={{ width: "33.333%", minHeight: "100vh" }}
        >
          <div className="w-full max-w-xs space-y-10">
            <Wordmark />

            <div className="space-y-1.5">
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                Optional
              </p>
              <h1 className="text-2xl font-bold text-foreground leading-snug">
                Got a teacher code?
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Enter the 6-character code from your teacher to link your accounts.
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={code}
                onChange={e => {
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
                  setCodeError(null);
                }}
                placeholder="A3KR72"
                className="w-full rounded-2xl px-4 py-4 text-center text-2xl font-mono
                           tracking-[0.3em] text-foreground bg-transparent
                           placeholder:text-muted-foreground/30 focus:outline-none"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              />

              {codeError && (
                <p className="text-xs text-destructive text-center">{codeError}</p>
              )}

              <button
                onClick={handleCodeSubmit}
                disabled={codeLoading || code.length < 6}
                className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground
                           text-sm font-medium transition-opacity disabled:opacity-40"
              >
                {codeLoading ? "Linking…" : "Link to Teacher"}
              </button>

              <button
                onClick={handleSkip}
                className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Onboarding;