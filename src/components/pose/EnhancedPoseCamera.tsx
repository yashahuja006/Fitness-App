/**
 * Enhanced Pose Detection Camera Component
 * Advanced pose detection with rep counting, form scoring, and visual feedback
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { RepCounter, RepData } from '@/lib/repCounter';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { FormAnalysis, PoseLandmark } from '@/types/pose';
import type { RepCountResult, ExerciseState, RepQuality } from '@/types/advancedPose';
import { ExerciseState } from '@/types/advancedPose';

interface EnhancedPoseCameraProps {
  readonly exerciseId?: string;
  readonly onPoseDetected?: (landmarks: PoseLandmark[]) => void;
  readonly onFormAnalysis?: (analysis: FormAnalysis) => void;
  readonly onRepCompleted?: (repData: RepData) => void;
  readonly className?: string;
  readonly showControls?: boolean;
  readonly showRepCounter?: boolean;
  readonly showFormScore?: boolean;
  readonly autoStart?: boolean;
}

export function EnhancedPoseCamera({
  exerciseId = 'squat',
  onPoseDetected,
  onFormAnalysis,
  onRepCompleted,
  className = '',
  showControls = true,
  showRepCounter = true,
  showFormScore = true,
  autoStart = false,
}: EnhancedPoseCameraProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [formAnalysis, setFormAnalysis] = useState<FormAnalysis | null>(null);
  const [repCounter] = useState(() => new RepCounter());
  const [repCounts, setRepCounts] = useState(repCounter.getRepCounts());
  const [currentRepResult, setCurrentRepResult] = useState<RepCountResult | null>(null);
  const [exerciseState, setExerciseState] = useState<ExerciseState>(ExerciseState.S1_STANDING);
  const [sessionStats, setSessionStats] = useState(repCounter.getSessionStats());
  const feedbackTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    state,
    videoRef,
    canvasRef,
    startDetection,
    stopDetection,
    isSupported,
    supportInfo,
  } = usePoseDetection({
    exerciseId,
    onPoseDetected: useCallback((landmarks: PoseLandmark[]) => {
      onPoseDetected?.(landmarks);
      
      // Process pose for rep counting (simplified state detection)
      const newState = detectExerciseState(landmarks, exerciseId);
      if (newState !== exerciseState) {
        const transition = {
          previousState: exerciseState,
          currentState: newState,
          timestamp: Date.now(),
          confidence: 0.8
        };
        
        const repResult = repCounter.processStateTransition(transition, []);
        setCurrentRepResult(repResult);
        setExerciseState(newState);
        
        if (repResult.repCompleted && onRepCompleted) {
          const repHistory = repCounter.getRepHistory();
          const latestRep = repHistory.at(-1);
          if (latestRep) {
            onRepCompleted(latestRep);
          }
        }
        
        // Update counts and stats
        setRepCounts(repCounter.getRepCounts());
        setSessionStats(repCounter.getSessionStats());
        
        // Clear feedback after 3 seconds
        if (feedbackTimeoutRef.current) {
          clearTimeout(feedbackTimeoutRef.current);
        }
        feedbackTimeoutRef.current = setTimeout(() => {
          setCurrentRepResult(null);
        }, 3000);
      }
    }, [onPoseDetected, exerciseState, exerciseId, repCounter, onRepCompleted]),
    onFormAnalysis: (analysis) => {
      setFormAnalysis(analysis);
      onFormAnalysis?.(analysis);
    },
    autoStart,
  });

  const handleStart = async () => {
    try {
      await startDetection();
      setIsStarted(true);
      repCounter.reset();
      setRepCounts(repCounter.getRepCounts());
      setSessionStats(repCounter.getSessionStats());
    } catch (error) {
      console.error('Failed to start pose detection:', error);
    }
  };

  const handleStop = () => {
    stopDetection();
    setIsStarted(false);
    setFormAnalysis(null);
    setCurrentRepResult(null);
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
  };

  const handleReset = () => {
    repCounter.reset();
    setRepCounts(repCounter.getRepCounts());
    setSessionStats(repCounter.getSessionStats());
    setCurrentRepResult(null);
    setExerciseState(ExerciseState.S1_STANDING);
  };

  const getFormScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-500';
    if (score >= 0.7) return 'text-yellow-500';
    if (score >= 0.5) return 'text-orange-500';
    return 'text-red-500';
  };

  const getRepQualityColor = (quality: RepQuality) => {
    switch (quality) {
      case RepQuality.EXCELLENT: return 'text-green-500';
      case RepQuality.GOOD: return 'text-blue-500';
      case RepQuality.NEEDS_IMPROVEMENT: return 'text-yellow-500';
      case RepQuality.POOR: return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStateDisplayName = (state: ExerciseState) => {
    switch (state) {
      case ExerciseState.S1_STANDING: return 'Ready';
      case ExerciseState.S2_TRANSITION: return 'Transitioning';
      case ExerciseState.S3_DEEP_SQUAT: return 'Deep Position';
      default: return 'Unknown';
    }
  };

  if (!isSupported) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Browser Not Supported
          </h3>
          <p className="text-gray-600 mb-4">
            Your browser is missing required features for pose detection:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-500 mb-4">
            {supportInfo.missingFeatures.map((feature, index) => (
              <li key={`feature-${index}`}>{feature}</li>
            ))}
          </ul>
          <p className="text-sm text-gray-500">
            Please use a modern browser with camera and WebGL support.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Camera View */}
        <div className="relative">
          <div className="relative bg-black rounded-lg overflow-hidden">
            {/* Video element (hidden, used for camera input) */}
            <video
              ref={videoRef}
              className="hidden"
              autoPlay
              muted
              playsInline
            />
            
            {/* Canvas for pose visualization */}
            <canvas
              ref={canvasRef}
              className="w-full h-auto max-w-full"
              style={{ aspectRatio: '4/3' }}
            />
            
            {/* Loading overlay */}
            {state.isInitialized && !state.isDetecting && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Initializing camera...</p>
                </div>
              </div>
            )}

            {/* Rep Counter Overlay */}
            {showRepCounter && state.isDetecting && (
              <div className="absolute top-4 right-4 bg-black bg-opacity-90 text-white px-4 py-3 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">{repCounts.totalReps}</div>
                  <div className="text-xs">REPS</div>
                  {repCounts.currentStreak > 0 && (
                    <div className="text-xs text-green-400 mt-1">
                      {repCounts.currentStreak} streak!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form Score Overlay */}
            {showFormScore && state.isDetecting && formAnalysis && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-90 text-white px-4 py-3 rounded-lg">
                <div className="text-center">
                  <div className={`text-xl font-bold ${getFormScoreColor(formAnalysis.correctness)}`}>
                    {Math.round(formAnalysis.correctness * 100)}%
                  </div>
                  <div className="text-xs">FORM</div>
                  <div className="text-xs mt-1">{getStateDisplayName(exerciseState)}</div>
                </div>
              </div>
            )}

            {/* Rep Feedback Overlay */}
            <AnimatePresence>
              {currentRepResult && currentRepResult.repCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="bg-black bg-opacity-90 text-white px-6 py-4 rounded-lg text-center max-w-sm">
                    <div className={`text-lg font-bold ${getRepQualityColor(currentRepResult.repQuality)}`}>
                      {currentRepResult.repQuality.toUpperCase()}
                    </div>
                    <div className="text-sm mt-2">{currentRepResult.feedback}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Stats Panel */}
        {showRepCounter && isStarted && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{repCounts.totalReps}</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Total Reps</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="text-lg font-bold text-green-600">{repCounts.correctReps}</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Good Form</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {sessionStats.accuracy.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Accuracy</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="text-lg font-bold text-orange-600">{repCounts.currentStreak}</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Streak</div>
            </div>
          </div>
        )}

        {/* Controls */}
        {showControls && (
          <div className="flex justify-center space-x-4">
            {!isStarted ? (
              <Button
                onClick={handleStart}
                disabled={!state.hasCamera && !state.isInitialized}
                className="bg-green-600 hover:bg-green-700"
              >
                {state.isInitialized ? 'Start Workout' : 'Initialize Camera'}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleStop}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Stop Workout
                </Button>
                <Button
                  onClick={handleReset}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  Reset Count
                </Button>
              </>
            )}
          </div>
        )}

        {/* Error Display */}
        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Pose Detection Error
                </h3>
                <p className="text-sm text-red-700 mt-1">{state.error.message}</p>
                {state.error.recoverable && (
                  <div className="mt-2">
                    <Button
                      onClick={handleStart}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form Analysis Display */}
        {formAnalysis && formAnalysis.issues.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              Form Feedback
            </h3>
            <div className="space-y-2">
              {formAnalysis.issues.map((issue, index) => (
                <div key={`issue-${index}`} className="text-sm">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        issue.severity === 'high'
                          ? 'bg-red-500'
                          : issue.severity === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <span className="font-medium text-yellow-800">
                      {issue.description}
                    </span>
                  </div>
                  <p className="text-yellow-700 ml-4 mt-1">{issue.correction}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Rep Feedback */}
        {currentRepResult && !currentRepResult.repCompleted && currentRepResult.feedback && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-800 text-center">
              {currentRepResult.feedback}
            </div>
          </div>
        )}

        {/* Status Information */}
        <div className="text-xs text-gray-500 text-center">
          Status: {state.isDetecting ? 'Detecting' : state.isInitialized ? 'Ready' : 'Not initialized'}
          {state.isDetecting && (
            <span> | Camera: {state.hasCamera ? 'Connected' : 'Disconnected'}</span>
          )}
          {isStarted && (
            <span> | Session: {Math.floor(sessionStats.sessionDuration / 60000)}m {Math.floor((sessionStats.sessionDuration % 60000) / 1000)}s</span>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Simplified exercise state detection based on pose landmarks
 * This is a basic implementation - in a real app, you'd use more sophisticated analysis
 */
function detectExerciseState(landmarks: PoseLandmark[], exerciseId: string): ExerciseState {
  if (!landmarks || landmarks.length === 0) {
    return ExerciseState.S1_STANDING;
  }

  // For squats, use hip and knee positions to determine state
  if (exerciseId === 'squat') {
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];

    if (!leftHip || !rightHip || !leftKnee || !rightKnee) {
      return ExerciseState.S1_STANDING;
    }

    // Calculate average hip and knee heights
    const avgHipY = (leftHip.y + rightHip.y) / 2;
    const avgKneeY = (leftKnee.y + rightKnee.y) / 2;
    
    // Simple state detection based on hip-knee relationship
    const hipKneeDiff = avgKneeY - avgHipY;
    
    if (hipKneeDiff < 0.05) {
      return ExerciseState.S3_DEEP_SQUAT; // Deep squat position
    } else if (hipKneeDiff < 0.15) {
      return ExerciseState.S2_TRANSITION; // Transitioning
    } else {
      return ExerciseState.S1_STANDING; // Standing position
    }
  }

  // Default to standing for other exercises
  return ExerciseState.S1_STANDING;
}