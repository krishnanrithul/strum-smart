import { useState, useEffect, useRef } from "react";
import { Plus, ChevronRight, ChevronLeft, Pencil, Trash2, CheckCircle2, X, Bookmark } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MiniLogo from "@/components/MiniLogo";
import WaveformLoader from "@/components/WaveformLoader";
import { useNavigate } from "react-router-dom";
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
import { supabase } from "@/integrations/supabase/client";

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
  const [reactivateConfirmExercise, setReactivateConfirmExercise] = useState<Exercise | null>(null);
  const [completedSheetOpen, setCompletedSheetOpen] = useState(false);
  const [completedSheetVisible, setCompletedSheetVisible] = useState(false);
  const [routineSheetOpen, setRoutineSheetOpen] = useState(false);
  const [routineSheetVisible, setRoutineSheetVisible] = useState(false);
  const [routineSheetView, setRoutineSheetView] = useState<"list" | "picker">("list");
  const [routinePickerRoutine, setRoutinePickerRoutine] = useState<typeof ROUTINES[0] | null>(null);
  const [pickerSelected, setPickerSelected] = useState<Set<number>>(new Set());
  const [activeRoutineIndex, setActiveRoutineIndex] = useState(0);
  const [carouselAtEnd, setCarouselAtEnd] = useState(false);
  const [carouselAtStart, setCarouselAtStart] = useState(true);
  const [carouselHovered, setCarouselHovered] = useState(false);
  const [hoveredExerciseId, setHoveredExerciseId] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (completedSheetOpen) setTimeout(() => setCompletedSheetVisible(true), 10);
    else setCompletedSheetVisible(false);
  }, [completedSheetOpen]);

  useEffect(() => {
    if (routineSheetOpen) setTimeout(() => setRoutineSheetVisible(true), 10);
    else setRoutineSheetVisible(false);
  }, [routineSheetOpen]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const handleScroll = () => {
      const idx = Math.round(el.scrollLeft / (el.scrollWidth / ROUTINES.length));
      setActiveRoutineIndex(Math.max(0, Math.min(ROUTINES.length - 1, idx)));
      setCarouselAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 10);
      setCarouselAtStart(el.scrollLeft <= 10);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleWindowScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, []);

  const myExercises = exercises.filter(e => !e.project_id);
  const activeExercises = myExercises.filter(e => e.status !== "Completed");
  const completedExercises = myExercises.filter(e => e.status === "Completed");

  const handleAddRoutine = async (routine: typeof ROUTINES[0], exercisesToAdd: typeof routine.exercises) => {
    setAddingRoutineId(routine.id);
    try {
      for (const ex of exercisesToAdd) {
        await StorageService.addExercise({
          title: ex.title,
          category: ex.category,
          currentBpm: ex.bpm,
          status: "New",
        });
      }
      toast({ title: `${routine.name} routine added!`, description: `${exercisesToAdd.length} exercises added.` });
      setRoutinePickerRoutine(null);
      setSelectedRoutine(null);
      setRoutineSheetOpen(false);
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

  const handleReactivate = async (exercise: Exercise) => {
    await supabase.from("exercises").update({ status: "In Progress" }).eq("id", exercise.id);
    setExercises(prev => prev.map(e => e.id === exercise.id ? { ...e, status: "In Progress" as const } : e));
    setReactivateConfirmExercise(null);
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

  const getBpmProgress = (exercise: Exercise) => {
    const current = exercise.currentBpm;
    const target = exercise.targetBpm;
    const initial = exercise.history[0]?.bpm ?? current;
    if (current <= initial) return 0;
    if (!target || target <= initial) {
      return Math.min(100, Math.round(((current - initial) / initial) * 100));
    }
    return Math.min(100, Math.round(((current - initial) / (target - initial)) * 100));
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <WaveformLoader />
    </div>
  );

  return (
    <div ref={containerRef} className="min-h-screen pb-24" style={{ background: "radial-gradient(circle at top right, rgba(34,197,94,0.07) 0%, transparent 50%), hsl(var(--background))" }}>

      <AppHeader />

      <main className="container mx-auto px-4 py-6 space-y-10">
      
      {/* Stats card */}
        <div className="rounded-2xl p-5 space-y-4" style={{ border: "1px solid rgba(255,255,255,0.05)", background: "radial-gradient(circle at top right, rgba(34,197,94,0.15) 0%, transparent 60%), hsl(var(--card))" }}>
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">My Library</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-white leading-none">{myExercises.length}</span>
            <span className="text-sm text-muted-foreground mb-1">exercise{myExercises.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="border-t border-white/5 pt-4 grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Routines</p>
              <p className="text-xl font-bold text-white mt-1">{routinesAdded}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Songs</p>
              <p className="text-xl font-bold text-white mt-1">{projects.length}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Available</p>
              <p className="text-xl font-bold text-white mt-1">{ROUTINES.length}</p>
            </div>
          </div>
        </div>

        {/* Routines */}
        <section className="space-y-4">
          <div style={{ position: "sticky", top: 0, zIndex: 10, padding: "8px 0", transition: "all 200ms ease", ...(scrollY > 80 ? { backdropFilter: "blur(12px)", background: "rgba(0,0,0,0.6)" } : {}) }}>
            <p className={scrollY > 80 ? "text-base font-semibold text-white" : "text-xs font-semibold tracking-widest uppercase text-muted-foreground"}>Routines</p>
          </div>

          {/* Cinematic carousel */}
          <div className="relative" onMouseEnter={() => setCarouselHovered(true)} onMouseLeave={() => setCarouselHovered(false)}>
            {ROUTINES.length > 1 && (
              <button
                className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-card border border-white/10 p-2 text-white hover:bg-white/10 transition-opacity duration-200 ${carouselHovered ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={(e) => { e.stopPropagation(); carouselRef.current?.scrollBy({ left: -(carouselRef.current.offsetWidth * 0.85), behavior: "smooth" }); }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <div
              ref={carouselRef}
              className="flex overflow-x-auto gap-3 scrollbar-hide"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {ROUTINES.map((routine) => {
                const boldColor = routine.glowColor.replace(/[\d.]+\)$/, "0.55)");
                return (
                  <div
                    key={routine.id}
                    className="relative rounded-2xl overflow-hidden shrink-0 flex flex-col justify-end cursor-pointer"
                    style={{
                      width: "85vw",
                      height: scrollY > 80 ? "160px" : "220px",
                      transition: "height 200ms ease",
                      scrollSnapAlign: "start",
                      background: `radial-gradient(ellipse at 80% 20%, ${boldColor} 0%, rgba(8,8,8,1) 65%)`,
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    onClick={() => {
                      setRoutineSheetOpen(true);
                      setRoutineSheetView("picker");
                      setRoutinePickerRoutine(routine);
                      setPickerSelected(new Set(routine.exercises.map((_, i) => i)));
                    }}
                  >
                    {/* Large background typography */}
                    <span
                      className="absolute inset-0 flex items-center justify-center font-black text-white select-none pointer-events-none overflow-hidden leading-none"
                      style={{ fontSize: "clamp(80px, 22vw, 120px)", opacity: 0.06 }}
                    >
                      {routine.name.split(" ")[0]}
                    </span>

                    {/* Scrim */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)" }}
                    />

                    {/* Overlay content */}
                    <div className="relative z-10 p-4">
                      <p className="text-xl font-bold text-white mb-2">{routine.name}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${routine.accent} ${routine.labelColor}`}>
                          {routine.exercises.length} exercises
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRoutineSheetOpen(true);
                              setRoutineSheetView("picker");
                              setRoutinePickerRoutine(routine);
                              setPickerSelected(new Set(routine.exercises.map((_, i) => i)));
                            }}
                            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                          >
                            Start
                          </button>
                          <button
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white transition-colors"
                            style={{ background: "rgba(255,255,255,0.1)" }}
                          >
                            <Bookmark className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!carouselAtEnd && (
              <button
                className={`absolute right-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-card border border-white/10 p-2 text-white hover:bg-white/10 transition-opacity duration-200 ${carouselHovered ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={(e) => { e.stopPropagation(); carouselRef.current?.scrollBy({ left: carouselRef.current.offsetWidth * 0.85, behavior: "smooth" }); }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Dot pagination */}
          <div className="flex items-center justify-center gap-1.5">
            {ROUTINES.map((_, idx) => (
              <div
                key={idx}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: idx === activeRoutineIndex ? "18px" : "6px",
                  background: idx === activeRoutineIndex ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.3)",
                }}
              />
            ))}
          </div>

          {/* Build your own CTA */}
          <button
            onClick={() => setBuildModalOpen(true)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <MiniLogo color="#0a0a0a" />
              Build your own
            </div>
            <ChevronRight className="h-5 w-5 opacity-70" />
          </button>
        </section>

        {/* Song Projects */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Song Projects</p>
            <AddProjectDialog onProjectAdded={loadData} />
          </div>
          {projects.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-xl text-sm text-muted-foreground">
              No song projects yet. Start one!
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map(project => (
                <div
                  key={project.id}
                  className="rounded-2xl bg-card p-4 flex items-center justify-between cursor-pointer hover:bg-card/80 transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.05)" }}
                  onClick={() => navigate(`/song/${project.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">{project.title}</h3>
                    {project.artist && <p className="text-xs text-muted-foreground mt-0.5">{project.artist}</p>}
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <Badge variant="outline" className={getStatusColor(project.status)}>{project.status}</Badge>
                    <button
                      onClick={(e) => handleEditProjectClick(project, e)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteProjectClick(project, e)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* My Exercises */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground whitespace-nowrap">Exercises</p>
              {completedExercises.length > 0 && (
                <button
                  onClick={() => setCompletedSheetOpen(true)}
                  className="shrink-0 px-2 py-0.5 rounded-full text-xs text-muted-foreground transition-colors hover:text-foreground"
                  style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}
                >
                  {completedExercises.length} completed
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {myExercises.length > 0 && (
                <button
                  onClick={() => setDeleteAllDialogOpen(true)}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/25 transition-colors"
                  style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
                >
                  Delete all
                </button>
              )}
              <AddExerciseDialog
                onExerciseAdded={loadData}
                trigger={
                  <button className="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                    <Plus className="h-3 w-3" /> Add
                  </button>
                }
              />
            </div>
          </div>
          <div className="space-y-3">
            {activeExercises.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-xl text-sm text-muted-foreground">
                No exercises yet. Add a routine or build your own above.
              </div>
            ) : (
              activeExercises.map(exercise => {
                const isHovered = hoveredExerciseId === exercise.id;
                const categoryGradient = exercise.category === "Warmup"
                  ? `radial-gradient(circle at top right, rgba(234,179,8,${isHovered ? 0.4 : 0.3}) 0%, rgba(0,0,0,0.8) 60%)`
                  : exercise.category === "Technical"
                  ? `radial-gradient(circle at top right, rgba(59,130,246,${isHovered ? 0.4 : 0.3}) 0%, rgba(0,0,0,0.8) 60%)`
                  : exercise.category === "Repertoire"
                  ? `radial-gradient(circle at top right, rgba(168,85,247,${isHovered ? 0.4 : 0.3}) 0%, rgba(0,0,0,0.8) 60%)`
                  : `radial-gradient(circle at top right, rgba(255,255,255,${isHovered ? 0.2 : 0.1}) 0%, rgba(0,0,0,0.8) 60%)`;
                const categoryColor = exercise.category === "Warmup" ? "#eab308"
                  : exercise.category === "Technical" ? "#3b82f6"
                  : exercise.category === "Repertoire" ? "#a855f7"
                  : "#22c55e";
                return (
                  <div
                    key={exercise.id}
                    className="rounded-2xl overflow-hidden relative cursor-pointer group"
                    style={{
                      height: "120px",
                      background: categoryGradient,
                      border: isHovered ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.08)",
                      transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                      boxShadow: isHovered ? "0 8px 24px rgba(0,0,0,0.4)" : "none",
                      transition: "all 200ms ease",
                    }}
                    onClick={() => navigate(`/practice/${exercise.id}`)}
                    onMouseEnter={() => setHoveredExerciseId(exercise.id)}
                    onMouseLeave={() => setHoveredExerciseId(null)}
                  >
                    {/* Ghost text */}
                    <span
                      className="absolute font-black text-white select-none pointer-events-none leading-none"
                      style={{ fontSize: "64px", opacity: 0.04, top: "-8px", right: "-4px" }}
                    >
                      {exercise.category}
                    </span>

                    {/* Right scrim */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-32 pointer-events-none z-10"
                      style={{ background: "linear-gradient(to left, rgba(0,0,0,0.6) 0%, transparent 100%)" }}
                    />

                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-30">
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${getBpmProgress(exercise)}%`, background: categoryColor }}
                      />
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between z-20">
                      <div>
                        <h3 className="text-base font-bold text-white leading-tight">{exercise.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{exercise.category}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-white leading-none">{exercise.currentBpm}</span>
                        <span className="text-xs text-muted-foreground leading-none mt-0.5">BPM</span>
                      </div>
                    </div>

                    {/* Edit / Delete */}
                    <button
                      className="absolute z-30 top-3 right-10 h-8 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white/50 hover:text-white"
                      onClick={(e) => handleEditClick(exercise, e)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      className="absolute z-30 top-3 right-2 h-8 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white/50 hover:text-destructive"
                      onClick={(e) => handleDeleteClick(exercise, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      <RoutineModal
        routine={selectedRoutine}
        isAdding={addingRoutineId === selectedRoutine?.id}
        alreadyAdded={selectedRoutine ? isRoutineAdded(selectedRoutine) : false}
        onClose={() => setSelectedRoutine(null)}
        onAdd={() => selectedRoutine && handleAddRoutine(selectedRoutine, selectedRoutine.exercises)}
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

      <AlertDialog open={!!reactivateConfirmExercise} onOpenChange={(o) => { if (!o) setReactivateConfirmExercise(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Move back to active?</AlertDialogTitle>
            <AlertDialogDescription>
              Move {reactivateConfirmExercise?.title} back to active exercises?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reactivateConfirmExercise && handleReactivate(reactivateConfirmExercise)}
              className="bg-primary hover:bg-primary/90"
            >
              Move to Active
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {routineSheetOpen && (
        <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-opacity duration-300 ${routineSheetVisible ? "opacity-100" : "opacity-0"}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRoutineSheetOpen(false)} />
          <div
            className={`relative w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-6 z-10 transition-transform duration-300 ${routineSheetVisible ? "translate-y-0" : "translate-y-8"}`}
            style={{ border: "1px solid rgba(255,255,255,0.15)" }}
          >
            {routineSheetView === "list" ? (
              <>
                <div className="flex items-start justify-between mb-4">
                  <p className="text-lg font-bold text-foreground">Routines</p>
                  <button onClick={() => setRoutineSheetOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="divide-y divide-white/5">
                  {ROUTINES.map(routine => (
                    <button
                      key={routine.id}
                      onClick={() => {
                        setRoutinePickerRoutine(routine);
                        setPickerSelected(new Set(routine.exercises.map((_, i) => i)));
                        setRoutineSheetView("picker");
                      }}
                      className="w-full py-4 flex items-center justify-between active:bg-white/5 transition-colors"
                    >
                      <span className="text-base font-semibold text-foreground">{routine.name}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm text-muted-foreground">{routine.exercises.length} exercises</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : routinePickerRoutine ? (
              <>
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setRoutineSheetView("list"); setRoutinePickerRoutine(null); }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <p className="text-lg font-bold text-foreground">{routinePickerRoutine.name}</p>
                  </div>
                  <button onClick={() => setRoutineSheetOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-3 mb-6">
                  {routinePickerRoutine.exercises.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setPickerSelected(prev => {
                        const next = new Set(prev);
                        if (next.has(i)) next.delete(i); else next.add(i);
                        return next;
                      })}
                      className="w-full flex items-center gap-3 text-left"
                    >
                      <div
                        className="h-5 w-5 rounded flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          background: pickerSelected.has(i) ? "hsl(var(--primary))" : "transparent",
                          border: `1px solid ${pickerSelected.has(i) ? "hsl(var(--primary))" : "rgba(255,255,255,0.2)"}`,
                        }}
                      >
                        {pickerSelected.has(i) && <span className="text-[10px] text-primary-foreground font-bold leading-none">✓</span>}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{ex.title}</p>
                        <p className="text-xs text-muted-foreground">{ex.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleAddRoutine(
                    routinePickerRoutine,
                    routinePickerRoutine.exercises.filter((_, i) => pickerSelected.has(i))
                  )}
                  disabled={pickerSelected.size === 0 || addingRoutineId === routinePickerRoutine.id}
                  className="w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {addingRoutineId === routinePickerRoutine.id
                    ? "Adding…"
                    : `Add ${pickerSelected.size} exercise${pickerSelected.size !== 1 ? "s" : ""}`}
                </button>
                <button
                  onClick={() => setRoutineSheetOpen(false)}
                  className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {completedSheetOpen && (
        <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-opacity duration-300 ${completedSheetVisible ? "opacity-100" : "opacity-0"}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCompletedSheetOpen(false)} />
          <div
            className={`relative w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-6 z-10 transition-transform duration-300 ${completedSheetVisible ? "translate-y-0" : "translate-y-8"}`}
            style={{ border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <div className="flex items-start justify-between mb-4">
              <p className="text-lg font-bold text-foreground">Completed Exercises</p>
              <button onClick={() => setCompletedSheetOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {completedExercises.map(exercise => (
                <div
                  key={exercise.id}
                  className="rounded-xl p-4 flex items-center gap-4"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500/50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{exercise.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{exercise.currentBpm} BPM</p>
                  </div>
                  <button
                    onClick={() => setReactivateConfirmExercise(exercise)}
                    className="text-xs font-medium px-3 py-1 rounded-full shrink-0 transition-colors hover:bg-green-500/10"
                    style={{ border: "1px solid #22c55e", color: "#22c55e", background: "transparent" }}
                  >
                    Practice Again
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Library;