/**
 * Workout Session Component
 * Complete workout session with analytics, progress tracking, and coaching
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedPoseCamera } from './EnhancedPoseCamera';
import { FormFeedbackOverlay } from './FormFeedbackOverlay';
import { ExerciseSelector } from './ExerciseSelector';
import { RepData } from '@/lib/repCounter';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { FormAnalysis } from '@/types/pose';
import type { RepQuality } from '@/types/advancedPose';

interface WorkoutSessionProps {
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
}

interface WorkoutGoal {
  targetReps: number;
  targetAccuracy: number;
  timeLimit?: number;
}

export function WorkoutSession({
  initialExercise = 'squat',
  targetReps = 10,
  onSessionComplete,
  className = '',
}: WorkoutSessionProps) {
  const [selectedExercise, setSelectedExercise] = useState(initialExercise);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [repHistory, setRepHistory] = useState<RepData[]>([]);
  const [currentFormAnalysis, setCurrentFormAnalysis] = useState<FormAnalysis | null>(null);
  const [workoutGoal] = useState<WorkoutGoal>({
    targetReps,
    targetAccuracy: 80,
    timeLimit: 600000, // 10 minutes
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

  const handleStartSession = () => {
    setIsSessionActive(true);
    setSessionStartTime(Date.now());
    setRepHistory([]);
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
    };

    setIsSessionActive(false);
    setSessionStartTime(null);
    onSessionComplete?.(sessionData);
  }, [sessionStartTime, selectedExercise, sessionStats, repHistory, onSessionComplete]);

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

    // Check if goal is reached
    if (sessionStats.totalReps + 1 >= workoutGoal.targetReps) {
      setTimeout(handleEndSession, 2000); // Give time for celebration
    }
  }, [sessionStats.totalReps, workoutGoal.targetReps, handleEndSession]);

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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Exercise Selection */}
      {!isSessionActive && (
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
            <Button
              onClick={handleStartSession}
              className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
            >
              Start Workout Session
            </Button>
          </div>
        </Card>
      )}

      {/* Active Session */}
      {isSessionActive && (
        <>
          {/* Session Header */}
          <Card className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold capitalize">
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
          </Card>

          {/* Camera with Enhanced Feedback */}
          <div className="relative">
            <EnhancedPoseCamera
              exerciseId={selectedExercise}
              onFormAnalysis={setCurrentFormAnalysis}
              onRepCompleted={handleRepCompleted}
              showControls={false}
              showRepCounter={true}
              showFormScore={false} // We'll use our custom overlay
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