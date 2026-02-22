class FitnessTrainerApp {
    constructor() {
        this.currentExercise = null;
        this.isTracking = false;
        this.statusUpdateInterval = null;
        
        this.initializeElements();
        this.bindEvents();
        this.startStatusUpdates();
    }
    
    initializeElements() {
        // Control elements
        this.exerciseSelect = document.getElementById('exercise-select');
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.stopBtn = document.getElementById('stop-btn');
        
        // Status elements
        this.currentExerciseEl = document.getElementById('current-exercise');
        this.repCountEl = document.getElementById('rep-count');
        this.formScoreEl = document.getElementById('form-score');
        this.currentStateEl = document.getElementById('current-state');
        this.currentAngleEl = document.getElementById('current-angle');
        this.feedbackMessagesEl = document.getElementById('feedback-messages');
        this.instructionsEl = document.getElementById('exercise-instructions');
    }
    
    bindEvents() {
        this.exerciseSelect.addEventListener('change', (e) => {
            this.selectExercise(e.target.value);
        });
        
        this.startBtn.addEventListener('click', () => {
            this.startExercise();
        });
        
        this.resetBtn.addEventListener('click', () => {
            this.resetExercise();
        });
        
        this.stopBtn.addEventListener('click', () => {
            this.stopExercise();
        });
    }
    
    async selectExercise(exerciseName) {
        if (!exerciseName) {
            this.currentExercise = null;
            this.updateUI();
            return;
        }
        
        try {
            const response = await fetch(`/api/exercise/${exerciseName}`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                this.currentExercise = exerciseName;
                this.updateExerciseInstructions(exerciseName);
                this.updateUI();
            } else {
                this.showError('Failed to load exercise');
            }
        } catch (error) {
            console.error('Error selecting exercise:', error);
            this.showError('Error selecting exercise');
        }
    }
    
    async startExercise() {
        if (!this.currentExercise) {
            this.showError('Please select an exercise first');
            return;
        }
        
        this.isTracking = true;
        this.updateUI();
        
        // Start camera if not already started
        try {
            await fetch('/api/camera/start', { method: 'POST' });
        } catch (error) {
            console.error('Error starting camera:', error);
        }
    }
    
    async resetExercise() {
        try {
            await fetch('/api/reset', { method: 'POST' });
            this.showSuccess('Exercise reset successfully');
        } catch (error) {
            console.error('Error resetting exercise:', error);
            this.showError('Error resetting exercise');
        }
    }
    
    async stopExercise() {
        this.isTracking = false;
        this.updateUI();
        
        try {
            await fetch('/api/camera/stop', { method: 'POST' });
        } catch (error) {
            console.error('Error stopping camera:', error);
        }
    }
    
    async updateStatus() {
        if (!this.isTracking) return;
        
        try {
            const response = await fetch('/api/status');
            const status = await response.json();
            
            if (status.status !== 'no_exercise') {
                this.updateStatusDisplay(status);
            }
        } catch (error) {
            console.error('Error fetching status:', error);
        }
    }
    
    updateStatusDisplay(status) {
        // Update rep count
        this.repCountEl.textContent = status.reps || 0;
        
        // Update form score with color coding
        const formScore = status.form_score || 0;
        this.formScoreEl.textContent = `${formScore}%`;
        this.formScoreEl.className = 'stat-value';
        
        if (formScore >= 80) {
            this.formScoreEl.classList.add('high-score');
        } else if (formScore >= 60) {
            this.formScoreEl.classList.add('medium-score');
        } else {
            this.formScoreEl.classList.add('low-score');
        }
        
        // Update current state
        this.currentStateEl.textContent = status.current_state || '--';
        
        // Update current angle
        const angle = status.current_angle || 0;
        this.currentAngleEl.textContent = `${angle.toFixed(1)}°`;
        
        // Update feedback messages
        this.updateFeedbackMessages(status.feedback || []);
    }
    
    updateFeedbackMessages(messages) {
        if (messages.length === 0) {
            this.feedbackMessagesEl.innerHTML = '<p class="no-feedback">Good form! Keep it up!</p>';
            return;
        }
        
        const feedbackHtml = messages.map(message => 
            `<div class="feedback-message error">${message}</div>`
        ).join('');
        
        this.feedbackMessagesEl.innerHTML = feedbackHtml;
    }
    
    updateExerciseInstructions(exerciseName) {
        const instructions = {
            'squat': [
                'Stand with feet shoulder-width apart',
                'Keep your back straight and chest up',
                'Lower down as if sitting in a chair',
                'Go down until thighs are parallel to floor',
                'Push through heels to return to start'
            ],
            'bicep_curl': [
                'Stand with arms at your sides',
                'Keep elbows close to your body',
                'Curl the weight up towards your shoulder',
                'Squeeze at the top of the movement',
                'Lower slowly with control'
            ]
        };
        
        const exerciseInstructions = instructions[exerciseName] || [
            'Follow the on-screen feedback',
            'Maintain proper form throughout',
            'Move with controlled tempo'
        ];
        
        const instructionsHtml = exerciseInstructions.map(instruction => 
            `<li>${instruction}</li>`
        ).join('');
        
        this.instructionsEl.innerHTML = `<ol>${instructionsHtml}</ol>`;
    }
    
    updateUI() {
        // Update current exercise display
        this.currentExerciseEl.textContent = this.currentExercise ? 
            this.currentExercise.replace('_', ' ').toUpperCase() : 'None';
        
        // Update button states
        this.startBtn.disabled = !this.currentExercise || this.isTracking;
        this.resetBtn.disabled = !this.currentExercise;
        this.stopBtn.disabled = !this.isTracking;
        
        // Update button text
        this.startBtn.textContent = this.isTracking ? 'Tracking...' : 'Start Exercise';
    }
    
    startStatusUpdates() {
        this.statusUpdateInterval = setInterval(() => {
            this.updateStatus();
        }, 100); // Update every 100ms for smooth real-time feedback
    }
    
    showError(message) {
        this.showMessage(message, 'error');
    }
    
    showSuccess(message) {
        this.showMessage(message, 'success');
    }
    
    showMessage(message, type) {
        const messageEl = document.createElement('div');
        messageEl.className = `feedback-message ${type}`;
        messageEl.textContent = message;
        
        this.feedbackMessagesEl.innerHTML = '';
        this.feedbackMessagesEl.appendChild(messageEl);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.remove();
            }
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FitnessTrainerApp();
});