import { useState, useEffect } from "react";
import { ArrowLeft, Search, Loader2, Music, Dumbbell, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StorageService, Exercise, Project } from "@/lib/storage";
import { AddExerciseDialog } from "@/components/AddExerciseDialog";
import { AddProjectDialog } from "@/components/AddProjectDialog";
import { AddRepertoireDialog } from "@/components/AddRepertoireDialog";
import { useToast } from "@/hooks/use-toast";

const Library = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedExercises, fetchedProjects] = await Promise.all([
        StorageService.getExercises(),
        StorageService.getProjects(),
      ]);
      setExercises(fetchedExercises);
      setProjects(fetchedProjects);
    } catch (error) {
      console.error("Failed to load library data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredExercises = exercises.filter((exercise) =>
    !exercise.project_id && // Only show standalone exercises here
    exercise.category !== "Repertoire" && // Exclude Repertoire from standalone drills
    exercise.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRepertoire = exercises.filter((exercise) =>
    !exercise.project_id && // Only standalone
    exercise.category === "Repertoire" &&
    exercise.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClick = (exercise: Exercise, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExerciseToDelete(exercise);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!exerciseToDelete) return;

    try {
      await StorageService.deleteExercise(exerciseToDelete.id);
      toast({
        title: "Song deleted",
        description: `${exerciseToDelete.title} has been removed.`,
      });
      loadData();
    } catch (error) {
      console.error("Failed to delete exercise:", error);
      toast({
        title: "Error",
        description: "Failed to delete song. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setExerciseToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Mastered":
        return "bg-primary/20 text-primary border-primary/40";
      case "In Progress":
        return "bg-blue-500/20 text-blue-400 border-blue-500/40";
      case "New":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Exercise Library</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 h-12 bg-secondary border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <AddProjectDialog onProjectAdded={loadData} />
            <AddExerciseDialog onExerciseAdded={loadData} />
          </div>
        </div>

        {/* Song Projects Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-primary">
            <Music className="h-5 w-5" />
            <h2>Song Projects</h2>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-border rounded-lg text-muted-foreground">
              No song projects yet. Start one!
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredProjects.map((project) => {
                const projectExercises = exercises.filter(e => e.project_id === project.id);
                return (
                  <Card key={project.id} className="p-4 bg-secondary/50 border-border">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold">{project.title}</h3>
                        {project.artist && <p className="text-sm text-muted-foreground">{project.artist}</p>}
                      </div>
                      <Badge variant="outline" className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>

                    {/* Project Sections (Exercises) */}
                    <div className="space-y-2 pl-4 border-l-2 border-border/50">
                      {projectExercises.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">No sections yet.</p>
                      )}
                      {projectExercises.map(ex => (
                        <Link key={ex.id} to={`/practice/${ex.id}`} className="block">
                          <div className="flex justify-between items-center p-2 hover:bg-background/50 rounded transition-colors cursor-pointer group">
                            <span className="text-sm font-medium group-hover:text-primary transition-colors">{ex.title}</span>
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className="text-[10px] h-5">{ex.status}</Badge>
                              <span className="text-xs font-mono text-muted-foreground">{ex.currentBpm} BPM</span>
                            </div>
                          </div>
                        </Link>
                      ))}

                      {/* Add Section Button (Placeholder for now, or we can reuse AddExerciseDialog with project_id) */}
                      <div className="pt-2">
                        <AddExerciseDialog
                          onExerciseAdded={loadData}
                          projectId={project.id}
                          trigger={
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-primary">
                              <Plus className="h-3 w-3 mr-1" /> Add Section
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Repertoire Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold text-primary">
              <Music className="h-5 w-5" />
              <h2>Repertoire Songs</h2>
            </div>
            <AddRepertoireDialog onRepertoireAdded={loadData} />
          </div>

          <div className="space-y-3">
            {filteredRepertoire.map((exercise) => (
              <Card key={exercise.id} className="relative group p-4 bg-secondary border-border hover:bg-secondary/80 transition-colors">
                <a 
                  href={exercise.songsterrUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="flex items-start justify-between gap-4 pr-10">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 truncate">{exercise.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        <Badge variant="outline" className={`text-xs ${getStatusColor(exercise.status)}`}>
                          {exercise.status}
                        </Badge>
                        {exercise.youtubeUrl && (
                          <a
                            href={exercise.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            ▶️ Video
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm text-muted-foreground">Current BPM</div>
                      <div className="text-2xl font-bold metric-display">{exercise.currentBpm}</div>
                    </div>
                  </div>
                </a>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={(e) => handleDeleteClick(exercise, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
            {filteredRepertoire.length === 0 && (
              <div className="text-center p-8 border border-dashed border-border rounded-lg text-muted-foreground">
                No repertoire songs yet. Add one to get started!
              </div>
            )}
          </div>
        </section>

        {/* Standalone Exercises Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-primary">
            <Dumbbell className="h-5 w-5" />
            <h2>Standalone Drills</h2>
          </div>

          <div className="space-y-3">
            {filteredExercises.map((exercise) => (
              <Link key={exercise.id} to={`/practice/${exercise.id}`}>
                <Card className="p-4 bg-secondary border-border hover:bg-secondary/80 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 truncate">{exercise.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {exercise.category}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(exercise.status)}`}>
                          {exercise.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm text-muted-foreground">Last BPM</div>
                      <div className="text-2xl font-bold metric-display">{exercise.currentBpm}</div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
            {filteredExercises.length === 0 && (
              <div className="text-center p-8 border border-dashed border-border rounded-lg text-muted-foreground">
                No standalone exercises found.
              </div>
            )}
          </div>
        </section>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Song?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{exerciseToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Library;
