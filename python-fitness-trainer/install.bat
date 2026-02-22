@echo off
echo 🏋️ AI Fitness Trainer - Windows Installation
echo ================================================

echo.
echo 📦 Installing dependencies with NumPy compatibility fix...
echo.

REM Uninstall problematic packages
echo Cleaning up existing packages...
pip uninstall -y numpy opencv-python mediapipe

echo.
echo Installing compatible versions...
pip install numpy==1.24.3
pip install opencv-python==4.8.1.78
pip install mediapipe==0.10.32
pip install Flask==2.3.3
pip install PyYAML==6.0.1
pip install pyttsx3==2.90

echo.
echo 🧪 Testing MediaPipe installation...
python test_mediapipe.py

echo.
echo 🎉 Installation complete!
echo.
echo Next steps:
echo 1. Run: python app.py
echo 2. Open: http://localhost:8000
echo.
pause