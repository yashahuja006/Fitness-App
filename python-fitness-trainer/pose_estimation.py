import cv2
import mediapipe as mp
import numpy as np
from utils import normalize_landmarks

class PoseEstimator:
    def __init__(self):
        """Initialize MediaPipe pose estimation."""
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        # Initialize pose model
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            enable_segmentation=False,
            smooth_segmentation=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
    def process_frame(self, frame):
        """
        Process a single frame and return landmarks and annotated image.
        
        Args:
            frame: Input image frame
            
        Returns:
            tuple: (landmarks, annotated_frame)
        """
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process the frame
        results = self.pose.process(rgb_frame)
        
        # Convert back to BGR for OpenCV
        annotated_frame = cv2.cvtColor(rgb_frame, cv2.COLOR_RGB2BGR)
        
        landmarks = None
        if results.pose_landmarks:
            # Draw pose landmarks
            self.mp_drawing.draw_landmarks(
                annotated_frame,
                results.pose_landmarks,
                self.mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=self.mp_drawing_styles.get_default_pose_landmarks_style()
            )
            
            # Extract landmark coordinates
            landmarks = self.extract_landmarks(results.pose_landmarks, frame.shape)
            
        return landmarks, annotated_frame
    
    def extract_landmarks(self, pose_landmarks, image_shape):
        """Extract landmark coordinates from MediaPipe results."""
        height, width = image_shape[:2]
        landmarks = []
        
        for landmark in pose_landmarks.landmark:
            x = int(landmark.x * width)
            y = int(landmark.y * height)
            z = landmark.z
            visibility = landmark.visibility
            landmarks.append([x, y, z, visibility])
            
        return landmarks
    
    def draw_exercise_info(self, frame, exercise_status):
        """Draw exercise information on the frame."""
        if not exercise_status:
            return frame
            
        # Draw background rectangle for info
        cv2.rectangle(frame, (10, 10), (400, 200), (0, 0, 0), -1)
        cv2.rectangle(frame, (10, 10), (400, 200), (255, 255, 255), 2)
        
        # Exercise info
        y_offset = 40
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.7
        color = (255, 255, 255)
        thickness = 2
        
        # Exercise name
        cv2.putText(frame, f"Exercise: {exercise_status['exercise']}", 
                   (20, y_offset), font, font_scale, color, thickness)
        y_offset += 30
        
        # Rep count
        cv2.putText(frame, f"Reps: {exercise_status['reps']}", 
                   (20, y_offset), font, font_scale, color, thickness)
        y_offset += 30
        
        # Current state
        cv2.putText(frame, f"State: {exercise_status['current_state']}", 
                   (20, y_offset), font, font_scale, color, thickness)
        y_offset += 30
        
        # Form score
        score_color = (0, 255, 0) if exercise_status['form_score'] > 80 else (0, 165, 255) if exercise_status['form_score'] > 60 else (0, 0, 255)
        cv2.putText(frame, f"Form Score: {exercise_status['form_score']}%", 
                   (20, y_offset), font, font_scale, score_color, thickness)
        y_offset += 30
        
        # Current angle
        cv2.putText(frame, f"Angle: {exercise_status['current_angle']:.1f}°", 
                   (20, y_offset), font, font_scale, color, thickness)
        
        # Feedback messages
        if exercise_status['feedback']:
            y_feedback = frame.shape[0] - 100
            cv2.rectangle(frame, (10, y_feedback - 30), (400, frame.shape[0] - 10), (0, 0, 255), -1)
            cv2.rectangle(frame, (10, y_feedback - 30), (400, frame.shape[0] - 10), (255, 255, 255), 2)
            
            for i, message in enumerate(exercise_status['feedback'][:2]):  # Show max 2 messages
                cv2.putText(frame, message, (20, y_feedback + i * 25), 
                           font, 0.6, (255, 255, 255), 2)
        
        return frame
    
    def draw_angle_visualization(self, frame, landmarks, landmark_indices, angle):
        """Draw angle visualization on specific landmarks."""
        if not landmarks or len(landmarks) < max(landmark_indices):
            return frame
            
        points = [landmarks[i][:2] for i in landmark_indices]  # Get x, y coordinates
        
        # Draw lines between points
        cv2.line(frame, tuple(points[0]), tuple(points[1]), (255, 0, 0), 3)
        cv2.line(frame, tuple(points[1]), tuple(points[2]), (255, 0, 0), 3)
        
        # Draw circles at joint points
        for point in points:
            cv2.circle(frame, tuple(point), 8, (0, 255, 255), -1)
        
        # Draw angle text
        angle_text = f"{angle:.1f}°"
        text_position = (points[1][0] + 20, points[1][1] - 20)
        cv2.putText(frame, angle_text, text_position, 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)
        
        return frame
    
    def release(self):
        """Release MediaPipe resources."""
        self.pose.close()