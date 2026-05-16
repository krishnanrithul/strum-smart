import { useState, useEffect } from "react";
import { Plus, ChevronRight, Pencil, Trash2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import WaveformLoader from "@/components/WaveformLoader";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { StorageService, Exercise, Project } from "@/lib/storage";
import { AddExerciseDialog } from "@/components/AddExerciseDialog";
import { AddProjectDialog } from "@/components/AddProjectDialog";
import { ExerciseCard } from "@/components/ExerciseCard";
import { RoutineCard } from "@/components/RoutineCard";
import { RoutineModal } from "@/components/RoutineModal";
import { BuildYourOwnModal } from "@/components/BuildYourOwnModal";
import { ROUTINES } from "@/data/routines";
import { useToast } from "@/hooks/use-toast";

const Library = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoutine, setSelectedRoutine] = useState<typeof ROUTINES[0] | null>(null);
  const [addingRoutineId, setAddingRoutineId] = useState<string | null>(null);
  const [buildModalOpen, setBuildModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [deleteProjectDialogOpen, setDeleteProjectDialogOpen] = useState(false);
  const [editProjectDialogOpen, setEditProjectDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const myExercises = exercises.filter(e => !e.project_id);

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
        await StorageService.addExercise({ title: ex.title, category: ex.category, currentBpm: ex.default_bpm, status: "New" });
      }
      for (const song of selectedSongs) {
        await StorageService.addExercise({ title: song.title, category: "Repertoire", currentBpm: 60, status: "New" });
      }
      toast({
        title: "Added!",
        description: `${selectedExercises.length} exercise${selectedExercises.length !== 1 ? "s" : ""} + ${selectedSongs.length} song${selectedSongs.length !== 1 ? "s" : ""} added.`,
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

  const handleDeleteProjectClick = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteProjectDialogOpen(true);
  };

  const handleEditProjectClick = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToEdit(project);
    setEditProjectDialogOpen(true);
  };

  const handleDeleteProjectConfirm = async () => {
    if (!projectToDelete) return;
    try {
      await StorageService.deleteProject(projectToDelete.id);
      toast({ title: "Song project deleted", description: `${projectToDelete.title} has been removed.` });
      loadData();
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    } finally {
      setDeleteProjectDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const routinesAdded = ROUTINES.filter(r => isRoutineAdded(r)).length;

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <WaveformLoader />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">

      <AppHeader />

      <main className="container mx-auto px-4 pt-8 pb-6 space-y-10">

        {/* Stats — bleeds into page */}
        <div className="pb-4">
          <p className="text-[10px] tracking-[0.4em] text-zinc-400 uppercase mb-3">My Library</p>
          <div className="flex items-end gap-2">
            <span className="text-6xl font-mono font-bold text-zinc-100 leading-none">{myExercises.length}</span>
            <span className="text-sm text-zinc-400 mb-1">exercise{myExercises.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="border-t border-zinc-800 mt-6 pt-6 grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] tracking-[0.4em] text-zinc-400 uppercase">Routines Added</p>
              <p className="text-2xl font-mono text-zinc-100 mt-1">{routinesAdded}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.4em] text-zinc-400 uppercase">Song Projects</p>
              <p className="text-2xl font-mono text-zinc-100 mt-1">{projects.length}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.4em] text-zinc-400 uppercase">Total Routines</p>
              <p className="text-2xl font-mono text-zinc-100 mt-1">{ROUTINES.length}</p>
            </div>
          </div>
        </div>

        {/* Routines */}
        <section className="space-y-4">
          <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">Routines</p>
          <div className="grid grid-cols-4 gap-3">
            {ROUTINES.map(routine => (
              <RoutineCard key={routine.id} routine={routine} onClick={() => setSelectedRoutine(routine)} />
            ))}
          </div>

          <button
            onClick={() => setBuildModalOpen(true)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-sm bg-green-700 text-white hover:bg-green-600 transition-colors"
          >
            <span className="text-base font-medium">Build your own</span>
            <ChevronRight className="h-4 w-4 opacity-70" />
          </button>
        </section>

        {/* Song Projects */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">Song Projects</p>
            <AddProjectDialog onProjectAdded={loadData} />
          </div>
          {projects.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-zinc-900 text-sm text-zinc-600">
              No song projects yet. Start one!
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map(project => (
                <div
                  key={project.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-sm p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800 transition-colors"
                  onClick={() => navigate(`/song/${project.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-medium text-zinc-100 truncate">{project.title}</h3>
                    {project.artist && <p className="text-xs text-zinc-500 mt-0.5">{project.artist}</p>}
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span className="text-[10px] tracking-widest text-green-700 uppercase">{project.status}</span>
                    <button
                      onClick={(e) => handleEditProjectClick(project, e)}
                      className="text-zinc-600 hover:text-zinc-300 transition-colors p-1"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteProjectClick(project, e)}
                      className="text-zinc-600 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <ChevronRight className="h-4 w-4 text-zinc-700" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* My Exercises */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">My Exercises</p>
            <div className="flex items-center gap-2">
              {myExercises.length > 0 && (
                <button
                  onClick={() => setDeleteAllDialogOpen(true)}
                  className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold text-red-500 hover:text-red-400 transition-colors"
                  style={{ border: "1px solid rgba(239,68,68,0.3)" }}
                >
                  Delete all
                </button>
              )}
              <AddExerciseDialog
                onExerciseAdded={loadData}
                trigger={
                  <button className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700 transition-colors">
                    <Plus className="h-3 w-3" /> Add
                  </button>
                }
              />
            </div>
          </div>
          <div>
            {myExercises.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-zinc-900 text-sm text-zinc-600">
                No exercises yet. Add a routine or build your own above.
              </div>
            ) : (
              myExercises.map(exercise => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              ))
            )}
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

      <AlertDialog open={deleteProjectDialogOpen} onOpenChange={setDeleteProjectDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Song Project?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{projectToDelete?.title}"? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProjectConfirm} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddProjectDialog
        open={editProjectDialogOpen}
        onOpenChange={(o) => { setEditProjectDialogOpen(o); if (!o) setProjectToEdit(null); }}
        projectToEdit={projectToEdit ?? undefined}
        onProjectAdded={() => { loadData(); setEditProjectDialogOpen(false); setProjectToEdit(null); toast({ title: "Project updated!" }); }}
      />
    </div>
  );
};

export default Library;