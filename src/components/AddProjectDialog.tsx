import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StorageService, Project } from "@/lib/storage";
import { Loader2, Plus } from "lucide-react";

interface AddProjectDialogProps {
    onProjectAdded: () => void;
    projectToEdit?: Project;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function AddProjectDialog({ onProjectAdded, projectToEdit, open: controlledOpen, onOpenChange }: AddProjectDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [status, setStatus] = useState<Project["status"]>("In Progress");

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;
    const isEditing = !!projectToEdit;

    useEffect(() => {
        if (projectToEdit) {
            setTitle(projectToEdit.title);
            setArtist(projectToEdit.artist || "");
            setStatus(projectToEdit.status);
        } else {
            setTitle("");
            setArtist("");
            setStatus("In Progress");
        }
    }, [projectToEdit, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditing && projectToEdit) {
                await StorageService.updateProject(projectToEdit.id, { title, artist: artist || undefined, status });
            } else {
                await StorageService.addProject({ title, artist: artist || undefined, status });
            }
            setOpen(false);
            onProjectAdded();
        } catch (error) {
            console.error("Failed to save project:", error);
            alert("Failed to save project. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const trigger = !isControlled ? (
        <button className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium bg-green-500 text-black hover:bg-green-400 transition-colors">
            <Plus className="h-3 w-3" /> New Song
        </button>
    ) : null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="bg-card border-border">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Song Project" : "Start a New Song Project"}</DialogTitle>
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
                    {isEditing && (
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as Project["status"])}>
                                <SelectTrigger className="bg-secondary">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="New">New</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                                    <SelectItem value="Mastered">Mastered</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditing ? "Save Changes" : "Create Project"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
