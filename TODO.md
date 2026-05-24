# FretGym TODO

## 📱 iOS (next focus)
- [ ] Capacitor setup — wrap the app, get it on your phone
- [ ] Metronome audio in silent mode — native audio plugin before App Store submission
- [ ] Push notifications — streak reminders via Capacitor

## 🐛 Bugs
- [ ] Verify existing-user teacher code banner works end-to-end

## 🧪 Testing
- [ ] Cross-role flow — teacher assigns → student sees it → student practices → teacher sees updated stats
- [ ] Run full manual test script end-to-end

## 🎨 Polish
- [ ] Bottom nav active state — verify looks correct on device

## 🔨 Features (saved for later)
- [ ] Plateau detection — query sessions for stagnation, show tip after session save
- [ ] Add Student via email invite — send real email once Supabase CLI + Resend is set up
- [ ] Guitar Fitness Score — single number summarising streak + BPM progress + practice consistency
- [ ] Maintenance status — UI entry point for exercises the student wants to keep practicing without actively improving

## ✅ Done this session
- Exercise completion flow — Mark as Complete on practice screen and exercise card
- Auto-trigger completion when target BPM hit during session
- Save Session rename (was Complete Session)
- Completed exercises section in Library — slide-up sheet matching routines animation
- Practice Again button on completed exercises
- Completed exercises hidden from active MY EXERCISES list on Home
- Student Snapshot + Next Exercise on StudentDetail (collapsible)
- AI cards renamed — Student Snapshot, Next Exercise
- StudentDetail polish — Last Active, Peak BPM hides when no sessions
- Exercise sort: Warmup → Technical → Repertoire
- Bottom nav styling fixed
- Hero card dark mode locked
- Status constraint updated — Mastered replaced with Completed
- StorageService used for exercise status updates (not Supabase directly)