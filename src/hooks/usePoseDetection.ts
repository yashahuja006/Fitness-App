/**
 * Enhanced React hook for pose detection functionality
 * 
 * Task 12.1: Enhanced React hooks - Upgrade usePoseDetection hook with advanced capabilities
 * - Extended with state management for advanced analysis
 * - Added exercise mode configuration
 * - Included rep counting and feedback state
 * - Added session management capabilities
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PoseDetectionService } from '@/lib/poseDetectionService';
import type {
  PoseLandmark,
  PoseDetectionState,
  PoseDetectionConfig,
  CameraConfig,
  PoseDetectionError,
  FormAnalysis,
} from '@/types/pose';
import type {
  ExerciseType,
  ExerciseMode,
  ExerciseState,
  ExerciseAngles,
  FormViolation,
  FeedbackResponse,
  ViewAnalysis,
  RepCountResult,
  RepCounts
} from '@/types/advancedPose';

interface UsePoseDetectionOptions {
  poseConfig?: Partial<PoseDetectionConfig>;
  cameraConfig?: Partial<CameraConfig>;
  onPoseDetected?: (landmarks: PoseLandmark[]) => void;
  onFormAnalysis?: (analysis: FormAnalysis) => void;
  exerciseId?: string;
  autoStart?: boolean;
  
  // Enhanced options for advanced analysis
  enableAdvancedAnalysis?: boolean;
  exerciseType?: ExerciseType;
  exerciseMode?: ExerciseMode;
  onRepCompleted?: (repResult: RepCountResult) => void;
  onFeedback?: (feedback: FeedbackResponse) => void;
  onStateChange?: (state: ExerciseState) => void;
  sessionId?: string;
}

interface EnhancedPoseDetectionState extends PoseDetectionState {
  // Advanced analysis state
  currentState: ExerciseState;
  currentAngles: ExerciseAngles | null;
  violations: FormViolation[];
  feedback: FeedbackResponse | null;
  viewAnalysis: ViewAnalysis | null;
  repCounts: RepCounts;
  exerciseMode: ExerciseMode;
  exerciseType: ExerciseType;
  sessionStartTime: number | null;
  isAdvancedMode: boolean;
}

interface UsePoseDetectionReturn {
  state: EnhancedPoseDetectionState;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  startDetection: () => Promise<void>;
  stopDetection: () => void;
  getCurrentPose: () => PoseLandmark[] | null;
  isSupported: boolean;
  supportInfo: { supported: boolean; missingFeatures: string[] };
  
  // Enhanced capabilities
  setExerciseMode: (mode: ExerciseMode) => void;
  setExerciseType: (type: ExerciseType) => void;
  resetSession: () => void;
  pauseAnalysis: () => void;
  resumeAnalysis: () => void;
  getCurrentAngles: () => ExerciseAngles | null;
  getCurrentState: () => ExerciseState;
  getRepCounts: () => RepCounts;
}

export function usePoseDetection(options: UsePoseDetectionOptions = {}): UsePoseDetectionReturn {
  const {
    poseConfig,
    cameraConfig,
    onPoseDetected,
    onFormAnalysis,
    exerciseId,
    autoStart = false,
    enableAdvancedAnalysis = false,
    exerciseType = 'squat',
    exerciseMode = 'beginner',
    onRepCompleted,
    onFeedback,
    onStateChange,
    sessionId,
  } = options;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const serviceRef = useRef<PoseDetectionService | null>(null);
  const analysisEnabledRef = useRef(true);

  const [state, setState] = useState<EnhancedPoseDetectionState>({
    // Legacy state
    isInitialized: false,
    isDetecting: false,
    hasCamera: false,
    error: null,
    currentPose: null,
    formScore: 0,
    feedback: [],
    
    // Enhanced state
    currentState: 's1',
    currentAngles: null,
    violations: [],
    feedback: null,
    viewAnalysis: null,
    repCounts: {
      correctReps: 0,
      incorrectReps: 0,
      totalReps: 0,
      currentStreak: 0,
      sessionStartTime: Date.now()
    },
    exerciseMode,
    exerciseType,
    sessionStartTime: null,
    isAdvancedMode: enableAdvancedAnalysis,
  });

  // Check browser support (only on client side to avoid hydration issues)
  const [supportInfo, setSupportInfo] = useState<{ supported: boolean; missingFeatures: string[] }>({
    supported: true,
    missingFeatures: [],
  });
  const [isSupported, setIsSupported] = useState(true);

  // Check browser support after component mounts
  useEffect(() => {
    const checkSupport = () => {
      const info = PoseDetectionService.checkBrowserSupport();
      setSupportInfo(info);
      setIsSupported(info.supported);
    };
    
    checkSupport();
  }, []);

  // Initialize service reference
  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = new PoseDetectionService();
    }
  }, []);

  // Handle pose detection results with enhanced analysis
  const handlePoseDetected = useCallback(
    async (landmarks: PoseLandmark[]) => {
      setState((prev) => ({
        ...prev,
        currentPose: landmarks,
      }));

      // Enhanced analysis mode
      if (enableAdvancedAnalysis && analysisEnabledRef.current && landmarks.length > 0) {
        try {
          // Import services dynamically to avoid circular dependencies
          const { angleCalculator } = await import('@/lib/angleCalculator');
          const { exerciseStateMachine } = await import('@/lib/exerciseStateMachine');
          const { formAnalysisService } = await import('@/lib/formAnalysisService');
          const { repCounter } = await import('@/lib/repCounter');
          const { cameraViewAnalyzer } = await import('@/lib/cameraViewAnalyzer');
          const { adaptiveFeedbackEngine } = await import('@/lib/adaptiveFeedbackEngine');

          // 1. Calculate angles
          const angles = angleCalculator.calculateExerciseAngles(landmarks, state.exerciseType);
          
          // 2. Analyze camera view
          const viewAnalysis = cameraViewAnalyzer.analyzeView(landmarks);
          
          // 3. Update exercise state
          const newState = exerciseStateMachine.updateState(angles, state.currentState);
          
          // 4. Analyze form violations
          const formViolations = formAnalysisService.analyzeAdvancedForm(
            landmarks,
            angles,
            state.exerciseType,
            state.exerciseMode
          );
          
          // 5. Check for rep completion
          const repResult = repCounter.updateRep(newState, angles, formViolations);
          
          // 6. Generate adaptive feedback
          const feedbackResponse = adaptiveFeedbackEngine.generateFeedback(
            formViolations,
            newState,
            angles,
            viewAnalysis,
            repResult.repCompleted ? repResult : undefined,
            state.exerciseMode
          );

          // Update state with enhanced analysis results
          setState((prev) => {
            const newRepCounts = repResult.repCompleted ? {
              ...prev.repCounts,
              totalReps: prev.repCounts.totalReps + 1,
              correctReps: repResult.repQuality === 'excellent' || repResult.repQuality === 'good' 
                ? prev.repCounts.correctReps + 1 
                : prev.repCounts.correctReps,
              incorrectReps: repResult.repQuality === 'poor' || repResult.repQuality === 'needs_improvement'
                ? prev.repCounts.incorrectReps + 1
                : prev.repCounts.incorrectReps,
              currentStreak: repResult.repQuality === 'excellent' || repResult.repQuality === 'good'
                ? prev.repCounts.currentStreak + 1
                : 0
            } : prev.repCounts;

            return {
              ...prev,
              currentState: newState,
              currentAngles: angles,
              violations: formViolations,
              feedback: feedbackResponse,
              viewAnalysis,
              repCounts: newRepCounts,
            };
          });

          // Notify callbacks
          if (newState !== state.currentState && onStateChange) {
            onStateChange(newState);
          }
          
          if (repResult.repCompleted && onRepCompleted) {
            onRepCompleted(repResult);
          }
          
          if (onFeedback) {
            onFeedback(feedbackResponse);
          }

        } catch (error) {
          console.error('Enhanced analysis error:', error);
        }
      }

      // Legacy analysis for backward compatibility
      if (exerciseId && !enableAdvancedAnalysis) {
        const analysis = serviceRef.current?.analyzePoseForm(landmarks, exerciseId);
        if (analysis) {
          setState((prev) => ({
            ...prev,
            formScore: analysis.correctness,
          }));

          if (onFormAnalysis) {
            onFormAnalysis(analysis);
          }
        }
      }

      if (onPoseDetected) {
        onPoseDetected(landmarks);
      }
    },
    [
      exerciseId, 
      onPoseDetected, 
      onFormAnalysis, 
      enableAdvancedAnalysis, 
      state.exerciseType, 
      state.exerciseMode, 
      state.currentState,
      onStateChange,
      onRepCompleted,
      onFeedback
    ]
  );

  // Handle errors
  const handleError = useCallback((error: PoseDetectionError) => {
    setState((prev) => ({
      ...prev,
      error,
      isDetecting: false,
    }));
  }, []);

  // Initialize pose detection
  const initializePoseDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isSupported || !serviceRef.current) {
      return;
    }

    try {
      setState((prev) => ({ ...prev, error: null }));

      await serviceRef.current.initialize(
        videoRef.current,
        canvasRef.current,
        poseConfig,
        cameraConfig
      );

      serviceRef.current.setOnPoseDetected(handlePoseDetected);
      serviceRef.current.setOnError(handleError);

      setState((prev) => ({
        ...prev,
        isInitialized: true,
        hasCamera: true,
      }));
    } catch (error) {
      console.error('Failed to initialize pose detection:', error);
      setState((prev) => ({
        ...prev,
        error: {
          type: 'model_load_failed',
          message: error instanceof Error ? error.message : 'Failed to initialize pose detection',
          recoverable: true,
        },
      }));
    }
  }, [poseConfig, cameraConfig, handlePoseDetected, handleError, isSupported]);

  // Start detection
  const startDetection = useCallback(async () => {
    if (!state.isInitialized) {
      await initializePoseDetection();
    }

    if (!state.isInitialized || !serviceRef.current) {
      throw new Error('Pose detection not initialized');
    }

    try {
      setState((prev) => ({ 
        ...prev, 
        error: null,
        sessionStartTime: Date.now(),
        repCounts: {
          ...prev.repCounts,
          sessionStartTime: Date.now()
        }
      }));
      
      await serviceRef.current.startDetection();
      analysisEnabledRef.current = true;
      
      setState((prev) => ({ ...prev, isDetecting: true }));
    } catch (error) {
      console.error('Failed to start pose detection:', error);
      setState((prev) => ({
        ...prev,
        error: {
          type: 'camera_access_denied',
          message: 'Failed to access camera. Please grant camera permissions.',
          recoverable: true,
        },
        isDetecting: false,
      }));
      throw error;
    }
  }, [state.isInitialized, initializePoseDetection]);

  // Stop detection
  const stopDetection = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stopDetection();
    }
    analysisEnabledRef.current = false;
    
    setState((prev) => ({
      ...prev,
      isDetecting: false,
      currentPose: null,
      sessionStartTime: null,
    }));
  }, []);

  // Get current pose
  const getCurrentPose = useCallback(() => {
    return serviceRef.current?.getCurrentPose() || null;
  }, []);

  // Enhanced capabilities
  const setExerciseMode = useCallback((mode: ExerciseMode) => {
    setState((prev) => ({
      ...prev,
      exerciseMode: mode,
    }));
  }, []);

  const setExerciseType = useCallback((type: ExerciseType) => {
    setState((prev) => ({
      ...prev,
      exerciseType: type,
    }));
  }, []);

  const resetSession = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentState: 's1',
      currentAngles: null,
      violations: [],
      feedback: null,
      repCounts: {
        correctReps: 0,
        incorrectReps: 0,
        totalReps: 0,
        currentStreak: 0,
        sessionStartTime: Date.now()
      },
      sessionStartTime: Date.now(),
    }));
  }, []);

  const pauseAnalysis = useCallback(() => {
    analysisEnabledRef.current = false;
  }, []);

  const resumeAnalysis = useCallback(() => {
    analysisEnabledRef.current = true;
  }, []);

  const getCurrentAngles = useCallback(() => {
    return state.currentAngles;
  }, [state.currentAngles]);

  const getCurrentState = useCallback(() => {
    return state.currentState;
  }, [state.currentState]);

  const getRepCounts = useCallback(() => {
    return state.repCounts;
  }, [state.repCounts]);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && isSupported && !state.isInitialized) {
      initializePoseDetection();
    }
  }, [autoStart, isSupported, state.isInitialized, initializePoseDetection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (serviceRef.current) {
        serviceRef.current.dispose();
      }
    };
  }, []);

  // Handle browser support errors
  useEffect(() => {
    if (!isSupported) {
      setState((prev) => ({
        ...prev,
        error: {
          type: 'unsupported_browser',
          message: `Browser missing required features: ${supportInfo.missingFeatures.join(', ')}`,
          recoverable: false,
        },
      }));
    }
  }, [isSupported, supportInfo.missingFeatures]);

  return {
    state,
    videoRef,
    canvasRef,
    startDetection,
    stopDetection,
    getCurrentPose,
    isSupported,
    supportInfo,
    setExerciseMode,
    setExerciseType,
    resetSession,
    pauseAnalysis,
    resumeAnalysis,
    getCurrentAngles,
    getCurrentState,
    getRepCounts,
  };
}