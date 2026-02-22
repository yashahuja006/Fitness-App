#!/usr/bin/env python3
"""
Setup script for AI Fitness Trainer
"""

import subprocess
import sys
import os

def install_requirements():
    """Install required Python packages."""
    print("Installing Python dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing dependencies: {e}")
        return False
    return True

def check_camera():
    """Check if camera is available."""
    print("Checking camera availability...")
    try:
        import cv2
        cap = cv2.VideoCapture(0)
        if cap.isOpened():
            print("✅ Camera detected and accessible!")
            cap.release()
            return True
        else:
            print("❌ Camera not accessible. Please check your camera connection.")
            return False
    except ImportError:
        print("❌ OpenCV not installed. Run pip install opencv-python")
        return False

def main():
    """Main setup function."""
    print("🏋️ AI Fitness Trainer Setup")
    print("=" * 40)
    
    # Check if we're in the right directory
    if not os.path.exists("app.py"):
        print("❌ Please run this script from the python-fitness-trainer directory")
        return
    
    # Install dependencies
    if not install_requirements():
        return
    
    # Check camera
    if not check_camera():
        print("⚠️  Camera check failed, but you can still run the app")
    
    print("\n🎉 Setup complete!")
    print("\nTo start the application:")
    print("  python app.py")
    print("\nThen open your browser to: http://localhost:5000")

if __name__ == "__main__":
    main()