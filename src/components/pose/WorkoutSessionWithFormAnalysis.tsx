/**
 * Workout Session with Voice Form Analysis
 * Complete workout session with real-time voice feedback for form correction
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedPoseCamera } from './EnhancedPoseCamera';
import { FormFeedbackOverlay } from './FormFeedbackOverlay';
import { ExerciseSelector } from './ExerciseSelector';
import { RepData } from '@/lib/repCounter';
import { voiceFeedbackService } from '@/lib/voiceFeedbackService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { FormAnalysis } from '@/types/pose';
import type { RepQuality, ExerciseState } from '@/types/advancedPose';

interface WorkoutSessionWithFormAnalysisProps {
  readonly initialExercise?: string;
  readonly targetReps?: number;
  readonly onSessionComplete?: (sessionData: SessionData) => void;
  readonly className?: string;
}

interface SessionData {
  exerciseId: string;
  totalReps: number;
  correctReps: number;
  accuracy: number;
  duration: number;
  repHistory: RepData[];
  averageFormScore: number;
  qualityDistribution: Record<RepQuality, number>;
  voiceFeedbackCount: number;
}

interface WorkoutGoal {
  targetReps: number;
  targetAccuracy: number;
  timeLimit?: number;
}

interface VoiceSettings {
  enabled: boolean;
  formFeedback: boolean;
  encouragement: boolean;
  instructions: boolean;
  volume: number;
}

export function WorkoutSessionWithFormAnalysis({
  initialExercise = 'squat',
  targetReps = 10,
  onSessionComplete,
  className = '',
}: WorkoutSessionWithFormAnalysisProps) {
  const [selectedExercise, setSelectedExercise] = useState(initialExercise);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [repHistory, setRepHistory] = useState<RepData[]>([]);
  const [currentFormAnalysis, setCurrentFormAnalysis] = useState<FormAnalysis | null>(null);
  const [voiceFeedbackCount, setVoiceFeedbackCount] = useState(0);
  const [workoutGoal] = useState<WorkoutGoal>({
    targetReps,
    targetAccuracy: 80,
    timeLimit: 600000, // 10 minutes
  });
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    enabled: true,
    formFeedback: true,
    encouragement: true,
    instructions: true,
    volume: 0.8,
  });
  const [sessionStats, setSessionStats] = useState({
    totalReps: 0,
    correctReps: 0,
    accuracy: 0,
    averageFormScore: 0,
    qualityDistribution: {
      [RepQuality.EXCELLENT]: 0,
      [RepQuality.GOOD]: 0,
      [RepQuality.NEEDS_IMPROVEMENT]: 0,
      [RepQuality.POOR]: 0,
    },
  });

  // Initialize voice feedback service
  useEffect(() => {
    if (voiceSettings.enabled) {
      voiceFeedbackService.updateConfig({
        enabled: true,
        enableFormFeedback: voiceSettings.formFeedback,
        enableEncouragement: voiceSettings.encouragement,
        enableInstructions: voiceSettings.instructions,
        volume: voiceSettings.volume,
        feedbackFrequency: 'periodic',
      });
    }
  }, [voiceSettings]);

  const handleStartSession = () => {
    setIsSessionActive(true);
    setSessionStartTime(Date.now());
    setRepHistory([]);
    setVoiceFeedbackCount(0);
    setSessionStats({
      totalReps: 0,
      correctReps: 0,
      accuracy: 0,
      averageFormScore: 0,
      qualityDistribution: {
        [RepQuality.EXCELLENT]: 0,
        [RepQuality.GOOD]: 0,
        [RepQuality.NEEDS_IMPROVEMENT]: 0,
        [RepQuality.POOR]: 0,
      },
    });

    // Provide initial encouragement
    if (voiceSettings.enabled && voiceSettings.encouragement) {
      voiceFeedbackService.provideEncouragement('start');
    }

    // Provide exercise instructions
    if (voiceSettings.enabled && voiceSettings.instructions) {
      const instructions = getExerciseInstructions(selectedExercise);
      if (instructions) {
        setTimeout(() => {
          voiceFeedbackService.provideInstructions(selectedExercise, instructions);
        }, 2000);
      }
    }
  };

  const handleEndSession = useCallback(() => {
    if (!sessionStartTime) return;

    const sessionDuration = Date.now() - sessionStartTime;
    const sessionData: SessionData = {
      exerciseId: selectedExercise,
      totalReps: sessionStats.totalReps,
      correctReps: sessionStats.correctReps,
      accuracy: sessionStats.accuracy,
      duration: sessionDuration,
      repHistory,
      averageFormScore: sessionStats.averageFormScore,
      qualityDistribution: sessionStats.qualityDistribution,
      voiceFeedbackCount,
    };

    setIsSessionActive(false);
    setSessionStartTime(null);
    
    // Provide completion feedback
    if (voiceSettings.enabled && voiceSettings.encouragement) {
      voiceFeedbackService.provideEncouragement('completion');
    }

    onSessionComplete?.(sessionData);
  }, [sessionStartTime, selectedExercise, sessionStats, repHistory, voiceFeedbackCount, voiceSettings, onSessionComplete]);

  const handleFormAnalysis = useCallback((analysis: FormAnalysis) => {
    setCurrentFormAnalysis(analysis);

    // Provide voice feedback for form issues
    if (voiceSettings.enabled && voiceSettings.formFeedback && analysis.issues.length > 0) {
      voiceFeedbackService.provideFormFeedback(analysis, selectedExercise);
      setVoiceFeedbackCount(prev => prev + 1);
    }

    // Provide score feedback occasionally
    if (voiceSettings.enabled && voiceSettings.encouragement && Math.random() < 0.1) {
      voiceFeedbackService.provideScoreFeedback(analysis.score, selectedExercise);
    }
  }, [selectedExercise, voiceSettings]);

  const handleRepCompleted = useCallback((repData: RepData) => {
    setRepHistory(prev => [...prev, repData]);
    
    // Update session stats
    setSessionStats(prev => {
      const newTotalReps = prev.totalReps + 1;
      const newCorrectReps = prev.correctReps + (
        repData.quality === RepQuality.EXCELLENT || repData.quality === RepQuality.GOOD ? 1 : 0
      );
      const newAccuracy = (newCorrectReps / newTotalReps) * 100;
      
      // Calculate average form score from violations
      const formScore = Math.max(0, 1 - (repData.violations.length * 0.1));
      const newAverageFormScore = (prev.averageFormScore * prev.totalReps + formScore) / newTotalReps;
      
      const newQualityDistribution = { ...prev.qualityDistribution };
      newQualityDistribution[repData.quality]++;

      return {
        totalReps: newTotalReps,
        correctReps: newCorrectReps,
        accuracy: newAccuracy,
        averageFormScore: newAverageFormScore,
        qualityDistribution: newQualityDistribution,
      };
    });

    // Provide rep completion feedback
    if (voiceSettings.enabled && voiceSettings.encouragement) {
      if (repData.quality === RepQuality.EXCELLENT) {
        voiceFeedbackService.provideEncouragement('progress');
      } else if (repData.quality === RepQuality.POOR) {
        voiceFeedbackService.provideWarning('Focus on your form. Slow down if needed.');
      }
    }

    // Check for milestones
    const newTotalReps = sessionStats.totalReps + 1;
    if (voiceSettings.enabled && voiceSettings.encouragement) {
      if (newTotalReps === Math.floor(workoutGoal.targetReps / 2)) {
        voiceFeedbackService.provideEncouragement('milestone');
      }
    }

    // Check if goal is reached
    if (newTotalReps >= workoutGoal.targetReps) {
      setTimeout(handleEndSession, 2000); // Give time for celebration
    }
  }, [sessionStats.totalReps, workoutGoal.targetReps, voiceSettings, handleEndSession]);

  const getExerciseInstructions = (exerciseId: string): string => {
    const instructions = {
      'squat': 'Keep your feet shoulder-width apart, chest up, and lower until your thighs are parallel to the floor.',
      'push-up': 'Start in plank position, lower your chest to the floor, then push back up while keeping your body straight.',
      'bicep-curls': 'Stand with feet shoulder-width apart, keep your elbows close to your body, and curl the weights up slowly.',
    };
    return instructions[exerciseId as keyof typeof instructions] || '';
  };

  const getProgressPercentage = () => {
    return Math.min((sessionStats.totalReps / workoutGoal.targetReps) * 100, 100);
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-500';
    if (accuracy >= 80) return 'text-blue-500';
    if (accuracy >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSessionDuration = () => {
    if (!sessionStartTime) return 0;
    return Date.now() - sessionStartTime;
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleVoiceSetting = (setting: keyof Omit<VoiceSettings, 'volume'>) => {
    setVoiceSettings(prev => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const updateVolume = (volume: number) => {
    setVoiceSettings(prev => ({ ...prev, volume }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Exercise Selection and Voice Settings */}
      {!isSessionActive && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Exercise Setup */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Setup Your Workout</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Exercise</label>
                <ExerciseSelector
                  selectedExercise={selectedExercise}
                  onExerciseChange={setSelectedExercise}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Target Reps</label>
                  <div className="text-2xl font-bold text-blue-600">{workoutGoal.targetReps}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target Accuracy</label>
                  <div className="text-2xl font-bold text-green-600">{workoutGoal.targetAccuracy}%</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Voice Coach Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">🎤 Voice Coach Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Enable Voice Coach</span>
                <button
                  onClick={() => toggleVoiceSetting('enabled')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    voiceSettings.enabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      voiceSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {voiceSettings.enabled && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Form Corrections</span>
                    <button
                      onClick={() => toggleVoiceSetting('formFeedback')}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        voiceSettings.formFeedback ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          voiceSettings.formFeedback ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Encouragement</span>
                    <button
                      onClick={() => toggleVoiceSetting('encouragement')}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        voiceSettings.encouragement ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          voiceSettings.encouragement ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Instructions</span>
                    <button
                      onClick={() => toggleVoiceSetting('instructions')}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        voiceSettings.instructions ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          voiceSettings.instructions ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Volume: {Math.round(voiceSettings.volume * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={voiceSettings.volume}
                      onChange={(e) => updateVolume(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <Button
                    onClick={() => voiceFeedbackService.testVoice('Voice coach is ready to help you!')}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    Test Voice
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Start Session Button */}
      {!isSessionActive && (
        <div className="text-center">
          <Button
            onClick={handleStartSession}
            className="bg-green-600 hover:bg-green-700 text-lg py-3 px-8"
          >
            🎯 Start Workout with Voice Coach
          </Button>
        </div>
      )}

      {/* Active Session */}
      {isSessionActive && (
        <>
          {/* Session Header */}
          <Card className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold capitalize flex items-center">
                  {voiceSettings.enabled && <span className="mr-2">🎤</span>}
                  {selectedExercise} Workout
                </h2>
                <p className="text-sm text-gray-600">
                  {sessionStats.totalReps} / {workoutGoal.targetReps} reps
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{formatTime(getSessionDuration())}</div>
                <div className={`text-sm ${getAccuracyColor(sessionStats.accuracy)}`}>
                  {sessionStats.accuracy.toFixed(0)}% accuracy
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{getProgressPercentage().toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressPercentage()}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Voice Feedback Stats */}
            {voiceSettings.enabled && (
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Voice feedback given: {voiceFeedbackCount}</span>
                <span className={voiceFeedbackService.isSpeaking() ? 'text-blue-500' : ''}>
                  {voiceFeedbackService.isSpeaking() ? '🔊 Speaking...' : '🎤 Listening'}
                </span>
              </div>
            )}
          </Card>

          {/* Camera with Enhanced Feedback */}
          <div className="relative">
            <EnhancedPoseCamera
              exerciseId={selectedExercise}
              onFormAnalysis={handleFormAnalysis}
              onRepCompleted={handleRepCompleted}
              showControls={false}
              showRepCounter={true}
              showFormScore={false}
              autoStart={true}
            />
            
            {/* Custom Form Feedback Overlay */}
            <FormFeedbackOverlay
              formAnalysis={currentFormAnalysis}
              exerciseState={exerciseState}
              isVisible={true}
            />
          </div>

          {/* Session Controls */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => voiceFeedbackService.stop()}
              variant="secondary"
              disabled={!voiceFeedbackService.isSpeaking()}
            >
              🔇 Stop Voice
            </Button>
            <Button
              onClick={handleEndSession}
              className="bg-red-600 hover:bg-red-700"
            >
              End Session
            </Button>
          </div>

          {/* Recent Reps Summary */}
          {repHistory.length > 0 && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">Recent Reps</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {repHistory.slice(-5).reverse().map((rep, index) => (
                  <motion.div
                    key={`rep-${rep.repNumber}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm">Rep #{rep.repNumber}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        rep.quality === RepQuality.EXCELLENT ? 'bg-green-100 text-green-800' :
                        rep.quality === RepQuality.GOOD ? 'bg-blue-100 text-blue-800' :
                        rep.quality === RepQuality.NEEDS_IMPROVEMENT ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {rep.quality.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {(rep.duration / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Goal Achievement Celebration */}
      <AnimatePresence>
        {sessionStats.totalReps >= workoutGoal.targetReps && isSessionActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white p-8 rounded-lg text-center max-w-md">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-2">Goal Achieved!</h2>
              <p className="text-gray-600 mb-4">
                You completed {sessionStats.totalReps} reps with {sessionStats.accuracy.toFixed(0)}% accuracy!
              </p>
              {voiceSettings.enabled && (
                <p className="text-sm text-gray-500 mb-4">
                  Voice coach provided {voiceFeedbackCount} form corrections
                </p>
              )}
              <Button
                onClick={handleEndSession}
                className="bg-green-600 hover:bg-green-700"
              >
                Complete Session
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}