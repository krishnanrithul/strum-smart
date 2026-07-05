# FretGym — Additional Features Roadmap

Potential enhancements identified during development. Prioritized by impact and effort.

## For Students

### Metronome during practice
Essential for guitar practice. Tap tempo or set BPM, play a click track during sessions.
- Impact: High (core guitar practice need)
- Effort: Medium
- Tech: Web Audio API or tone.js library

### Practice reminders/notifications
Push notifications to remind about streaks or teacher-assigned exercises.
- Impact: High (drives consistent practice)
- Effort: Low (use Capacitor push notifications)
- Tech: Capacitor PushNotifications plugin + backend notifications service

### Session notes
Let students add quick notes after practice ("struggled with timing", "felt good today"), see teacher feedback.
- Impact: Medium (reflection + teacher insight)
- Effort: Low (textarea + notes table)
- Tech: Simple notes field in sessions table

### Exercise difficulty levels
Progression from beginner→intermediate→advanced to guide practice flow.
- Impact: Medium (structure for learning)
- Effort: Medium (new column, UI filters, progression logic)
- Tech: difficulty enum on exercises, unlock progression tracking

---

## For Teachers

### Class grouping
Organize students into classes/groups, assign to whole groups at once.
- Impact: High (scales to real classrooms)
- Effort: High (new schema, complex UI)
- Tech: classes table, many-to-many relationships

### Practice reports
PDF/email summaries of student progress to send to parents.
- Impact: Medium (communication)
- Effort: Medium (PDF generation, email service)
- Tech: pdfkit or similar + email API

### Custom exercises ✓ DONE
Teachers create exercises tailored to their curriculum instead of just using templates.
- Status: Implemented 2026-07-05

### Session feedback ✓ DONE
Leave voice/text comments on specific sessions.
- Status: Implemented 2026-07-05

---

## For Both

### Leaderboards
Friendly competition (class-wide "most consistent this week", "most improved BPM", etc).
- Impact: Medium (engagement/motivation)
- Effort: Medium (ranking queries, UI)
- Tech: Denormalized rank columns or computed queries

### Better charts
AreaChart already integrated; could show:
- Multiple students' progress comparison
- BPM improvement curves with trend lines
- Consistency heatmaps (practice frequency by day/time)
- Impact: Medium (insights)
- Effort: Medium (Recharts customization)

### Offline mode
Record sessions offline, sync when reconnected.
- Impact: Medium (reliability)
- Effort: High (service workers, conflict resolution)
- Tech: ServiceWorkers, IndexedDB, Capacitor offline detection

### Goal milestones
Celebrate when hitting a BPM target ("You hit your 180 BPM goal on Alternate Picking! 🎉").
- Impact: Low-Medium (motivation)
- Effort: Low (conditional banner + confetti animation)
- Tech: Confetti library, milestone detection logic

---

## Priority Tiers

**Tier 1 (Highest impact for effort):**
1. Metronome during practice
2. Practice reminders/notifications
3. Session notes

**Tier 2 (Polish):**
4. Exercise difficulty levels
5. Better charts (trend lines, comparisons)

**Tier 3 (Nice to have):**
6. Class grouping
7. Leaderboards
8. Goal milestones

**Tier 4 (Complex):**
9. Practice reports (PDF/email)
10. Offline mode
