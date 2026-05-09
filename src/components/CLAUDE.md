# FretGym

Guitar practice tracking app built with React + TypeScript + Vite + Supabase.

## Stack
- React + TypeScript + Vite
- Supabase (auth + database)
- shadcn/ui components
- Tailwind CSS
- React Router

## Design language
- Dark theme throughout
- Primary accent: green (`text-primary` / `bg-primary` = #22c55e)
- Green is reserved for CTA buttons only — not for data or labels
- Section headers: `text-xs font-semibold tracking-widest uppercase text-muted-foreground`
- Glass cards: `rounded-2xl border border-white/5 bg-card`
- Matches home page style: uppercase tracking labels, glass surface cards

## Key files
- `src/pages/Library.tsx` — main library page (routines, song projects, my exercises)
- `src/pages/Progress.tsx` — progress tracking page
- `src/pages/Home.tsx` — home page (reference for design language)
- `src/components/BuildYourOwnModal.tsx` — two-step modal (step 1: exercises, step 2: songs)
- `src/components/RoutineCard.tsx` — genre routine cards with per-genre glow on hover
- `src/components/RoutineModal.tsx` — modal shown when clicking a routine card
- `src/components/ExerciseCard.tsx` — individual exercise card in My Exercises
- `src/data/routines.ts` — 8 genre routines with labelColor + glowColor per genre
- `src/lib/storage.ts` — StorageService, abstracts all Supabase DB calls
- `src/lib/badges.ts` — getStatusColor, getCategoryBadge helpers

## Database (Supabase)
- `exercises` table — user's exercises (title, category, currentBpm, status, project_id)
- `projects` table — song projects (title, artist, status)
- `exercise_templates` table — catalogue of 10 technical exercises, each with `linked_songs` JSONB column (array of {title, artist})
- `profiles` table — user profiles with `role` (teacher | student) and `teacher_id`

## Exercise templates structure
Each template has: id, title, category ("Technical"), default_bpm, description, linked_songs (JSONB)
10 exercises: Alternate Picking, Sweep Picking, String Skipping, Legato, Bending, Palm Muting, Tapping, Tremolo Picking, Power Chords & Rhythm, Vibrato
Each has 5 curated songs linked to the technique.

## Routines (hardcoded in routines.ts)
8 genres: Fingerpicking, Blues, Metal, Rock, Classical, Jazz, Rhythm & Strumming, Speed & Technique
Each has: id, name, description, accent, labelColor, glowColor, exercises[]
RoutineCard uses glowColor for hover glow effect (linear-gradient + boxShadow)

## BuildYourOwnModal — two-step flow
Step 1: user picks exercises from exercise_templates (multi-select, green ring when selected)
Step 2: linked songs from selected exercises shown pre-selected, user deselects any they don't want
Transition: sliding panel (200% wide flex row, translateX to move between steps)
onAdd(selectedExercises, selectedSongs) — both get added to exercises table via StorageService

## Teacher layer (in progress)
profiles.role = 'teacher' | 'student'
profiles.teacher_id = UUID of their teacher
Teacher dashboard planned but not yet built