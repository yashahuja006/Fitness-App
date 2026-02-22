from google import genai
import os
import json
import time
from typing import Dict, List, Optional

class GeminiAICoach:
    def __init__(self, api_key: str):
        """
        Initialize Gemini AI Coach for personalized fitness guidance.
        
        Args:
            api_key: Google AI API key for Gemini
        """
        self.client = genai.Client(api_key=api_key)
        
        # Coaching context and history
        self.user_profile = {
            'fitness_level': 'beginner',
            'goals': ['strength', 'form_improvement'],
            'preferences': ['encouraging', 'detailed_feedback']
        }
        self.session_history = []
        self.last_ai_feedback_time = 0
        self.feedback_cooldown = 10  # 10 seconds between AI feedback
        
    def analyze_workout_session(self, exercise_data: Dict) -> str:
        """
        Analyze current workout session and provide AI coaching.
        
        Args:
            exercise_data: Dictionary containing exercise metrics
            
        Returns:
            AI-generated coaching feedback
        """
        current_time = time.time()
        
        # Check cooldown to avoid overwhelming user
        if (current_time - self.last_ai_feedback_time) < self.feedback_cooldown:
            return ""
        
        try:
            # Prepare context for Gemini
            prompt = self._build_coaching_prompt(exercise_data)
            
            # Generate AI response using new API
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            
            # Update session history
            self.session_history.append({
                'timestamp': current_time,
                'exercise': exercise_data.get('exercise', 'unknown'),
                'reps': exercise_data.get('reps', 0),
                'form_score': exercise_data.get('form_score', 0),
                'ai_feedback': response.text
            })
            
            self.last_ai_feedback_time = current_time
            return response.text
            
        except Exception as e:
            print(f"Gemini AI Error: {e}")
            return ""
    
    def _build_coaching_prompt(self, exercise_data: Dict) -> str:
        """Build context-aware prompt for Gemini."""
        
        exercise = exercise_data.get('exercise', 'unknown')
        reps = exercise_data.get('reps', 0)
        current_stage = exercise_data.get('stage', 'START')
        form_feedback = exercise_data.get('feedback', '')
        angle = exercise_data.get('angle', 0)
        
        # Get recent performance trends
        recent_sessions = self.session_history[-5:] if self.session_history else []
        
        prompt = f"""
You are an expert AI fitness coach providing real-time guidance during a {exercise} workout.

CURRENT SITUATION:
- Exercise: {exercise}
- Completed Reps: {reps}
- Current Stage: {current_stage}
- Joint Angle: {angle}°
- Form Feedback: {form_feedback}

USER PROFILE:
- Fitness Level: {self.user_profile['fitness_level']}
- Goals: {', '.join(self.user_profile['goals'])}
- Coaching Style: {', '.join(self.user_profile['preferences'])}

RECENT PERFORMANCE:
{self._format_recent_performance(recent_sessions)}

COACHING GUIDELINES:
1. Keep feedback under 15 words for voice delivery
2. Be encouraging and motivational
3. Focus on form improvement if angle/feedback indicates issues
4. Celebrate milestones (every 5 reps)
5. Provide specific, actionable advice
6. Match the user's fitness level

Generate a brief, encouraging coaching message that helps improve their {exercise} technique:
"""
        
        return prompt
    
    def _format_recent_performance(self, sessions: List[Dict]) -> str:
        """Format recent session data for context."""
        if not sessions:
            return "No recent session data available."
        
        performance_summary = []
        for session in sessions:
            performance_summary.append(
                f"- {session['exercise']}: {session['reps']} reps"
            )
        
        return "\n".join(performance_summary)
    
    def get_exercise_tips(self, exercise: str) -> str:
        """Get exercise-specific tips from Gemini."""
        try:
            prompt = f"""
Provide 3 key form tips for {exercise} exercise. 
Keep each tip under 10 words for voice delivery.
Focus on the most common mistakes beginners make.

Format as:
1. [tip]
2. [tip] 
3. [tip]
"""
            
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return response.text
            
        except Exception as e:
            print(f"Gemini Tips Error: {e}")
            return f"Focus on proper form and controlled movement for {exercise}."
    
    def analyze_form_correction(self, exercise: str, angle: float, target_range: tuple) -> str:
        """Get specific form correction advice."""
        try:
            min_angle, max_angle = target_range
            
            prompt = f"""
User is doing {exercise} with joint angle of {angle}°.
Target range is {min_angle}° to {max_angle}°.

Provide ONE specific correction in under 8 words for voice delivery.
Be direct and actionable.

Examples:
- "Lower down more"
- "Straighten your arms"
- "Bend deeper"
"""
            
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return response.text.strip()
            
        except Exception as e:
            print(f"Gemini Form Error: {e}")
            return "Adjust your form"
    
    def get_motivation_message(self, reps: int, exercise: str) -> str:
        """Get motivational message based on progress."""
        try:
            prompt = f"""
User just completed {reps} {exercise} reps.
Generate a motivational message under 10 words.
Be enthusiastic and encouraging.

Examples:
- "Amazing work! Keep that energy up!"
- "You're crushing it! Form looks great!"
- "Fantastic! Feel that strength building!"
"""
            
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return response.text.strip()
            
        except Exception as e:
            print(f"Gemini Motivation Error: {e}")
            return f"Great job on {reps} reps! Keep going!"
    
    def update_user_profile(self, fitness_level: str = None, goals: List[str] = None):
        """Update user profile for personalized coaching."""
        if fitness_level:
            self.user_profile['fitness_level'] = fitness_level
        if goals:
            self.user_profile['goals'] = goals
    
    def get_session_summary(self) -> str:
        """Generate workout session summary."""
        if not self.session_history:
            return "No workout data available."
        
        try:
            total_reps = sum(session.get('reps', 0) for session in self.session_history)
            exercises = list(set(session.get('exercise', '') for session in self.session_history))
            
            prompt = f"""
Generate a motivational workout summary:
- Total reps completed: {total_reps}
- Exercises performed: {', '.join(exercises)}
- Session duration: {len(self.session_history)} feedback points

Keep it under 20 words and very encouraging.
"""
            
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return response.text.strip()
            
        except Exception as e:
            print(f"Gemini Summary Error: {e}")
            return f"Great workout! You completed {total_reps} total reps!"

# Example usage and testing
if __name__ == "__main__":
    # Test the Gemini coach (requires API key)
    api_key = os.getenv('GEMINI_API_KEY', 'your-api-key-here')
    
    if api_key != 'your-api-key-here':
        coach = GeminiAICoach(api_key)
        
        # Test exercise analysis
        test_data = {
            'exercise': 'squat',
            'reps': 5,
            'stage': 'DOWN',
            'feedback': 'Go Lower',
            'angle': 95,
            'form_score': 75
        }
        
        feedback = coach.analyze_workout_session(test_data)
        print(f"AI Coach Feedback: {feedback}")
        
        # Test form correction
        correction = coach.analyze_form_correction('squat', 95, (70, 90))
        print(f"Form Correction: {correction}")
        
        # Test motivation
        motivation = coach.get_motivation_message(10, 'push-ups')
        print(f"Motivation: {motivation}")
    else:
        print("Please set GEMINI_API_KEY environment variable to test the AI coach.")