#!/usr/bin/env python3
"""
Installation script for AI Fitness Trainer dependencies
Handles NumPy compatibility issues with MediaPipe
"""

import subprocess
import sys
import os

def run_command(command):
    """Run a command and return success status"""
    try:
        print(f"Running: {command}")
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print("✅ Success!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        print(f"Output: {e.stdout}")
        print(f"Error: {e.stderr}")
        return False

def main():
    print("🏋️ AI Fitness Trainer - Dependency Installation")
    print("=" * 50)
    
    # Check Python version
    python_version = sys.version_info
    print(f"Python version: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    if python_version < (3, 8):
        print("❌ Python 3.8+ is required")
        return False
    
    # Uninstall problematic packages first
    print("\n📦 Cleaning up existing packages...")
    cleanup_commands = [
        "pip uninstall -y numpy",
        "pip uninstall -y opencv-python", 
        "pip uninstall -y mediapipe"
    ]
    
    for cmd in cleanup_commands:
        run_command(cmd)
    
    # Install compatible versions
    print("\n📦 Installing compatible packages...")
    install_commands = [
        "pip install numpy==1.24.3",
        "pip install opencv-python==4.8.1.78", 
        "pip install mediapipe==0.10.32",
        "pip install Flask==2.3.3",
        "pip install PyYAML==6.0.1",
        "pip install pyttsx3==2.90"
    ]
    
    success = True
    for cmd in install_commands:
        if not run_command(cmd):
            success = False
            break
    
    if success:
        print("\n🎉 Installation completed successfully!")
        print("\nNext steps:")
        print("1. Test MediaPipe: python test_mediapipe.py")
        print("2. Run the app: python app.py")
        print("3. Open browser: http://localhost:8000")
    else:
        print("\n❌ Installation failed. Please check the errors above.")
    
    return success

if __name__ == "__main__":
    main()