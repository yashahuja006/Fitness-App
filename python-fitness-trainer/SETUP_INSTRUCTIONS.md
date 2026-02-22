# AI Fitness Trainer - Setup Instructions

## Current Issue: NumPy Compatibility

The AI Fitness Trainer is encountering a NumPy version compatibility issue. MediaPipe and OpenCV were compiled with NumPy 1.x but your system has NumPy 2.4.1 installed.

## Solution Options

### Option 1: Use Python 3.11 (Recommended)
The easiest solution is to use Python 3.11 which has better compatibility with the required packages:

1. **Install Python 3.11** from [python.org](https://www.python.org/downloads/)
2. **Create a new virtual environment:**
   ```bash
   python3.11 -m venv fitness_env
   fitness_env\Scripts\activate  # On Windows
   ```
3. **Install dependencies:**
   ```bash
   pip install Flask==2.3.3
   pip install opencv-python==4.8.1.78
   pip install mediapipe==0.10.32
   pip install PyYAML==6.0.1
   pip install pyttsx3==2.90
   pip install numpy==1.24.3
   ```

### Option 2: Force NumPy Downgrade (Current Python)
Try to force install compatible NumPy version:

```bash
pip uninstall numpy opencv-python mediapipe
pip install numpy==1.24.3 --force-reinstall --no-deps
pip install opencv-python==4.8.1.78
pip install mediapipe==0.10.32
```

### Option 3: Use Demo Mode
The app includes a demo mode that works without MediaPipe/OpenCV for testing the interface.

## Features

✅ **3 Exercise Types:**
- Squats (lower body)
- Push-ups (upper body) 
- Bicep Curls (arms)

✅ **Perfect Form Detection:**
- Only counts reps with 85%+ form score
- Real-time angle calculation
- Voice feedback for corrections

✅ **Voice Coaching:**
- Encouragement and form corrections
- Audio feedback for perfect reps
- Customizable voice settings

✅ **Enhanced UI:**
- Professional design with animations
- Real-time statistics dashboard
- Keyboard shortcuts (1,2,3 for exercises, R for reset)
- Sound effects and visual feedback

## Running the App

1. **Navigate to the directory:**
   ```bash
   cd python-fitness-trainer
   ```

2. **Run the application:**
   ```bash
   python app.py
   ```

3. **Open your browser:**
   ```
   http://localhost:8000
   ```

## Troubleshooting

- **Port 8000 in use?** The app will show an error. Try closing other applications or change the port in `app.py`
- **Camera not working?** Make sure no other applications are using your webcam
- **Voice not working?** Check your system audio settings and microphone permissions

## File Structure

```
python-fitness-trainer/
├── app.py                    # Main Flask application
├── pose_module.py           # MediaPipe pose detection
├── pose_module_simple.py    # Fallback demo mode
├── exercise_engine.py       # Exercise logic and rep counting
├── voice_feedback.py        # Voice coaching system
├── exercises/               # Exercise configurations
│   ├── squat.yaml
│   ├── pushup.yaml
│   └── bicep_curl.yaml
├── templates/
│   └── index.html          # Web interface
├── static/                 # CSS, JavaScript, sounds
└── requirements.txt        # Dependencies
```

## Next Steps

Once you get the app running:
1. Test each exercise type
2. Verify voice feedback is working
3. Check that only perfect form reps are counted
4. Try the keyboard shortcuts
5. Experiment with different camera angles for best detection