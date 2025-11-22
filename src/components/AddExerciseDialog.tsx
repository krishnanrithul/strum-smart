
import { useState } from "react";
import { Plus } from "lucide-react";
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
}

export function AddExerciseDialog({ onExerciseAdded }: AddExerciseDialogProps) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<Exercise["category"]>("Technical");
    const [bpm, setBpm] = useState("120");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        StorageService.addExercise({
            title,
            category,
            currentBpm: parseInt(bpm),
            status: "New",
        });
        setOpen(false);
        setTitle("");
        setBpm("120");
        onExerciseAdded();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="mt-2">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Your First Exercise
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Exercise</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Exercise Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Spider Walk"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={category}
                            onValueChange={(value: Exercise["category"]) => setCategory(value)}
                        >
                            <SelectTrigger>
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
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Add Exercise</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
