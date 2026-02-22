// Enhanced AI Fitness Trainer JavaScript
class EnhancedFitnessTrainer {
    constructor() {
        this.currentExercise = 'squat';
        this.voiceEnabled = true;
        this.soundEnabled = true;
        this.lastRepCount = 0;
        this.sessionStartTime = Date.now();
        this.sessionStats = {
            totalReps: 0,
            perfectReps: 0,
            exerciseTime: {},
            formScores: []
        };
        
        // Initialize components
        this.soundManager = new SoundManager();
        this.initializeElements();
        this.bindEvents();
        this.startStatusUpdates();
        this.initializeSession();
    }
    
    initializeElements() {
        // Control elements
        this.exerciseButtons = document.querySelectorAll('.exercise-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.voiceBtn = document.getElementById('voice-btn');
        this.soundBtn = document.getElementById('sound-btn');
        
        // Status elements
        this.currentExerciseEl = document.getElementById('current-exercise');
        this.repCountEl = document.getElementById('rep-count');
        this.formScoreEl = document.getElementById('form-score');
        this.currentStageEl = document.getElementById('current-stage');
        this.feedbackMessagesEl = document.getElementById('feedback-messages');
        this.instructionsEl = document.getElementById('exercise-instructions');
        this.voiceStatusEl = document.getElementById('voice-status');
        
        // Session stats elements
        this.sessionTimeEl = document.getElementById('session-time');
        this.totalRepsEl = document.getElementById('total-reps');
        this.avgFormScoreEl = document.getElementById('avg-form-score');
    }
    
    bindEvents() {
        // Exercise selection
        this.exerciseButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exercise = e.currentTarget.dataset.exercise;
                this.selectExercise(exercise);
            });
        });
        
        // Control buttons
        this.resetBtn?.addEventListener('click', () => this.resetStats());
        this.voiceBtn?.addEventListener('click', () => this.toggleVoice());
        this.soundBtn?.addEventListener('click', () => this.toggleSound());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) return;
            
            switch(e.key) {
                case '1': this.selectExercise('squat'); break;
                case '2': this.selectExercise('pushup'); break;
                case '3': this.selectExercise('bicep_curl'); break;
                case 'r': this.resetStats(); break;
                case 'v': this.toggleVoice(); break;
                case 's': this.toggleSound(); break;
            }
        });
        
        // Visibility change handling
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseSession();
            } else {
                this.resumeSession();
            }
        });
    }
    
    initializeSession() {
        this.selectExercise('squat');
        this.updateSessionStats();
        this.showWelcomeMessage();
    }
    
    showWelcomeMessage() {
        this.showMessage('Welcome to Perfect Form AI Trainer! Select an exercise to begin.', 'success', 4000);
    }
    
    async selectExercise(exerciseName) {
        // Visual feedback
        this.exerciseButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-exercise="${exerciseName}"]`)?.classList.add('active');
        
        // Sound feedback
        if (this.soundEnabled) {
            this.soundManager.playSwitch();
        }
        
        // Update session stats
        if (this.currentExercise !== exerciseName) {
            this.sessionStats.exerciseTime[this.currentExercise] = 
                (this.sessionStats.exerciseTime[this.currentExercise] || 0) + 
                (Date.now() - this.sessionStartTime);
        }
        
        try {
            const response = await fetch(`/set_exercise/${exerciseName}`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.currentExercise = exerciseName;
                this.updateInstructions(exerciseName);
                this.showMessage(`Switched to ${data.exercise_name}! Perfect form required!`, 'perfect', 3000);
                
                // Analytics
                this.trackEvent('exercise_selected', { exercise: exerciseName });
            } else {
                this.showMessage('Failed to switch exercise. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error selecting exercise:', error);
            this.showMessage('Connection error. Please check your connection.', 'error');
        }
    }
    
    startStatusUpdates() {
        this.statusInterval = setInterval(() => {
            this.updateStats();
        }, 200); // Faster updates for smoother experience
        
        this.sessionInterval = setInterval(() => {
            this.updateSessionStats();
        }, 1000);
    }
    
    async updateStats() {
        try {
            const response = await fetch('/stats');
            const data = await response.json();
            
            this.updateDisplay(data);
            this.handleRepChange(data.reps);
            this.updateFormScore(data.form_score);
            this.handleVoiceStatus(data.voice_message);
            
        } catch (error) {
            console.error('Error fetching stats:', error);
            this.showConnectionError();
        }
    }
    
    updateDisplay(data) {
        // Update basic stats
        this.currentExerciseEl.textContent = data.exercise_name || 'Unknown';
        this.repCountEl.textContent = data.reps || 0;
        this.currentStageEl.textContent = data.stage || 'START';
        
        // Update feedback with enhanced styling
        this.updateFeedback(data.feedback, data.form_score);
    }
    
    handleRepChange(newReps) {
        if (newReps > this.lastRepCount) {
            // New rep completed
            this.sessionStats.totalReps++;
            this.sessionStats.perfectReps++;
            
            // Sound and visual feedback
            if (this.soundEnabled) {
                if (newReps % 5 === 0) {
                    this.soundManager.playMilestone();
                } else {
                    this.soundManager.playSuccess();
                }
            }
            
            // Celebration animation
            this.celebrateRep(newReps);
            
            // Analytics
            this.trackEvent('rep_completed', { 
                exercise: this.currentExercise, 
                rep_count: newReps 
            });
        }
        
        this.lastRepCount = newReps;
    }
    
    updateFormScore(formScore) {
        if (!formScore) return;
        
        const formScoreEl = this.formScoreEl;
        formScoreEl.textContent = `${Math.round(formScore)}%`;
        
        // Remove existing classes
        formScoreEl.classList.remove('high', 'medium', 'low');
        
        // Add appropriate class based on score
        if (formScore >= 85) {
            formScoreEl.classList.add('high');
        } else if (formScore >= 70) {
            formScoreEl.classList.add('medium');
            if (this.soundEnabled && Math.random() < 0.1) { // Occasional warning
                this.soundManager.playWarning();
            }
        } else {
            formScoreEl.classList.add('low');
            if (this.soundEnabled && Math.random() < 0.2) {
                this.soundManager.playWarning();
            }
        }
        
        // Track form scores for analytics
        this.sessionStats.formScores.push(formScore);
    }
    
    updateFeedback(feedback, formScore) {
        if (!feedback || feedback === 'Ready') {
            this.feedbackMessagesEl.innerHTML = 
                '<p class="no-feedback">Maintain perfect form! Every rep counts!</p>';
            return;
        }
        
        let messageClass = '';
        if (feedback.includes('Perfect') || formScore >= 95) {
            messageClass = 'perfect';
        } else if (feedback.includes('Good') || formScore >= 85) {
            messageClass = 'success';
        } else {
            messageClass = 'warning';
        }
        
        this.feedbackMessagesEl.innerHTML = 
            `<div class="feedback-message ${messageClass}">${feedback}</div>`;
    }
    
    handleVoiceStatus(voiceMessage) {
        if (voiceMessage && this.voiceEnabled) {
            this.voiceStatusEl.style.display = 'block';
            setTimeout(() => {
                this.voiceStatusEl.style.display = 'none';
            }, 2500);
        }
    }
    
    celebrateRep(repCount) {
        // Add celebration animation to rep counter
        this.repCountEl.style.transform = 'scale(1.2)';
        this.repCountEl.style.color = '#4facfe';
        
        setTimeout(() => {
            this.repCountEl.style.transform = 'scale(1)';
            this.repCountEl.style.color = '';
        }, 300);
        
        // Milestone celebrations
        if (repCount % 10 === 0) {
            this.showMessage(`🎉 ${repCount} perfect reps! You're crushing it!`, 'perfect', 4000);
        } else if (repCount % 5 === 0) {
            this.showMessage(`💪 ${repCount} reps completed! Keep going!`, 'success', 3000);
        }
    }
    
    updateInstructions(exerciseName) {
        const instructions = {
            'squat': [
                'Stand with feet shoulder-width apart',
                'Keep your back straight and chest up',
                'Lower down until thighs are parallel to floor (70-90° knee angle)',
                'Push through heels to return to start',
                'Only perfect depth reps will count!'
            ],
            'pushup': [
                'Start in plank position with arms extended',
                'Keep your body in a straight line',
                'Lower chest towards ground (60-90° elbow angle)',
                'Push back up to starting position',
                'Perfect form required for rep counting!'
            ],
            'bicep_curl': [
                'Stand with arms at your sides',
                'Keep elbows close to your body',
                'Curl weight up to shoulder (30-50° elbow angle)',
                'Lower slowly with control',
                'Only full range of motion counts!'
            ]
        };
        
        const exerciseInstructions = instructions[exerciseName] || [
            'Follow the on-screen feedback',
            'Maintain perfect form throughout',
            'Only quality reps will be counted'
        ];
        
        const instructionsHtml = exerciseInstructions.map(instruction => 
            `<li>${instruction}</li>`
        ).join('');
        
        this.instructionsEl.innerHTML = `<ol>${instructionsHtml}</ol>`;
    }
    
    async resetStats() {
        try {
            const response = await fetch('/reset', { method: 'POST' });
            const data = await response.json();
            
            // Reset local stats
            this.lastRepCount = 0;
            this.sessionStats.totalReps = 0;
            this.sessionStats.perfectReps = 0;
            this.sessionStats.formScores = [];
            
            // Sound feedback
            if (this.soundEnabled) {
                this.soundManager.playReset();
            }
            
            this.showMessage('Perfect form counter reset! Ready for quality reps!', 'success');
            this.trackEvent('stats_reset', { exercise: this.currentExercise });
            
        } catch (error) {
            console.error('Error resetting stats:', error);
            this.showMessage('Error resetting stats. Please try again.', 'error');
        }
    }
    
    toggleVoice() {
        this.voiceEnabled = !this.voiceEnabled;
        const btn = this.voiceBtn;
        
        btn.innerHTML = this.voiceEnabled ? 
            '🎤 <span>Voice ON</span>' : 
            '🔇 <span>Voice OFF</span>';
        btn.className = this.voiceEnabled ? 'btn btn-voice' : 'btn btn-voice-off';
        
        this.showMessage(`Voice coaching ${this.voiceEnabled ? 'enabled' : 'disabled'}`, 'success');
        this.trackEvent('voice_toggled', { enabled: this.voiceEnabled });
    }
    
    toggleSound() {
        this.soundEnabled = this.soundManager.toggle();
        const btn = this.soundBtn;
        
        if (btn) {
            btn.innerHTML = this.soundEnabled ? 
                '🔊 <span>Sound ON</span>' : 
                '🔇 <span>Sound OFF</span>';
            btn.className = this.soundEnabled ? 'btn btn-sound' : 'btn btn-sound-off';
        }
        
        this.showMessage(`Sound effects ${this.soundEnabled ? 'enabled' : 'disabled'}`, 'success');
        this.trackEvent('sound_toggled', { enabled: this.soundEnabled });
    }
    
    updateSessionStats() {
        const sessionTime = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        const minutes = Math.floor(sessionTime / 60);
        const seconds = sessionTime % 60;
        
        if (this.sessionTimeEl) {
            this.sessionTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (this.totalRepsEl) {
            this.totalRepsEl.textContent = this.sessionStats.totalReps;
        }
        
        if (this.avgFormScoreEl && this.sessionStats.formScores.length > 0) {
            const avgScore = this.sessionStats.formScores.reduce((a, b) => a + b, 0) / 
                           this.sessionStats.formScores.length;
            this.avgFormScoreEl.textContent = `${Math.round(avgScore)}%`;
        }
    }
    
    showMessage(message, type = 'info', duration = 3000) {
        const feedbackEl = this.feedbackMessagesEl;
        const messageEl = document.createElement('div');
        messageEl.className = `feedback-message ${type}`;
        messageEl.innerHTML = message;
        
        feedbackEl.innerHTML = '';
        feedbackEl.appendChild(messageEl);
        
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.remove();
            }
        }, duration);
    }
    
    showConnectionError() {
        this.showMessage('Connection lost. Trying to reconnect...', 'error', 5000);
    }
    
    pauseSession() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
        }
        if (this.sessionInterval) {
            clearInterval(this.sessionInterval);
        }
    }
    
    resumeSession() {
        this.startStatusUpdates();
    }
    
    trackEvent(eventName, properties = {}) {
        // Simple analytics tracking
        const event = {
            name: eventName,
            timestamp: Date.now(),
            session_id: this.sessionId || 'unknown',
            properties: {
                ...properties,
                current_exercise: this.currentExercise,
                session_duration: Date.now() - this.sessionStartTime
            }
        };
        
        // Log to console for now (could send to analytics service)
        console.log('Analytics Event:', event);
        
        // Store in localStorage for session analysis
        const events = JSON.parse(localStorage.getItem('fitness_events') || '[]');
        events.push(event);
        localStorage.setItem('fitness_events', JSON.stringify(events.slice(-100))); // Keep last 100 events
    }
    
    // Cleanup method
    destroy() {
        if (this.statusInterval) clearInterval(this.statusInterval);
        if (this.sessionInterval) clearInterval(this.sessionInterval);
        document.removeEventListener('keydown', this.handleKeydown);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add loading indicator
    document.body.classList.add('loading');
    
    // Initialize app
    window.fitnessTrainer = new EnhancedFitnessTrainer();
    
    // Remove loading indicator
    setTimeout(() => {
        document.body.classList.remove('loading');
    }, 500);
    
    // Add keyboard shortcuts help
    console.log(`
🎯 AI Fitness Trainer Keyboard Shortcuts:
1 - Select Squats
2 - Select Push-ups  
3 - Select Bicep Curls
R - Reset counters
V - Toggle voice
S - Toggle sound
    `);
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.fitnessTrainer) {
        window.fitnessTrainer.destroy();
    }
});