import yaml
import os

class ExerciseEngine:
    def __init__(self, exercise_file, voice_feedback=None):
        """
        Initialize exercise engine with YAML configuration.
        Only counts PERFECT FORM repetitions!
        
        Args:
            exercise_file: Path to the YAML exercise configuration file
            voice_feedback: VoiceFeedback instance for voice commands
        """
        self.exercise_config = self.load_exercise(exercise_file)
        self.voice_feedback = voice_feedback
        self.current_stage = "START"
        self.reps = 0
        self.feedback = ""
        self.voice_message = ""
        self.form_score = 100
        self.perfect_form_threshold = 85  # Only count reps with 85%+ form score
        
        # Extract landmarks from config
        landmarks = self.exercise_config['landmarks']
        if 'hip' in landmarks:  # Squat
            self.landmark1 = landmarks['hip']
            self.landmark2 = landmarks['knee']
            self.landmark3 = landmarks['ankle']
        elif 'shoulder' in landmarks:  # Push-up or Bicep curl
            self.landmark1 = landmarks['shoulder']
            self.landmark2 = landmarks['elbow']
            self.landmark3 = landmarks['wrist']
        
        # Extract thresholds based on exercise type
        params = self.exercise_config['parameters']
        self.start_threshold = params.get('angle_threshold_start', 160)
        self.down_threshold = params.get('angle_threshold_down', 90)
        self.up_threshold = params.get('angle_threshold_up', 50)  # For bicep curls
        self.feedback_threshold = params.get('feedback_threshold', 100)
        
        # Perfect form ranges
        self.perfect_ranges = params.get('perfect_range_min', 70), params.get('perfect_range_max', 90)
        
        # Announce exercise start
        if self.voice_feedback:
            self.voice_feedback.speak_exercise_start(self.exercise_config['name'])
        
    def load_exercise(self, exercise_file):
        """Load exercise configuration from YAML file."""
        if not os.path.exists(exercise_file):
            raise FileNotFoundError(f"Exercise file not found: {exercise_file}")
            
        with open(exercise_file, 'r') as file:
            return yaml.safe_load(file)
    
    def process(self, image, landmarks):
        """
        Process the current frame and update exercise state.
        Only count reps with PERFECT FORM!
        
        Returns:
            tuple: (reps, status, feedback, voice_message, form_score)
        """
        if len(landmarks) == 0:
            return self.reps, self.current_stage, "No pose detected", "", 0
        
        # Calculate the angle
        try:
            point1 = None
            point2 = None
            point3 = None
            
            for landmark in landmarks:
                if landmark[0] == self.landmark1:
                    point1 = (landmark[1], landmark[2])
                elif landmark[0] == self.landmark2:
                    point2 = (landmark[1], landmark[2])
                elif landmark[0] == self.landmark3:
                    point3 = (landmark[1], landmark[2])
            
            if not all([point1, point2, point3]):
                return self.reps, self.current_stage, "Required landmarks not detected", "", 0
            
            angle = self.calculate_angle(point1, point2, point3)
            
        except (IndexError, TypeError):
            return self.reps, self.current_stage, "Error calculating angle", "", 0
        
        # Calculate form score first
        self.form_score = self.calculate_form_score(angle)
        
        # State machine logic based on exercise type
        previous_stage = self.current_stage
        exercise_name = self.exercise_config['name'].lower()
        rep_completed = False
        
        if 'bicep' in exercise_name:
            # Bicep curl logic: START -> UP -> DOWN (rep completed)
            if angle > self.start_threshold:
                if self.current_stage == "UP":
                    self.current_stage = "DOWN"
                    rep_completed = True
                else:
                    self.current_stage = "START"
            elif angle < self.up_threshold:
                self.current_stage = "UP"
        else:
            # Squat and Push-up logic: START -> DOWN -> UP (rep completed)
            if angle > self.start_threshold:
                if self.current_stage == "DOWN":
                    self.current_stage = "UP"
                    rep_completed = True
                else:
                    self.current_stage = "START"
            elif angle < self.down_threshold:
                self.current_stage = "DOWN"
        
        # Only count rep if form is PERFECT!
        if rep_completed:
            if self.form_score >= self.perfect_form_threshold:
                self.reps += 1
                if self.voice_feedback:
                    self.voice_feedback.speak_perfect_rep(self.reps, self.exercise_config['name'])
            else:
                # Rep not counted due to poor form
                if self.voice_feedback:
                    self.voice_feedback.speak_form_warning(self.form_score)
        
        # Generate feedback with voice
        self.feedback, self.voice_message = self.generate_feedback(angle, self.current_stage, self.form_score)
        
        # Speak voice feedback with AI enhancement
        if self.voice_feedback and self.voice_message:
            exercise_data = {
                'exercise': self.exercise_config['name'].lower(),
                'reps': self.reps,
                'stage': self.current_stage,
                'feedback': self.feedback,
                'angle': angle,
                'form_score': self.form_score
            }
            
            self.voice_feedback.speak_form_feedback(self.voice_message, exercise_data)
        
        return self.reps, self.current_stage, self.feedback, self.voice_message, self.form_score
    
    def calculate_angle(self, point1, point2, point3):
        """Calculate angle between three points with point2 as vertex."""
        import math
        
        x1, y1 = point1
        x2, y2 = point2  # Vertex
        x3, y3 = point3
        
        # Calculate vectors
        vector1 = (x1 - x2, y1 - y2)
        vector2 = (x3 - x2, y3 - y2)
        
        # Calculate angle using dot product
        dot_product = vector1[0] * vector2[0] + vector1[1] * vector2[1]
        magnitude1 = math.sqrt(vector1[0]**2 + vector1[1]**2)
        magnitude2 = math.sqrt(vector2[0]**2 + vector2[1]**2)
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0
        
        cos_angle = dot_product / (magnitude1 * magnitude2)
        cos_angle = max(-1, min(1, cos_angle))
        angle = math.degrees(math.acos(cos_angle))
        
        return angle
    
    def calculate_form_score(self, angle):
        """Calculate detailed form score based on angle accuracy."""
        exercise_name = self.exercise_config['name'].lower()
        
        if 'squat' in exercise_name:
            # Perfect squat: 70-90 degrees at bottom
            if self.current_stage == "DOWN":
                if 70 <= angle <= 90:
                    return 100
                elif 65 <= angle <= 95:
                    return 90
                elif 60 <= angle <= 100:
                    return 75
                elif 50 <= angle <= 110:
                    return 60
                else:
                    return 40
            else:
                return 95  # Good form in other stages
                
        elif 'push' in exercise_name:
            # Perfect push-up: 60-90 degrees at bottom
            if self.current_stage == "DOWN":
                if 60 <= angle <= 90:
                    return 100
                elif 55 <= angle <= 95:
                    return 90
                elif 50 <= angle <= 100:
                    return 75
                else:
                    return 60
            else:
                return 95
                
        elif 'bicep' in exercise_name:
            # Perfect bicep curl: 30-50 degrees at top
            if self.current_stage == "UP":
                if 30 <= angle <= 50:
                    return 100
                elif 25 <= angle <= 55:
                    return 90
                elif 20 <= angle <= 60:
                    return 75
                else:
                    return 60
            else:
                return 95
        
        return 80  # Default score
    
    def generate_feedback(self, angle, stage, form_score):
        """Generate feedback based on current angle, stage, and form score."""
        # Priority feedback for poor form
        if form_score < self.perfect_form_threshold:
            if form_score < 60:
                return "Poor Form!", "Focus on your form! Slow down and control the movement!"
            else:
                return "Improve Form", "Almost there! Adjust your form slightly for perfect reps!"
        
        # Check feedback rules from YAML
        for rule in self.exercise_config['feedback']:
            condition = rule['condition']
            message = rule['message']
            voice = rule.get('voice', message)
            
            if self.evaluate_condition(condition, angle, stage):
                return message, voice
        
        # Positive feedback for good form
        if form_score >= 95:
            return "Perfect Form!", "Excellent technique! Keep it up!"
        elif form_score >= self.perfect_form_threshold:
            return "Good Form", "Great form! This rep will count!"
        
        # Default feedback based on stage
        if stage == "START":
            return "Ready", "Ready for next rep"
        elif stage == "DOWN":
            return "Good depth!", ""
        elif stage == "UP":
            return "Great rep!", ""
        
        return "", ""
    
    def evaluate_condition(self, condition, angle, stage):
        """Evaluate feedback condition from YAML."""
        try:
            condition = condition.replace('angle', str(angle))
            condition = condition.replace('state', f'"{stage}"')
            
            if 'and state ==' in condition:
                parts = condition.split(' and state ==')
                angle_condition = parts[0].strip()
                state_condition = parts[1].strip().strip('"')
                
                if '>' in angle_condition:
                    threshold = float(angle_condition.split('>')[-1].strip())
                    angle_ok = angle > threshold
                elif '<' in angle_condition:
                    threshold = float(angle_condition.split('<')[-1].strip())
                    angle_ok = angle < threshold
                else:
                    angle_ok = True
                
                return angle_ok and stage == state_condition
            
            elif '>' in condition:
                threshold = float(condition.split('>')[-1].strip())
                return angle > threshold
            elif '<' in condition:
                threshold = float(condition.split('<')[-1].strip())
                return angle < threshold
                
        except:
            pass
        
        return False
    
    def reset(self):
        """Reset the exercise counter and state."""
        self.reps = 0
        self.current_stage = "START"
        self.feedback = ""
        self.voice_message = ""
        self.form_score = 100