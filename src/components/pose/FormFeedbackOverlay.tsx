/**
 * Enhanced Form Feedback Overlay Component
 * Real-time visual feedback for exercise form correction with advanced analysis
 * 
 * Task 11.2: Enhanced React components - Create real-time feedback overlay component
 * - Built visual feedback overlay with angle indicators
 * - Added rep counter display
 * - Included form violation warnings
 * - Added positioning guides visualization
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FormAnalysis, FormIssue, PoseLandmark } from '@/types/pose';
import type { 
  RepQuality, 
  ExerciseState, 
  ExerciseAngles, 
  FormViolation, 
  FeedbackResponse, 
  ViewAnalysis 
} from '@/types/advancedPose';

interface EnhancedFormFeedbackOverlayProps {
  // Legacy support
  readonly landmarks?: PoseLandmark[];
  readonly formAnalysis?: FormAnalysis | null;
  readonly canvasWidth?: number;
  readonly canvasHeight?: number;
  
  // Enhanced props for advanced analysis
  readonly feedback?: FeedbackResponse | null;
  readonly currentState?: ExerciseState;
  readonly angles?: ExerciseAngles | null;
  readonly viewAnalysis?: ViewAnalysis | null;
  readonly showVisualGuides?: boolean;
  readonly repCounts?: {
    correctReps: number;
    incorrectReps: number;
    totalReps: number;
    currentStreak: number;
  };
  
  // Display options
  readonly isVisible?: boolean;
  readonly className?: string;
}

export function FormFeedbackOverlay({
  landmarks,
  formAnalysis,
  canvasWidth = 640,
  canvasHeight = 480,
  feedback,
  currentState,
  angles,
  viewAnalysis,
  showVisualGuides = true,
  repCounts,
  isVisible = true,
  className = '',
}: EnhancedFormFeedbackOverlayProps) {
  if (!isVisible) {
    return null;
  }

  // Enhanced mode detection
  const isEnhancedMode = !!(feedback || currentState || angles || viewAnalysis);

  const getStateColor = (state: ExerciseState) => {
    switch (state) {
      case 's1':
        return 'bg-blue-500';
      case 's2':
        return 'bg-yellow-500';
      case 's3':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStateLabel = (state: ExerciseState) => {
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
  };

  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return 'text-red-500 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🔵';
      default:
        return '⚪';
    }
  };

  const getFormScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-500';
    if (score >= 0.7) return 'text-yellow-500';
    if (score >= 0.5) return 'text-orange-500';
    return 'text-red-500';
  };

  const getAngleColor = (angle: number, optimal: number, tolerance: number = 10) => {
    const diff = Math.abs(angle - optimal);
    if (diff <= tolerance) return 'text-green-500';
    if (diff <= tolerance * 2) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Enhanced Rep Counter and Stats Display */}
      {isEnhancedMode && repCounts && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 left-4 bg-black bg-opacity-90 text-white px-4 py-3 rounded-lg min-w-[200px]"
        >
          <div className="text-lg font-bold mb-2">
            Reps: <span className="text-green-400">{repCounts.totalReps}</span>
          </div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Correct:</span>
              <span className="text-green-400">{repCounts.correctReps}</span>
            </div>
            <div className="flex justify-between">
              <span>Incorrect:</span>
              <span className="text-red-400">{repCounts.incorrectReps}</span>
            </div>
            <div className="flex justify-between">
              <span>Streak:</span>
              <span className="text-blue-400">{repCounts.currentStreak}</span>
            </div>
            {currentState && (
              <div className="flex justify-between">
                <span>State:</span>
                <span className={`${getStateColor(currentState).replace('bg-', 'text-')}`}>
                  {getStateLabel(currentState)}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Legacy Form Score Display */}
      {!isEnhancedMode && formAnalysis && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 left-4 bg-black bg-opacity-90 text-white px-4 py-3 rounded-lg"
        >
          <div className="text-center">
            <div className={`text-2xl font-bold ${getFormScoreColor(formAnalysis.correctness)}`}>
              {Math.round(formAnalysis.correctness * 100)}%
            </div>
            <div className="text-xs">FORM SCORE</div>
          </div>
        </motion.div>
      )}

      {/* Enhanced Angle Indicators */}
      {isEnhancedMode && angles && showVisualGuides && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-4 bg-black bg-opacity-90 text-white px-4 py-3 rounded-lg min-w-[180px]"
        >
          <div className="text-sm font-semibold mb-2 text-center">Joint Angles</div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span>Knee:</span>
              <span className={getAngleColor(angles.kneeAngle, 90, 15)}>
                {Math.round(angles.kneeAngle)}°
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Hip:</span>
              <span className={getAngleColor(angles.hipAngle, 90, 20)}>
                {Math.round(angles.hipAngle)}°
              </span>
            </div>
            {angles.ankleAngle && (
              <div className="flex justify-between items-center">
                <span>Ankle:</span>
                <span className={getAngleColor(angles.ankleAngle, 90, 15)}>
                  {Math.round(angles.ankleAngle)}°
                </span>
              </div>
            )}
            {currentState && (
              <div className="pt-2 border-t border-gray-600">
                <div className="flex items-center justify-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getStateColor(currentState)}`} />
                  <span className="text-xs font-medium">{getStateLabel(currentState)}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Enhanced Form Violations Panel */}
      <AnimatePresence>
        {isEnhancedMode && feedback && feedback.visualCues && feedback.visualCues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg max-w-md mx-auto"
          >
            <h3 className="text-sm font-semibold mb-3 text-center">Real-time Feedback</h3>
            <div className="space-y-2">
              {feedback.visualCues.slice(0, 3).map((cue, index) => (
                <motion.div
                  key={`feedback-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start space-x-3 p-2 rounded ${
                    cue.type === 'form_warning' ? 'bg-red-900 bg-opacity-50' :
                    cue.type === 'positioning_guide' ? 'bg-yellow-900 bg-opacity-50' :
                    'bg-blue-900 bg-opacity-50'
                  }`}
                >
                  <span className="text-lg">
                    {cue.type === 'form_warning' ? '⚠️' :
                     cue.type === 'positioning_guide' ? '📍' :
                     cue.type === 'angle_indicator' ? '📐' : '💡'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{cue.message}</p>
                    <div className="flex items-center mt-1 space-x-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cue.color }}
                      />
                      <span className="text-xs text-gray-300 capitalize">
                        {cue.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legacy Form Issues Panel */}
      <AnimatePresence>
        {!isEnhancedMode && formAnalysis && formAnalysis.issues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg max-w-md mx-auto"
          >
            <h3 className="text-sm font-semibold mb-3 text-center">Form Feedback</h3>
            <div className="space-y-2">
              {formAnalysis.issues.slice(0, 3).map((issue, index) => (
                <motion.div
                  key={`legacy-feedback-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3"
                >
                  <span className="text-lg">{getSeverityIcon(issue.severity)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{issue.description}</p>
                    <p className="text-xs text-gray-300 mt-1">{issue.correction}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Positioning Guides */}
      {isEnhancedMode && viewAnalysis && viewAnalysis.viewType !== 'optimal_side' && showVisualGuides && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-600 bg-opacity-90 text-white px-4 py-3 rounded-lg text-center max-w-sm"
        >
          <div className="text-sm font-medium mb-1">📍 Camera Positioning</div>
          <div className="text-xs mb-2">
            {viewAnalysis.recommendations[0] || 'Position yourself to the side of the camera'}
          </div>
          <div className="flex items-center justify-center space-x-2 text-xs">
            <span>View:</span>
            <span className={
              viewAnalysis.viewType === 'frontal' ? 'text-red-300' :
              viewAnalysis.viewType === 'suboptimal_side' ? 'text-yellow-300' :
              'text-green-300'
            }>
              {viewAnalysis.viewType.replace('_', ' ')}
            </span>
            <span>•</span>
            <span>Confidence: {Math.round(viewAnalysis.confidence * 100)}%</span>
          </div>
        </motion.div>
      )}

      {/* Perfect Form Celebration */}
      <AnimatePresence>
        {((isEnhancedMode && feedback?.priority === 'low' && repCounts?.currentStreak && repCounts.currentStreak >= 3) ||
          (!isEnhancedMode && formAnalysis && formAnalysis.correctness >= 0.95)) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="bg-green-500 bg-opacity-90 text-white px-6 py-4 rounded-lg text-center"
            >
              <div className="text-2xl mb-2">🎉</div>
              <div className="text-lg font-bold">
                {isEnhancedMode ? `${repCounts?.currentStreak} Rep Streak!` : 'Perfect Form!'}
              </div>
              <div className="text-sm">Keep it up!</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Angle Guides (when enabled) */}
      {isEnhancedMode && angles && showVisualGuides && landmarks && landmarks.length > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        >
          {/* Knee angle arc */}
          {landmarks[25] && landmarks[26] && landmarks[27] && (
            <g>
              <circle
                cx={landmarks[26].x * canvasWidth}
                cy={landmarks[26].y * canvasHeight}
                r="20"
                fill="none"
                stroke={getAngleColor(angles.kneeAngle, 90, 15).replace('text-', '')}
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.7"
              />
              <text
                x={landmarks[26].x * canvasWidth + 25}
                y={landmarks[26].y * canvasHeight - 5}
                fill="white"
                fontSize="12"
                fontWeight="bold"
                textAnchor="start"
              >
                {Math.round(angles.kneeAngle)}°
              </text>
            </g>
          )}
          
          {/* Hip angle arc */}
          {landmarks[23] && landmarks[24] && landmarks[25] && (
            <g>
              <circle
                cx={landmarks[24].x * canvasWidth}
                cy={landmarks[24].y * canvasHeight}
                r="15"
                fill="none"
                stroke={getAngleColor(angles.hipAngle, 90, 20).replace('text-', '')}
                strokeWidth="2"
                strokeDasharray="3,3"
                opacity="0.6"
              />
              <text
                x={landmarks[24].x * canvasWidth + 20}
                y={landmarks[24].y * canvasHeight + 15}
                fill="white"
                fontSize="10"
                fontWeight="bold"
                textAnchor="start"
              >
                {Math.round(angles.hipAngle)}°
              </text>
            </g>
          )}
        </svg>
      )}

      {/* Progress Indicators for Legacy Mode */}
      {!isEnhancedMode && formAnalysis && formAnalysis.keyPointAccuracy && (
        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 space-y-2">
          {Object.entries(formAnalysis.keyPointAccuracy).map(([joint, accuracy]) => (
            <motion.div
              key={joint}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs"
            >
              <div className="flex items-center space-x-2">
                <span className="capitalize">{joint.replace('_', ' ')}</span>
                <div className="w-8 h-1 bg-gray-600 rounded">
                  <div
                    className={`h-full rounded transition-all duration-300 ${
                      accuracy >= 0.8 ? 'bg-green-500' : accuracy >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${accuracy * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}