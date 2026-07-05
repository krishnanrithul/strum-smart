# Implementation Plan: Goal Milestones

**Scope:** Celebrate when students hit target BPM goals with immediate feedback and optional history tracking  
**Effort Estimate:** 4-5 hours (celebration only) or 6-7 hours (with history)  
**Priority:** Low-Medium (motivation/engagement feature)  
**Complexity:** Low

---

## Feature Overview

When a student finishes a practice session and their current BPM meets or exceeds the target BPM for that exercise, trigger a celebration with:
- Congratulatory modal with exercise + target BPM
- Confetti animation
- Optional next goal suggestion
- Optional historical record of all milestones reached

---

## Version 1: Celebration Banner Only (4-5 hours)

### User Flow

**Student:**
1. Practice Alternate Picking session
2. End session with current BPM: 185 (target was 180)
3. **Milestone modal appears:** "🎉 You hit your 180 BPM goal on Alternate Picking!"
4. Confetti animation plays
5. Options: "Next goal?" (suggests next level or next exercise) or "Got it"
6. Modal closes → continue to session notes

### Database Changes

**Minimal approach — no new table:**
```sql
-- Just track that the exercise was completed at target
-- Nothing needs to be added; logic runs on current_bpm >= target_bpm
```

No database changes needed. Logic is: if `current_bpm >= target_bpm`, show celebration.

### Component Structure

#### 1. GoalMilestoneModal (NEW)
```typescript
interface GoalMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseTitle: string;
  targetBpm: number;
  achievedBpm: number;
  onNextGoal?: () => void;
}
```

**UI:**
- Confetti animation (canvas-confetti)
- Large title: "🎉 You Did It!"
- Message: `"You hit your ${targetBpm} BPM goal on ${exerciseTitle}!"`
- Stats: `"Achieved: ${achievedBpm} BPM"`
- Buttons: "Next Goal" | "Got it"

**Animation:**
```tsx
useEffect(() => {
  if (isOpen) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }
}, [isOpen]);
```

#### 2. Update Practice.tsx

After session ends, before showing SessionNotesModal:

```typescript
const handleSessionComplete = async (sessionData) => {
  // Save session to DB
  await saveSession(sessionData);
  
  // Check for milestone
  const exercise = exercises.find(e => e.id === currentExerciseId);
  if (exercise && exercise.current_bpm >= exercise.target_bpm && !alreadyCelebrated) {
    setMilestoneData({
      exerciseTitle: exercise.title,
      targetBpm: exercise.target_bpm,
      achievedBpm: exercise.current_bpm,
    });
    setMilestoneOpen(true);
    setAlreadyCelebrated(true); // Don't show twice per session
  } else {
    setNotesModalOpen(true);
  }
};

const handleMilestoneClose = () => {
  setMilestoneOpen(false);
  setNotesModalOpen(true); // Then show notes modal
};
```

**State in Practice.tsx:**
```typescript
const [milestoneOpen, setMilestoneOpen] = useState(false);
const [alreadyCelebrated, setAlreadyCelebrated] = useState(false);
const [milestoneData, setMilestoneData] = useState<MilestoneData | null>(null);
```

### Implementation Checklist

- [ ] Install confetti library: `npm install canvas-confetti`
- [ ] Create `GoalMilestoneModal` component
- [ ] Add celebration logic to `Practice.tsx`
- [ ] Add state for milestone modal
- [ ] Test: complete session with target BPM met → see modal
- [ ] Test: complete session without reaching target → no modal
- [ ] Test: modal confetti animation plays
- [ ] Polish modal styling (matches cinematic design)

### Effort: 4-5 hours
- GoalMilestoneModal component: 1.5-2 hours
- Practice.tsx integration: 1-1.5 hours
- Confetti setup & testing: 1 hour
- Styling & polish: 30 min

### Success Criteria (Version 1)
- ✓ Modal shows when target BPM reached
- ✓ Modal doesn't show when target BPM not reached
- ✓ Confetti animation plays
- ✓ Modal closes properly
- ✓ Session notes modal shows after celebration

---

## Version 2: With Milestone History (6-7 hours)

### User Flow (Extended)

**Student:**
1. Hit goal → see celebration modal (same as V1)
2. Tap "View Milestones" or go to **StudentDetail → Progress → Milestones** new tab
3. See timeline of all milestones reached
4. Each card shows: exercise, achieved date, BPM (current vs target)
5. Can see progression: "Alternate Picking: reached 140 → 160 → 180 BPM"

**Teacher:**
1. StudentDetail → Progress tab
2. See "Milestones Reached: 7" as a stat
3. Optional: expandable list of recent milestones

### Database Changes

```sql
-- New table to track milestone history
CREATE TABLE exercise_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  target_bpm INT NOT NULL,
  achieved_bpm INT NOT NULL,
  reached_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_milestones_student ON exercise_milestones(student_id);
CREATE INDEX idx_milestones_exercise ON exercise_milestones(student_id, exercise_id);
```

### Component Structure

#### 1. GoalMilestoneModal (Enhanced)
Same as V1, but add:
```tsx
<button onClick={onViewMilestones} className="text-xs text-primary underline">
  View all milestones
</button>
```

When clicked:
```typescript
const handleViewMilestones = () => {
  setMilestoneOpen(false);
  navigate("/", { state: { scrollToMilestones: true } }); // Or in StudentDetail
};
```

#### 2. MilestoneHistoryTab (NEW)
New tab in StudentDetail Progress:

```tsx
interface MilestoneHistoryTabProps {
  studentId: string;
}

const MilestoneHistoryTab = ({ studentId }: MilestoneHistoryTabProps) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("exercise_milestones")
        .select("*, exercise:exercises(title)")
        .eq("student_id", studentId)
        .order("reached_at", { ascending: false });
      setMilestones(data || []);
    };
    load();
  }, [studentId]);

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
        Milestones Reached ({milestones.length})
      </p>
      
      {milestones.length === 0 ? (
        <div className="bg-card rounded-2xl p-4 text-center text-sm text-muted-foreground">
          No milestones yet — reach a target BPM to celebrate!
        </div>
      ) : (
        <div className="space-y-2">
          {milestones.map((m) => (
            <div
              key={m.id}
              className="bg-card rounded-2xl p-4 border border-green-500/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{m.exercise.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(m.reached_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">
                    {m.achieved_bpm} BPM
                  </p>
                  <p className="text-xs text-muted-foreground">
                    target: {m.target_bpm}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

#### 3. Update Practice.tsx
When milestone reached, save to history:

```typescript
const handleSessionComplete = async (sessionData) => {
  await saveSession(sessionData);
  
  const exercise = exercises.find(e => e.id === currentExerciseId);
  if (exercise && exercise.current_bpm >= exercise.target_bpm) {
    // Save milestone to history
    await supabase.from("exercise_milestones").insert({
      student_id: session.user.id,
      exercise_id: exercise.id,
      target_bpm: exercise.target_bpm,
      achieved_bpm: exercise.current_bpm,
    });
    
    // Show celebration
    setMilestoneOpen(true);
  }
};
```

#### 4. Milestone Stats in StudentDetail
Add to hero or stats section:

```tsx
<div className="flex items-center gap-6">
  <div>
    <p className="text-xs text-muted-foreground">Milestones</p>
    <p className="text-2xl font-black text-primary">{totalMilestones}</p>
  </div>
  <div className="w-px h-8 bg-border" />
  <div>
    <p className="text-xs text-muted-foreground">This Month</p>
    <p className="text-2xl font-black text-primary">{milestonesThisMonth}</p>
  </div>
</div>
```

### Implementation Checklist

**Database:**
- [ ] Create migration: `exercise_milestones` table + indexes
- [ ] Run `npx supabase db push`

**Components:**
- [ ] Create `MilestoneHistoryTab` component
- [ ] Update `GoalMilestoneModal` with "View all" link
- [ ] Add milestone stats to StudentDetail hero

**Practice.tsx:**
- [ ] Save milestone to history when goal reached
- [ ] Test: milestone appears in database

**StudentDetail.tsx:**
- [ ] Add new "Milestones" tab alongside "Overview" & "Progress"
- [ ] Load and display milestone history
- [ ] Add milestone stats to hero section

**Queries:**
- [ ] Add `getMilestoneHistory(studentId)` to StorageService
- [ ] Add `getTotalMilestones(studentId)` helper
- [ ] Add `getMilestonesThisMonth(studentId)` helper

### Effort: 6-7 hours
- Database migration: 15 min
- GoalMilestoneModal (enhanced): 30 min
- MilestoneHistoryTab component: 1.5-2 hours
- Practice.tsx integration: 1 hour
- StudentDetail integration: 1-1.5 hours
- Queries/helpers: 1 hour
- Testing: 1 hour

### Success Criteria (Version 2)
- ✓ All V1 criteria met
- ✓ Milestones saved to database when reached
- ✓ Milestone history tab displays all milestones
- ✓ Milestones sorted by date (newest first)
- ✓ Milestone stats show in StudentDetail
- ✓ Filter by month works (optional)
- ✓ Teacher can view student's milestone history

---

## Implementation Path

### Option A: Start Simple (Day 1)
1. Build V1 (celebration banner) — 4-5 hours
2. Ship it, get user feedback
3. Add history later if users love it

### Option B: Build Both (Days 1-2)
1. Build V1 (celebration banner)
2. Add database + history tracking (V2)
3. Ship complete feature

### Recommendation
**Option A** — celebrate first, see if students enjoy it. History tracking adds value but isn't necessary for the core "feel good" moment.

---

## Integration Timeline

### If doing V1 only (today):
```
11am-12pm: Create GoalMilestoneModal
12pm-1pm: Integrate into Practice.tsx
1pm-2pm: Add confetti, test
2pm-2:30pm: Polish styling
2:30pm: DONE ✓
```

### If doing V1 + V2 (2 days):
```
Day 1:
- Create GoalMilestoneModal (with history link)
- Integrate into Practice.tsx
- Set up confetti

Day 2:
- Create migration + push to Supabase
- Build MilestoneHistoryTab
- Integrate into StudentDetail
- Add stats to hero
- Test end-to-end
```

---

## Libraries Needed

```bash
# Install confetti
npm install canvas-confetti
npm install --save-dev @types/canvas-confetti
```

---

## Edge Cases

### Celebration
- Student reaches exactly target BPM (185 = 185) → celebrate ✓
- Student exceeds target (200 > 185) → celebrate ✓
- Student falls short (180 < 185) → no celebrate ✓
- Student already celebrated this exercise once this session → only show once ✓

### History (V2)
- Multiple milestones on same exercise (Beginner 100, Intermediate 160) → show both ✓
- Same target BPM reached twice → create two milestone records? Yes, tracks persistence
- Filters by date → use `created_at` from milestone record
- Queries: index on `student_id` to avoid N+1

---

## Future Enhancements

### Phase 2
- **Milestone badges/achievements** — unlock badges for 5 milestones, 10, etc.
- **Milestone streaks** — "3 milestones in a week!"
- **Social** — compare milestones reached with classmates (leaderboard)
- **Notifications** — push notification when milestone reached
- **Goals system** — students can set custom BPM goals beyond targets
- **Celebration themes** — different confetti for different achievement levels
- **Audio** — celebration sound effect (optional, user can toggle)

---

## Testing Checklist

### V1 (Celebration)
- [ ] Complete practice session with target BPM met
- [ ] Modal appears with correct exercise name + BPM
- [ ] Confetti animation triggers
- [ ] Modal closes on "Got it"
- [ ] Session notes modal appears after
- [ ] Complete practice without meeting target → no modal

### V2 (History)
- [ ] Milestone saved to database
- [ ] Milestone appears in StudentDetail Milestones tab
- [ ] Stats count is correct
- [ ] Multiple milestones for same exercise show separately
- [ ] Date display is correct
- [ ] Filter by month works (if implemented)

---

## Success Metrics

**Engagement:**
- Do students celebrate reaching goals? (anecdotal feedback)
- Do students return to view milestone history?

**Data:**
- Milestone reached count over time
- Average milestones per student per month
- Exercises with most milestones reached

