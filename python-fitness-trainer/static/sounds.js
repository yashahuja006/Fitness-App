// Sound Effects for AI Fitness Trainer
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.enabled = true;
        this.initAudioContext();
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }
    
    // Generate beep sound programmatically
    createBeep(frequency = 800, duration = 200, type = 'sine') {
        if (!this.audioContext || !this.enabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
    }
    
    // Success sound (perfect rep)
    playSuccess() {
        this.createBeep(880, 150, 'sine');
        setTimeout(() => this.createBeep(1100, 150, 'sine'), 100);
    }
    
    // Warning sound (poor form)
    playWarning() {
        this.createBeep(400, 300, 'sawtooth');
    }
    
    // Exercise switch sound
    playSwitch() {
        this.createBeep(600, 100, 'square');
        setTimeout(() => this.createBeep(800, 100, 'square'), 80);
    }
    
    // Milestone sound (every 5 reps)
    playMilestone() {
        const notes = [523, 659, 784, 1047]; // C, E, G, C
        notes.forEach((note, index) => {
            setTimeout(() => this.createBeep(note, 200, 'sine'), index * 150);
        });
    }
    
    // Reset sound
    playReset() {
        this.createBeep(300, 400, 'triangle');
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// Export for use in main script
window.SoundManager = SoundManager;