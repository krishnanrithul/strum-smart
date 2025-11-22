import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StorageService } from "@/lib/storage";
import { Loader2, Plus } from "lucide-react";

interface AddProjectDialogProps {
    onProjectAdded: () => void;
}

export function AddProjectDialog({ onProjectAdded }: AddProjectDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await StorageService.addProject({
                title,
                artist: artist || undefined,
                status: "In Progress",
            });
            setOpen(false);
            setTitle("");
            setArtist("");
            onProjectAdded();
        } catch (error) {
            console.error("Failed to add project:", error);
            alert("Failed to create project. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="h-4 w-4" /> New Song
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Start a New Song Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Song Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Sultans of Swing"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="bg-secondary"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="artist">Artist (Optional)</Label>
                        <Input
                            id="artist"
                            placeholder="e.g. Dire Straits"
                            value={artist}
                            onChange={(e) => setArtist(e.target.value)}
                            className="bg-secondary"
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Project"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
