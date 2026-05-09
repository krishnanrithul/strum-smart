# FretGym — Next Session TODO

## Priority 1: Onboarding Flow
New users land on an empty app with no guidance. Fix this first — everything else depends on it.

- [ ] Add `level` and `genre` columns to `profiles` table in Supabase
      level: text, values: beginner / intermediate / advanced
      genre: text, values: fingerpicking / blues / metal / rock / classical / jazz / rhythm / speed
      Both nullable (existing users won't have them)
- [ ] Build onboarding screen — runs once on first launch if profile has no level/genre set
      Screen 1: "What's your level?" — 3 cards (Beginner / Intermediate / Advanced)
      Screen 2: "What do you want to work on?" — 8 genre cards (same as Library routines)
      Screen 3: Done — auto-load selected routine into My Exercises, navigate to Home
- [ ] Save level + genre to profiles table on completion
- [ ] Gate onboarding: if profiles.level is null → show onboarding, else skip to Home

## Priority 2: Fix "Start Practice"
Currently takes user to Library. Wrong — Library is for setup, not practicing.

- [ ] "Start Practice" on Home should open a "How long do you have?" picker
      Options: 15 min / 30 min / 45 min
- [ ] After picking time → generate Today's Session from My Exercises
- [ ] If My Exercises is empty → prompt to complete onboarding first

## Priority 3: Today's Session Screen
Auto-generated practice plan. No decisions required from user beyond time selection.

- [ ] Build session generator logic:
      - Pull from My Exercises
      - Order: warmup-tagged first, repertoire last, technique in middle
      - Fit as many exercises as possible within selected time
      - Allocate time per exercise based on total session length
- [ ] Build Today's Session screen:
      - Shows exercise queue for the session
      - Timer per exercise, auto-advances to next
      - Post-session summary: time spent, exercises completed, streak updated
- [ ] Handle empty state: if no exercises in library → redirect to onboarding

## Decisions Already Made
- Song practice: no section logging, no BPM tracking — just tutorial link + timer + notes
- Exercise practice: keep metronome, BPM logging, reference material — remove AI Coach
- No practice calendar on Progress page — removed, not useful for new users
- Teacher dashboard: build after solo experience is solid

## Design Rules (don't break these)
- Glass cards: `rounded-2xl bg-card` + `style={{ border: "1px solid rgba(255,255,255,0.05)" }}`
- Green spotlight: `radial-gradient(circle at top right, rgba(34,197,94,0.12) 0%, transparent 60%), hsl(var(--card))`
- Section headers: `text-xs font-semibold tracking-widest uppercase text-muted-foreground`
- Green (`text-primary`) reserved for CTA buttons only — not data, not labels, not numbers
- Numbers/data: always `text-foreground` (white)