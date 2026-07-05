# Implementation Plan: Session Notes & Exercise Difficulty Levels

**Scope:** Student-facing features to improve practice reflection and structured progression  
**Effort Estimate:** 17-20 hours total (3-4 days of focused work)  
**Breakdown:** Session Notes (3-4 hrs) + Difficulty Levels (14-16 hrs)  
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

## Feature 2: Exercise Difficulty Levels

### Overview
Structure practice progression: Beginner → Intermediate → Advanced. Teachers assign difficulty, students unlock progression.

### User Flow

**Student:**
1. Library → **Filter by difficulty** (All / Beginner / Intermediate / Advanced)
2. See difficulty badge on each exercise card
3. Practice → reach BPM target → **"Ready for next level?" prompt**
4. Click unlock → exercise moves to next difficulty
5. Teacher can see progression in StudentDetail

**Teacher:**
1. Assign exercise → **pick difficulty level**
2. StudentDetail → see student's current difficulty on each exercise
3. Manually unlock next level if needed (optional)
4. Dashboard could show "X students ready to level up"

### Database Design

**Option A: Simple (Global difficulty per exercise)**
```sql
ALTER TABLE exercises
ADD COLUMN difficulty TEXT DEFAULT 'Intermediate' 
  CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced'));
```
Pros: Simple, clean  
Cons: Can't customize per student

**Option B: Per-student progression (Recommended)**
```sql
CREATE TABLE exercise_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  current_difficulty TEXT NOT NULL DEFAULT 'Beginner'
    CHECK (current_difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  unlocked_difficulties TEXT[] DEFAULT ARRAY['Beginner'],
  -- Tracks which levels they've completed
  unlocked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(student_id, exercise_id)
);
```
Pros: Per-student tracking, can show progression  
Cons: More complex queries

**Recommendation:** Use Option B (per-student), allows for future "achievement" features.

### Component Changes

#### 1. Update AssignExerciseModal
Add difficulty selector:
```tsx
<select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
  <option value="Beginner">Beginner</option>
  <option value="Intermediate">Intermediate</option>
  <option value="Advanced">Advanced</option>
</select>

// When saving exercise:
await supabase.from("exercise_progression").insert({
  student_id: studentId,
  exercise_id: exercise.id,
  current_difficulty: selectedDifficulty,
  unlocked_difficulties: [selectedDifficulty],
});
```

#### 2. Difficulty Badge Component
Use on exercise cards throughout app:

```tsx
const DifficultyBadge = ({ difficulty }: { difficulty: string }) => {
  const colors = {
    Beginner: "bg-green-500/20 text-green-400",
    Intermediate: "bg-yellow-500/20 text-yellow-400",
    Advanced: "bg-red-500/20 text-red-400",
  };
  
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded ${colors[difficulty]}`}>
      {difficulty}
    </span>
  );
};
```

#### 3. Library Filter
In Library.tsx, add difficulty tabs:

```tsx
const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

const filtered = exercises.filter(e =>
  !selectedDifficulty || e.current_difficulty === selectedDifficulty
);

<div className="flex gap-2 mb-4">
  {["All", "Beginner", "Intermediate", "Advanced"].map((diff) => (
    <button
      key={diff}
      onClick={() => setSelectedDifficulty(diff === "All" ? null : diff)}
      className={`px-4 py-2 rounded ${
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

#### 4. Progression Unlock Modal
After reaching target BPM, show:

```tsx
interface DifficultyUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseTitle: string;
  currentDifficulty: "Beginner" | "Intermediate";
  nextDifficulty: "Intermediate" | "Advanced";
  onUnlock: () => void;
}

// Modal shows:
// "You've mastered [Exercise] at Beginner level!"
// "Ready for Intermediate? It starts at 140 BPM..."
// [Unlock] [Later]
```

When unlocking:
```typescript
const handleUnlock = async () => {
  await supabase
    .from("exercise_progression")
    .update({
      current_difficulty: nextDifficulty,
      unlocked_difficulties: [...unlockedDifficulties, nextDifficulty],
    })
    .eq("student_id", userId)
    .eq("exercise_id", exerciseId);
};
```

#### 5. StudentDetail Exercise Display
Show difficulty on each exercise card:

```tsx
<div className="flex items-center gap-2">
  <h3>{exercise.title}</h3>
  <DifficultyBadge difficulty={exercise.current_difficulty} />
  {exercise.unlocked_difficulties?.includes("Advanced") && (
    <span className="text-xs text-primary">✓ All levels unlocked</span>
  )}
</div>
```

### Display in Progress Tab
Optional: Show progression bar

```tsx
<div className="mt-2">
  <p className="text-xs text-muted-foreground mb-1">Progression</p>
  <div className="flex items-center gap-2">
    {["Beginner", "Intermediate", "Advanced"].map((level) => (
      <div
        key={level}
        className={`flex-1 h-2 rounded ${
          unlockedDifficulties.includes(level)
            ? "bg-primary"
            : "bg-secondary"
        }`}
      />
    ))}
  </div>
</div>
```

### Implementation Checklist

- [ ] Create migration: `exercise_progression` table
- [ ] Update `AssignExerciseModal` with difficulty selector
- [ ] Create `DifficultyBadge` component
- [ ] Create `DifficultyUnlockModal` component
- [ ] Add difficulty filter to `Library.tsx`
- [ ] Update `StudentDetail.tsx` to show progression
- [ ] Update `Practice.tsx` to detect target reach & show unlock prompt
- [ ] Add progression bar to StudentDetail
- [ ] Update queries in `StorageService` to fetch progression data
- [ ] Teacher Dashboard: optional "Ready to level up" indicator
- [ ] Testing across student + teacher flows

### Effort: 14-16 hours
- Database schema: 1 hour
- DifficultyBadge component: 1 hour
- AssignExerciseModal update: 2-3 hours
- Library filter UI: 2-3 hours
- DifficultyUnlockModal: 3-4 hours
- Practice.tsx integration: 2-3 hours
- StudentDetail updates: 2-3 hours
- Query/storage updates: 2-3 hours
- Testing: 2-3 hours

---

## Combined Implementation Timeline

### Session Notes: 1 Day (3-4 hours)
Quick win—do this first to build momentum:
- Morning: Database migration + SessionNotesModal
- Afternoon: Practice.tsx integration + StudentDetail display + testing
- Done before EOD

### Exercise Difficulty Levels: 2-3 Days (14-16 hours)
Follows naturally after Session Notes:
- Day 1: Database + components (DifficultyBadge, DifficultyUnlockModal)
- Day 2: AssignExerciseModal + Library filter + Practice integration
- Day 3: StudentDetail updates, queries, testing

### Optional Polish (Week 2)
- Progression bars, teacher dashboard "ready to level up" indicator
- Celebration animations on unlock
- Mobile responsiveness refinement

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
- Voice notes for sessions (Capacitor Media plugin)
- Difficulty-specific targets (Beginner: 80 BPM, Intermediate: 120 BPM, Advanced: 160 BPM)
- "Mastery" system (1000 points per difficulty = unlock next)
- Progress animations on unlock (confetti, glow effect)
- Teacher approval for unlocking (optional mode)
- Leaderboards by difficulty level

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

