#!/usr/bin/env python3
"""
Demo version of AI Fitness Trainer that works without OpenCV/MediaPipe
This version simulates the exercise detection for testing the interface
"""

from flask import Flask, render_template, Response, jsonify, request
import threading
import time
import os
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

# Demo simulation variables
demo_angle = 180
angle_direction = -1
frame_count = 0

def generate_demo_frames():
    """Generate demo video frames without camera."""
    global current_reps, current_stage, current_feedback, current_voice_message
    global demo_angle, angle_direction, frame_count
    
    while True:
        frame_count += 1
        
        # Simulate angle changes for realistic exercise motion
        demo_angle += angle_direction * 3
        if demo_angle <= 60:
            angle_direction = 1
        elif demo_angle >= 180:
            angle_direction = -1
        
        # Create fake landmarks for exercise engine
        fake_landmarks = [
            [23, 320, 200],  # Hip
            [25, 320, 300],  # Knee
            [27, 320, 400]   # Ankle
        ]
        
        # Process exercise logic with simulated angle
        if hasattr(exercise_engine, 'process_angle'):
            reps, stage, feedback, voice_msg, form_score = exercise_engine.process_angle(demo_angle)
        else:
            # Fallback simulation
            reps = frame_count // 120  # Increment rep every ~4 seconds
            stage = "DOWN" if demo_angle < 100 else "UP"
            feedback = "Perfect form!" if demo_angle < 80 else "Go lower!"
            voice_msg = ""
            form_score = max(60, 100 - abs(demo_angle - 70))
        
        # Update global variables
        current_reps = reps
        current_stage = stage
        current_feedback = feedback
        current_voice_message = voice_msg
        current_form_score = form_score
        
        # Create a simple demo image (just text)
        demo_frame = f"""
        <div style="width: 640px; height: 480px; background: linear-gradient(45deg, #667eea 0%, #764ba2 100%); 
                    display: flex; flex-direction: column; justify-content: center; align-items: center; 
                    color: white; font-family: Arial; text-align: center; border-radius: 10px;">
            <h1 style="margin: 20px;">🏋️ DEMO MODE</h1>
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
                📝 Install MediaPipe + OpenCV for real pose detection
            </div>
        </div>
        """
        
        # Simulate video streaming delay
        time.sleep(0.1)
        
        yield (b'--frame\r\n'
               b'Content-Type: text/html\r\n\r\n' + demo_frame.encode() + b'\r\n')

@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html', exercises=AVAILABLE_EXERCISES)

@app.route('/video_feed')
def video_feed():
    """Demo video streaming route."""
    return Response(generate_demo_frames(),
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
    global frame_count
    
    current_reps = 0
    current_stage = "START"
    current_feedback = ""
    current_voice_message = ""
    current_form_score = 100
    frame_count = 0
    
    voice_feedback.speak("Demo counter reset! Testing interface!", priority=True)
    
    return jsonify({'status': 'reset', 'message': 'Demo counters reset'})

@app.route('/toggle_voice', methods=['POST'])
def toggle_voice():
    """Toggle voice feedback on/off."""
    return jsonify({'status': 'success', 'message': 'Voice feedback toggled'})

if __name__ == '__main__':
    print("🏋️ AI Fitness Trainer - DEMO MODE")
    print("⚠️  This is a demo version without camera/pose detection")
    print("📝 Install MediaPipe + OpenCV for full functionality")
    print("📋 Available Exercises:")
    for key, exercise in AVAILABLE_EXERCISES.items():
        print(f"   - {exercise['name']}: {exercise['description']}")
    print("🎤 Voice feedback enabled!")
    print("🌐 Open your browser to: http://localhost:8000")
    
    try:
        app.run(debug=True, host='0.0.0.0', port=8000, threaded=True)
    finally:
        voice_feedback.stop()