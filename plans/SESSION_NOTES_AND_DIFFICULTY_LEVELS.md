# Implementation Plan: Session Notes & Exercise Difficulty Levels

**Scope:** Student-facing features to improve practice reflection and exercise organization  
**Effort Estimate:** 7-9 hours total (1-2 days of focused work)  
**Breakdown:** Session Notes (3-4 hrs) + Difficulty Levels—Simple (4-5 hrs)  
**Priority:** Medium (both enhance core practice experience)

---

## Feature 1: Session Notes

### Overview
Allow students to reflect on practice sessions immediately after finishing. Teachers can view and respond.

### User Flow

**Student:**
1. End practice session → **"Add notes?" modal appears**
2. Quick textarea: "Struggled with timing", "Felt great today", etc.
3. Optional voice note? (phase 2)
4. Save → confirms
5. Later, view notes in **Progress → Recent Sessions**
6. See teacher feedback/responses

**Teacher:**
1. StudentDetail → Progress tab → Recent Sessions
2. Click session card → see student's notes
3. Add teacher feedback (already implemented) in response

### Database Changes

```sql
-- Add to sessions table
ALTER TABLE sessions
ADD COLUMN student_notes TEXT,
ADD COLUMN notes_created_at TIMESTAMP;

-- Optional: notes response (phase 2)
-- ALTER TABLE sessions
-- ADD COLUMN teacher_response TEXT,
-- ADD COLUMN response_created_at TIMESTAMP;
```

### Component Structure

#### 1. SessionNotesModal (NEW)
- Triggered after session ends (Practice.tsx)
- Textarea for notes (max 500 chars)
- Optional mood/feeling emoji selector
- Save button
- Skip option

```typescript
interface SessionNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onNotesAdded?: () => void;
}
```

#### 2. Update Practice.tsx
- When user clicks "End Session"
- Show modal before returning to Home
- Pass session ID to modal
- On save, update session record, then navigate

```typescript
const handleEndSession = () => {
  setCurrentSessionId(sessionId); // Store for modal
  setNotesModalOpen(true);
};

// Modal closes after save and navigates:
onNotesAdded={() => {
  setNotesModalOpen(false);
  navigate("/");
}}
```

#### 3. Display in StudentDetail Progress Tab
- Existing session cards → add visual indicator if notes exist
- Click session → show notes below (expandable)
- Show mood indicator (optional: 😐 → 😊)

```tsx
{recentSessions.map((session) => (
  <div key={session.id} className="space-y-2">
    <div className="...session card...">
      {session.student_notes && (
        <span className="text-xs text-primary">📝 Notes</span>
      )}
    </div>
    {expandedSessionId === session.id && session.student_notes && (
      <div className="bg-secondary rounded p-3 text-sm text-foreground">
        {session.student_notes}
      </div>
    )}
  </div>
))}
```

### Implementation Checklist

- [ ] Create migration: add `student_notes`, `notes_created_at` to sessions
- [ ] Create `SessionNotesModal` component
- [ ] Integrate modal into `Practice.tsx` (show after session ends)
- [ ] Update `StudentDetail.tsx` to fetch and display notes
- [ ] Add expandable notes display to session cards
- [ ] Add "Notes" indicator badge on sessions with notes
- [ ] Optional: emoji mood selector UI

### Effort: 3-4 hours
- Migration + schema: 10 min
- SessionNotesModal component: 1-1.5 hours
- Practice.tsx integration: 30 min
- StudentDetail display: 1 hour
- Testing: 30 min

---

## Feature 2: Exercise Difficulty Levels (Simple Version)

### Overview
Add difficulty labels (Beginner/Intermediate/Advanced) to exercises. Teachers assign on creation, students see and can filter by difficulty. No progression/unlocking—just organization and filtering.

### User Flow

**Student:**
1. Library → **Filter by difficulty** (All / Beginner / Intermediate / Advanced)
2. See difficulty badge on each exercise card
3. Home page exercises show difficulty badges
4. Practice page shows difficulty of current exercise

**Teacher:**
1. When assigning exercise → pick difficulty level
2. StudentDetail → see difficulty badge on each exercise
3. Filter student's exercises by difficulty (optional)

### Database Changes

**Simple approach:**
```sql
ALTER TABLE exercises
ADD COLUMN difficulty TEXT DEFAULT 'Intermediate' 
  CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced'));
```

That's it. One column, persists on the exercise record.

### Component Changes

#### 1. DifficultyBadge Component
Reusable badge for all exercise cards:

```tsx
const DifficultyBadge = ({ difficulty }: { difficulty?: string }) => {
  if (!difficulty) return null;
  
  const colors = {
    Beginner: "bg-green-500/20 text-green-400",
    Intermediate: "bg-yellow-500/20 text-yellow-400",
    Advanced: "bg-red-500/20 text-red-400",
  };
  
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded ${colors[difficulty] || colors.Intermediate}`}>
      {difficulty}
    </span>
  );
};
```

#### 2. Update AssignExerciseModal
Add difficulty dropdown when assigning:

```tsx
<select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
  <option value="Beginner">Beginner</option>
  <option value="Intermediate">Intermediate</option>
  <option value="Advanced">Advanced</option>
</select>

// When saving, set difficulty on the exercise
```

#### 3. Library Filter
Add tabs to filter by difficulty:

```tsx
const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

const filtered = exercises.filter(e =>
  !selectedDifficulty || e.difficulty === selectedDifficulty
);

<div className="flex gap-2 mb-4">
  {["All", "Beginner", "Intermediate", "Advanced"].map((diff) => (
    <button
      key={diff}
      onClick={() => setSelectedDifficulty(diff === "All" ? null : diff)}
      className={`px-4 py-2 rounded text-sm font-medium ${
        (diff === "All" ? !selectedDifficulty : selectedDifficulty === diff)
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-muted-foreground"
      }`}
    >
      {diff}
    </button>
  ))}
</div>
```

#### 4. Display on Exercise Cards
Add badge to Library, Home, Practice, StudentDetail:

```tsx
<div className="flex items-center gap-2">
  <h3>{exercise.title}</h3>
  {exercise.difficulty && <DifficultyBadge difficulty={exercise.difficulty} />}
</div>
```

### Implementation Checklist

- [ ] Create migration: add `difficulty` column to exercises table
- [ ] Create `DifficultyBadge` component
- [ ] Update `AssignExerciseModal` with difficulty selector
- [ ] Add difficulty filter to `Library.tsx`
- [ ] Display badge on exercise cards (Library, Home, Practice, StudentDetail)
- [ ] Update `StorageService` queries to include difficulty
- [ ] Testing: filter works, badges display correctly

### Effort: 4-5 hours
- Migration + schema: 10 min
- DifficultyBadge component: 30 min
- AssignExerciseModal update: 1 hour
- Library filter UI: 1-1.5 hours
- Display on cards (4 places): 1 hour
- StorageService queries: 30 min
- Testing: 30 min

---

## Combined Implementation Timeline

### Session Notes: 1 Day (3-4 hours)
Quick win—do this first:
- Morning: Database migration + SessionNotesModal component
- Afternoon: Practice.tsx integration + StudentDetail display + testing
- Done before EOD

### Exercise Difficulty Levels: Half day (4-5 hours)
Simple feature, quick turnaround:
- 1-2 hours: Migration + DifficultyBadge component
- 1-2 hours: AssignExerciseModal + Library filter
- 1 hour: Display badges on cards + testing

### Both together: 1-2 days, ~7-9 hours
- Day 1 morning: Session Notes
- Day 1 afternoon: Difficulty Levels
- Done by EOD Day 1 or early Day 2

---

## Integration Points

### 1. Practice.tsx
- Import SessionNotesModal
- Import DifficultyUnlockModal  
- After session ends:
  - Show SessionNotesModal first
  - If exercise target reached AND current_difficulty < Advanced:
    - Show DifficultyUnlockModal
  - Then return home

### 2. StorageService (lib/storage.ts)
Add helpers:
```typescript
export const getExerciseProgression = async (studentId: string, exerciseId: string) => {
  return supabase
    .from("exercise_progression")
    .select("*")
    .eq("student_id", studentId)
    .eq("exercise_id", exerciseId)
    .single();
};

export const getStudentDifficultiesUnlocked = async (studentId: string) => {
  return supabase
    .from("exercise_progression")
    .select("exercise_id, current_difficulty, unlocked_difficulties")
    .eq("student_id", studentId);
};
```

### 3. Index.tsx / Library.tsx
- Display difficulty badges
- Filter by difficulty

### 4. StudentDetail.tsx
- Show progression on exercise cards
- Display notes on sessions

---

## Edge Cases & Considerations

### Session Notes
- Student completes session at 11:59pm, adds notes at 12:01am → created_at is next day (OK)
- What if student closes modal without saving? → No default, just skip
- Empty notes text → validate, don't allow blank save
- Character limit: 500 chars (reasonable for reflection)

### Difficulty Levels
- What if exercise already exists in student's library?  
  → Create progression record on first assignment, or check on load
- Teacher assigns "Advanced" but student just started?  
  → Allowed (teacher knows the student), but show warning
- Can student unlock backwards? (Advanced → Intermediate)  
  → No, only forward progression via target reach
- What if target BPM is same for all difficulties?  
  → Allow teacher to set different targets per difficulty (future enhancement)

---

## Future Enhancements

### Phase 2 (After both complete)
**Difficulty Progression System (unlock-on-target-reached):**
- Track which difficulty levels each student has unlocked
- "Ready for next level?" modal when target BPM reached
- Unlock animation + celebration
- Show progression bar (Beginner ✓ → Intermediate ✓ → Advanced)

**Session Notes Enhancements:**
- Voice notes (Capacitor Media plugin)
- Teacher responses to student notes
- Notes sentiment tracking (mood emoji)

**Other:**
- Difficulty-specific targets (Beginner: 80 BPM, Intermediate: 120 BPM, Advanced: 160 BPM)
- Leaderboards by difficulty level
- Achievement badges for unlocking all levels

---

## Success Criteria

### Session Notes
- ✓ Student can add notes after practice
- ✓ Notes persist and display in StudentDetail
- ✓ Teacher can see notes when viewing student
- ✓ Notes display quickly (< 100ms query)

### Difficulty Levels
- ✓ Teacher assigns difficulty when assigning exercise
- ✓ Difficulty badge shows on all exercise cards
- ✓ Library can filter by difficulty
- ✓ Student sees "Ready to unlock?" prompt at target BPM
- ✓ Unlocking moves exercise to next difficulty
- ✓ Progression state persists correctly

---

## Testing Strategy

### Session Notes
1. **Manual:** Create session → add notes → reload → verify display
2. **Edge cases:** Empty notes, very long notes, special characters
3. **Teacher view:** Verify notes visible in StudentDetail

### Difficulty Levels
1. **Assignment:** Assign exercise, set difficulty, verify in DB
2. **Progression:** Reach target → unlock → verify new difficulty active
3. **Library:** Filter by difficulty, verify correct exercises shown
4. **Edge cases:** Unlock multiple times, teacher override

