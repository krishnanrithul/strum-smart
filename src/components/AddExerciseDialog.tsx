import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { StorageService, Exercise } from "@/lib/storage";

interface AddExerciseDialogProps {
    onExerciseAdded: () => void;
    projectId?: string;
    trigger?: React.ReactNode;
}

export function AddExerciseDialog({ onExerciseAdded, projectId, trigger }: AddExerciseDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<Exercise["category"]>("Technical");
    const [bpm, setBpm] = useState("120");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await StorageService.addExercise({
                project_id: projectId,
                title,
                category,
                currentBpm: parseInt(bpm),
                status: "New",
            });
            setOpen(false);
            setTitle("");
            setBpm("120");
            onExerciseAdded();
        } catch (error) {
            console.error("Failed to add exercise:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Exercise
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle>{projectId ? "Add Section" : "Add New Exercise"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={projectId ? "e.g. Intro, Solo" : "e.g. Spider Walk"}
                            required
                            className="bg-secondary"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={category}
                            onValueChange={(value: Exercise["category"]) => setCategory(value)}
                        >
                            <SelectTrigger className="bg-secondary">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Technical">Technical</SelectItem>
                                <SelectItem value="Repertoire">Repertoire</SelectItem>
                                <SelectItem value="Warmup">Warmup</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="bpm">Starting BPM</Label>
                        <Input
                            id="bpm"
                            type="number"
                            value={bpm}
                            onChange={(e) => setBpm(e.target.value)}
                            required
                            min="1"
                            className="bg-secondary"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
