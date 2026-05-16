# FretGym TODO

## 🔨 Features (in order)
- [ ] Studio/performance visual direction — try on Home page first, then roll out if approved
- [ ] BPM plateau detection — opt-in toggle in Settings, tip shown after session save
- [ ] AI Insights section on Progress page — Ollama locally, Claude API in production

## 🐛 Bugs
- [ ] Verify existing-user teacher code banner works end-to-end (test linking on home screen)
- [ ] BPM display restyle — revert to flat/minimal (remove inset panels, just bold monospace typography)
- [ ] Stats on StudentDetail showing wrong data — 0 sessions/0m practice but Peak BPM populated, sessions not pulling correctly
- [ ] Hero card dark mode gradient getting overridden by light mode styles — fix dark: prefix

## 🧪 Testing
- [ ] Run full manual test script (fretgym-test-script.md) end-to-end
- [ ] Cross-role flow — teacher assigns → student sees it → student practices → teacher sees updated stats

## 📱 iOS
- [ ] Capacitor setup — wrap the app, get it on your phone
- [ ] Metronome audio in silent mode — native audio plugin before App Store submission

## 🎨 Design Direction (decided)
- Studio/performance: dark, moody, minimal — like a pedalboard in a dark room
- Less UI chrome, more content
- Monospace font for BPM numbers
- Green accent used sparingly, like an LED
- Try on Home first before committing