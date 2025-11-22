
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StorageService, Exercise } from "@/lib/storage";
import { useNavigate } from "react-router-dom";
import { TrendingUp } from "lucide-react";

interface SessionCompleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    exercise: Exercise;
    durationSeconds: number;
}

export function SessionCompleteDialog({
    open,
    onOpenChange,
    exercise,
    durationSeconds,
}: SessionCompleteDialogProps) {
    const [bpm, setBpm] = useState(exercise.currentBpm.toString());
    const [suggestion, setSuggestion] = useState<{ newBpm: number; reason: string } | null>(null);
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newBpm = parseInt(bpm);

        // Save session
        StorageService.saveSession({
            date: new Date().toISOString(),
            duration: durationSeconds,
            exercises: [exercise.id],
        });

        // Update exercise BPM if changed
        if (newBpm !== exercise.currentBpm) {
            StorageService.updateExerciseBpm(exercise.id, newBpm);
        }

        // Check for progressive overload
        const overload = StorageService.checkProgressiveOverload(exercise.id);
        if (overload) {
            setSuggestion(overload);
        } else {
            onOpenChange(false);
            navigate("/library");
        }
    };

    const handleAcceptSuggestion = () => {
        if (suggestion) {
            StorageService.updateTargetBpm(exercise.id, suggestion.newBpm);
            onOpenChange(false);
            navigate("/library");
        }
    };

    const handleDismissSuggestion = () => {
        onOpenChange(false);
        navigate("/library");
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

                    <div className="grid gap-2">
                        <Label htmlFor="bpm">Max Clean BPM Achieved</Label>
                        <Input
                            id="bpm"
                            type="number"
                            value={bpm}
                            onChange={(e) => setBpm(e.target.value)}
                            required
                        />
                    </div>

                    {bpmDiff !== 0 && (
                        <div className={`text-center font-bold ${bpmDiff > 0 ? "text-green-500" : "text-red-500"}`}>
                            {bpmDiff > 0 ? "+" : ""}{bpmDiff} BPM from last time
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" className="w-full">Save Progress</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
