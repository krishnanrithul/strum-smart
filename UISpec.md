Claude Code Spec for Home Page UI
Spec — Home page studio/standby visual directionsrc/pages/Home.tsxPage background
Set to bg-zinc-950.Hero card
Remove all card borders and border radius entirely — rounded-none. Background bg-zinc-950 so it bleeds into the page. Remove any gradient. Personal Best BPM number — text-8xl font-mono font-bold text-green-400. "PERSONAL BEST" label — text-[10px] tracking-[0.4em] text-zinc-600 uppercase. BPM unit label — text-sm font-mono text-zinc-600. TODAY and STREAK values — text-2xl font-mono text-zinc-100. Their labels — text-[10px] tracking-[0.4em] text-zinc-600 uppercase. Divider between TODAY and STREAK — bg-zinc-800. Divider between hero number and stat row — border-zinc-800.Start Practice button
rounded-sm bg-green-700 hover:bg-green-600. Remove the FretGym icon from inside the button. Full width, just text and chevron.FROM YOUR TEACHER and ADDED BY YOU section headers
text-[10px] tracking-[0.5em] text-zinc-700 uppercase.Exercise cards
Remove all card backgrounds and borders. Separated by border-b border-zinc-900 only. Padding py-5 px-1. Exercise name — text-base font-medium text-zinc-100. Category — text-[10px] tracking-widest text-zinc-600 uppercase. BPM number — text-xl font-mono text-green-400. BPM unit — text-xs text-zinc-600. Progression line — text-xs font-mono text-zinc-600. Progress bar track — bg-zinc-900, fill — bg-green-800. FROM TEACHER — remove pill, render as text-[10px] tracking-widest text-green-700 uppercase inline next to category.Spacing
pt-8 top of page. pb-4 between hero and Start Practice. mt-8 before first exercise section header.Remove entirely
Clear All and See All buttons. All box shadows. All rounded pill shapes.Do not change anything else in the file.

Claude Code Spec for Library UI
Spec — Library page studio visual direction
src/pages/Library.tsx
Page background
bg-zinc-950.
MY LIBRARY hero section
Remove gradient, border, border radius. Background bg-zinc-950, bleeds into page. "MY LIBRARY" label — text-[10px] tracking-[0.4em] text-zinc-600 uppercase. Exercise count — text-6xl font-mono font-bold text-zinc-100. "exercises" — text-sm text-zinc-600. Stat labels (ROUTINES ADDED, SONG PROJECTS, TOTAL AVAILABLE ROUTINES) — text-[10px] tracking-[0.4em] text-zinc-600 uppercase. Stat values — text-2xl font-mono text-zinc-100. Dividers — bg-zinc-800.
ROUTINES section header
text-[10px] tracking-[0.5em] text-zinc-700 uppercase.
Routine cards
bg-zinc-900 border border-zinc-800 rounded-sm. Name — text-base font-medium text-zinc-100. Description — text-xs text-zinc-500. Exercise count — text-[10px] tracking-widest text-zinc-600. Hover — bg-zinc-800.
Build your own button
rounded-sm bg-green-700 hover:bg-green-600, full width.
SONG PROJECTS section header
text-[10px] tracking-[0.5em] text-zinc-700 uppercase.
Song project cards
bg-zinc-900 border border-zinc-800 rounded-sm. Song name — text-base font-medium text-zinc-100. Artist — text-xs text-zinc-500. In Progress badge — remove pill, plain text-[10px] tracking-widest text-green-700 uppercase.
New Song button
bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-sm border border-zinc-700.
MY EXERCISES section
Borderless list, separated by border-b border-zinc-900 lines only, no card chrome.
Do not change anything else in the file.