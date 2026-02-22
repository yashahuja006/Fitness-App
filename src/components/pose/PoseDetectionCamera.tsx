/**
 * Enhanced Pose Detection Camera Component
 * Provides real-time pose detection with advanced form analysis and feedback
 * 
 * Task 11.1: Enhanced React components - Upgrade PoseDetectionCamera component
 * - Extended with advanced analysis integration
 * - Added real-time feedback overlay integration
 * - Included exercise mode controls
 * - Added visual guides for camera positioning
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { FormFeedbackOverlay } from './FormFeedbackOverlay';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formScoringService } from '@/lib/formScoringService';
import { voiceFeedbackService } from '@/lib/voiceFeedbackService';
import { adaptiveFeedbackEngine } from '@/lib/adaptiveFeedbackEngine';
import { angleCalculator } from '@/lib/angleCalculator';
import { exerciseStateMachine } from '@/lib/exerciseStateMachine';
import { formAnalysisService } from '@/lib/formAnalysisService';
import { repCounter } from '@/lib/repCounter';
import { cameraViewAnalyzer } from '@/lib/cameraViewAnalyzer';
import { exerciseModeConfigService } from '@/lib/exerciseModeConfigService';
import { useExerciseModeConfig } from '@/hooks/useExerciseModeConfig';
import ExerciseConfigPanel from './ExerciseConfigPanel';
import type { FormAnalysis, PoseLandmark, FormScore } from '@/types/pose';
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

interface EnhancedPoseDetectionCameraProps {
  exerciseId?: string;
  exerciseType?: ExerciseType;
  exerciseMode?: ExerciseMode;
  onPoseDetected?: (landmarks: PoseLandmark[]) => void;
  onFormAnalysis?: (analysis: FormAnalysis) => void;
  onFormScore?: (score: FormScore) => void;
  onRepCompleted?: (repResult: RepCountResult) => void;
  onFeedback?: (feedback: FeedbackResponse) => void;
  className?: string;
  showControls?: boolean;
  showVisualGuides?: boolean;
  showConfigPanel?: boolean;
  autoStart?: boolean;
  sessionId?: string;
  enableAudioFeedback?: boolean;
  enableAdvancedAnalysis?: boolean;
}

export function PoseDetectionCamera({
  exerciseId,
  exerciseType = 'squat' as ExerciseType,
  exerciseMode = 'beginner' as ExerciseMode,
  onPoseDetected,
  onFormAnalysis,
  onFormScore,
  onRepCompleted,
  onFeedback,
  className = '',
  showControls = true,
  showVisualGuides = true,
  showConfigPanel = true,
  autoStart = false,
  sessionId,
  enableAudioFeedback = true,
  enableAdvancedAnalysis = true,
}: EnhancedPoseDetectionCameraProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [formAnalysis, setFormAnalysis] = useState<FormAnalysis | null>(null);
  const [formScore, setFormScore] = useState<FormScore | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 640, height: 480 });
  const [voiceEnabled, setVoiceEnabled] = useState(enableAudioFeedback && voiceFeedbackService.isSupported());
  
  // Advanced analysis state
  const [currentState, setCurrentState] = useState<ExerciseState>('s1' as ExerciseState);
  const [currentAngles, setCurrentAngles] = useState<ExerciseAngles | null>(null);
  const [violations, setViolations] = useState<FormViolation[]>([]);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [viewAnalysis, setViewAnalysis] = useState<ViewAnalysis | null>(null);
  const [repCounts, setRepCounts] = useState<RepCounts>({
    correctReps: 0,
    incorrectReps: 0,
    totalReps: 0,
    currentStreak: 0,
    sessionStartTime: Date.now()
  });

  // Exercise mode configuration integration
  const {
    currentMode,
    currentExerciseType,
    currentThresholds,
    allThresholds,
    switchMode,
    switchExerciseType,
    updateThresholds,
    isLoading: configLoading,
    error: configError
  } = useExerciseModeConfig({
    initialMode: exerciseMode,
    initialExerciseType: exerciseType,
    autoSync: true,
    onModeChange: (event) => {
      console.log('Mode changed:', event);
      // Re-initialize analysis components with new configuration
      if (enableAdvancedAnalysis && isStarted) {
        reinitializeAnalysisComponents();
      }
    },
    onThresholdChange: (thresholds) => {
      console.log('Thresholds updated:', thresholds);
    }
  });

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
      
      if (enableAdvancedAnalysis && landmarks.length > 0) {
        performAdvancedAnalysis(landmarks);
      }
    }, [onPoseDetected, enableAdvancedAnalysis]),
    onFormAnalysis: (analysis) => {
      setFormAnalysis(analysis);
      onFormAnalysis?.(analysis);

      // Provide voice feedback for form issues (legacy support)
      if (voiceEnabled && exerciseId && !enableAdvancedAnalysis) {
        voiceFeedbackService.provideFormFeedback(analysis, exerciseId);
      }

      // Calculate comprehensive form score (legacy support)
      if (exerciseId && state.currentPose && !enableAdvancedAnalysis) {
        const score = formScoringService.calculateFormScore(
          analysis,
          state.currentPose,
          exerciseId,
          sessionId
        );
        setFormScore(score);
        onFormScore?.(score);

        // Provide voice feedback for score (less frequent)
        if (voiceEnabled && Math.random() < 0.3) { // 30% chance for score feedback
          voiceFeedbackService.provideScoreFeedback(score, exerciseId);
        }
      }
    },
    autoStart,
  });

  // Reinitialize analysis components when configuration changes
  const reinitializeAnalysisComponents = useCallback(() => {
    if (!enableAdvancedAnalysis) return;

    try {
      // Reset state machine with new configuration
      exerciseStateMachine.setExerciseMode(currentMode);
      
      // Reset rep counter
      repCounter.reset();
      
      // Update feedback engine configuration
      adaptiveFeedbackEngine.updateConfig({
        feedbackFrequency: currentMode === 'pro' ? 3000 : 2000,
        priorityThreshold: currentMode === 'pro' ? 'medium' : 'low'
      });
      
      // Reset local state
      setCurrentState('s1' as ExerciseState);
      setRepCounts(prev => ({ 
        ...prev, 
        correctReps: 0,
        incorrectReps: 0,
        totalReps: 0,
        currentStreak: 0,
        sessionStartTime: Date.now()
      }));
      setViolations([]);
      setFeedback(null);
      
      console.log('Analysis components reinitialized for mode:', currentMode);
    } catch (error) {
      console.error('Failed to reinitialize analysis components:', error);
    }
  }, [enableAdvancedAnalysis, currentMode]);

  // Advanced pose analysis function
  const performAdvancedAnalysis = useCallback(async (landmarks: PoseLandmark[]) => {
    try {
      // 1. Calculate angles
      const angles = angleCalculator.calculateExerciseAngles(landmarks, currentExerciseType);
      setCurrentAngles(angles);

      // 2. Analyze camera view
      const viewAnalysis = cameraViewAnalyzer.analyzeView(landmarks);
      setViewAnalysis(viewAnalysis);

      // 3. Update exercise state
      const newState = exerciseStateMachine.updateState(angles, currentState);
      if (newState !== currentState) {
        setCurrentState(newState);
      }

      // 4. Analyze form violations using current mode
      const formViolations = formAnalysisService.analyzeAdvancedForm(
        landmarks,
        angles,
        currentExerciseType,
        currentMode
      );
      setViolations(formViolations);

      // 5. Check for rep completion
      const repResult = repCounter.updateRep(newState, angles, formViolations);
      if (repResult.repCompleted) {
        setRepCounts(prev => ({
          ...prev,
          totalReps: prev.totalReps + 1,
          correctReps: repResult.repQuality === 'excellent' || repResult.repQuality === 'good' 
            ? prev.correctReps + 1 
            : prev.correctReps,
          incorrectReps: repResult.repQuality === 'poor' || repResult.repQuality === 'needs_improvement'
            ? prev.incorrectReps + 1
            : prev.incorrectReps,
          currentStreak: repResult.repQuality === 'excellent' || repResult.repQuality === 'good'
            ? prev.currentStreak + 1
            : 0
        }));
        onRepCompleted?.(repResult);
      }

      // 6. Generate adaptive feedback using current mode
      const feedbackResponse = adaptiveFeedbackEngine.generateFeedback(
        formViolations,
        newState,
        angles,
        viewAnalysis,
        repResult.repCompleted ? repResult : undefined,
        currentMode
      );
      setFeedback(feedbackResponse);
      onFeedback?.(feedbackResponse);

      // 7. Deliver audio feedback if enabled
      if (voiceEnabled && feedbackResponse.shouldSpeak && feedbackResponse.audioMessages.length > 0) {
        await adaptiveFeedbackEngine.deliverAudioFeedback(feedbackResponse.audioMessages);
      }

    } catch (error) {
      console.error('Advanced analysis error:', error);
    }
  }, [currentExerciseType, currentState, currentMode, voiceEnabled, onRepCompleted, onFeedback]);

  const handleStart = async () => {
    try {
      await startDetection();
      setIsStarted(true);
      
      // Reset advanced analysis state
      if (enableAdvancedAnalysis) {
        setCurrentState('s1' as ExerciseState);
        setRepCounts(prev => ({ ...prev, sessionStartTime: Date.now() }));
        exerciseStateMachine.reset();
        repCounter.reset();
        adaptiveFeedbackEngine.reset();
        
        // Ensure components are using current configuration
        reinitializeAnalysisComponents();
      }
      
      // Provide encouragement when starting
      if (voiceEnabled) {
        if (enableAdvancedAnalysis) {
          await adaptiveFeedbackEngine.deliverAudioFeedback(['Ready to start! Position yourself to the side of the camera.']);
        } else {
          voiceFeedbackService.provideEncouragement('start');
        }
      }
    } catch (error) {
      console.error('Failed to start pose detection:', error);
      
      // Provide fallback message
      if (voiceEnabled) {
        if (enableAdvancedAnalysis) {
          await adaptiveFeedbackEngine.deliverAudioFeedback(['Camera access failed. Please check your camera permissions.']);
        } else {
          voiceFeedbackService.provideWarning('Camera access failed. Please check your camera permissions.');
        }
      }
    }
  };

  const handleStop = () => {
    stopDetection();
    setIsStarted(false);
    setFormAnalysis(null);
    setFormScore(null);
    
    // Reset advanced analysis state
    if (enableAdvancedAnalysis) {
      setCurrentState('s1' as ExerciseState);
      setCurrentAngles(null);
      setViolations([]);
      setFeedback(null);
      setViewAnalysis(null);
      adaptiveFeedbackEngine.stopAudioFeedback();
    }
    
    // Stop voice feedback
    voiceFeedbackService.stop();
    
    // Provide completion message
    if (voiceEnabled) {
      if (enableAdvancedAnalysis) {
        adaptiveFeedbackEngine.deliverAudioFeedback([`Great session! You completed ${repCounts.totalReps} reps.`]);
      } else {
        voiceFeedbackService.provideEncouragement('completion');
      }
    }
  };

  // Handle configuration panel changes
  const handleConfigPanelModeChange = useCallback(async (newMode: ExerciseMode) => {
    try {
      await switchMode(newMode);
    } catch (error) {
      console.error('Failed to switch mode:', error);
    }
  }, [switchMode]);

  const handleConfigPanelExerciseChange = useCallback(async (newType: ExerciseType) => {
    try {
      await switchExerciseType(newType);
    } catch (error) {
      console.error('Failed to switch exercise type:', error);
    }
  }, [switchExerciseType]);

  const handleConfigPanelThresholdChange = useCallback(async (thresholds: ExerciseThresholds) => {
    try {
      await updateThresholds(currentMode, thresholds[currentMode]);
    } catch (error) {
      console.error('Failed to update thresholds:', error);
    }
  }, [updateThresholds, currentMode]);

  const handleModeChange = (newMode: ExerciseMode) => {
    setCurrentMode(newMode);
    // Update feedback engine configuration for new mode
    if (enableAdvancedAnalysis) {
      // Mode-specific configurations could be applied here
      adaptiveFeedbackEngine.updateConfig({
        feedbackFrequency: newMode === 'pro' ? 3000 : 2000, // Pro mode gets less frequent feedback
      });
    }
  };

  // Update canvas dimensions when canvas ref changes
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      setCanvasDimensions({
        width: canvas.width,
        height: canvas.height,
      });
    }
  }, [canvasRef.current, state.isDetecting]);

  // Auto-stop when component unmounts
  useEffect(() => {
    return () => {
      if (isStarted) {
        stopDetection();
        voiceFeedbackService.stop();
        if (enableAdvancedAnalysis) {
          adaptiveFeedbackEngine.stopAudioFeedback();
        }
      }
    };
  }, [isStarted, stopDetection, enableAdvancedAnalysis]);

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
              <li key={index}>{feature}</li>
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
        {/* Exercise Configuration Panel */}
        {enableAdvancedAnalysis && showConfigPanel && (
          <ExerciseConfigPanel
            currentMode={currentMode}
            onModeChange={handleConfigPanelModeChange}
            exerciseType={currentExerciseType}
            onExerciseChange={handleConfigPanelExerciseChange}
            thresholds={allThresholds}
            onThresholdChange={handleConfigPanelThresholdChange}
            showAdvancedSettings={true}
            showThresholdEditor={true}
            className="mb-4"
          />
        )}

        {/* Exercise Mode Controls (Simple version when config panel is hidden) */}
        {enableAdvancedAnalysis && showControls && !showConfigPanel && (
          <div className="flex items-center justify-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Exercise Mode:</span>
            <div className="flex space-x-2">
              <Button
                onClick={() => handleConfigPanelModeChange('beginner' as ExerciseMode)}
                size="sm"
                className={currentMode === 'beginner' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
                disabled={configLoading}
              >
                Beginner
              </Button>
              <Button
                onClick={() => handleConfigPanelModeChange('pro' as ExerciseMode)}
                size="sm"
                className={currentMode === 'pro' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
                disabled={configLoading}
              >
                Pro
              </Button>
            </div>
            {configLoading && (
              <div className="text-xs text-gray-500">Updating...</div>
            )}
          </div>
        )}

        {/* Configuration Error Display */}
        {configError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-sm text-red-800">
              Configuration Error: {configError}
            </div>
          </div>
        )}

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
            
            {/* Enhanced Form Feedback Overlay */}
            {state.isDetecting && state.currentPose && (
              <FormFeedbackOverlay
                landmarks={state.currentPose}
                formAnalysis={formAnalysis}
                canvasWidth={canvasDimensions.width}
                canvasHeight={canvasDimensions.height}
                // Enhanced props for advanced analysis
                feedback={enableAdvancedAnalysis ? feedback : undefined}
                currentState={enableAdvancedAnalysis ? currentState : undefined}
                angles={enableAdvancedAnalysis ? currentAngles : undefined}
                viewAnalysis={enableAdvancedAnalysis ? viewAnalysis : undefined}
                showVisualGuides={showVisualGuides}
              />
            )}
            
            {/* Loading overlay */}
            {state.isInitialized && !state.isDetecting && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Initializing camera...</p>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Rep Counter and Stats Display */}
          {enableAdvancedAnalysis && state.isDetecting && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-90 text-white px-4 py-3 rounded-lg min-w-[200px]">
              <div className="text-lg font-bold mb-2">
                Reps: <span className="text-green-400">{repCounts.totalReps}</span>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Correct:</span>
                  <span className="text-green-400">{repCounts.correctReps}</span>
                </div>
                <div className="flex justify-between">
                  <span>Streak:</span>
                  <span className="text-blue-400">{repCounts.currentStreak}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <span className={currentMode === 'pro' ? 'text-purple-400' : 'text-blue-400'}>
                    {currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Exercise:</span>
                  <span className="text-yellow-400">
                    {currentExerciseType.charAt(0).toUpperCase() + currentExerciseType.slice(1).replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>State:</span>
                  <span className={getStateColor(currentState)}>{getStateLabel(currentState)}</span>
                </div>
                {currentAngles && (
                  <div className="flex justify-between">
                    <span>Knee:</span>
                    <span>{Math.round(currentAngles.kneeAngle)}°</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Form Score Display */}
          {state.isDetecting && formScore && !enableAdvancedAnalysis && (
            <div className="absolute top-4 right-4 bg-black bg-opacity-90 text-white px-4 py-3 rounded-lg min-w-[200px]">
              <div className="text-lg font-bold mb-2">
                Form Grade: <span className={`${getGradeColor(formScore.grade)}`}>{formScore.grade}</span>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Overall:</span>
                  <span>{Math.round(formScore.overall * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Alignment:</span>
                  <span>{Math.round(formScore.breakdown.alignment * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Posture:</span>
                  <span>{Math.round(formScore.breakdown.posture * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Range:</span>
                  <span>{Math.round(formScore.breakdown.rangeOfMotion * 100)}%</span>
                </div>
              </div>
              {state.currentPose && (
                <div className="text-xs text-gray-300 mt-2">
                  Pose detected ({state.currentPose.length} points)
                </div>
              )}
            </div>
          )}

          {/* Camera Positioning Guide */}
          {enableAdvancedAnalysis && viewAnalysis && viewAnalysis.viewType !== 'optimal_side' && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-600 bg-opacity-90 text-white px-4 py-2 rounded-lg text-center">
              <div className="text-sm font-medium">Camera Positioning</div>
              <div className="text-xs">{viewAnalysis.recommendations[0] || 'Position yourself to the side of the camera'}</div>
            </div>
          )}
        </div>

        {/* Controls */}
        {showControls && (
          <div className="space-y-4">
            {/* Voice Feedback Controls */}
            {(voiceFeedbackService.isSupported() || enableAdvancedAnalysis) && (
              <div className="flex items-center justify-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="voice-feedback"
                    checked={voiceEnabled}
                    onChange={(e) => {
                      setVoiceEnabled(e.target.checked);
                      if (!e.target.checked) {
                        voiceFeedbackService.stop();
                        if (enableAdvancedAnalysis) {
                          adaptiveFeedbackEngine.stopAudioFeedback();
                        }
                      }
                    }}
                    className="rounded"
                  />
                  <label htmlFor="voice-feedback" className="text-sm font-medium text-gray-700">
                    Voice Feedback
                  </label>
                </div>
                
                {voiceEnabled && (
                  <>
                    <Button
                      onClick={() => {
                        if (enableAdvancedAnalysis) {
                          adaptiveFeedbackEngine.deliverAudioFeedback(['Voice feedback test. You are ready to exercise!']);
                        } else {
                          voiceFeedbackService.testVoice();
                        }
                      }}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Test Voice
                    </Button>
                    
                    {(voiceFeedbackService.isSpeaking() || (enableAdvancedAnalysis && adaptiveFeedbackEngine.isAudioPlaying())) && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-600">Speaking...</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            
            {/* Main Controls */}
            <div className="flex justify-center space-x-4">
              {!isStarted ? (
                <Button
                  onClick={handleStart}
                  disabled={!state.hasCamera && !state.isInitialized}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {state.isInitialized ? 'Start Detection' : 'Initialize Camera'}
                </Button>
              ) : (
                <Button
                  onClick={handleStop}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Stop Detection
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
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

        {/* Enhanced Form Analysis Display */}
        {enableAdvancedAnalysis && violations.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              Form Feedback
            </h3>
            <div className="space-y-2">
              {violations.slice(0, 3).map((violation, index) => (
                <div key={index} className="text-sm">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        violation.severity === 'high'
                          ? 'bg-red-500'
                          : violation.severity === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <span className="font-medium text-yellow-800">
                      {violation.description}
                    </span>
                  </div>
                  <p className="text-yellow-700 ml-4 mt-1">{violation.correctionHint}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legacy Form Analysis Display */}
        {!enableAdvancedAnalysis && formAnalysis && formAnalysis.issues.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              Form Feedback
            </h3>
            <div className="space-y-2">
              {formAnalysis.issues.map((issue, index) => (
                <div key={index} className="text-sm">
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
            {formAnalysis.suggestions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-yellow-200">
                <h4 className="text-xs font-medium text-yellow-800 mb-1">
                  Suggestions:
                </h4>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {formAnalysis.suggestions.map((suggestion, index) => (
                    <li key={index}>• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Legacy Form Score Breakdown */}
        {!enableAdvancedAnalysis && formScore && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-3">
              Detailed Form Analysis
            </h3>
            
            {/* Strengths */}
            {formScore.strengths.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-medium text-green-800 mb-1">Strengths:</h4>
                <ul className="text-xs text-green-700 space-y-1">
                  {formScore.strengths.map((strength, index) => (
                    <li key={index}>✓ {strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Top Improvements */}
            {formScore.improvements.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-medium text-blue-800 mb-1">
                  Priority Improvements:
                </h4>
                <div className="space-y-2">
                  {formScore.improvements.slice(0, 2).map((improvement, index) => (
                    <div key={index} className="text-xs">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            improvement.priority === 'high'
                              ? 'bg-red-500'
                              : improvement.priority === 'medium'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                        />
                        <span className="font-medium text-blue-800">
                          {improvement.title}
                        </span>
                      </div>
                      <p className="text-blue-700 ml-4 mt-1">
                        {improvement.description}
                      </p>
                      <p className="text-xs text-blue-600 ml-4">
                        Expected improvement: +{improvement.expectedImprovement}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Alignment:</span>
                <span className={getScoreColor(formScore.breakdown.alignment)}>
                  {Math.round(formScore.breakdown.alignment * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Posture:</span>
                <span className={getScoreColor(formScore.breakdown.posture)}>
                  {Math.round(formScore.breakdown.posture * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Range:</span>
                <span className={getScoreColor(formScore.breakdown.rangeOfMotion)}>
                  {Math.round(formScore.breakdown.rangeOfMotion * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Timing:</span>
                <span className={getScoreColor(formScore.breakdown.timing)}>
                  {Math.round(formScore.breakdown.timing * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Status Information */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <div>
            Status: {state.isDetecting ? 'Detecting' : state.isInitialized ? 'Ready' : 'Not initialized'}
            {enableAdvancedAnalysis && ` | Mode: ${currentMode} | Exercise: ${currentExerciseType.replace('_', ' ')}`}
          </div>
          {state.isDetecting && (
            <div>
              Camera: {state.hasCamera ? 'Connected' : 'Disconnected'}
              {enableAdvancedAnalysis && viewAnalysis && ` | View: ${viewAnalysis.viewType}`}
              {enableAdvancedAnalysis && ` | Sensitivity: ${Math.round(currentThresholds.feedbackSensitivity * 100)}%`}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Helper functions for styling
 */
function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A+':
    case 'A':
      return 'text-green-400';
    case 'B+':
    case 'B':
      return 'text-blue-400';
    case 'C+':
    case 'C':
      return 'text-yellow-400';
    case 'D':
      return 'text-orange-400';
    case 'F':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

function getScoreColor(score: number): string {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-yellow-600';
  if (score >= 0.4) return 'text-orange-600';
  return 'text-red-600';
}

function getStateColor(state: ExerciseState): string {
  switch (state) {
    case 's1':
      return 'text-blue-400';
    case 's2':
      return 'text-yellow-400';
    case 's3':
      return 'text-green-400';
    default:
      return 'text-gray-400';
  }
}

function getStateLabel(state: ExerciseState): string {
  switch (state) {
    case 's1':
      return 'Standing';
    case 's2':
      return 'Transition';
    case 's3':
      return 'Deep Squat';
    default:
      return 'Unknown';
  }
}