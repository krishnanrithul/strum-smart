import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { StorageService, Exercise } from "@/lib/storage";
import { useNavigate } from "react-router-dom";
import { Play, Dumbbell, Music, Flame, RefreshCw } from "lucide-react";

interface RoutineDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RoutineDialog({ open, onOpenChange }: RoutineDialogProps) {
    const [routine, setRoutine] = useState<{
        warmup: Exercise | null;
        technical: Exercise | null;
        repertoire: Exercise | null;
    } | null>(null);
    const [selectedCategories, setSelectedCategories] = useState({
        warmup: true,
        technical: true,
        repertoire: true,
    });
    const navigate = useNavigate();

    useEffect(() => {
        if (open) {
            const loadRoutine = async () => {
                const fullRoutine = await StorageService.generateRoutine();
                setRoutine({
                    warmup: selectedCategories.warmup ? fullRoutine.warmup : null,
                    technical: selectedCategories.technical ? fullRoutine.technical : null,
                    repertoire: selectedCategories.repertoire ? fullRoutine.repertoire : null,
                });
            };
            loadRoutine();
        }
    }, [open, selectedCategories]);

    const handleStart = () => {
        if (routine?.warmup) {
            navigate(`/practice/${routine.warmup.id}`);
        } else if (routine?.technical) {
            navigate(`/practice/${routine.technical.id}`);
        } else if (routine?.repertoire) {
            navigate(`/practice/${routine.repertoire.id}`);
        }
        onOpenChange(false);
    };

    const handleSwap = async (category: "Warmup" | "Technical" | "Repertoire", currentId?: string) => {
        const newExercise = await StorageService.getRandomExerciseByCategory(category, currentId);
        if (newExercise && routine) {
            setRoutine({
                ...routine,
                [category.toLowerCase()]: newExercise,
            });
        }
    };

    if (!routine) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center mb-2">
                        Daily Workout Plan
                    </DialogTitle>
                    <p className="text-center text-muted-foreground">
                        A balanced 30-minute session generated for you.
                    </p>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Warmup */}
                    <Card className="p-4 bg-secondary/50 border-border flex items-center gap-4">
                        <Checkbox
                            checked={selectedCategories.warmup}
                            onCheckedChange={(checked) =>
                                setSelectedCategories({ ...selectedCategories, warmup: !!checked })
                            }
                        />
                        <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                            <Flame className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Warmup • 5 min
                            </div>
                            <div className="font-semibold">
                                {selectedCategories.warmup ? (routine.warmup?.title || "No Warmup Found") : "Disabled"}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSwap("Warmup", routine.warmup?.id)}
                            disabled={!selectedCategories.warmup || !routine.warmup}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </Card>

                    {/* Technical */}
                    <Card className="p-4 bg-secondary/50 border-border flex items-center gap-4">
                        <Checkbox
                            checked={selectedCategories.technical}
                            onCheckedChange={(checked) =>
                                setSelectedCategories({ ...selectedCategories, technical: !!checked })
                            }
                        />
                        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                            <Dumbbell className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Skill Work • 10 min
                            </div>
                            <div className="font-semibold">
                                {selectedCategories.technical ? (routine.technical?.title || "No Technical Found") : "Disabled"}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSwap("Technical", routine.technical?.id)}
                            disabled={!selectedCategories.technical || !routine.technical}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </Card>

                    {/* Repertoire */}
                    <Card className="p-4 bg-secondary/50 border-border flex items-center gap-4">
                        <Checkbox
                            checked={selectedCategories.repertoire}
                            onCheckedChange={(checked) =>
                                setSelectedCategories({ ...selectedCategories, repertoire: !!checked })
                            }
                        />
                        <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
                            <Music className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Repertoire • 15 min
                            </div>
                            <div className="font-semibold">
                                {selectedCategories.repertoire ? (routine.repertoire?.title || "No Song Found") : "Disabled"}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSwap("Repertoire", routine.repertoire?.id)}
                            disabled={!selectedCategories.repertoire || !routine.repertoire}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </Card>
                </div>

                <DialogFooter>
                    <Button
                        className="w-full h-12 text-lg"
                        onClick={handleStart}
                        disabled={
                            (!selectedCategories.warmup || !routine.warmup) &&
                            (!selectedCategories.technical || !routine.technical) &&
                            (!selectedCategories.repertoire || !routine.repertoire)
                        }
                    >
                        <Play className="mr-2 h-5 w-5" /> Start Workout
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
