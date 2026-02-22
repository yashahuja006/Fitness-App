#!/usr/bin/env python3
"""
Test MediaPipe installation
"""

try:
    import mediapipe as mp
    print("✅ MediaPipe imported successfully")
    
    # Test if solutions module exists
    if hasattr(mp, 'solutions'):
        print("✅ mp.solutions exists")
        
        # Test pose module
        if hasattr(mp.solutions, 'pose'):
            print("✅ mp.solutions.pose exists")
            
            # Try to initialize pose
            pose = mp.solutions.pose.Pose()
            print("✅ Pose initialized successfully")
            print("🎉 MediaPipe is working correctly!")
        else:
            print("❌ mp.solutions.pose does not exist")
    else:
        print("❌ mp.solutions does not exist")
        print("MediaPipe version:", mp.__version__)
        
except ImportError as e:
    print("❌ Failed to import MediaPipe:", e)
except Exception as e:
    print("❌ Error testing MediaPipe:", e)