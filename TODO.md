# FretGym TODO

## 📱 iOS
- [x] Capacitor setup — wrapped, running on phone
- [x] Safe area insets — header, bottom nav
- [x] App icon — FretGym logo
- [x] Metronome audio in silent mode — test if current fix works, may need native plugin
- [ ] Push notifications — streak reminders via Capacitor

## 🐛 Bugs
- [ ] Verify existing-user teacher code banner works end-to-end

## 🧪 Testing
- [ ] Cross-role flow — teacher assigns → student sees it → student practices → teacher sees updated stats
- [ ] Run full manual test script end-to-end

## 🚀 TestFlight
- [ ] Sign up for paid Apple Developer account ($99/yr)
- [ ] Create app listing in App Store Connect
- [ ] Archive and upload build from Xcode
- [ ] Share link with first guitar teacher

## 🔨 Features (saved for later)
- [ ] Plateau detection
- [ ] Add Student via email invite
- [ ] Guitar Fitness Score
- [ ] Maintenance status
- [ ] Android support

## ✅ Done today
- Mobile layout fixes — safe areas, font sizes, header clipping
- App icon designed and added to Xcode
- Personal Best fixed — uses history only
- Last practiced dates on exercise cards
- Library routine list — compact single-entry with two-level bottom sheet
- BPM → BPM progress row hidden when no progress
- Metronome auto-starts with timer
- Routine exercise selection — checklist before adding


Library screen → Spotify

Cinematic routine cards ✓ already done
Shared element transition when tapping a routine → expands into practice screen (big effort, high impact)
Scroll-linked header — "ROUTINES" label compresses as you scroll down
Exercise cards get slightly richer — subtle left border accent in the category color


Home screen → Fitness+

TODAY and STREAK numbers go massive — text-4xl font-black
Personal Best BPM already large, but make the supporting text smaller and more muted to increase contrast
"Hey, akanksha." greeting goes bolder — text-2xl font-bold
Completion flash when marking exercise complete — brief green overlay pulse on the card, 300ms


Practice screen → Fitness+

BPM counter during practice should be the biggest element on screen, heavy weight
Timer numbers bold and large
Session end screen gets a proper completion moment — not complex, just the stats animating up with a green accent


Student detail screen (teacher view) → Spotify

Student progress cards get gradient treatment similar to routine cards
Scrolling compresses the student header


Priority order to implement:

Home screen typography (Fitness+) — highest impact, lowest effort
Completion flash on exercise cards — high emotional impact
Library exercise card left border accents — quick win
Shared element transition — high effort, do last