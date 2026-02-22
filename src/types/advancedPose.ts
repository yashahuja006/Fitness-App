/**
 * Advanced Pose Analysis Types
 * Enhanced types for professional-level biomechanical analysis
 */

import type { PoseLandmark } from './pose';

// Core Exercise Types
export enum ExerciseType {
  SQUAT = 'squat',
  PUSHUP = 'pushup',
  PLANK = 'plank',
  DEADLIFT = 'deadlift',
  BICEP_CURL = 'bicep_curl'
}

export enum ExerciseMode {
  BEGINNER = 'beginner',
  PRO = 'pro'
}

// Exercise State Machine
export enum ExerciseState {
  S1_STANDING = 's1',    // knee angle > 160°
  S2_TRANSITION = 's2',  // 80° < knee angle < 160°
  S3_DEEP_SQUAT = 's3'   // knee angle < 80°
}

export interface StateTransition {
  previousState: ExerciseState;
  currentState: ExerciseState;
  timestamp: number;
  triggerAngles: ExerciseAngles;
}

// Angle Calculations
export interface ExerciseAngles {
  kneeAngle: number;
  hipAngle: number;
  ankleAngle: number;
  offsetAngle: number;
}

export interface Landmark {
  x: number; // Normalized [0.0, 1.0]
  y: number; // Normalized [0.0, 1.0]
  z: number; // Depth relative to hip midpoint
  visibility: number; // Confidence score [0.0, 1.0]
}

// Form Analysis
export interface FormAnalysisResult {
  isCorrectForm: boolean;
  violations: FormViolation[];
  recommendations: string[];
  riskLevel: RiskLevel;
}

export interface FormViolation {
  type: ViolationType;
  severity: Severity;
  description: string;
  correctionHint: string;
}

export enum ViolationType {
  KNEE_OVER_TOES = 'knee_over_toes',
  INSUFFICIENT_DEPTH = 'insufficient_depth',
  EXCESSIVE_DEPTH = 'excessive_depth',
  FORWARD_LEAN = 'forward_lean',
  BACKWARD_LEAN = 'backward_lean'
}

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum RiskLevel {
  SAFE = 'safe',
  CAUTION = 'caution',
  WARNING = 'warning',
  DANGER = 'danger'
}

// Rep Counting
export interface RepCounts {
  correctReps: number;
  incorrectReps: number;
  totalReps: number;
  currentStreak: number;
  sessionStartTime: number;
}

export interface RepCountResult {
  repCompleted: boolean;
  repQuality: RepQuality;
  feedback: string;
  shouldReset: boolean;
}

export enum RepQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  NEEDS_IMPROVEMENT = 'needs_improvement',
  POOR = 'poor'
}

// Feedback System
export interface FeedbackResponse {
  audioMessages: string[];
  visualCues: VisualCue[];
  priority: FeedbackPriority;
  shouldSpeak: boolean;
}

export interface VisualCue {
  type: CueType;
  position: ScreenPosition;
  color: string;
  message: string;
  duration: number;
}

export enum CueType {
  ANGLE_INDICATOR = 'angle_indicator',
  FORM_WARNING = 'form_warning',
  POSITIONING_GUIDE = 'positioning_guide',
  REP_COUNTER = 'rep_counter'
}

export enum FeedbackPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ScreenPosition {
  x: number; // Percentage of screen width
  y: number; // Percentage of screen height
}

// Camera View Optimization
export interface ViewAnalysis {
  viewType: ViewType;
  offsetAngle: number;
  confidence: number;
  recommendations: string[];
}

export enum ViewType {
  OPTIMAL_SIDE = 'optimal_side',
  SUBOPTIMAL_SIDE = 'suboptimal_side',
  FRONTAL = 'frontal',
  UNKNOWN = 'unknown'
}

export interface PositioningGuidance {
  message: string;
  visualGuides: PositionGuide[];
  isBlocking: boolean;
}

export interface PositionGuide {
  type: 'arrow' | 'circle' | 'text';
  position: ScreenPosition;
  color: string;
  message: string;
}

// Exercise Configuration
export interface ExerciseThresholds {
  beginner: ModeThresholds;
  pro: ModeThresholds;
}

export interface ModeThresholds {
  kneeAngle: AngleThresholds;
  hipAngle: AngleThresholds;
  offsetAngle: AngleThresholds;
  feedbackSensitivity: number; // 0.0 - 1.0
  inactivityTimeout: number; // seconds
}

export interface AngleThresholds {
  s1Threshold: number; // Standing position
  s2Range: [number, number]; // Transition range
  s3Threshold: number; // Deep squat
  warningTolerance: number; // Degrees of tolerance before warning
}

// Session Data
export interface ExerciseSession {
  id: string;
  userId: string;
  exerciseType: ExerciseType;
  mode: ExerciseMode;
  startTime: Date;
  endTime?: Date;
  reps: RepData[];
  summary: SessionSummary;
}

export interface RepData {
  repNumber: number;
  quality: RepQuality;
  duration: number;
  stateTransitions: StateTransition[];
  violations: FormViolation[];
  angles: {
    min: ExerciseAngles;
    max: ExerciseAngles;
    average: ExerciseAngles;
  };
}

export interface SessionSummary {
  totalReps: number;
  correctReps: number;
  averageRepQuality: number;
  commonViolations: ViolationType[];
  improvementSuggestions: string[];
  nextSessionRecommendations: string[];
}

// Performance Metrics
export interface PerformanceMetrics {
  frameRate: number;
  processingLatency: number; // milliseconds
  memoryUsage: number; // MB
  landmarkConfidence: number; // average confidence
  analysisAccuracy: number; // percentage
}

// Error Handling
export interface ErrorBoundaryStrategy {
  component: string;
  fallbackComponent: React.ComponentType;
  errorReporting: boolean;
  retryStrategy: RetryStrategy;
}

export enum RetryStrategy {
  IMMEDIATE = 'immediate',
  EXPONENTIAL_BACKOFF = 'exponential_backoff',
  USER_INITIATED = 'user_initiated',
  NO_RETRY = 'no_retry'
}

// Component Props Interfaces
export interface EnhancedPoseDetectionCameraProps {
  exerciseType: ExerciseType;
  mode: ExerciseMode;
  onRepCompleted: (rep: RepResult) => void;
  onFeedback: (feedback: FeedbackResponse) => void;
  showVisualGuides: boolean;
  enableAudioFeedback: boolean;
}

export interface RepResult {
  quality: RepQuality;
  duration: number;
  angles: ExerciseAngles[];
  violations: FormViolation[];
}

export interface FeedbackOverlayProps {
  feedback: FeedbackResponse;
  repCounts: RepCounts;
  currentState: ExerciseState;
  viewAnalysis: ViewAnalysis;
}

export interface ExerciseConfigPanelProps {
  currentMode: ExerciseMode;
  onModeChange: (mode: ExerciseMode) => void;
  exerciseType: ExerciseType;
  onExerciseChange: (type: ExerciseType) => void;
  thresholds: ExerciseThresholds;
  onThresholdChange: (thresholds: ExerciseThresholds) => void;
}

// Hook Return Types
export interface UseEnhancedPoseDetectionReturn {
  // Existing functionality
  isLoading: boolean;
  error: string | null;
  landmarks: PoseLandmark[] | null;
  
  // Enhanced functionality
  currentState: ExerciseState;
  repCounts: RepCounts;
  feedback: FeedbackResponse | null;
  viewAnalysis: ViewAnalysis;
  exerciseMode: ExerciseMode;
  
  // Actions
  setExerciseMode: (mode: ExerciseMode) => void;
  resetSession: () => void;
  pauseAnalysis: () => void;
  resumeAnalysis: () => void;
}

export interface UseExerciseStateReturn {
  currentState: ExerciseState;
  stateHistory: StateTransition[];
  isValidSequence: boolean;
  timeInState: number;
  resetState: () => void;
}

// Test Data Generation
export interface TestDataGenerators {
  generateValidPoseLandmarks(): PoseLandmark[];
  generateAngleRange(min: number, max: number): number;
  generateStateSequence(length: number): ExerciseState[];
  generatePoseViolation(type: ViolationType): ExerciseAngles;
  generateExerciseSession(repCount: number): ExerciseSession;
}