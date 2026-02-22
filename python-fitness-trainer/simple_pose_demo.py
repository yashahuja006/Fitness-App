import cv2
import mediapipe as mp

# This is what SIMPLE pose detection looks like
class SimplePoseDetection:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils
        self.pose = self.mp_pose.Pose()
    
    def detect_pose(self, frame):
        # Convert to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process frame
        results = self.pose.process(rgb_frame)
        
        # Draw basic skeleton (if landmarks detected)
        if results.pose_landmarks:
            self.mp_drawing.draw_landmarks(
                frame, 
                results.pose_landmarks, 
                self.mp_pose.POSE_CONNECTIONS
            )
        
        return frame

# Simple demo - NO rep counting, NO feedback, NO intelligence
def main():
    cap = cv2.VideoCapture(0)
    detector = SimplePoseDetection()
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        # Just detect and draw skeleton - that's it!
        frame = detector.detect_pose(frame)
        
        # Show basic info
        cv2.putText(frame, "Simple Pose Detection", (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, "No counting, no feedback", (10, 70), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        cv2.imshow('Simple Pose Detection', frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()