import cv2
import mediapipe as mp
import math

class PoseDetector:
    def __init__(self, min_detection_confidence=0.5, min_tracking_confidence=0.5):
        """
        Initialize MediaPipe Pose detector.
        
        Args:
            min_detection_confidence: Minimum confidence for pose detection
            min_tracking_confidence: Minimum confidence for pose tracking
        """
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            enable_segmentation=False,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )
    
    def find_pose(self, img, draw=True):
        """
        Find pose landmarks and draw skeleton on the image.
        
        Args:
            img: Input image (BGR format)
            draw: Whether to draw the pose landmarks
            
        Returns:
            img: Image with pose landmarks drawn
            landmarks: List of landmark positions
        """
        # Convert BGR to RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Process the image
        self.results = self.pose.process(img_rgb)
        
        landmarks = []
        
        if self.results.pose_landmarks:
            if draw:
                # Draw pose landmarks
                self.mp_drawing.draw_landmarks(
                    img,
                    self.results.pose_landmarks,
                    self.mp_pose.POSE_CONNECTIONS,
                    landmark_drawing_spec=self.mp_drawing_styles.get_default_pose_landmarks_style()
                )
            
            # Extract landmark coordinates
            for id, lm in enumerate(self.results.pose_landmarks.landmark):
                h, w, c = img.shape
                cx, cy = int(lm.x * w), int(lm.y * h)
                landmarks.append([id, cx, cy])
        
        return img, landmarks
    
    def find_angle(self, img, p1, p2, p3, landmarks, draw=True):
        """
        Calculate angle between three landmarks and draw it on the image.
        
        Args:
            img: Input image
            p1, p2, p3: Landmark indices (p2 is the vertex)
            landmarks: List of landmarks from find_pose
            draw: Whether to draw the angle on the image
            
        Returns:
            angle: Calculated angle in degrees (0-360)
        """
        if len(landmarks) == 0:
            return 0
        
        # Get landmark coordinates
        try:
            x1, y1 = landmarks[p1][1], landmarks[p1][2]
            x2, y2 = landmarks[p2][1], landmarks[p2][2]
            x3, y3 = landmarks[p3][1], landmarks[p3][2]
        except (IndexError, TypeError):
            return 0
        
        # Calculate angle using atan2
        angle = math.degrees(
            math.atan2(y3 - y2, x3 - x2) - math.atan2(y1 - y2, x1 - x2)
        )
        
        # Normalize angle to 0-360 range
        if angle < 0:
            angle += 360
        
        # Convert to 0-180 range for joint angles
        if angle > 180:
            angle = 360 - angle
        
        if draw:
            # Draw lines connecting the three points
            cv2.line(img, (x1, y1), (x2, y2), (255, 255, 255), 3)
            cv2.line(img, (x3, y3), (x2, y2), (255, 255, 255), 3)
            
            # Draw circles at the points
            cv2.circle(img, (x1, y1), 10, (0, 0, 255), cv2.FILLED)
            cv2.circle(img, (x2, y2), 10, (0, 0, 255), cv2.FILLED)
            cv2.circle(img, (x3, y3), 10, (0, 0, 255), cv2.FILLED)
            
            # Draw angle text
            cv2.putText(img, str(int(angle)), (x2 - 50, y2 + 50),
                       cv2.FONT_HERSHEY_PLAIN, 2, (0, 0, 255), 2)
        
        return angle