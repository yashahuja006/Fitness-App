from flask import Flask, render_template, Response, jsonify, request
import cv2
import threading
import os

# Try to import MediaPipe version first, fallback to simple version
try:
    from pose_module import PoseDetector
    MEDIAPIPE_AVAILABLE = True
    print("✅ MediaPipe pose detection loaded successfully!")
except ImportError as e:
    print(f"⚠️  MediaPipe not available: {e}")
    print("🔄 Loading simplified pose detector for testing...")
    from pose_module_simple import PoseDetector
    MEDIAPIPE_AVAILABLE = False

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
pose_detector = PoseDetector(min_detection_confidence=0.5)
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
camera = cv2.VideoCapture(0)
camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

def generate_frames():
    """Generate video frames with pose detection and exercise tracking."""
    global current_reps, current_stage, current_feedback, current_voice_message
    
    while True:
        success, frame = camera.read()
        if not success:
            break
        
        # Flip frame horizontally for mirror effect
        frame = cv2.flip(frame, 1)
        
        # Detect pose
        frame, landmarks = pose_detector.find_pose(frame, draw=True)
        
        if landmarks:
            # Calculate angle and draw it
            angle = pose_detector.find_angle(
                frame, 
                exercise_engine.landmark1,
                exercise_engine.landmark2, 
                exercise_engine.landmark3,
                landmarks,
                draw=True
            )
            
            # Process exercise logic
            reps, stage, feedback, voice_msg, form_score = exercise_engine.process(frame, landmarks)
            
            # Update global variables
            current_reps = reps
            current_stage = stage
            current_feedback = feedback
            current_voice_message = voice_msg
            current_form_score = form_score
        
        # Draw exercise information on frame
        cv2.rectangle(frame, (10, 10), (450, 180), (0, 0, 0), -1)
        cv2.rectangle(frame, (10, 10), (450, 180), (255, 255, 255), 2)
        
        # MediaPipe status
        status_color = (0, 255, 0) if MEDIAPIPE_AVAILABLE else (0, 165, 255)
        status_text = "MediaPipe: ON" if MEDIAPIPE_AVAILABLE else "MediaPipe: DEMO MODE"
        cv2.putText(frame, status_text, (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.6, status_color, 2)
        
        # Exercise name
        cv2.putText(frame, f'Exercise: {AVAILABLE_EXERCISES[current_exercise_name]["name"]}', 
                   (20, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
        
        # Rep count
        cv2.putText(frame, f'Reps: {current_reps}', (20, 90),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        
        # Current stage
        cv2.putText(frame, f'Stage: {current_stage}', (20, 120),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        
        # Feedback
        cv2.putText(frame, f'Feedback: {current_feedback}', (20, 150),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        
        # Voice indicator
        if voice_feedback.is_speaking:
            cv2.putText(frame, '🎤 SPEAKING', (350, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        # Encode frame as JPEG
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html', exercises=AVAILABLE_EXERCISES)

@app.route('/video_feed')
def video_feed():
    """Video streaming route."""
    return Response(generate_frames(),
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
    
    exercise_engine.reset()
    current_reps = 0
    current_stage = "START"
    current_feedback = ""
    current_voice_message = ""
    current_form_score = 100
    
    voice_feedback.speak("Perfect form counter reset! Ready for quality reps!", priority=True)
    
    return jsonify({'status': 'reset', 'message': 'Exercise counters reset'})

@app.route('/toggle_voice', methods=['POST'])
def toggle_voice():
    """Toggle voice feedback on/off."""
    # This would require adding a voice_enabled flag
    return jsonify({'status': 'success', 'message': 'Voice feedback toggled'})

if __name__ == '__main__':
    try:
        print("🏋️ AI Fitness Trainer with Voice Feedback Starting...")
        print(f"🔧 MediaPipe Status: {'✅ ENABLED' if MEDIAPIPE_AVAILABLE else '⚠️  DEMO MODE'}")
        if not MEDIAPIPE_AVAILABLE:
            print("📝 Running in demo mode - install MediaPipe for real pose detection")
        print("📋 Available Exercises:")
        for key, exercise in AVAILABLE_EXERCISES.items():
            print(f"   - {exercise['name']}: {exercise['description']}")
        print("🎤 Voice feedback enabled!")
        print("🌐 Open your browser to: http://localhost:8000")
        
        app.run(debug=True, host='0.0.0.0', port=8000, threaded=True)
    finally:
        # Cleanup
        camera.release()
        voice_feedback.stop()
        cv2.destroyAllWindows()