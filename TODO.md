# FretGym — Next Session TODO

## Priority 1: Onboarding Flow
New users land on an empty app with no guidance. Fix this first — everything else depends on it.

- [ ] Add columns to Supabase profiles table:
      - level: text, nullable (beginner / intermediate / advanced)
      - genre: text, nullable (fingerpicking / blues / metal / rock / classical / jazz / rhythm / speed)
      - onboarded: boolean, default false
- [ ] Build src/pages/Onboarding.tsx — 2 screens, sliding panel transition (same as BuildYourOwnModal)
      Screen 1: "Let's build your practice plan" — 3 level cards, selecting auto-advances
      Screen 2: "What do you want to work on?" — 8 genre cards in 2x4 grid, selecting completes onboarding
      On completion: save level + genre to profiles, set onboarded = true, 
      auto-add matching routine to My Exercises, navigate to Home
- [ ] Add /onboarding route in App.tsx inside ProtectedRoute, excluded from redirect loop
- [ ] Update ProtectedRoute: after role check, if onboarded is false/null → redirect to /onboarding
      Teacher role skips onboarding check entirely

## Priority 2: Fix "Start Practice"
Currently takes user to Library. Wrong — Library is for setup, not for practicing.

- [ ] Replace "Start Practice" button on Home with a "How long do you have?" picker
      Options: 15 min / 30 min / 45 min — one tap, no other decisions
- [ ] After picking time → generate Today's Session from My Exercises
- [ ] If My Exercises is empty → redirect to onboarding

## Priority 3: Today's Session Screen
Auto-generated practice plan. No decisions required from user beyond time selection.

- [ ] Build session generator logic:
      - Pull from My Exercises
      - Order: warmup-tagged first, technique middle, repertoire last
      - Fit as many exercises as possible within selected time
      - Allocate time per exercise based on total session length
- [ ] Build Today's Session screen:
      - Shows exercise queue for the session
      - Timer per exercise, auto-advances to next
      - Post-session summary: time spent, exercises completed, streak updated
- [ ] Handle empty state: if no exercises in library → redirect to onboarding

## Priority 4: BPM Plateau Detection (AI feature)
Runs silently in background. Feels like a real coach without being intrusive.

- [ ] Build detection logic (no AI needed):
      After every session, check each practiced exercise:
      - If BPM unchanged for 14+ days AND practiced 3+ times → flag as plateau
      - Store plateau state in Supabase so it doesn't re-trigger every session
      - Clear plateau flag automatically when BPM improves
- [ ] Build Claude API call (fires only on plateau detection):
      Send: exercise name, category, current BPM, target BPM, days stuck
      Receive: one specific actionable tip for that exercise
      Cache tip in Supabase — reuse until plateau is broken, no repeated calls
- [ ] Surface on Home page:
      Subtle glass card below "Start Practice", above "In Progress"
      Shows exercise name + Claude's tip
      Disappears automatically once BPM improves
      Same glass card style as rest of app

## Decisions Already Made
- Song practice: no section logging, no BPM tracking — tutorial link + timer + notes only
- Exercise practice: keep metronome, BPM logging, reference material — AI Coach removed
- No practice calendar on Progress page — removed, not useful for new users
- No section breakdown for songs — too much admin, kills flow state
- Teacher dashboard: build after solo experience is solid
- AI features should be invisible — no chat interface, no "ask AI" button

## Design Rules (don't break these)
- Glass cards: `rounded-2xl bg-card` + `style={{ border: "1px solid rgba(255,255,255,0.05)" }}`
- Green spotlight: `radial-gradient(circle at top right, rgba(34,197,94,0.12) 0%, transparent 60%), hsl(var(--card))`
- Section headers: `text-xs font-semibold tracking-widest uppercase text-muted-foreground`
- Green (`text-primary`) reserved for CTA buttons only — not data, not labels, not numbers
- Numbers/data: always `text-foreground` (white)
- Sliding transitions: 200% wide flex row, translateX (same as BuildYourOwnModal)
- Modal open animation: double requestAnimationFrame, cubic-bezier(0.32, 0.72, 0, 1)