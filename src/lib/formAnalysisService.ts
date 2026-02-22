/**
 * Form Analysis Service
 * Advanced algorithms for analyzing exercise form and providing feedback
 * Enhanced with biomechanical rules and injury risk assessment
 */

import type {
  PoseLandmark,
  FormAnalysis,
  FormIssue,
  KeyPointAccuracy,
  PoseKeypoint,
} from '@/types/pose';

import type {
  FormAnalysisResult,
  FormViolation,
  ExerciseAngles
} from '@/types/advancedPose';

import { 
  ViolationType,
  Severity,
  RiskLevel,
  ExerciseState,
  ExerciseMode
} from '@/types/advancedPose';

import { calculateKneeAngle, calculateHipAngle, calculateOffsetAngle } from './angleCalculator';

export interface ExerciseFormRules {
  exerciseId: string;
  name: string;
  keyJoints: string[];
  alignmentRules: AlignmentRule[];
  rangeOfMotionRules: RangeOfMotionRule[];
  postureRules: PostureRule[];
  timingRules?: TimingRule[];
}

export interface AlignmentRule {
  name: string;
  joints: string[];
  expectedAlignment: 'vertical' | 'horizontal' | 'parallel';
  tolerance: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  correction: string;
}

export interface RangeOfMotionRule {
  name: string;
  joint: string;
  minAngle: number;
  maxAngle: number;
  phase: 'start' | 'middle' | 'end' | 'all';
  severity: 'low' | 'medium' | 'high';
  description: string;
  correction: string;
}

export interface PostureRule {
  name: string;
  description: string;
  checkFunction: (landmarks: PoseLandmark[]) => boolean;
  severity: 'low' | 'medium' | 'high';
  correction: string;
}

export interface TimingRule {
  name: string;
  phase: string;
  expectedDuration: number;
  tolerance: number;
  description: string;
  correction: string;
}

// MediaPipe pose landmark indices
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

export class FormAnalysisService {
  private exerciseRules: Map<string, ExerciseFormRules> = new Map();

  constructor() {
    this.initializeExerciseRules();
  }

  /**
   * Initialize form rules for different exercises
   */
  private initializeExerciseRules(): void {
    // Push-up form rules
    this.exerciseRules.set('pushup', {
      exerciseId: 'pushup',
      name: 'Push-up',
      keyJoints: ['shoulders', 'elbows', 'hips', 'knees', 'ankles'],
      alignmentRules: [
        {
          name: 'body_alignment',
          joints: ['shoulders', 'hips', 'ankles'],
          expectedAlignment: 'parallel',
          tolerance: 0.1,
          severity: 'high',
          description: 'Body should form a straight line',
          correction: 'Keep your body in a straight line from head to heels',
        },
        {
          name: 'shoulder_alignment',
          joints: ['left_shoulder', 'right_shoulder'],
          expectedAlignment: 'horizontal',
          tolerance: 0.05,
          severity: 'medium',
          description: 'Shoulders should be level',
          correction: 'Keep both shoulders at the same height',
        },
      ],
      rangeOfMotionRules: [
        {
          name: 'elbow_flexion',
          joint: 'elbow',
          minAngle: 45,
          maxAngle: 90,
          phase: 'middle',
          severity: 'medium',
          description: 'Elbows should bend to 90 degrees',
          correction: 'Lower your chest until elbows reach 90 degrees',
        },
      ],
      postureRules: [
        {
          name: 'plank_position',
          description: 'Maintain plank position throughout movement',
          checkFunction: this.checkPlankPosition.bind(this),
          severity: 'high',
          correction: 'Engage your core and maintain a straight body line',
        },
      ],
    });

    // Squat form rules
    this.exerciseRules.set('squat', {
      exerciseId: 'squat',
      name: 'Squat',
      keyJoints: ['hips', 'knees', 'ankles', 'shoulders'],
      alignmentRules: [
        {
          name: 'knee_alignment',
          joints: ['knees', 'ankles'],
          expectedAlignment: 'vertical',
          tolerance: 0.1,
          severity: 'high',
          description: 'Knees should track over toes',
          correction: 'Keep your knees aligned with your toes',
        },
        {
          name: 'torso_upright',
          joints: ['shoulders', 'hips'],
          expectedAlignment: 'vertical',
          tolerance: 0.2,
          severity: 'medium',
          description: 'Keep torso upright',
          correction: 'Keep your chest up and back straight',
        },
      ],
      rangeOfMotionRules: [
        {
          name: 'hip_flexion',
          joint: 'hip',
          minAngle: 90,
          maxAngle: 120,
          phase: 'middle',
          severity: 'medium',
          description: 'Squat to at least 90 degrees',
          correction: 'Lower until your thighs are parallel to the ground',
        },
      ],
      postureRules: [
        {
          name: 'weight_distribution',
          description: 'Weight should be evenly distributed',
          checkFunction: this.checkWeightDistribution.bind(this),
          severity: 'medium',
          correction: 'Keep weight evenly distributed on both feet',
        },
      ],
    });

    // Plank form rules
    this.exerciseRules.set('plank', {
      exerciseId: 'plank',
      name: 'Plank',
      keyJoints: ['shoulders', 'elbows', 'hips', 'knees', 'ankles'],
      alignmentRules: [
        {
          name: 'body_line',
          joints: ['shoulders', 'hips', 'ankles'],
          expectedAlignment: 'parallel',
          tolerance: 0.08,
          severity: 'high',
          description: 'Body should form a straight line',
          correction: 'Keep your body in a straight line from head to heels',
        },
      ],
      rangeOfMotionRules: [],
      postureRules: [
        {
          name: 'core_engagement',
          description: 'Core should be engaged',
          checkFunction: this.checkCoreEngagement.bind(this),
          severity: 'high',
          correction: 'Engage your core muscles and avoid sagging hips',
        },
      ],
    });

    // Bicep Curls form rules
    this.exerciseRules.set('bicep_curl', {
      exerciseId: 'bicep_curl',
      name: 'Bicep Curl',
      keyJoints: ['shoulders', 'elbows', 'wrists', 'hips'],
      alignmentRules: [
        {
          name: 'elbow_stability',
          joints: ['left_elbow', 'right_elbow'],
          expectedAlignment: 'vertical',
          tolerance: 0.1,
          severity: 'high',
          description: 'Elbows should stay close to your sides',
          correction: 'Keep your elbows tucked against your ribs',
        },
        {
          name: 'shoulder_stability',
          joints: ['left_shoulder', 'right_shoulder'],
          expectedAlignment: 'horizontal',
          tolerance: 0.05,
          severity: 'medium',
          description: 'Shoulders should remain level and stable',
          correction: 'Keep your shoulders down and back, avoid shrugging',
        },
      ],
      rangeOfMotionRules: [
        {
          name: 'elbow_flexion',
          joint: 'elbow',
          minAngle: 30,
          maxAngle: 150,
          phase: 'all',
          severity: 'medium',
          description: 'Full range of motion from extended to fully flexed',
          correction: 'Curl the weight all the way up and lower it completely',
        },
      ],
      postureRules: [
        {
          name: 'upright_posture',
          description: 'Maintain upright posture throughout movement',
          checkFunction: this.checkUprightPosture.bind(this),
          severity: 'medium',
          correction: 'Stand tall with core engaged, avoid swinging or leaning',
        },
        {
          name: 'controlled_movement',
          description: 'Movement should be controlled and deliberate',
          checkFunction: this.checkControlledMovement.bind(this),
          severity: 'medium',
          correction: 'Use slow, controlled movements - avoid momentum',
        },
      ],
    });
  }

  /**
   * Analyze pose form for a specific exercise
   */
  analyzePoseForm(landmarks: PoseLandmark[], exerciseId: string): FormAnalysis {
    const rules = this.exerciseRules.get(exerciseId);
    
    if (!rules) {
      // Fallback to basic analysis for unknown exercises
      return this.basicFormAnalysis(landmarks, exerciseId);
    }

    const analysis: FormAnalysis = {
      exerciseId,
      correctness: 1.0,
      issues: [],
      suggestions: [],
      keyPointAccuracy: [],
    };

    // Check alignment rules
    for (const rule of rules.alignmentRules) {
      const alignmentIssue = this.checkAlignment(landmarks, rule);
      if (alignmentIssue) {
        analysis.issues.push(alignmentIssue);
        analysis.correctness *= 0.8; // Reduce score for alignment issues
      }
    }

    // Check range of motion rules
    for (const rule of rules.rangeOfMotionRules) {
      const romIssue = this.checkRangeOfMotion(landmarks, rule);
      if (romIssue) {
        analysis.issues.push(romIssue);
        analysis.correctness *= 0.85; // Reduce score for ROM issues
      }
    }

    // Check posture rules
    for (const rule of rules.postureRules) {
      const postureIssue = this.checkPosture(landmarks, rule);
      if (postureIssue) {
        analysis.issues.push(postureIssue);
        analysis.correctness *= 0.75; // Reduce score for posture issues
      }
    }

    // Calculate key point accuracy
    analysis.keyPointAccuracy = this.calculateKeyPointAccuracy(landmarks, rules);

    // Generate suggestions based on issues
    analysis.suggestions = this.generateSuggestions(analysis.issues);

    // Ensure correctness is between 0 and 1
    analysis.correctness = Math.max(0, Math.min(1, analysis.correctness));

    return analysis;
  }

  /**
   * Check alignment rule
   */
  private checkAlignment(landmarks: PoseLandmark[], rule: AlignmentRule): FormIssue | null {
    const jointPositions = this.getJointPositions(landmarks, rule.joints);
    
    if (jointPositions.length < 2) {
      return null; // Not enough joints visible
    }

    let isAligned = false;
    
    switch (rule.expectedAlignment) {
      case 'horizontal':
        isAligned = this.checkHorizontalAlignment(jointPositions, rule.tolerance);
        break;
      case 'vertical':
        isAligned = this.checkVerticalAlignment(jointPositions, rule.tolerance);
        break;
      case 'parallel':
        isAligned = this.checkParallelAlignment(jointPositions, rule.tolerance);
        break;
    }

    if (!isAligned) {
      return {
        type: 'alignment',
        severity: rule.severity,
        description: rule.description,
        correction: rule.correction,
        affectedJoints: rule.joints,
      };
    }

    return null;
  }

  /**
   * Check range of motion rule
   */
  private checkRangeOfMotion(landmarks: PoseLandmark[], rule: RangeOfMotionRule): FormIssue | null {
    const angle = this.calculateJointAngle(landmarks, rule.joint);
    
    if (angle === null) {
      return null; // Could not calculate angle
    }

    if (angle < rule.minAngle || angle > rule.maxAngle) {
      return {
        type: 'range_of_motion',
        severity: rule.severity,
        description: rule.description,
        correction: rule.correction,
        affectedJoints: [rule.joint],
      };
    }

    return null;
  }

  /**
   * Check posture rule
   */
  private checkPosture(landmarks: PoseLandmark[], rule: PostureRule): FormIssue | null {
    const isCorrect = rule.checkFunction(landmarks);
    
    if (!isCorrect) {
      return {
        type: 'posture',
        severity: rule.severity,
        description: rule.description,
        correction: rule.correction,
        affectedJoints: [], // Posture affects multiple joints
      };
    }

    return null;
  }

  /**
   * Get joint positions from landmarks
   */
  private getJointPositions(landmarks: PoseLandmark[], jointNames: string[]): PoseLandmark[] {
    const positions: PoseLandmark[] = [];
    
    for (const jointName of jointNames) {
      const index = this.getJointIndex(jointName);
      if (index !== -1 && landmarks[index] && landmarks[index].visibility > 0.5) {
        positions.push(landmarks[index]);
      }
    }
    
    return positions;
  }

  /**
   * Get landmark index for joint name
   */
  private getJointIndex(jointName: string): number {
    const jointMap: Record<string, number> = {
      'nose': POSE_LANDMARKS.NOSE,
      'left_shoulder': POSE_LANDMARKS.LEFT_SHOULDER,
      'right_shoulder': POSE_LANDMARKS.RIGHT_SHOULDER,
      'left_elbow': POSE_LANDMARKS.LEFT_ELBOW,
      'right_elbow': POSE_LANDMARKS.RIGHT_ELBOW,
      'left_wrist': POSE_LANDMARKS.LEFT_WRIST,
      'right_wrist': POSE_LANDMARKS.RIGHT_WRIST,
      'left_hip': POSE_LANDMARKS.LEFT_HIP,
      'right_hip': POSE_LANDMARKS.RIGHT_HIP,
      'left_knee': POSE_LANDMARKS.LEFT_KNEE,
      'right_knee': POSE_LANDMARKS.RIGHT_KNEE,
      'left_ankle': POSE_LANDMARKS.LEFT_ANKLE,
      'right_ankle': POSE_LANDMARKS.RIGHT_ANKLE,
      // Compound joints (use average or primary joint)
      'shoulders': POSE_LANDMARKS.LEFT_SHOULDER, // Will handle both in alignment check
      'hips': POSE_LANDMARKS.LEFT_HIP,
      'knees': POSE_LANDMARKS.LEFT_KNEE,
      'ankles': POSE_LANDMARKS.LEFT_ANKLE,
      'elbows': POSE_LANDMARKS.LEFT_ELBOW,
    };
    
    return jointMap[jointName] ?? -1;
  }

  /**
   * Check horizontal alignment
   */
  private checkHorizontalAlignment(positions: PoseLandmark[], tolerance: number): boolean {
    if (positions.length < 2) return true;
    
    const yValues = positions.map(p => p.y);
    const avgY = yValues.reduce((sum, y) => sum + y, 0) / yValues.length;
    
    return yValues.every(y => Math.abs(y - avgY) <= tolerance);
  }

  /**
   * Check vertical alignment
   */
  private checkVerticalAlignment(positions: PoseLandmark[], tolerance: number): boolean {
    if (positions.length < 2) return true;
    
    const xValues = positions.map(p => p.x);
    const avgX = xValues.reduce((sum, x) => sum + x, 0) / xValues.length;
    
    return xValues.every(x => Math.abs(x - avgX) <= tolerance);
  }

  /**
   * Check parallel alignment (straight line)
   */
  private checkParallelAlignment(positions: PoseLandmark[], tolerance: number): boolean {
    if (positions.length < 3) return true;
    
    // Check if points form approximately a straight line
    const first = positions[0];
    const last = positions[positions.length - 1];
    
    // Calculate expected line
    const dx = last.x - first.x;
    const dy = last.y - first.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return true;
    
    // Check if intermediate points are close to the line
    for (let i = 1; i < positions.length - 1; i++) {
      const point = positions[i];
      const distance = this.pointToLineDistance(point, first, last);
      if (distance > tolerance) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Calculate distance from point to line
   */
  private pointToLineDistance(point: PoseLandmark, lineStart: PoseLandmark, lineEnd: PoseLandmark): number {
    const A = lineEnd.y - lineStart.y;
    const B = lineStart.x - lineEnd.x;
    const C = lineEnd.x * lineStart.y - lineStart.x * lineEnd.y;
    
    return Math.abs(A * point.x + B * point.y + C) / Math.sqrt(A * A + B * B);
  }

  /**
   * Calculate joint angle
   */
  private calculateJointAngle(landmarks: PoseLandmark[], jointName: string): number | null {
    // This is a simplified implementation
    // In a real application, you would calculate angles between specific bone segments
    
    if (jointName === 'elbow') {
      const shoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
      const elbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
      const wrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
      
      if (shoulder && elbow && wrist && 
          shoulder.visibility > 0.5 && elbow.visibility > 0.5 && wrist.visibility > 0.5) {
        return this.calculateAngleBetweenPoints(shoulder, elbow, wrist);
      }
    }
    
    if (jointName === 'hip') {
      const hip = landmarks[POSE_LANDMARKS.LEFT_HIP];
      const knee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
      const shoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
      
      if (hip && knee && shoulder && 
          hip.visibility > 0.5 && knee.visibility > 0.5 && shoulder.visibility > 0.5) {
        return this.calculateAngleBetweenPoints(shoulder, hip, knee);
      }
    }
    
    return null;
  }

  /**
   * Calculate angle between three points
   */
  private calculateAngleBetweenPoints(p1: PoseLandmark, p2: PoseLandmark, p3: PoseLandmark): number {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    if (mag1 === 0 || mag2 === 0) return 0;
    
    const cos = dot / (mag1 * mag2);
    const angle = Math.acos(Math.max(-1, Math.min(1, cos)));
    
    return (angle * 180) / Math.PI;
  }

  /**
   * Posture check functions
   */
  private checkPlankPosition(landmarks: PoseLandmark[]): boolean {
    const shoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const hip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const ankle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
    
    if (!shoulder || !hip || !ankle || 
        shoulder.visibility < 0.5 || hip.visibility < 0.5 || ankle.visibility < 0.5) {
      return true; // Can't determine, assume correct
    }
    
    // Check if body forms a straight line (within tolerance)
    const distance = this.pointToLineDistance(hip, shoulder, ankle);
    return distance < 0.1;
  }

  private checkWeightDistribution(landmarks: PoseLandmark[]): boolean {
    const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
    
    if (!leftAnkle || !rightAnkle || !leftHip || !rightHip ||
        leftAnkle.visibility < 0.5 || rightAnkle.visibility < 0.5 ||
        leftHip.visibility < 0.5 || rightHip.visibility < 0.5) {
      return true; // Can't determine, assume correct
    }
    
    // Check if weight is evenly distributed (hips centered over ankles)
    const hipCenter = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
    const ankleCenter = { x: (leftAnkle.x + rightAnkle.x) / 2, y: (leftAnkle.y + rightAnkle.y) / 2 };
    
    const distance = Math.abs(hipCenter.x - ankleCenter.x);
    return distance < 0.1;
  }

  private checkCoreEngagement(landmarks: PoseLandmark[]): boolean {
    // This is a simplified check - in reality, core engagement is hard to detect visually
    // We'll check for hip sagging as a proxy
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
    
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip ||
        leftShoulder.visibility < 0.5 || rightShoulder.visibility < 0.5 ||
        leftHip.visibility < 0.5 || rightHip.visibility < 0.5) {
      return true; // Can't determine, assume correct
    }
    
    const shoulderCenter = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
    const hipCenter = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
    
    // Check if hips are not sagging (should be roughly level with shoulders)
    const verticalDifference = Math.abs(shoulderCenter.y - hipCenter.y);
    return verticalDifference < 0.15; // Allow some natural body curve
  }

  private checkUprightPosture(landmarks: PoseLandmark[]): boolean {
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
    
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip ||
        leftShoulder.visibility < 0.5 || rightShoulder.visibility < 0.5 ||
        leftHip.visibility < 0.5 || rightHip.visibility < 0.5) {
      return true; // Can't determine, assume correct
    }
    
    // Check if torso is upright (shoulders should be roughly above hips)
    const shoulderCenter = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
    const hipCenter = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
    
    // Check horizontal alignment (shoulders shouldn't be too far forward/back from hips)
    const horizontalOffset = Math.abs(shoulderCenter.x - hipCenter.x);
    return horizontalOffset < 0.15; // Allow some natural forward lean
  }

  private checkControlledMovement(landmarks: PoseLandmark[]): boolean {
    // This is a simplified check - in reality, we'd need to track movement over time
    // For now, we'll check if the pose is stable (good visibility on key joints)
    const leftElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
    const rightElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
    const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
    const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];
    
    if (!leftElbow || !rightElbow || !leftWrist || !rightWrist) {
      return false; // Can't see arms properly
    }
    
    // Check if all arm joints are clearly visible (indicates stable, controlled movement)
    const avgVisibility = (leftElbow.visibility + rightElbow.visibility + 
                          leftWrist.visibility + rightWrist.visibility) / 4;
    
    return avgVisibility > 0.7; // High visibility indicates controlled movement
  }

  /**
   * Calculate key point accuracy
   */
  private calculateKeyPointAccuracy(landmarks: PoseLandmark[], rules: ExerciseFormRules): KeyPointAccuracy[] {
    const accuracy: KeyPointAccuracy[] = [];
    
    for (const jointName of rules.keyJoints) {
      const index = this.getJointIndex(jointName);
      if (index !== -1 && landmarks[index]) {
        const landmark = landmarks[index];
        
        // Simple accuracy based on visibility and position stability
        const accuracyScore = Math.min(1.0, landmark.visibility * 1.2);
        
        accuracy.push({
          joint: jointName,
          accuracy: accuracyScore,
          expected: landmark, // In a real system, this would be the ideal position
          actual: landmark,
        });
      }
    }
    
    return accuracy;
  }

  /**
   * Generate suggestions based on issues
   */
  private generateSuggestions(issues: FormIssue[]): string[] {
    const suggestions: string[] = [];
    const issueTypes = new Set(issues.map(issue => issue.type));
    
    if (issueTypes.has('alignment')) {
      suggestions.push('Focus on maintaining proper body alignment throughout the movement');
    }
    
    if (issueTypes.has('range_of_motion')) {
      suggestions.push('Pay attention to the full range of motion for maximum effectiveness');
    }
    
    if (issueTypes.has('posture')) {
      suggestions.push('Engage your core and maintain good posture');
    }
    
    // Add severity-based suggestions
    const highSeverityIssues = issues.filter(issue => issue.severity === 'high');
    if (highSeverityIssues.length > 0) {
      suggestions.push('Address the major form issues first before increasing intensity');
    }
    
    return suggestions;
  }

  /**
   * Basic form analysis for unknown exercises
   */
  private basicFormAnalysis(landmarks: PoseLandmark[], exerciseId: string): FormAnalysis {
    const analysis: FormAnalysis = {
      exerciseId,
      correctness: this.calculateBasicFormScore(landmarks),
      issues: [],
      suggestions: [],
      keyPointAccuracy: [],
    };

    // Basic posture checks
    if (landmarks.length >= 33) {
      const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
      const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
      const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
      const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];

      // Check if shoulders are level
      if (leftShoulder && rightShoulder && 
          leftShoulder.visibility > 0.5 && rightShoulder.visibility > 0.5) {
        const shoulderDifference = Math.abs(leftShoulder.y - rightShoulder.y);
        if (shoulderDifference > 0.05) {
          analysis.issues.push({
            type: 'posture',
            severity: 'medium',
            description: 'Shoulders appear uneven',
            correction: 'Keep your shoulders level and aligned',
            affectedJoints: ['left_shoulder', 'right_shoulder'],
          });
        }
      }

      // Check if hips are level
      if (leftHip && rightHip && 
          leftHip.visibility > 0.5 && rightHip.visibility > 0.5) {
        const hipDifference = Math.abs(leftHip.y - rightHip.y);
        if (hipDifference > 0.05) {
          analysis.issues.push({
            type: 'posture',
            severity: 'medium',
            description: 'Hips appear uneven',
            correction: 'Keep your hips level and aligned',
            affectedJoints: ['left_hip', 'right_hip'],
          });
        }
      }
    }

    analysis.suggestions = this.generateSuggestions(analysis.issues);
    return analysis;
  }

  /**
   * Calculate basic form score
   */
  private calculateBasicFormScore(landmarks: PoseLandmark[]): number {
    if (landmarks.length === 0) return 0;

    let score = 1.0;
    let visibilitySum = 0;
    let visibleLandmarks = 0;

    for (const landmark of landmarks) {
      if (landmark.visibility > 0.5) {
        visibilitySum += landmark.visibility;
        visibleLandmarks++;
      }
    }

    if (visibleLandmarks > 0) {
      const averageVisibility = visibilitySum / visibleLandmarks;
      score = Math.min(score, averageVisibility);
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get available exercises with form rules
   */
  getAvailableExercises(): string[] {
    return Array.from(this.exerciseRules.keys());
  }

  /**
   * Get exercise rules for a specific exercise
   */
  getExerciseRules(exerciseId: string): ExerciseFormRules | undefined {
    return this.exerciseRules.get(exerciseId);
  }

  /**
   * Enhanced biomechanical analysis for squat exercises
   * Integrates with angle calculator and state machine for comprehensive form assessment
   */
  analyzeSquatBiomechanics(
    landmarks: PoseLandmark[], 
    exerciseState: ExerciseState,
    exerciseMode: ExerciseMode
  ): FormAnalysisResult {
    const violations: FormViolation[] = [];
    let riskLevel: RiskLevel = RiskLevel.SAFE;

    try {
      // Calculate exercise angles using our angle calculator
      const angles = this.calculateExerciseAngles(landmarks);
      
      if (!angles) {
        return {
          isCorrectForm: false,
          violations: [{
            type: ViolationType.INSUFFICIENT_DEPTH,
            severity: Severity.HIGH,
            description: 'Unable to detect pose landmarks clearly',
            correctionHint: 'Ensure you are fully visible in the camera frame'
          }],
          recommendations: ['Position yourself fully in the camera view'],
          riskLevel: RiskLevel.WARNING
        };
      }

      // 1. Check for knee-over-toes violation (most critical for injury prevention)
      const kneeOverToesViolation = this.checkKneeOverToes(landmarks, angles);
      if (kneeOverToesViolation) {
        violations.push(kneeOverToesViolation);
        riskLevel = this.escalateRiskLevel(riskLevel, RiskLevel.WARNING);
      }

      // 2. Check squat depth based on exercise state and mode
      const depthViolation = this.checkSquatDepth(angles, exerciseState, exerciseMode);
      if (depthViolation) {
        violations.push(depthViolation);
        riskLevel = this.escalateRiskLevel(riskLevel, RiskLevel.CAUTION);
      }

      // 3. Check forward/backward lean
      const leanViolation = this.checkTorsoLean(landmarks, angles);
      if (leanViolation) {
        violations.push(leanViolation);
        riskLevel = this.escalateRiskLevel(riskLevel, RiskLevel.CAUTION);
      }

      // 4. Check for excessive depth (injury risk)
      const excessiveDepthViolation = this.checkExcessiveDepth(angles, exerciseMode);
      if (excessiveDepthViolation) {
        violations.push(excessiveDepthViolation);
        riskLevel = this.escalateRiskLevel(riskLevel, RiskLevel.DANGER);
      }

      // 5. Check ankle mobility and stability
      const ankleViolation = this.checkAnkleStability(landmarks, angles);
      if (ankleViolation) {
        violations.push(ankleViolation);
        riskLevel = this.escalateRiskLevel(riskLevel, RiskLevel.CAUTION);
      }

      // Generate recommendations based on violations
      const recommendations = this.generateBiomechanicalRecommendations(violations, exerciseMode);

      return {
        isCorrectForm: violations.length === 0,
        violations,
        recommendations,
        riskLevel
      };

    } catch (error) {
      console.error('Error in biomechanical analysis:', error);
      return {
        isCorrectForm: false,
        violations: [{
          type: ViolationType.INSUFFICIENT_DEPTH,
          severity: Severity.HIGH,
          description: 'Analysis error occurred',
          correctionHint: 'Please check your camera positioning and try again'
        }],
        recommendations: ['Ensure proper lighting and camera positioning'],
        riskLevel: RiskLevel.WARNING
      };
    }
  }

  /**
   * Calculate exercise angles from pose landmarks
   */
  private calculateExerciseAngles(landmarks: PoseLandmark[]): ExerciseAngles | null {
    try {
      const kneeAngle = calculateKneeAngle(landmarks);
      const hipAngle = calculateHipAngle(landmarks);
      const offsetAngle = calculateOffsetAngle(landmarks);

      if (kneeAngle === null || hipAngle === null || offsetAngle === null) {
        return null;
      }

      return {
        kneeAngle,
        hipAngle,
        ankleAngle: 90, // Simplified for now - could be calculated if needed
        offsetAngle
      };
    } catch (error) {
      console.error('Error calculating exercise angles:', error);
      return null;
    }
  }

  /**
   * Check for knee-over-toes violation (critical for knee safety)
   */
  private checkKneeOverToes(landmarks: PoseLandmark[], angles: ExerciseAngles): FormViolation | null {
    const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
    const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
    const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

    if (!leftKnee || !rightKnee || !leftAnkle || !rightAnkle ||
        leftKnee.visibility < 0.7 || rightKnee.visibility < 0.7 ||
        leftAnkle.visibility < 0.7 || rightAnkle.visibility < 0.7) {
      return null; // Can't determine reliably
    }

    // Check if knees extend significantly beyond toes (in x-direction)
    const leftKneeOverToe = leftKnee.x - leftAnkle.x;
    const rightKneeOverToe = rightKnee.x - rightAnkle.x;
    
    // Threshold for knee-over-toe violation (normalized coordinates)
    const violationThreshold = 0.05; // 5% of frame width
    
    if (Math.abs(leftKneeOverToe) > violationThreshold || Math.abs(rightKneeOverToe) > violationThreshold) {
      const severity = Math.max(Math.abs(leftKneeOverToe), Math.abs(rightKneeOverToe)) > 0.08 
        ? Severity.HIGH : Severity.MEDIUM;

      return {
        type: ViolationType.KNEE_OVER_TOES,
        severity,
        description: 'Knees are extending too far forward over toes',
        correctionHint: 'Push your hips back more and keep knees aligned over your feet'
      };
    }

    return null;
  }

  /**
   * Check squat depth based on exercise state and mode
   */
  private checkSquatDepth(angles: ExerciseAngles, state: ExerciseState, mode: ExerciseMode): FormViolation | null {
    // Only check depth when in deep squat state
    if (state !== ExerciseState.S3_DEEP_SQUAT) {
      return null;
    }

    const minDepthAngle = mode === ExerciseMode.PRO ? 80 : 75; // Pro mode requires deeper squat
    const optimalDepthAngle = mode === ExerciseMode.PRO ? 85 : 80;

    if (angles.kneeAngle > minDepthAngle + 15) {
      return {
        type: ViolationType.INSUFFICIENT_DEPTH,
        severity: Severity.MEDIUM,
        description: `Squat depth is insufficient for ${mode} mode`,
        correctionHint: `Lower until your thighs are parallel to the ground (knee angle ~${optimalDepthAngle}°)`
      };
    }

    return null;
  }

  /**
   * Check for forward or backward lean
   */
  private checkTorsoLean(landmarks: PoseLandmark[], angles: ExerciseAngles): FormViolation | null {
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip ||
        leftShoulder.visibility < 0.7 || rightShoulder.visibility < 0.7 ||
        leftHip.visibility < 0.7 || rightHip.visibility < 0.7) {
      return null;
    }

    // Calculate torso angle (shoulder to hip line vs vertical)
    const shoulderCenter = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
    const hipCenter = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };

    const torsoAngle = Math.atan2(shoulderCenter.x - hipCenter.x, hipCenter.y - shoulderCenter.y) * (180 / Math.PI);
    
    // Acceptable lean range (degrees from vertical)
    const maxForwardLean = 15;
    const maxBackwardLean = 10;

    if (torsoAngle > maxForwardLean) {
      return {
        type: ViolationType.FORWARD_LEAN,
        severity: torsoAngle > 25 ? Severity.HIGH : Severity.MEDIUM,
        description: 'Excessive forward lean detected',
        correctionHint: 'Keep your chest up and maintain a more upright torso position'
      };
    }

    if (torsoAngle < -maxBackwardLean) {
      return {
        type: ViolationType.BACKWARD_LEAN,
        severity: torsoAngle < -20 ? Severity.HIGH : Severity.MEDIUM,
        description: 'Excessive backward lean detected',
        correctionHint: 'Avoid leaning too far back, maintain neutral spine alignment'
      };
    }

    return null;
  }

  /**
   * Check for excessive squat depth (injury risk)
   */
  private checkExcessiveDepth(angles: ExerciseAngles, mode: ExerciseMode): FormViolation | null {
    // Excessive depth thresholds (too deep can stress knees and lower back)
    const maxDepthAngle = mode === ExerciseMode.PRO ? 60 : 65;

    if (angles.kneeAngle < maxDepthAngle) {
      return {
        type: ViolationType.EXCESSIVE_DEPTH,
        severity: Severity.HIGH,
        description: 'Squat depth is excessive and may cause injury',
        correctionHint: 'Avoid going too deep - stop when thighs are parallel to ground'
      };
    }

    return null;
  }

  /**
   * Check ankle stability and mobility
   */
  private checkAnkleStability(landmarks: PoseLandmark[], angles: ExerciseAngles): FormViolation | null {
    const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];
    const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
    const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];

    if (!leftAnkle || !rightAnkle || !leftKnee || !rightKnee ||
        leftAnkle.visibility < 0.7 || rightAnkle.visibility < 0.7 ||
        leftKnee.visibility < 0.7 || rightKnee.visibility < 0.7) {
      return null;
    }

    // Check for ankle collapse (knees caving inward)
    const ankleWidth = Math.abs(rightAnkle.x - leftAnkle.x);
    const kneeWidth = Math.abs(rightKnee.x - leftKnee.x);
    
    // Knees should not collapse inward significantly
    const collapseRatio = kneeWidth / ankleWidth;
    
    if (collapseRatio < 0.8) { // Knees are significantly narrower than ankles
      return {
        type: ViolationType.KNEE_OVER_TOES, // Reusing this type as it's related
        severity: Severity.MEDIUM,
        description: 'Knee valgus (inward collapse) detected',
        correctionHint: 'Push your knees outward to align with your toes'
      };
    }

    return null;
  }

  /**
   * Escalate risk level based on new violation
   */
  private escalateRiskLevel(currentLevel: RiskLevel, newLevel: RiskLevel): RiskLevel {
    const riskHierarchy = {
      [RiskLevel.SAFE]: 0,
      [RiskLevel.CAUTION]: 1,
      [RiskLevel.WARNING]: 2,
      [RiskLevel.DANGER]: 3
    };

    return riskHierarchy[newLevel] > riskHierarchy[currentLevel] ? newLevel : currentLevel;
  }

  /**
   * Generate biomechanical recommendations based on violations
   */
  private generateBiomechanicalRecommendations(violations: FormViolation[], mode: ExerciseMode): string[] {
    const recommendations: string[] = [];
    const violationTypes = new Set(violations.map(v => v.type));

    // Priority recommendations based on injury risk
    if (violationTypes.has(ViolationType.KNEE_OVER_TOES)) {
      recommendations.push('Focus on hip hinge movement - push hips back first before bending knees');
      recommendations.push('Practice wall squats to learn proper knee tracking');
    }

    if (violationTypes.has(ViolationType.EXCESSIVE_DEPTH)) {
      recommendations.push('Reduce squat depth to protect your knees and lower back');
      recommendations.push('Focus on controlled movement rather than maximum depth');
    }

    if (violationTypes.has(ViolationType.FORWARD_LEAN)) {
      recommendations.push('Strengthen your core and upper back to maintain upright posture');
      recommendations.push('Practice goblet squats to improve torso positioning');
    }

    if (violationTypes.has(ViolationType.INSUFFICIENT_DEPTH)) {
      if (mode === ExerciseMode.PRO) {
        recommendations.push('Work on ankle and hip mobility to achieve proper squat depth');
      } else {
        recommendations.push('Gradually increase squat depth as flexibility improves');
      }
    }

    // General recommendations
    if (violations.length > 2) {
      recommendations.push('Consider reducing weight or intensity to focus on form');
      recommendations.push('Practice bodyweight squats to master the movement pattern');
    }

    // Mode-specific recommendations
    if (mode === ExerciseMode.BEGINNER && violations.length > 0) {
      recommendations.push('Take your time - focus on learning proper form before progressing');
    } else if (mode === ExerciseMode.PRO && violations.length > 0) {
      recommendations.push('Review your form - even advanced practitioners need to maintain basics');
    }

    return recommendations.length > 0 ? recommendations : ['Great form! Keep up the excellent technique'];
  }

  /**
   * Assess injury risk based on biomechanical violations
   */
  assessInjuryRisk(violations: FormViolation[]): {
    riskLevel: RiskLevel;
    riskFactors: string[];
    preventionTips: string[];
  } {
    let riskLevel = RiskLevel.SAFE;
    const riskFactors: string[] = [];
    const preventionTips: string[] = [];

    for (const violation of violations) {
      switch (violation.type) {
        case ViolationType.KNEE_OVER_TOES:
          riskLevel = this.escalateRiskLevel(riskLevel, RiskLevel.WARNING);
          riskFactors.push('Increased knee stress and potential patellar tendon strain');
          preventionTips.push('Focus on hip-dominant movement pattern');
          break;

        case ViolationType.EXCESSIVE_DEPTH:
          riskLevel = this.escalateRiskLevel(riskLevel, RiskLevel.DANGER);
          riskFactors.push('Risk of knee hyperflexion and lower back strain');
          preventionTips.push('Limit depth to thigh-parallel position');
          break;

        case ViolationType.FORWARD_LEAN:
          riskLevel = this.escalateRiskLevel(riskLevel, RiskLevel.CAUTION);
          riskFactors.push('Increased spinal loading and potential back injury');
          preventionTips.push('Strengthen core and improve thoracic mobility');
          break;

        case ViolationType.BACKWARD_LEAN:
          riskLevel = this.escalateRiskLevel(riskLevel, RiskLevel.CAUTION);
          riskFactors.push('Risk of losing balance and falling backward');
          preventionTips.push('Improve ankle mobility and balance training');
          break;

        case ViolationType.INSUFFICIENT_DEPTH:
          // Lower risk but affects exercise effectiveness
          riskFactors.push('Reduced exercise effectiveness and muscle activation');
          preventionTips.push('Work on mobility and gradually increase range of motion');
          break;
      }
    }

    return {
      riskLevel,
      riskFactors,
      preventionTips
    };
  }
}

// Export singleton instance
export const formAnalysisService = new FormAnalysisService();