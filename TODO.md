# FretGym TODO

## 🔨 Features (in order)
- [ ] BPM plateau detection — opt-in toggle in Settings, tip shown after session save
- [ ] AI Insights section on Progress page — Ollama locally, Claude API in production (spec written)
- [ ] Personal Best BPM data bug — green placeholder showing instead of number, check column name in sessions table (bpm_reached? bpm? peak_bpm?)

## 🐛 Bugs
- [ ] Library page styling regressions — routine card hover missing, New Song button grey not green, MY EXERCISES section different from Home
- [ ] Verify existing-user teacher code banner works end-to-end (test linking on home screen)
- [ ] BPM display restyle — revert to flat/minimal (remove inset panels, just bold monospace typography)
- [ ] Stats on StudentDetail showing wrong data — 0 sessions/0m practice but Peak BPM populated

## 🧪 Testing
- [ ] Run full manual test script (fretgym-test-script.md) end-to-end
- [ ] Cross-role flow — teacher assigns → student sees it → student practices → teacher sees updated stats

## 📱 iOS
- [ ] Capacitor setup — wrap the app, get it on your phone
- [ ] Metronome audio in silent mode — native audio plugin before App Store submission

## 🎨 Design (saved for later)
- Studio/performance specs saved for Home and Library — apply when ready
- Glassmorphism worth trying on hero card only when Personal Best data bug is fixed
- Practice screen is best candidate for studio/performance direction

## 📋 Saved Specs (ready to use)
- Home studio/performance spec — documented this session
- Library studio/performance spec — documented this session