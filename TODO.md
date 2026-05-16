# FretGym TODO

## ✅ Done This Session
- [x] Persistent bottom nav — lives in layout wrapper, active tab highlights correctly
- [x] Progress page header — replaced "PROGRESS" title with FretGym logo, removed back arrow
- [x] Teacher exercise actions — Edit Notes and Remove added to assigned exercise cards
- [x] Remove button styled consistently with Edit Notes and Update Target (red border/text)
- [x] "From Teacher" badge moved up to category label row, action buttons all right-aligned
- [x] Exercises grouped in StudentDetail — "ASSIGNED BY YOU" and "STUDENT'S OWN" sections
- [x] Progress bar per exercise in StudentDetail
- [x] Last practiced date per exercise in StudentDetail
- [x] MY STUDENTS breadcrumb above student name in StudentDetail header
- [x] Progress bar fixed — shows 0% when start equals target BPM (division by zero was causing full bar on unpracticed exercises)

## 🔨 Features (in order)
- [x] Add hover styling to My Exercises cards on Home page (match Library card style)
- [x] Add FretGym logo next to Library header
- [x] Verify teacher notes show in Practice screen
- [ ] Verify practice time displays correctly in StudentDetail
- [ ] Verify last active pulls from sessions table
- [ ] BPM plateau detection — flag when stuck, generate tip via Claude API

## 🐛 Bugs
- [ ] Verify existing-user teacher code banner works end-to-end (test linking on home screen)
- [ ] BPM display restyle — revert to flat/minimal (remove inset panels, just bold monospace typography)
- [ ] Stats on StudentDetail showing wrong data — 0 sessions/0m practice but Peak BPM populated, sessions not pulling correctly

## 📱 iOS
- [ ] Capacitor setup — wrap the app, get it on your phone
- [ ] Metronome audio in silent mode — native audio plugin before App Store submission