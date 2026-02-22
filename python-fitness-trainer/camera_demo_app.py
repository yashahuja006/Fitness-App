#!/usr/bin/env python3
"""
Camera Demo version of AI Fitness Trainer
Uses camera feed with simplified pose detection (no MediaPipe required)
"""

from flask import Flask, render_template, Response, jsonify, request
import threading
import time
import os

# Try to import OpenCV, fallback to demo mode if not available
try:
    import cv2
    CAMERA_AVAILABLE = True
    print("✅ OpenCV loaded - Camera functionality enabled")
except ImportError:
    CAMERA_AVAILABLE = False
    print("⚠️  OpenCV not available - Using demo mode")

from exercise_engine import ExerciseEngine
from voice_feedback import VoiceFeedback

app = Flask(__name__)

# Global variables to share state between routes
current_reps = 0
current_stage = "START"
current_feedback = ""
current_voice_message = ""
current_exercise_name = "squat"
current_form_score = 100

# Initialize components
voice_feedback = VoiceFeedback()
exercise_engine = ExerciseEngine('exercises/squat.yaml', voice_feedback)

# Available exercises
AVAILABLE_EXERCISES = {
    'squat': {
        'name': 'Squats',
        'file': 'exercises/squat.yaml',
        'description': 'Lower body strength exercise'
    },
    'pushup': {
        'name': 'Push-ups', 
        'file': 'exercises/pushup.yaml',
        'description': 'Upper body strength exercise'
    },
    'bicep_curl': {
        'name': 'Bicep Curls',
        'file': 'exercises/bicep_curl.yaml', 
        'description': 'Arm strength exercise'
    }
}

# Camera setup
if CAMERA_AVAILABLE:
    camera = cv2.VideoCapture(0)
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

# Demo simulation variables
demo_angle = 180
angle_direction = -1
frame_count = 0

class SimplePoseDetector:
    """Simple pose detector that simulates pose detection on camera feed"""
    
    def __init__(self):
        self.frame_count = 0
        self.simulated_angle = 180
        self.angle_direction = -1
        
    def detect_pose(self, frame):
        """Simulate pose detection on real camera frame"""
        self.frame_count += 1
        
        # Simulate realistic exercise motion
        self.simulated_angle += self.angle_direction * 2
        if self.simulated_angle <= 60:
            self.angle_direction = 1
        elif self.simulated_angle >= 180:
            self.angle_direction = -1
        
        # Draw simulated pose landmarks on the frame
        h, w, c = frame.shape
        
        # Simulate key body points
        hip_x, hip_y = w//2, h//3
        knee_x, knee_y = w//2, h//2
        ankle_x, ankle_y = w//2, int(h*0.8)
        
        # Draw pose skeleton
        cv2.circle(frame, (hip_x, hip_y), 8, (0, 255, 0), -1)
        cv2.circle(frame, (knee_x, knee_y), 8, (0, 255, 0), -1)
        cv2.circle(frame, (ankle_x, ankle_y), 8, (0, 255, 0), -1)
        
        # Draw connecting lines
        cv2.line(frame, (hip_x, hip_y), (knee_x, knee_y), (255, 255, 255), 3)
        cv2.line(frame, (knee_x, knee_y), (ankle_x, ankle_y), (255, 255, 255), 3)
        
        # Draw angle
        cv2.putText(frame, f"Angle: {int(self.simulated_angle)}", 
                   (knee_x - 50, knee_y + 50), cv2.FONT_HERSHEY_PLAIN, 2, (0, 255, 255), 2)
        
        # Create fake landmarks for exercise engine
        landmarks = [
            [23, hip_x, hip_y],   # Hip
            [25, knee_x, knee_y], # Knee
            [27, ankle_x, ankle_y] # Ankle
        ]
        
        return frame, landmarks, self.simulated_angle

# Initialize pose detector
pose_detector = SimplePoseDetector()

def generate_camera_frames():
    """Generate camera frames with simulated pose detection."""
    global current_reps, current_stage, current_feedback, current_voice_message, current_form_score
    
    while True:
        if CAMERA_AVAILABLE:
            success, frame = camera.read()
            if not success:
                break
            
            # Flip frame horizontally for mirror effect
            frame = cv2.flip(frame, 1)
            
            # Apply simulated pose detection
            frame, landmarks, angle = pose_detector.detect_pose(frame)
            
            # Process exercise logic
            if landmarks:
                # Simulate exercise processing
                reps = pose_detector.frame_count // 120  # Rep every ~4 seconds
                stage = "DOWN" if angle < 100 else "UP"
                feedback = "Perfect depth!" if angle < 80 else "Go lower!" if angle > 120 else "Good form!"
                form_score = max(60, 100 - abs(angle - 70))
                
                # Update global variables
                current_reps = reps
                current_stage = stage
                current_feedback = feedback
                current_form_score = form_score
            
            # Draw exercise information overlay
            cv2.rectangle(frame, (10, 10), (450, 180), (0, 0, 0), -1)
            cv2.rectangle(frame, (10, 10), (450, 180), (255, 255, 255), 2)
            
            # Status
            cv2.putText(frame, "Camera: ON | Pose: SIMULATED", (20, 35), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            
            # Exercise info
            cv2.putText(frame, f'Exercise: {AVAILABLE_EXERCISES[current_exercise_name]["name"]}', 
                       (20, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
            
            # Stats
            cv2.putText(frame, f'Reps: {current_reps}', (20, 90),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
            cv2.putText(frame, f'Stage: {current_stage}', (20, 120),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            
            cv2.putText(frame, f'Form: {int(current_form_score)}%', (20, 150),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
            
            # Voice indicator
            if voice_feedback.is_speaking:
                cv2.putText(frame, '🎤 SPEAKING', (350, 60),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            
            # Encode frame
            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        else:
            # Fallback to demo mode without camera
            time.sleep(0.1)
            demo_frame = create_demo_frame()
            yield (b'--frame\r\n'
                   b'Content-Type: text/html\r\n\r\n' + demo_frame.encode() + b'\r\n')

def create_demo_frame():
    """Create demo frame when camera is not available"""
    global current_reps, current_stage, current_feedback, current_form_score
    global demo_angle, angle_direction, frame_count
    
    frame_count += 1
    
    # Simulate angle changes
    demo_angle += angle_direction * 3
    if demo_angle <= 60:
        angle_direction = 1
    elif demo_angle >= 180:
        angle_direction = -1
    
    # Update stats
    current_reps = frame_count // 120
    current_stage = "DOWN" if demo_angle < 100 else "UP"
    current_feedback = "Perfect form!" if demo_angle < 80 else "Go lower!"
    current_form_score = max(60, 100 - abs(demo_angle - 70))
    
    return f"""
    <div style="width: 640px; height: 480px; background: linear-gradient(45deg, #667eea 0%, #764ba2 100%); 
                display: flex; flex-direction: column; justify-content: center; align-items: center; 
                color: white; font-family: Arial; text-align: center; border-radius: 10px;">
        <h1 style="margin: 20px;">📷 CAMERA DEMO</h1>
        <h2>Exercise: {AVAILABLE_EXERCISES[current_exercise_name]['name']}</h2>
        <div style="font-size: 24px; margin: 20px;">
            <div>Reps: {current_reps}</div>
            <div>Stage: {current_stage}</div>
            <div>Angle: {int(demo_angle)}°</div>
            <div>Form Score: {int(current_form_score)}%</div>
        </div>
        <div style="margin: 20px; font-size: 18px; max-width: 400px;">
            {current_feedback}
        </div>
        <div style="margin-top: 20px; font-size: 14px; opacity: 0.8;">
            ⚠️ Camera not available - Install OpenCV for camera feed
        </div>
    </div>
    """

@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html', exercises=AVAILABLE_EXERCISES)

@app.route('/video_feed')
def video_feed():
    """Camera video streaming route."""
    return Response(generate_camera_frames(),
                   mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/stats')
def stats():
    """Return current exercise statistics as JSON."""
    return jsonify({
        'reps': current_reps,
        'stage': current_stage,
        'feedback': current_feedback,
        'voice_message': current_voice_message,
        'exercise': current_exercise_name,
        'exercise_name': AVAILABLE_EXERCISES[current_exercise_name]['name'],
        'form_score': current_form_score
    })

@app.route('/set_exercise/<exercise_name>', methods=['POST'])
def set_exercise(exercise_name):
    """Switch to a different exercise."""
    global exercise_engine, current_exercise_name, current_reps, current_stage, current_feedback
    
    if exercise_name not in AVAILABLE_EXERCISES:
        return jsonify({'status': 'error', 'message': 'Exercise not found'}), 404
    
    try:
        exercise_file = AVAILABLE_EXERCISES[exercise_name]['file']
        exercise_engine = ExerciseEngine(exercise_file, voice_feedback)
        current_exercise_name = exercise_name
        current_reps = 0
        current_stage = "START"
        current_feedback = ""
        
        # Reset pose detector
        pose_detector.frame_count = 0
        pose_detector.simulated_angle = 180
        
        return jsonify({
            'status': 'success', 
            'exercise': exercise_name,
            'exercise_name': AVAILABLE_EXERCISES[exercise_name]['name']
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/exercises')
def get_exercises():
    """Get list of available exercises."""
    return jsonify(AVAILABLE_EXERCISES)

@app.route('/reset', methods=['POST'])
def reset():
    """Reset exercise counters."""
    global current_reps, current_stage, current_feedback, current_voice_message, current_form_score
    
    current_reps = 0
    current_stage = "START"
    current_feedback = ""
    current_voice_message = ""
    current_form_score = 100
    
    # Reset pose detector
    pose_detector.frame_count = 0
    pose_detector.simulated_angle = 180
    
    voice_feedback.speak("Camera demo reset! Ready to train!", priority=True)
    
    return jsonify({'status': 'reset', 'message': 'Camera demo reset'})

@app.route('/toggle_voice', methods=['POST'])
def toggle_voice():
    """Toggle voice feedback on/off."""
    return jsonify({'status': 'success', 'message': 'Voice feedback toggled'})

if __name__ == '__main__':
    print("🏋️ AI Fitness Trainer - CAMERA DEMO")
    print(f"📷 Camera Status: {'✅ ENABLED' if CAMERA_AVAILABLE else '⚠️  NOT AVAILABLE'}")
    print("🤖 Pose Detection: SIMULATED (MediaPipe not required)")
    print("📋 Available Exercises:")
    for key, exercise in AVAILABLE_EXERCISES.items():
        print(f"   - {exercise['name']}: {exercise['description']}")
    print("🎤 Voice feedback enabled!")
    print("🌐 Open your browser to: http://localhost:8000")
    
    try:
        app.run(debug=True, host='0.0.0.0', port=8000, threaded=True)
    finally:
        if CAMERA_AVAILABLE:
            camera.release()
            cv2.destroyAllWindows()
        voice_feedback.stop()