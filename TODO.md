# FretGym — Next Session TODO

## Priority 1: Student Detail Page
Teacher clicks a student card → navigates to /teacher/student/:id

- [ ] Build src/pages/StudentDetail.tsx
      - Glass stats card at top: Total Sessions, Practice Time, Peak BPM
        (same design as Home page stats card with green radial spotlight)
      - MY EXERCISES section below: same card design as Library's My Exercises
        (exercise name, category badge, BPM on the right)
      - Read-only — teacher can see but not edit student's exercises
      - "+ Assign Exercise" button at the bottom (can be a placeholder for now)
      - Header: back arrow + student's name in uppercase tracking-widest

- [ ] Wire up navigation in TeacherDashboard.tsx
      - Clicking a student card navigates to /teacher/student/:id
      - Add the route in App.tsx: /teacher/student/:id → StudentDetail

- [ ] Fetch student data in StudentDetail.tsx
      - Pull exercises from exercises table where user_id = student id
      - Pull sessions from sessions table for stats
      - RLS: teacher needs read access to their students' data
        Run in Supabase SQL editor:
        CREATE POLICY "Teachers can view student exercises"
        ON exercises FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = exercises.user_id
            AND profiles.teacher_id = auth.uid()
          )
        );

## Priority 2: Assign Exercise Flow
Teacher assigns an exercise to a student from their detail page

- [ ] Build AssignExerciseModal — same sliding panel style as BuildYourOwnModal
      Fields: Title, Category (Technical / Repertoire / Warmup), Target BPM
- [ ] On submit: insert into exercises table with user_id = student's id
- [ ] Assigned exercises should show in student's My Exercises automatically

## Priority 3: BPM Plateau Detection (AI feature)
Runs silently after every session. Feels like a real coach.

- [ ] Detection logic (no AI needed):
      After every session, check each practiced exercise:
      - BPM unchanged for 14+ days AND practiced 3+ times → flag as plateau
      - Store plateau flag in Supabase (add plateau_detected_at column to exercises)
      - Clear flag automatically when BPM improves

- [ ] Claude API call (fires only on plateau detection):
      Send: exercise name, category, current BPM, target BPM, days stuck
      Receive: one specific actionable tip
      Cache tip in Supabase — reuse until plateau broken, no repeated calls

- [ ] Surface on Home page:
      Subtle glass card below "Start Practice"
      Shows exercise name + Claude's tip
      Disappears when BPM improves

## Design Rules (don't break these)
- Glass cards: rounded-2xl bg-card + border 1px solid rgba(255,255,255,0.05)
- Green spotlight: radial-gradient(circle at top right, rgba(34,197,94,0.12) 0%, transparent 60%), hsl(var(--card))
- Section headers: text-xs font-semibold tracking-widest uppercase text-muted-foreground
- Green (text-primary) reserved for CTA buttons only
- Numbers/data: always text-foreground (white)
- Badges: no colored backgrounds — text-xs uppercase text-muted-foreground only
- Sliding modals: 200% wide flex row, translateX, cubic-bezier(0.32, 0.72, 0, 1)