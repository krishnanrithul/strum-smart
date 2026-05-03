import { supabase } from "@/integrations/supabase/client";

// Simple cache
let exerciseCache: Exercise[] | null = null;
let templateCache: ExerciseTemplate[] | null = null;

const clearCache = () => {
    exerciseCache = null;
    templateCache = null;
};
export interface Project {
    id: string;
    title: string;
    artist?: string;
    status: "New" | "In Progress" | "Maintenance" | "Mastered";
    created_at: string;
}

export interface Exercise {
    id: string;
    project_id?: string;
    title: string;
    category: "Technical" | "Repertoire" | "Warmup";
    currentBpm: number;
    targetBpm: number;
    status: "New" | "In Progress" | "Maintenance" | "Mastered";
    history: { date: string; bpm: number }[];
    songsterrUrl?: string;
    youtubeUrl?: string;
    ultimateGuitarUrl?: string;
    tutorialUrl?: string;
    diagramUrl?: string;
}

export interface Session {
    id: string;
    date: string;
    duration: number;
    exercises: string[];
}

export interface ExerciseTemplate {
    id: string;
    title: string;
    category: "Technical" | "Repertoire" | "Warmup";
    default_bpm: number;
    description?: string;
    diagram_url?: string;
    tutorial_url?: string;
}

const mapExercise = (row: any): Exercise => ({
    id: row.id,
    project_id: row.project_id,
    title: row.title,
    category: row.category as any,
    currentBpm: row.current_bpm,
    targetBpm: row.target_bpm,
    status: row.status as any,
    history: row.history || [],
    songsterrUrl: row.songsterr_url,
    youtubeUrl: row.youtube_url,
    ultimateGuitarUrl: row.ultimate_guitar_url,
    tutorialUrl: row.tutorial_url,
    diagramUrl: row.diagram_url,
});

const mapSession = (row: any): Session => ({
    id: row.id,
    date: row.date,
    duration: row.duration,
    exercises: row.exercises || [],
});

export const StorageService = {
    // --- Projects ---
    getProjects: async (): Promise<Project[]> => {
        const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(row => ({
            ...row,
            status: row.status as Project['status']
        }));
    },

    addProject: async (project: Omit<Project, "id" | "created_at">): Promise<Project> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not logged in");

        const { data, error } = await supabase
            .from("projects")
            .insert([{ ...project, user_id: user.id }])
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            status: data.status as Project['status']
        };
    },

    // --- Exercise Templates ---
  getExerciseTemplates: async (): Promise<ExerciseTemplate[]> => {
    if (templateCache) return templateCache;
    const { data, error } = await supabase.from("exercise_templates").select("*").order("category");
    if (error) throw error;
    templateCache = (data || []).map(row => ({
        id: row.id,
        title: row.title,
        category: row.category as ExerciseTemplate["category"],
        default_bpm: row.default_bpm,
        description: row.description ?? undefined,
        diagram_url: row.diagram_url ?? undefined,
        tutorial_url: row.tutorial_url ?? undefined,
    }));
    return templateCache;
},

   addExerciseFromTemplate: async (template: ExerciseTemplate): Promise<Exercise> => {
    return StorageService.addExercise({
        title: template.title,
        category: template.category,
        currentBpm: template.default_bpm,
        status: "In Progress",
        tutorialUrl: template.tutorial_url,
        diagramUrl: template.diagram_url,
    });
},
    // --- Exercises ---
    getExercises: async (): Promise<Exercise[]> => {
    if (exerciseCache) return exerciseCache;
    const { data, error } = await supabase.from("exercises").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    exerciseCache = (data || []).map(mapExercise);
    return exerciseCache;
    },

    getExercise: async (id: string): Promise<Exercise | null> => {
        const { data, error } = await supabase.from("exercises").select("*").eq("id", id).single();
        if (error) return null;
        return mapExercise(data);
    },

    addExercise: async (exercise: Omit<Exercise, "id" | "history" | "targetBpm">): Promise<Exercise> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not logged in");

        const newExercise = {
            user_id: user.id,
            project_id: exercise.project_id,
            title: exercise.title,
            category: exercise.category,
            current_bpm: exercise.currentBpm,
            target_bpm: exercise.currentBpm,
            status: exercise.status,
            history: [{ date: new Date().toISOString(), bpm: exercise.currentBpm }],
            songsterr_url: exercise.songsterrUrl,
            youtube_url: exercise.youtubeUrl,
            tutorial_url: exercise.tutorialUrl,
            diagram_url: exercise.diagramUrl,
        };

        const { data, error } = await supabase
            .from("exercises")
            .insert([newExercise])
            .select()
            .single();

        if (error) throw error;
        clearCache();
        return mapExercise(data);
    },
    updateExerciseBpm: async (id: string, newBpm: number) => {
        const exercise = await StorageService.getExercise(id);
        if (!exercise) return;

        const newHistory = [...exercise.history, { date: new Date().toISOString(), bpm: newBpm }];

        const { error } = await supabase
            .from("exercises")
            .update({
                current_bpm: newBpm,
                history: newHistory,
            })
            .eq("id", id);

        if (error) throw error;
    },

    updateTargetBpm: async (id: string, newTarget: number) => {
        const { error } = await supabase
            .from("exercises")
            .update({ target_bpm: newTarget })
            .eq("id", id);

        if (error) throw error;
    },

    deleteExercise: async (id: string): Promise<void> => {
    const { error } = await supabase
        .from("exercises")
        .delete()
        .eq("id", id);

    if (error) throw error;
    clearCache();
},

    // --- Sessions ---
    getSessions: async (): Promise<Session[]> => {
        const { data, error } = await supabase.from("sessions").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(mapSession);
    },

    saveSession: async (session: Omit<Session, "id">): Promise<Session> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not logged in");

        const { data, error } = await supabase
            .from("sessions")
            .insert([{ ...session, user_id: user.id }])
            .select()
            .single();

        if (error) throw error;
        return mapSession(data);
    },

    // --- Logic ---
    checkProgressiveOverload: async (id: string): Promise<{ newBpm: number; reason: string } | null> => {
        const exercise = await StorageService.getExercise(id);
        if (!exercise || exercise.history.length < 3) return null;

        const last3 = exercise.history.slice(-3);
        const allHitTarget = last3.every((h) => h.bpm >= exercise.targetBpm);

        if (allHitTarget) {
            const increase = Math.max(5, Math.round((exercise.targetBpm * 0.05) / 5) * 5);
            return {
                newBpm: exercise.targetBpm + increase,
                reason: "You've hit your target for 3 sessions in a row!",
            };
        }
        return null;
    },

    generateRoutine: async (): Promise<{ warmup: Exercise | null; technical: Exercise | null; repertoire: Exercise | null }> => {
    const exercises = await StorageService.getExercises();
    const templates = await StorageService.getExerciseTemplates();

    const getRandom = (list: any[]) =>
        list.length > 0 ? list[Math.floor(Math.random() * list.length)] : null;

    const warmups = exercises.filter(e => e.category === "Warmup");
    const technicals = exercises.filter(e => e.category === "Technical");
    const repertoires = exercises.filter(e => e.category === "Repertoire");

    // Fall back to templates if user has no exercises in a category
    const getFromTemplates = async (category: string): Promise<Exercise | null> => {
        const categoryTemplates = templates.filter(t => t.category === category);
        const template = getRandom(categoryTemplates);
        if (!template) return null;
        return StorageService.addExerciseFromTemplate(template);
    };

    const warmup = warmups.length > 0
        ? getRandom(warmups)
        : await getFromTemplates("Warmup");

    const activeTechnicals = technicals.filter(e => e.status === "In Progress");
    const technical = technicals.length > 0
        ? getRandom(activeTechnicals.length > 0 ? activeTechnicals : technicals)
        : await getFromTemplates("Technical");

    const activeRepertoires = repertoires.filter(e => e.status === "In Progress");
    const repertoire = repertoires.length > 0
        ? getRandom(activeRepertoires.length > 0 ? activeRepertoires : repertoires)
        : await getFromTemplates("Repertoire");

    return { warmup, technical, repertoire };
},

    getRandomExerciseByCategory: async (category: string, excludeId?: string): Promise<Exercise | null> => {
    const exercises = await StorageService.getExercises();
    const filtered = exercises.filter(
        (e) => e.category === category && e.id !== excludeId
    );

    if (filtered.length > 0) {
        return filtered[Math.floor(Math.random() * filtered.length)];
    }

    // Fall back to templates if no user exercises available
    const templates = await StorageService.getExerciseTemplates();
    const categoryTemplates = templates.filter(t => t.category === category);
    
    if (categoryTemplates.length === 0) return null;
    
    const template = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
    return StorageService.addExerciseFromTemplate(template);
},
};