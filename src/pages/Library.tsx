import { useState, useEffect } from "react";
import { ArrowLeft, Search, Loader2, Music, Dumbbell, Plus, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { StorageService, Exercise, Project } from "@/lib/storage";
import { AddExerciseDialog } from "@/components/AddExerciseDialog";
import { AddProjectDialog } from "@/components/AddProjectDialog";
import { ExerciseCard } from "@/components/ExerciseCard";
import { RoutineCard } from "@/components/RoutineCard";
import { RoutineModal } from "@/components/RoutineModal";
import { BuildYourOwnModal } from "@/components/BuildYourOwnModal";
import { ROUTINES } from "@/data/routines";
import { getStatusColor } from "@/lib/badges";
import { useToast } from "@/hooks/use-toast";

const Library = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoutine, setSelectedRoutine] = useState<typeof ROUTINES[0] | null>(null);
  const [addingRoutineId, setAddingRoutineId] = useState<string | null>(null);
  const [buildModalOpen, setBuildModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
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

  useEffect(() => { loadData(); }, []);

  const myExercises = exercises.filter(e =>
    !e.project_id && e.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddRoutine = async (routine: typeof ROUTINES[0]) => {
    setAddingRoutineId(routine.id);
    try {
      for (const ex of routine.exercises) {
        await StorageService.addExercise({
          title: ex.title,
          category: ex.category,
          currentBpm: ex.bpm,
          status: "New",
        });
      }
      toast({ title: `${routine.name} routine added!`, description: `${routine.exercises.length} exercises added.` });
      setSelectedRoutine(null);
      loadData();
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to add routine.", variant: "destructive" });
    } finally {
      setAddingRoutineId(null);
    }
  };

  const handleBuildOwn = async (selectedExercises: any[], selectedSongs: Array<{ title: string; artist: string }>) => {
    try {
      for (const ex of selectedExercises) {
        await StorageService.addExercise({
          title: ex.title,
          category: ex.category,
          currentBpm: ex.default_bpm,
          status: "New",
        });
      }
      for (const song of selectedSongs) {
        await StorageService.addExercise({
          title: song.title,
          category: "Repertoire",
          currentBpm: 60,
          status: "New",
        });
      }
      toast({
        title: "Added!",
        description: `${selectedExercises.length} exercise${selectedExercises.length !== 1 ? "s" : ""} + ${selectedSongs.length} song${selectedSongs.length !== 1 ? "s" : ""} added to your library.`,
      });
      loadData();
    } catch {
      toast({ title: "Error", description: "Failed to add items.", variant: "destructive" });
    }
  };

  const handleDeleteAll = async () => {
    try {
      for (const exercise of myExercises) {
        await StorageService.deleteExercise(exercise.id);
      }
      toast({ title: "All exercises deleted" });
      loadData();
    } catch {
      toast({ title: "Error", description: "Failed to delete all.", variant: "destructive" });
    } finally {
      setDeleteAllDialogOpen(false);
    }
  };

  const isRoutineAdded = (routine: typeof ROUTINES[0]) =>
    routine.exercises.every(ex => exercises.some(e => e.title === ex.title));

  const handleDeleteClick = (exercise: Exercise, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setExerciseToDelete(exercise);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (exercise: Exercise, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setExerciseToEdit(exercise);
    setEditDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!exerciseToDelete) return;
    try {
      await StorageService.deleteExercise(exerciseToDelete.id);
      toast({ title: "Exercise deleted", description: `${exerciseToDelete.title} has been removed.` });
      loadData();
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setExerciseToDelete(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="h-6 w-6" /></Button></Link>
          <h1 className="text-xl font-bold">Library</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-10 h-12 bg-secondary border-border"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        {/* Routines */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-primary">Routines</h2>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {ROUTINES.map(routine => (
              <RoutineCard key={routine.id} routine={routine} onClick={() => setSelectedRoutine(routine)} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Don't see your style?{" "}
            <button onClick={() => setBuildModalOpen(true)} className="text-primary hover:underline">
              Build your own
            </button>
            {" "}or{" "}
            <AddExerciseDialog
              onExerciseAdded={loadData}
              trigger={<button className="text-primary hover:underline">create from scratch</button>}
            />
          </p>
        </section>

        {/* Song Projects */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold text-primary">
              <Music className="h-5 w-5" /><h2>Song Projects</h2>
            </div>
            <AddProjectDialog onProjectAdded={loadData} />
          </div>
          {filteredProjects.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-border rounded-lg text-muted-foreground">No song projects yet. Start one!</div>
          ) : (
            <div className="grid gap-4">
              {filteredProjects.map(project => {
                const projectExercises = exercises.filter(e => e.project_id === project.id);
                return (
                  <Card key={project.id} className="p-4 bg-secondary/50 border-border">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold">{project.title}</h3>
                        {project.artist && <p className="text-sm text-muted-foreground">{project.artist}</p>}
                      </div>
                      <Badge variant="outline" className={getStatusColor(project.status)}>{project.status}</Badge>
                    </div>
                    <div className="space-y-2 pl-4 border-l-2 border-border/50">
                      {projectExercises.length === 0 && <p className="text-xs text-muted-foreground italic">No sections yet.</p>}
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
                      <div className="pt-2">
                        <AddExerciseDialog onExerciseAdded={loadData} projectId={project.id}
                          trigger={<Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-primary"><Plus className="h-3 w-3 mr-1" /> Add Section</Button>}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* My Exercises */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold text-primary">
              <Dumbbell className="h-5 w-5" /><h2>My Exercises</h2>
            </div>
            <div className="flex items-center gap-2">
              {myExercises.length > 0 && (
                <Button variant="ghost" size="sm"
                  className="text-xs text-destructive hover:text-destructive"
                  onClick={() => setDeleteAllDialogOpen(true)}>
                  Delete all
                </Button>
              )}
              <AddExerciseDialog
                onExerciseAdded={loadData}
                trigger={<Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary"><Plus className="h-3 w-3 mr-1" /> Add</Button>}
              />
            </div>
          </div>
          <div className="space-y-3">
            {myExercises.length === 0
              ? <div className="text-center p-8 border border-dashed border-border rounded-lg text-muted-foreground">No exercises yet. Add a routine or build your own above.</div>
              : myExercises.map(exercise => (
                <ExerciseCard key={exercise.id} exercise={exercise} showCategory bpmLabel="Last BPM" onEdit={handleEditClick} onDelete={handleDeleteClick} />
              ))}
          </div>
        </section>
      </main>

      <RoutineModal
        routine={selectedRoutine}
        isAdding={addingRoutineId === selectedRoutine?.id}
        alreadyAdded={selectedRoutine ? isRoutineAdded(selectedRoutine) : false}
        onClose={() => setSelectedRoutine(null)}
        onAdd={() => selectedRoutine && handleAddRoutine(selectedRoutine)}
      />

      <BuildYourOwnModal
        open={buildModalOpen}
        onClose={() => setBuildModalOpen(false)}
        onAdd={handleBuildOwn}
      />

      <AddExerciseDialog
        open={editDialogOpen}
        onOpenChange={(o) => { setEditDialogOpen(o); if (!o) setExerciseToEdit(null); }}
        exerciseToEdit={exerciseToEdit ?? undefined}
        onExerciseAdded={() => { loadData(); setEditDialogOpen(false); setExerciseToEdit(null); toast({ title: "Exercise updated!" }); }}
      />

      {/* Delete Single Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exercise?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{exerciseToDelete?.title}"? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Dialog */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Exercises?</AlertDialogTitle>
            <AlertDialogDescription>This will delete all {myExercises.length} exercises. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive hover:bg-destructive/90">Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Library;