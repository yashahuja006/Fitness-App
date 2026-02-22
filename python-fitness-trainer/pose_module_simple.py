import cv2
import math

class PoseDetector:
    def __init__(self, min_detection_confidence=0.5, min_tracking_confidence=0.5):
        """
        Initialize a simple pose detector without MediaPipe for testing.
        This is a fallback version that works without MediaPipe.
        """
        print("⚠️  Using simplified pose detector (MediaPipe not available)")
        print("📝 This version simulates pose detection for testing purposes")
        
        self.frame_count = 0
        self.simulated_angle = 180  # Start with extended position
        self.angle_direction = -1   # Direction of angle change
        
    def find_pose(self, img, draw=True):
        """
        Simulate pose detection for testing purposes.
        """
        self.frame_count += 1
        
        # Simulate angle changes for testing
        self.simulated_angle += self.angle_direction * 2
        if self.simulated_angle <= 60:
            self.angle_direction = 1
        elif self.simulated_angle >= 180:
            self.angle_direction = -1
        
        # Create fake landmarks for testing
        h, w, c = img.shape
        landmarks = []
        
        # Simulate key landmarks (hip, knee, ankle for squat)
        hip_x, hip_y = w//2, h//3
        knee_x, knee_y = w//2, h//2
        ankle_x, ankle_y = w//2, int(h*0.8)
        
        landmarks.append([23, hip_x, hip_y])    # Hip
        landmarks.append([25, knee_x, knee_y])  # Knee  
        landmarks.append([27, ankle_x, ankle_y]) # Ankle
        
        if draw:
            # Draw simulated skeleton
            cv2.circle(img, (hip_x, hip_y), 8, (0, 255, 0), -1)
            cv2.circle(img, (knee_x, knee_y), 8, (0, 255, 0), -1)
            cv2.circle(img, (ankle_x, ankle_y), 8, (0, 255, 0), -1)
            
            # Draw lines
            cv2.line(img, (hip_x, hip_y), (knee_x, knee_y), (255, 255, 255), 3)
            cv2.line(img, (knee_x, knee_y), (ankle_x, ankle_y), (255, 255, 255), 3)
            
            # Add text
            cv2.putText(img, "DEMO MODE - MediaPipe Not Available", 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        
        return img, landmarks
    
    def find_angle(self, img, p1, p2, p3, landmarks, draw=True):
        """
        Return simulated angle for testing.
        """
        if len(landmarks) < 3:
            return self.simulated_angle
            
        if draw:
            # Get landmark coordinates for drawing
            try:
                x1, y1 = landmarks[0][1], landmarks[0][2]  # Hip
                x2, y2 = landmarks[1][1], landmarks[1][2]  # Knee
                x3, y3 = landmarks[2][1], landmarks[2][2]  # Ankle
                
                # Draw angle visualization
                cv2.putText(img, f"Angle: {int(self.simulated_angle)}", 
                           (x2 - 50, y2 + 50), cv2.FONT_HERSHEY_PLAIN, 2, (0, 255, 255), 2)
            except:
                pass
        
        return self.simulated_angle