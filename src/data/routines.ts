export type Routine = {
  id: string;
  name: string;
  description: string;
  accent: string;
  labelColor: string;
  exercises: { title: string; category: string; bpm: number }[];
};

export const ROUTINES: Routine[] = [
  {
    id: "fingerpicking",
    name: "Fingerpicking",
    description: "Fingerstyle independence and control",
    accent: "border-emerald-500/40 bg-emerald-500/10",
    labelColor: "text-emerald-400",
    exercises: [
      { title: "Thumb Independence", category: "Warmup", bpm: 60 },
      { title: "PIMA Pattern", category: "Technical", bpm: 50 },
      { title: "Dust in the Wind Intro", category: "Repertoire", bpm: 70 },
    ],
  },
  {
    id: "blues",
    name: "Blues",
    description: "Blues scale, bends and feel",
    accent: "border-blue-500/40 bg-blue-500/10",
    labelColor: "text-blue-400",
    exercises: [
      { title: "Blues Scale Warmup", category: "Warmup", bpm: 60 },
      { title: "String Bending", category: "Technical", bpm: 70 },
      { title: "Double Stops", category: "Technical", bpm: 65 },
      { title: "12-Bar Blues Rhythm", category: "Repertoire", bpm: 80 },
    ],
  },
  {
    id: "metal",
    name: "Metal",
    description: "Downstrokes, palm muting and power",
    accent: "border-red-500/40 bg-red-500/10",
    labelColor: "text-red-400",
    exercises: [
      { title: "Chromatic Warmup", category: "Warmup", bpm: 80 },
      { title: "Downstroke Drill", category: "Technical", bpm: 100 },
      { title: "Palm Muting", category: "Technical", bpm: 90 },
      { title: "Master of Puppets Riff", category: "Repertoire", bpm: 100 },
    ],
  },
  {
    id: "rock",
    name: "Rock",
    description: "Power chords, riffs and rhythm",
    accent: "border-orange-500/40 bg-orange-500/10",
    labelColor: "text-orange-400",
    exercises: [
      { title: "Power Chord Warmup", category: "Warmup", bpm: 70 },
      { title: "Pentatonic Scale", category: "Technical", bpm: 80 },
      { title: "Smoke on the Water Riff", category: "Repertoire", bpm: 75 },
    ],
  },
  {
    id: "classical",
    name: "Classical",
    description: "Precision, posture and technique",
    accent: "border-purple-500/40 bg-purple-500/10",
    labelColor: "text-purple-400",
    exercises: [
      { title: "Right Hand Arpeggio", category: "Warmup", bpm: 50 },
      { title: "Left Hand Scales", category: "Technical", bpm: 60 },
      { title: "Recuerdos de la Alhambra", category: "Repertoire", bpm: 60 },
    ],
  },
  {
    id: "jazz",
    name: "Jazz",
    description: "Chord voicings and improvisation",
    accent: "border-yellow-500/40 bg-yellow-500/10",
    labelColor: "text-yellow-400",
    exercises: [
      { title: "Jazz Chord Warmup", category: "Warmup", bpm: 60 },
      { title: "Dorian Mode Scale", category: "Technical", bpm: 70 },
      { title: "Autumn Leaves Chord Melody", category: "Repertoire", bpm: 65 },
    ],
  },
  {
    id: "rhythm",
    name: "Rhythm & Strumming",
    description: "Groove, timing and patterns",
    accent: "border-pink-500/40 bg-pink-500/10",
    labelColor: "text-pink-400",
    exercises: [
      { title: "Metronome Strumming", category: "Warmup", bpm: 70 },
      { title: "Syncopated Strumming", category: "Technical", bpm: 80 },
      { title: "Wonderwall Rhythm", category: "Repertoire", bpm: 87 },
    ],
  },
  {
    id: "speed",
    name: "Speed & Technique",
    description: "Build speed, accuracy and dexterity",
    accent: "border-cyan-500/40 bg-cyan-500/10",
    labelColor: "text-cyan-400",
    exercises: [
      { title: "Spider Walk", category: "Warmup", bpm: 60 },
      { title: "Alternate Picking", category: "Technical", bpm: 100 },
      { title: "Sweep Picking", category: "Technical", bpm: 80 },
      { title: "String Skipping", category: "Technical", bpm: 90 },
    ],
  },
];