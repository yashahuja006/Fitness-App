import pyttsx3
import threading
import time
import os
from queue import Queue
from gemini_coach import GeminiAICoach

class VoiceFeedback:
    def __init__(self):
        """Initialize text-to-speech engine with voice feedback system."""
        self.engine = pyttsx3.init()
        self.setup_voice()
        self.feedback_queue = Queue()
        self.is_speaking = False
        self.last_feedback_time = 0
        self.feedback_cooldown = 3  # 3 seconds between voice feedback
        
        # Initialize Gemini AI Coach
        self.ai_coach = None
        # Commenting out Gemini for now to avoid package issues
        # self.setup_ai_coach()
        print("ℹ️  Gemini AI Coach disabled for this session.")
        
        # Start voice feedback thread
        self.voice_thread = threading.Thread(target=self._voice_worker, daemon=True)
        self.voice_thread.start()
    
    def setup_ai_coach(self):
        """Setup Gemini AI Coach if API key is available."""
        api_key = os.getenv('GEMINI_API_KEY')
        if api_key:
            try:
                self.ai_coach = GeminiAICoach(api_key)
                print("🤖 Gemini AI Coach initialized!")
            except Exception as e:
                print(f"⚠️  Gemini AI Coach failed to initialize: {e}")
                self.ai_coach = None
        else:
            print("ℹ️  No GEMINI_API_KEY found. Using basic voice feedback only.")
    
    def setup_voice(self):
        """Configure voice properties."""
        voices = self.engine.getProperty('voices')
        
        # Try to set a female voice (usually index 1)
        if len(voices) > 1:
            self.engine.setProperty('voice', voices[1].id)
        
        # Set speech rate and volume
        self.engine.setProperty('rate', 150)  # Speed of speech
        self.engine.setProperty('volume', 0.9)  # Volume level (0.0 to 1.0)
    
    def speak(self, text, priority=False):
        """
        Add text to speech queue.
        
        Args:
            text: Text to speak
            priority: If True, speaks immediately regardless of cooldown
        """
        current_time = time.time()
        
        # Check cooldown unless it's a priority message
        if not priority and (current_time - self.last_feedback_time) < self.feedback_cooldown:
            return
        
        # Add to queue
        self.feedback_queue.put((text, priority, current_time))
    
    def _voice_worker(self):
        """Background worker to handle voice feedback."""
        while True:
            try:
                text, priority, timestamp = self.feedback_queue.get(timeout=1)
                
                # Skip if too old (more than 2 seconds)
                if time.time() - timestamp > 2:
                    continue
                
                self.is_speaking = True
                self.engine.say(text)
                self.engine.runAndWait()
                self.is_speaking = False
                self.last_feedback_time = time.time()
                
            except:
                continue
    
    def speak_perfect_rep(self, count, exercise_name):
        """Speak when a perfect form rep is completed."""
        if count == 1:
            self.speak(f"Perfect {exercise_name}! One quality rep!", priority=True)
        elif count == 5:
            self.speak(f"Excellent! Five perfect {exercise_name}s!", priority=True)
        elif count == 10:
            self.speak(f"Outstanding! Ten perfect reps! You're crushing it!", priority=True)
        elif count % 5 == 0 and count > 0:
            self.speak(f"Amazing! {count} perfect reps completed!", priority=True)
        else:
            self.speak(f"Perfect rep {count}! Great form!", priority=True)
    
    def speak_form_warning(self, form_score):
        """Speak when form is not good enough to count rep."""
        if form_score < 60:
            self.speak("Rep not counted! Focus on proper form!", priority=True)
        elif form_score < 75:
            self.speak("Close! Improve your form for the rep to count!", priority=True)
        else:
            self.speak("Almost perfect! Just a bit more precision!", priority=True)
    
    def speak_exercise_start(self, exercise_name):
        """Announce exercise start."""
        self.speak(f"Starting {exercise_name}. Get into position!", priority=True)
        
        # Get AI tips if available
        if self.ai_coach:
            try:
                tips = self.ai_coach.get_exercise_tips(exercise_name.lower())
                # Extract first tip for voice
                if tips and "1." in tips:
                    first_tip = tips.split("1.")[1].split("2.")[0].strip()
                    self.speak(f"Remember: {first_tip}", priority=False)
            except:
                pass
    
    def speak_form_feedback(self, feedback_text, exercise_data=None):
        """Speak form correction feedback with AI enhancement."""
        # Use basic feedback first
        self.speak(feedback_text)
        
        # Get AI-enhanced feedback if available
        if self.ai_coach and exercise_data:
            try:
                ai_feedback = self.ai_coach.analyze_workout_session(exercise_data)
                if ai_feedback and len(ai_feedback) < 100:  # Keep it short for voice
                    self.speak(ai_feedback, priority=False)
            except Exception as e:
                print(f"AI feedback error: {e}")
    
    def speak_ai_form_correction(self, exercise, angle, target_range):
        """Get AI-powered form correction."""
        if self.ai_coach:
            try:
                correction = self.ai_coach.analyze_form_correction(exercise, angle, target_range)
                if correction:
                    self.speak(correction)
            except:
                pass
    
    def speak_ai_motivation(self, reps, exercise):
        """Get AI-powered motivation."""
        if self.ai_coach:
            try:
                motivation = self.ai_coach.get_motivation_message(reps, exercise)
                if motivation:
                    self.speak(motivation, priority=True)
            except:
                pass
    
    def speak_encouragement(self):
        """Speak random encouragement."""
        encouragements = [
            "Great form! Keep it up!",
            "You're doing amazing!",
            "Perfect technique!",
            "Stay strong!",
            "Excellent work!"
        ]
        import random
        self.speak(random.choice(encouragements))
    
    def speak_session_summary(self):
        """Speak workout session summary."""
        if self.ai_coach:
            try:
                summary = self.ai_coach.get_session_summary()
                if summary:
                    self.speak(summary, priority=True)
            except:
                self.speak("Great workout session! Keep up the excellent work!")
        else:
            self.speak("Workout complete! Great job today!")
    
    def stop(self):
        """Stop the voice feedback system."""
        try:
            self.engine.stop()
        except:
            pass