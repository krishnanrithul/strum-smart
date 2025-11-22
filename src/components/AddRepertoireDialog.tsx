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
import { StorageService } from "@/lib/storage";

interface AddRepertoireDialogProps {
    onRepertoireAdded: () => void;
}

export function AddRepertoireDialog({ onRepertoireAdded }: AddRepertoireDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [bpm, setBpm] = useState("120");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const songTitle = artist ? `${title} - ${artist}` : title;
            await StorageService.addExercise({
                project_id: undefined,
                title: songTitle,
                category: "Repertoire",
                currentBpm: parseInt(bpm),
                status: "New",
            });
            setOpen(false);
            setTitle("");
            setArtist("");
            setBpm("120");
            onRepertoireAdded();
        } catch (error) {
            console.error("Failed to add repertoire song:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Song
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Add Repertoire Song</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Song Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Stairway to Heaven"
                            required
                            className="bg-secondary"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="artist">Artist (optional)</Label>
                        <Input
                            id="artist"
                            value={artist}
                            onChange={(e) => setArtist(e.target.value)}
                            placeholder="e.g. Led Zeppelin"
                            className="bg-secondary"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="bpm">Target BPM</Label>
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
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Song"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
