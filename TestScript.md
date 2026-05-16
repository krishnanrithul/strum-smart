# FretGym Manual Test Script

Use two browsers (or browser + incognito) to test teacher and student simultaneously.
Mark each as ✅ Pass / ❌ Fail / ⚠️ Partial.

---

## 1. Onboarding

### Teacher Signup
- [ ] Go to signup, select "Teacher" role
- [ ] Fill in name and email, submit
- [ ] **Expected:** Lands on Teacher Dashboard, invite code is visible in the panel

### Student Signup (new user)
- [ ] Go to signup, select "Student" role
- [ ] Fill in full name and email, submit
- [ ] **Expected:** Lands on onboarding screen, full name is displayed correctly (not null)
- [ ] Enter the teacher's invite code during onboarding
- [ ] **Expected:** Code accepted, student is linked to teacher, proceeds to home

### Student Signup — bad invite code
- [ ] During onboarding, enter a random invalid code
- [ ] **Expected:** Inline error shown, does not proceed or crash

### Student Signup — skip invite code
- [ ] During onboarding, skip the invite code step
- [ ] **Expected:** Student lands on home with no teacher linked

---

## 2. Existing Student — Teacher Code Banner

- [ ] Log in as a student with no teacher linked
- [ ] **Expected:** Banner visible on Home page prompting to enter invite code
- [ ] Enter a valid teacher invite code in the banner
- [ ] **Expected:** Student is linked to teacher, banner disappears, no page reload required
- [ ] Enter an invalid code in the banner
- [ ] **Expected:** Inline error on the banner, banner stays visible

---

## 3. Student — Home Page

- [ ] Log in as student
- [ ] **Expected:** FretGym logo in top left, bottom nav visible with Home/Library/Progress
- [ ] **Expected:** Today's Peak BPM shows correctly (or 0 if no sessions)
- [ ] **Expected:** Practice Time shows correctly formatted (e.g. "0m" or "1h 23m")
- [ ] **Expected:** Total Sessions count is correct
- [ ] **Expected:** My Exercises list shows all assigned + self-added exercises
- [ ] **Expected:** "FROM TEACHER" badge appears on teacher-assigned exercises
- [ ] Tap an exercise card
- [ ] **Expected:** Navigates to Practice screen for that exercise
- [ ] Tap Library tab
- [ ] **Expected:** Navigates to Library without losing bottom nav
- [ ] Tap Progress tab
- [ ] **Expected:** Navigates to Progress without losing bottom nav
- [ ] Tap Home tab from Progress
- [ ] **Expected:** Returns to Home, active tab highlights correctly on each page

---

## 4. Student — Library Page

- [ ] **Expected:** FretGym logo in top left
- [ ] **Expected:** My Library stats show correct exercise count, routines added, song projects
- [ ] **Expected:** All 8 routines visible in the grid
- [ ] Tap a routine
- [ ] **Expected:** Opens routine detail with exercises listed
- [ ] Add an exercise from the routine to My Exercises
- [ ] **Expected:** Exercise appears on Home page My Exercises list

---

## 5. Student — Practice Screen

- [ ] Tap Start Practice from Home, or tap an exercise card
- [ ] **Expected:** Exercise name, category, and target BPM shown
- [ ] If exercise has a teacher note: **Expected:** Note card visible below exercise title with 📌 icon
- [ ] If exercise has no teacher note: **Expected:** No note card rendered
- [ ] Use the metronome — tap Start
- [ ] **Expected:** Metronome clicks at set BPM
- [ ] Adjust BPM up and down
- [ ] **Expected:** BPM updates, metronome adjusts tempo
- [ ] End the session / save
- [ ] **Expected:** Session saved, BPM reached recorded
- [ ] Return to Home
- [ ] **Expected:** Practice Time and Total Sessions updated

---

## 6. Student — Progress Page

- [ ] **Expected:** FretGym logo in top left, no back arrow
- [ ] **Expected:** This Week shows correct hours and session count
- [ ] **Expected:** Streak shows correct day count
- [ ] **Expected:** BPM Progress dropdown lists all exercises
- [ ] Select an exercise with sessions
- [ ] **Expected:** Chart shows BPM progression over time
- [ ] Select an exercise with no sessions
- [ ] **Expected:** "No sessions yet" empty state shown

---

## 7. Teacher — Dashboard

- [ ] Log in as teacher
- [ ] **Expected:** Invite code visible in the panel
- [ ] **Expected:** All linked students shown in student list
- [ ] **Expected:** Each student card shows last active date (or "No sessions yet")
- [ ] Tap a student
- [ ] **Expected:** Navigates to StudentDetail for that student

---

## 8. Teacher — StudentDetail Page

- [ ] **Expected:** Header shows "MY STUDENTS" breadcrumb above student name
- [ ] **Expected:** Stats panel shows Sessions, Practice time (correctly formatted), Peak BPM
- [ ] **Expected:** "ASSIGNED BY YOU" section shows teacher-assigned exercises
- [ ] **Expected:** "STUDENT'S OWN" section shows student's self-added exercises
- [ ] **Expected:** If no self-added exercises, "STUDENT'S OWN" section is hidden
- [ ] **Expected:** Each exercise card shows "Never practiced" or "Last practiced: X days ago"
- [ ] **Expected:** Progress bar shows 0% for unpracticed exercises (not 100%)
- [ ] **Expected:** Progress bar fills proportionally when start ≠ target BPM and student has practiced

### Update Target BPM
- [ ] Tap Update Target on an assigned exercise
- [ ] **Expected:** Input appears pre-filled with current target
- [ ] Change the value and save
- [ ] **Expected:** Target BPM updates in the card immediately

### Edit Notes
- [ ] Tap Edit Notes on an assigned exercise
- [ ] **Expected:** Text area appears pre-filled with current note (or empty)
- [ ] Type a note and save
- [ ] **Expected:** Note saved, card reflects update
- [ ] Log in as that student and navigate to the exercise in Practice
- [ ] **Expected:** Teacher note visible on Practice screen

### Remove Exercise
- [ ] Tap Remove on an assigned exercise
- [ ] **Expected:** Two-tap confirm appears ("Confirm Remove?" + cancel option)
- [ ] Tap cancel
- [ ] **Expected:** Nothing changes
- [ ] Tap Remove again, then confirm
- [ ] **Expected:** Exercise disappears from the list immediately
- [ ] Log in as that student
- [ ] **Expected:** Removed exercise no longer appears on student's Home page

---

## 9. Cross-Role Flow — Full End to End

- [ ] As teacher: assign an exercise to a student with a target BPM and a note
- [ ] As student: **Expected:** Exercise appears on Home with "FROM TEACHER" badge
- [ ] As student: open the exercise in Practice
- [ ] **Expected:** Teacher note visible
- [ ] As student: complete a practice session, reach a BPM
- [ ] As teacher: open StudentDetail for that student
- [ ] **Expected:** Sessions count incremented, Practice time updated, Last practiced updated on the exercise card

---

## 10. Edge Cases

- [ ] Student with zero sessions — Home shows "0m" practice time, "0" sessions, no peak BPM (or 0)
- [ ] Student with zero exercises — My Exercises shows empty state, not a blank list
- [ ] Teacher with zero students — Dashboard shows empty state, not a crash
- [ ] Exercise where start BPM = target BPM — progress bar shows 0%, not 100%
- [ ] Very long exercise name — doesn't break card layout
- [ ] Invalid invite code — error shown, no crash
- [ ] Log out and log back in — lands on correct page for role (student → Home, teacher → Dashboard)

---

## Summary

| Section | Pass | Fail | Partial |
|---|---|---|---|
| Onboarding | | | |
| Existing student banner | | | |
| Student Home | | | |
| Student Library | | | |
| Practice Screen | | | |
| Progress Page | | | |
| Teacher Dashboard | | | |
| Teacher StudentDetail | | | |
| Cross-role flow | | | |
| Edge cases | | | |