# Real-Time AI Fitness Trainer

A Python-based web application that uses MediaPipe for pose estimation to count repetitions and analyze exercise form in real-time.

## Features

- Real-time pose estimation using MediaPipe
- YAML-driven exercise configuration
- Form scoring and feedback system
- Live video streaming with skeleton overlay
- Repetition counting with state machine logic

## Tech Stack

- **Backend**: Python Flask
- **Computer Vision**: MediaPipe Pose
- **Frontend**: HTML/JavaScript
- **Configuration**: YAML files for exercise definitions

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python app.py
```

3. Open your browser to `http://localhost:5000`

## Exercise Configuration

Exercises are defined in YAML files in the `exercises/` directory. Each exercise defines:
- Landmarks to track
- Angle calculations
- State machine logic
- Form feedback rules

## Directory Structure

```
python-fitness-trainer/
├── app.py                 # Flask application
├── pose_estimation.py     # MediaPipe pose processing
├── exercise_engine.py     # YAML-driven exercise logic
├── utils.py              # Utility functions
├── requirements.txt      # Python dependencies
├── exercises/            # YAML exercise definitions
│   ├── squat.yaml
│   └── bicep_curl.yaml
├── templates/            # HTML templates
│   └── index.html
└── static/              # CSS/JS files
    ├── style.css
    └── script.js
```