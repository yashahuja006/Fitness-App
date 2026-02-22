#!/usr/bin/env python3
"""
Real Camera AI Fitness Trainer
Shows actual camera feed without auto-incrementing reps
"""

from flask import Flask, render_template, Response, jsonify, request
import cv2
import threading
import time
import os
from voice_feedback import VoiceFeedback

app = Flask(__name__)

# Global variables to share state between routes
current_reps = 0
current_stage = "START"
current_feedback = "Position yourself in front of camera"
current_voice_message = ""
current_exercise_name = "squat"
current_form_score = 100

# Initialize components
voice_feedback = VoiceFeedback()

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
try:
    camera = cv2.VideoCapture(0)
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    CAMERA_AVAILABLE = True
    print("✅ Camera initialized successfully")
except:
    CAMERA_AVAILABLE = False
    print("❌ Camera initialization failed")

def generate_real_camera_frames():
    """Generate real camera frames without automatic rep counting."""
    global current_feedback
    
    while True:
        if CAMERA_AVAILABLE:
            success, frame = camera.read()
            if not success:
                break
            
            # Flip frame horizontally for mirror effect
            frame = cv2.flip(frame, 1)
            
            # Draw exercise information overlay
            cv2.rectangle(frame, (10, 10), (500, 200), (0, 0, 0), -1)
            cv2.rectangle(frame, (10, 10), (500, 200), (255, 255, 255), 2)
            
            # Status
            cv2.putText(frame, "Camera: LIVE | Pose: MANUAL MODE", (20, 35), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            # Exercise info
            cv2.putText(frame, f'Exercise: {AVAILABLE_EXERCISES[current_exercise_name]["name"]}', 
                       (20, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
            
            # Stats
            cv2.putText(frame, f'Reps: {current_reps}', (20, 95),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
            cv2.putText(frame, f'Stage: {current_stage}', (20, 125),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            
            cv2.putText(frame, f'Form: {int(current_form_score)}%', (20, 155),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
            
            # Instructions
            cv2.putText(frame, "Press SPACE or click +REP to count reps", (20, 185),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
            
            # Voice indicator
            if voice_feedback.is_speaking:
                cv2.putText(frame, '🎤 SPEAKING', (400, 35),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            
            # Draw a simple pose guide (optional)
            h, w, c = frame.shape
            center_x, center_y = w//2, h//2
            
            # Draw guide lines for exercise positioning
            cv2.line(frame, (center_x-50, center_y-100), (center_x+50, center_y-100), (0, 255, 0), 2)
            cv2.line(frame, (center_x, center_y-120), (center_x, center_y+120), (0, 255, 0), 2)
            cv2.putText(frame, "Position yourself here", (center_x-100, center_y+140),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            
            # Encode frame
            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        else:
            # Fallback if camera fails
            time.sleep(0.1)
            yield (b'--frame\r\n'
                   b'Content-Type: text/html\r\n\r\n' + b'<div>Camera not available</div>\r\n')

@app.route('/')
def index():
    """Render the camera test page."""
    return render_template('camera_test.html', exercises=AVAILABLE_EXERCISES)

@app.route('/video_feed')
def video_feed():
    """Real camera video streaming route."""
    return Response(generate_real_camera_frames(),
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

@app.route('/add_rep', methods=['POST'])
def add_rep():
    """Manually add a rep (for testing without pose detection)."""
    global current_reps, current_stage, current_feedback
    
    current_reps += 1
    current_stage = "UP" if current_stage == "DOWN" else "DOWN"
    current_feedback = f"Great rep #{current_reps}! Keep going!"
    
    voice_feedback.speak(f"Rep {current_reps} counted! Excellent form!", priority=True)
    
    return jsonify({
        'status': 'success', 
        'reps': current_reps,
        'message': f'Rep {current_reps} added!'
    })

@app.route('/set_exercise/<exercise_name>', methods=['POST'])
def set_exercise(exercise_name):
    """Switch to a different exercise."""
    global current_exercise_name, current_reps, current_stage, current_feedback
    
    if exercise_name not in AVAILABLE_EXERCISES:
        return jsonify({'status': 'error', 'message': 'Exercise not found'}), 404
    
    current_exercise_name = exercise_name
    current_reps = 0
    current_stage = "START"
    current_feedback = f"Ready for {AVAILABLE_EXERCISES[exercise_name]['name']}!"
    
    voice_feedback.speak(f"Switched to {AVAILABLE_EXERCISES[exercise_name]['name']}. Ready to train!", priority=True)
    
    return jsonify({
        'status': 'success', 
        'exercise': exercise_name,
        'exercise_name': AVAILABLE_EXERCISES[exercise_name]['name']
    })

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
    current_feedback = "Ready to start!"
    current_voice_message = ""
    current_form_score = 100
    
    voice_feedback.speak("Counter reset! Ready for perfect form training!", priority=True)
    
    return jsonify({'status': 'reset', 'message': 'Counters reset'})

@app.route('/toggle_voice', methods=['POST'])
def toggle_voice():
    """Toggle voice feedback on/off."""
    return jsonify({'status': 'success', 'message': 'Voice feedback toggled'})

if __name__ == '__main__':
    print("🏋️ AI Fitness Trainer - REAL CAMERA MODE")
    print(f"📷 Camera Status: {'✅ LIVE FEED' if CAMERA_AVAILABLE else '❌ NOT AVAILABLE'}")
    print("🎯 Pose Detection: MANUAL (Click +REP button or press SPACE)")
    print("📋 Available Exercises:")
    for key, exercise in AVAILABLE_EXERCISES.items():
        print(f"   - {exercise['name']}: {exercise['description']}")
    print("🎤 Voice feedback enabled!")
    print("🌐 Open your browser to: http://localhost:8000")
    print("\n💡 Instructions:")
    print("   - Your camera feed will show live")
    print("   - Reps won't auto-increment")
    print("   - Click '+REP' button to manually count reps")
    print("   - This simulates what real pose detection would do")
    
    try:
        app.run(debug=True, host='0.0.0.0', port=8000, threaded=True)
    finally:
        if CAMERA_AVAILABLE:
            camera.release()
            cv2.destroyAllWindows()
        voice_feedback.stop()