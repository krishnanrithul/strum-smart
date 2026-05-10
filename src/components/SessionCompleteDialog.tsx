
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { StorageService, Exercise } from "@/lib/storage";
import { useNavigate } from "react-router-dom";
import { TrendingUp } from "lucide-react";

interface SessionCompleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    exercise: Exercise;
    durationSeconds: number;
    sessionBpm?: number;
}

export function SessionCompleteDialog({
    open,
    onOpenChange,
    exercise,
    durationSeconds,
    sessionBpm,
}: SessionCompleteDialogProps) {
    const [bpm, setBpm] = useState((sessionBpm ?? exercise.currentBpm).toString());
    const [suggestion, setSuggestion] = useState<{ newBpm: number; reason: string } | null>(null);
    const navigate = useNavigate();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setBpm((sessionBpm ?? exercise.currentBpm).toString());
        }
    }, [open, sessionBpm]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        const newBpm = parseInt(bpm);

        try {
            await StorageService.saveSession({
                date: new Date().toISOString(),
                duration: durationSeconds,
                exercises: [exercise.id],
            });

            await StorageService.updateExerciseBpm(exercise.id, newBpm);

            const overload = await StorageService.checkProgressiveOverload(exercise.id);
            if (overload) {
                setSuggestion(overload);
            } else {
                onOpenChange(false);
                navigate("/");
            }
        } catch (err: any) {
            console.error("Save Progress failed:", err);
            setError(err?.message || "Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleAcceptSuggestion = async () => {
        if (suggestion) {
            await StorageService.updateTargetBpm(exercise.id, suggestion.newBpm);
            onOpenChange(false);
            navigate("/");
        }
    };

    const handleDismissSuggestion = () => {
        onOpenChange(false);
        navigate("/");
    };

    const bpmDiff = parseInt(bpm) - exercise.currentBpm;

    if (suggestion) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[425px] text-center">
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex items-center justify-center gap-2">
                            <TrendingUp className="text-primary" />
                            Level Up!
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6">
                        <p className="text-muted-foreground mb-4">{suggestion.reason}</p>
                        <div className="text-4xl font-bold metric-display mb-2">
                            {suggestion.newBpm} BPM
                        </div>
                        <p className="text-sm text-muted-foreground">Suggested Target</p>
                    </div>
                    <DialogFooter className="flex-col gap-2 sm:flex-col">
                        <Button onClick={handleAcceptSuggestion} className="w-full h-12 text-lg">
                            Accept Challenge
                        </Button>
                        <Button variant="ghost" onClick={handleDismissSuggestion} className="w-full">
                            Maybe Later
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Session Complete!</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="text-center mb-4">
                        <div className="text-sm text-muted-foreground">Practice Time</div>
                        <div className="text-3xl font-bold">
                            {Math.floor(durationSeconds / 60)}m {durationSeconds % 60}s
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Session BPM</p>
                        <div className="flex items-center gap-2">
                            {bpmDiff !== 0 && (
                                <span className={`text-xs font-semibold ${bpmDiff > 0 ? "text-primary" : "text-destructive"}`}>
                                    {bpmDiff > 0 ? "+" : ""}{bpmDiff}
                                </span>
                            )}
                            <input
                                type="text"
                                inputMode="numeric"
                                value={bpm}
                                onChange={(e) => setBpm(e.target.value)}
                                onBlur={(e) => {
                                    const v = parseInt(e.target.value);
                                    setBpm(String(isNaN(v) ? parseInt(bpm) : Math.min(240, Math.max(40, v))));
                                }}
                                className="w-16 text-xl font-bold text-foreground text-right bg-transparent border-b border-white/20 outline-none focus:border-primary transition-colors"
                            />
                            <span className="text-sm text-muted-foreground">BPM</span>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-destructive text-center">{error}</p>
                    )}

                    <DialogFooter>
                        <Button type="submit" className="w-full" disabled={saving}>
                            {saving ? "Saving…" : "Save Progress"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
