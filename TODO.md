# FretGym TODO

## 🔨 Features (in order)
- [ ] Add Student via email invite — Teacher Dashboard "+ Add Student" button, invite-student Edge Function, pre-link on signup (specs written)
- [ ] BPM plateau detection — opt-in toggle in Settings, tip shown after session save
- [ ] AI Insights section on Progress page — Ollama locally, Claude API in production (spec written)

## 🐛 Bugs
- [ ] Personal Best BPM not displaying — green placeholder showing, check column name in sessions table (bpm_reached? bpm? peak_bpm?)
- [ ] Library page styling regressions — routine card hover missing, New Song button grey not green, MY EXERCISES section different from Home
- [ ] Verify existing-user teacher code banner works end-to-end
- [ ] Stats on StudentDetail showing wrong data — 0 sessions/0m practice but Peak BPM populated

## 🧪 Testing
- [ ] Update manual test script to reflect real auth flow (no role selection at signup originally, now fixed)
- [ ] Run full manual test script end-to-end
- [ ] Cross-role flow — teacher assigns → student sees it → student practices → teacher sees updated stats

## 📱 iOS
- [ ] Capacitor setup — wrap the app, get it on your phone
- [ ] Metronome audio in silent mode — native audio plugin before App Store submission

## 🎨 Design (saved for later)
- Studio/performance specs saved for Home and Library — apply when ready
- Glassmorphism worth trying on hero card only when Personal Best data bug is fixed
- Practice screen is best candidate for studio/performance direction