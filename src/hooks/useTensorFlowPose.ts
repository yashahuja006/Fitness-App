/**
 * React hook for TensorFlow.js pose detection
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { TensorFlowPoseService } from '@/lib/tensorflowPoseService';
import type {
  PoseLandmark,
  PoseDetectionError,
  FormAnalysis,
} from '@/types/pose';

interface UseTensorFlowPoseOptions {
  exerciseId?: string;
  onPoseDetected?: (landmarks: PoseLandmark[]) => void;
  onFormAnalysis?: (analysis: FormAnalysis) => void;
  autoStart?: boolean;
}

interface UseTensorFlowPoseReturn {
  isInitialized: boolean;
  isDetecting: boolean;
  hasCamera: boolean;
  error: string | null;
  currentPose: PoseLandmark[] | null;
  poseCount: number;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  startDetection: () => Promise<void>;
  stopDetection: () => void;
  getCurrentPose: () => PoseLandmark[] | null;
  isSupported: boolean;
}

export function useTensorFlowPose(options: UseTensorFlowPoseOptions = {}): UseTensorFlowPoseReturn {
  const {
    exerciseId,
    onPoseDetected,
    onFormAnalysis,
    autoStart = false,
  } = options;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const serviceRef = useRef<TensorFlowPoseService | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPose, setCurrentPose] = useState<PoseLandmark[] | null>(null);
  const [poseCount, setPoseCount] = useState(0);
  const [isSupported, setIsSupported] = useState(true);

  // Initialize service
  useEffect(() => {
    serviceRef.current = new TensorFlowPoseService();
    
    // Check browser support
    const support = TensorFlowPoseService.checkBrowserSupport();
    setIsSupported(support.supported);
    
    if (!support.supported) {
      setError(`Browser missing features: ${support.missingFeatures.join(', ')}`);
    }

    return () => {
      if (serviceRef.current) {
        serviceRef.current.dispose();
      }
    };
  }, []);

  // Handle pose detection results
  const handlePoseDetected = useCallback(
    (landmarks: PoseLandmark[]) => {
      setCurrentPose(landmarks);
      setPoseCount(prev => prev + 1);

      // Analyze form if exercise ID is provided
      if (exerciseId && serviceRef.current) {
        try {
          const analysis = serviceRef.current.analyzePoseForm(landmarks, exerciseId);
          if (onFormAnalysis) {
            onFormAnalysis(analysis);
          }
        } catch (err) {
          console.warn('Form analysis failed:', err);
        }
      }

      if (onPoseDetected) {
        onPoseDetected(landmarks);
      }
    },
    [exerciseId, onPoseDetected, onFormAnalysis]
  );

  // Handle errors
  const handleError = useCallback((error: PoseDetectionError) => {
    console.error('TensorFlow pose detection error:', error);
    setError(error.message);
    setIsDetecting(false);
  }, []);

  // Start detection
  const startDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !serviceRef.current || !isSupported) {
      throw new Error('Service not ready or browser not supported');
    }

    try {
      setError(null);
      console.log('🚀 Starting TensorFlow pose detection...');

      // Initialize the service
      await serviceRef.current.initialize(
        videoRef.current,
        canvasRef.current,
        {
          architecture: 'MobileNetV1',
          outputStride: 16,
          inputResolution: 513,
          multiplier: 0.75,
          scoreThreshold: 0.5,
        }
      );

      // Set up callbacks
      serviceRef.current.setOnPoseDetected(handlePoseDetected);
      serviceRef.current.setOnError(handleError);

      // Start detection
      await serviceRef.current.startDetection();
      
      setIsInitialized(true);
      setIsDetecting(true);
      setHasCamera(true);
      setPoseCount(0);
      
      console.log('✅ TensorFlow pose detection started');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start pose detection';
      console.error('❌ Failed to start pose detection:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [handlePoseDetected, handleError, isSupported]);

  // Stop detection
  const stopDetection = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stopDetection();
    }
    setIsDetecting(false);
    setCurrentPose(null);
    setPoseCount(0);
    console.log('🛑 TensorFlow pose detection stopped');
  }, []);

  // Get current pose
  const getCurrentPose = useCallback(() => {
    return serviceRef.current?.getCurrentPose() || null;
  }, []);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && isSupported && !isInitialized && !isDetecting) {
      startDetection().catch(console.error);
    }
  }, [autoStart, isSupported, isInitialized, isDetecting, startDetection]);

  return {
    isInitialized,
    isDetecting,
    hasCamera,
    error,
    currentPose,
    poseCount,
    videoRef,
    canvasRef,
    startDetection,
    stopDetection,
    getCurrentPose,
    isSupported,
  };
}