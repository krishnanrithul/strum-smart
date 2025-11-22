export class MetronomeEngine {
    private audioContext: AudioContext | null = null;
    private isPlaying: boolean = false;
    private bpm: number = 120;
    private nextNoteTime: number = 0.0;
    private timerID: number | null = null;
    private lookahead: number = 25.0; // How frequently to call scheduling function (in milliseconds)
    private scheduleAheadTime: number = 0.1; // How far ahead to schedule audio (in seconds)

    constructor() {
        // Initialize AudioContext only on user interaction to comply with browser policies
    }

    private initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    private nextNote() {
        const secondsPerBeat = 60.0 / this.bpm;
        this.nextNoteTime += secondsPerBeat;
    }

    private scheduleNote(time: number) {
        if (!this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const envelope = this.audioContext.createGain();

        osc.frequency.value = 1000; // Click frequency
        envelope.gain.value = 1;
        envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
        envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

        osc.connect(envelope);
        envelope.connect(this.audioContext.destination);

        osc.start(time);
        osc.stop(time + 0.03);
    }

    private scheduler() {
        if (!this.audioContext) return;

        // while there are notes that will need to play before the next interval,
        // schedule them and advance the pointer.
        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.nextNoteTime);
            this.nextNote();
        }

        if (this.isPlaying) {
            this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
        }
    }

    public start(bpm: number) {
        if (this.isPlaying) return;

        this.initAudioContext();
        if (!this.audioContext) return;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.isPlaying = true;
        this.bpm = bpm;
        this.nextNoteTime = this.audioContext.currentTime + 0.05;
        this.scheduler();
    }

    public stop() {
        this.isPlaying = false;
        if (this.timerID !== null) {
            window.clearTimeout(this.timerID);
            this.timerID = null;
        }
    }

    public setBpm(bpm: number) {
        this.bpm = bpm;
    }

    public isActive() {
        return this.isPlaying;
    }
}
