# Product Requirements Document (PRD)

**Project Name:** "FretGym" (Working Title)  
**Version:** 1.2  
**Status:** Draft  
**Date:** November 22, 2025

---

## 1. Executive Summary

**The Concept:** An iOS/Android mobile application that functions as a "Personal Trainer" for guitarists, unlike traditional learning apps that provide lessons/content (lessons/tabs). This app provides **structure, tracking, and management** for content the user already owns. The Problem: Intermediate guitarists who own books, tabs, or YouTube lessons often lack structured practice routines and quantifiable metrics for improvement. **The Solution:** A "Quantified Self" app for musicians that tracks BPM (Speed), Repetitions (Volume), and Repertoire Health (Retention), utilizing "Progressive Overload" principles borrowed from weightlifting.

---

## 2. User Personas

### Primary Persona: "The Plateaued Pro"
- **Profile:** 18+ years playing, owns high-end gear, plays in a local band.
- **Pain Point:** 5 years haven't improved technically in 5 years. Finds practice boring.
- **Goal:** Wants to finally master that specific fast solo in "Sultans of Swing."
- **Behavior:** Owns tabs but never followed a structured, setting graphs go up.

### Secondary Persona: "The Diligent Student"
- **Profile:** Takes bi-weekly lessons with a human teacher.
- **Pain Point:** Loses track of homework sheets, forgets to practice specific drills.
- **Goal:** Wants a digital log practice to show their teacher.

---

## 3. Core Value Propositions (The "Gym" Metaphors)

| Music Concept | App Feature Name | Function |
|---------------|------------------|----------|
| Practice Routine | "The Workout" | A timed, ordered list of tasks (Warmup -> Technical -> Repertoire). |
| Speed/Tempo | "Max Load" (BPM) | The primary metric of progress. |
| Song Retention | "Active Recall" | Spaced repetition algorithms to prompt reviews of old songs. |
| Sheet Music | "The Snapshot" | User takes a photo of their own physical book/screen to create a visual reference. |
| Reference Links | "Quick Access" | Links to external tabs (Songsterr) and video tutorials (YouTube) for each song. |

---

## 4. Feature Breakdown

### 4.1 Exercise Database
- **Pre-loaded "Calisthenics"** (Chromatic Scale, Spider Walk).
- **User-generated exercises.**
- **Song Projects:**
  - User manually creates a new song project by inputting Title, Artist, and optional reference URLs.
  - **Section Creation:** User manually breaks the song into specific clickable "Sections" (e.g., Intro, Solo, Bridge) to allow for focused practice on just that part.
  - **Reference Links:**
    - **Tab URL:** Link to Songsterr, Ultimate Guitar, or other tab sites
    - **Video URL:** Link to YouTube tutorial or performance video
    - Display as clickable icons in Library and Practice pages
  - **Status Tags:** New, In Progress, Maintenance, Mastered.

### 4.2 Custom Song Projects
- **Add Custom Song:** User manually creates a new song project by inputting Title, Artist, external reference URLs (optional).
- **Section Creation:** User manually breaks the song into specific clickable "Sections" (e.g., Intro, Solo, Bridge) to allow for focused practice on just that part.
- **Reference Integration:**
  - Tab link opens in Safari/external browser
  - Video link can be embedded in Practice page or opened externally
  - Works seamlessly in iOS PWA and native apps

### 4.3 Practice Session (The "Workout")
- **Timer:** Tracks how long you've been practicing in the current session.
- **Metronome:**
  - Custom Web Audio API implementation for accurate timing
  - Adjustable tempo control (40-240 BPM)
  - Editable BPM display with hover/focus states
  - Visual and audio feedback
- **Snapshot Area:**
  - Display embedded YouTube video if video URL provided
  - "Open Tab" button if tab URL provided
  - Fallback to image upload for personal tabs/sheets
- **Complete Session:** A workflow to log your results (Max Clean BPM achieved).

### 4.4 Progress Tracking (The "Gains")
- **Session Logging:** When you finish, you record your "Max Clean BPM."
- **Immediate Feedback:** The app calculates the difference from your last session (e.g., "+5 BPM").
- **Dashboard Updates:** The Home screen shows real data for "Today's Practice Time" and "Max BPM."
- **Progressive Overload:** Smart suggestions when you hit target BPM for 3 consecutive sessions (5% increase).

### 4.5 Smart Routine Generator
- **Daily Workout:** Generates a balanced 30-minute routine (Warmup, Skill, Repertoire) based on your library.
- **Customization:** "Swap" button to reroll specific slots in the routine.
- **Intelligent Selection:** Prioritizes "In Progress" exercises for technical and repertoire slots.

### 4.6 Cloud Sync & Authentication
- **Supabase Integration:** All data synced to cloud database
- **User Authentication:** Email/password login with protected routes
- **Cross-device Access:** Practice data available on any device
- **Row Level Security:** Users can only access their own data

---

## 5. Technical Stack

### Frontend
- **Framework:** React + Vite + TypeScript
- **UI Library:** Shadcn UI + Tailwind CSS
- **Routing:** React Router DOM
- **Charts:** Recharts
- **Audio:** Web Audio API (MetronomeEngine)

### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage (for future snapshot uploads)

### Deployment
- **Platform:** Vercel (or similar)
- **Mobile:** PWA (installable on iOS/Android)
- **Future:** Native app wrapper (Capacitor) for app store distribution

---

## 6. Database Schema

### Tables
1. **projects**
   - Song containers with title, artist, status
   - Optional tab_url and video_url fields
   
2. **exercises**
   - Standalone drills or song sections
   - Links to projects via project_id
   - Tracks BPM history and status
   
3. **sessions**
   - Practice session logs
   - Duration and exercises practiced

---

## 7. Future Enhancements

### Phase 3 (Planned)
- **Snapshot Upload:** Direct image upload for tabs/sheets
- **Heatmap Calendar:** Visual practice streak tracking
- **Social Features:** Share progress with friends/teachers
- **Advanced Analytics:** Detailed progress charts and insights
- **Offline Mode:** Practice without internet connection
- **Native App:** iOS/Android app store distribution

### Phase 4 (Exploration)
- **AI Tab Recognition:** OCR for uploaded tab images
- **Practice Reminders:** Smart notifications based on routine
- **Integration:** Connect with Songsterr API (if available)
- **Video Playback Controls:** Slow down YouTube videos for practice

---

## 8. Success Metrics

- **User Engagement:** Daily active users, session duration
- **Progress Tracking:** Average BPM improvement over time
- **Feature Adoption:** % of users creating song projects with reference links
- **Retention:** 7-day and 30-day user retention rates
- **Cloud Sync:** % of users with active Supabase accounts

---

## 9. Design Principles

- **Mobile-First:** Optimized for phone screens
- **Dark Theme:** Industrial, premium aesthetic
- **Minimal Friction:** Quick access to practice sessions
- **Data-Driven:** Always show progress metrics
- **Offline-Capable:** Core features work without internet (future)
