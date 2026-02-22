/**
 * Exercise Configuration Panel Component
 * Provides comprehensive UI for exercise mode and threshold configuration
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { exerciseModeConfigService, type ModeChangeEvent } from '@/lib/exerciseModeConfigService';
import type {
  ExerciseMode,
  ExerciseType,
  ExerciseThresholds,
  ModeThresholds,
  ExerciseConfigPanelProps
} from '@/types/advancedPose';

interface ExerciseConfigPanelExtendedProps extends ExerciseConfigPanelProps {
  showAdvancedSettings?: boolean;
  showThresholdEditor?: boolean;
  onConfigChange?: (event: ModeChangeEvent) => void;
  className?: string;
}

export function ExerciseConfigPanel({
  currentMode,
  onModeChange,
  exerciseType,
  onExerciseChange,
  thresholds,
  onThresholdChange,
  showAdvancedSettings = false,
  showThresholdEditor = false,
  onConfigChange,
  className = ''
}: ExerciseConfigPanelExtendedProps) {
  const [localMode, setLocalMode] = useState<ExerciseMode>(currentMode);
  const [localExerciseType, setLocalExerciseType] = useState<ExerciseType>(exerciseType);
  const [localThresholds, setLocalThresholds] = useState<ExerciseThresholds>(thresholds);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [configHistory, setConfigHistory] = useState<ModeChangeEvent[]>([]);

  // Sync with external props
  useEffect(() => {
    setLocalMode(currentMode);
  }, [currentMode]);

  useEffect(() => {
    setLocalExerciseType(exerciseType);
  }, [exerciseType]);

  useEffect(() => {
    setLocalThresholds(thresholds);
  }, [thresholds]);

  // Listen to config service changes
  useEffect(() => {
    const handleConfigChange = (event: ModeChangeEvent) => {
      setConfigHistory(prev => [event, ...prev.slice(0, 9)]); // Keep last 10 changes
      onConfigChange?.(event);
    };

    exerciseModeConfigService.addModeChangeListener(handleConfigChange);
    
    return () => {
      exerciseModeConfigService.removeModeChangeListener(handleConfigChange);
    };
  }, [onConfigChange]);

  // Handle mode change with immediate updates
  const handleModeChange = useCallback((newMode: ExerciseMode) => {
    if (newMode === localMode) return;

    // Update local state immediately
    setLocalMode(newMode);
    
    // Update service configuration (triggers immediate parameter updates)
    const event = exerciseModeConfigService.switchMode(newMode);
    
    // Get updated thresholds from service
    const updatedThresholds = exerciseModeConfigService.getCurrentConfig().thresholds;
    setLocalThresholds(updatedThresholds);
    
    // Notify parent components
    onModeChange(newMode);
    onThresholdChange(updatedThresholds);
    
    // Reset unsaved changes flag
    setHasUnsavedChanges(false);
  }, [localMode, onModeChange, onThresholdChange]);

  // Handle exercise type change
  const handleExerciseTypeChange = useCallback((newType: ExerciseType) => {
    if (newType === localExerciseType) return;

    // Update local state immediately
    setLocalExerciseType(newType);
    
    // Update service configuration
    const event = exerciseModeConfigService.switchExerciseType(newType);
    
    // Get updated thresholds from service
    const updatedThresholds = exerciseModeConfigService.getCurrentConfig().thresholds;
    setLocalThresholds(updatedThresholds);
    
    // Notify parent components
    onExerciseChange(newType);
    onThresholdChange(updatedThresholds);
    
    // Reset unsaved changes flag
    setHasUnsavedChanges(false);
  }, [localExerciseType, onExerciseChange, onThresholdChange]);

  // Handle threshold updates
  const handleThresholdUpdate = useCallback((
    mode: ExerciseMode, 
    field: keyof ModeThresholds, 
    value: any
  ) => {
    const updatedThresholds = {
      ...localThresholds,
      [mode]: {
        ...localThresholds[mode],
        [field]: value
      }
    };
    
    setLocalThresholds(updatedThresholds);
    setHasUnsavedChanges(true);
  }, [localThresholds]);

  // Apply threshold changes
  const applyThresholdChanges = useCallback(() => {
    // Update service with new thresholds
    exerciseModeConfigService.updateThresholds(localMode, localThresholds[localMode]);
    
    // Notify parent
    onThresholdChange(localThresholds);
    
    setHasUnsavedChanges(false);
  }, [localMode, localThresholds, onThresholdChange]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const event = exerciseModeConfigService.resetToDefaults(localMode, localExerciseType);
    const defaultThresholds = exerciseModeConfigService.getCurrentConfig().thresholds;
    
    setLocalThresholds(defaultThresholds);
    onThresholdChange(defaultThresholds);
    setHasUnsavedChanges(false);
  }, [localMode, localExerciseType, onThresholdChange]);

  // Get mode description
  const getModeDescription = (mode: ExerciseMode): string => {
    switch (mode) {
      case 'beginner':
        return 'Lenient thresholds, more guidance, longer timeouts';
      case 'pro':
        return 'Strict thresholds, precise feedback, faster transitions';
      default:
        return '';
    }
  };

  // Get exercise type description
  const getExerciseTypeDescription = (type: ExerciseType): string => {
    switch (type) {
      case 'squat':
        return 'Lower body strength exercise focusing on hip and knee movement';
      case 'pushup':
        return 'Upper body exercise targeting chest, shoulders, and triceps';
      case 'plank':
        return 'Core stability exercise maintaining straight body position';
      case 'deadlift':
        return 'Full body exercise emphasizing hip hinge movement pattern';
      case 'bicep_curl':
        return 'Isolated arm exercise targeting bicep muscles';
      default:
        return '';
    }
  };

  return (
    <Card className={`p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Exercise Configuration</h3>
        {showAdvancedSettings && (
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            size="sm"
            className="bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            {isExpanded ? 'Simple' : 'Advanced'}
          </Button>
        )}
      </div>

      {/* Exercise Mode Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Exercise Mode
        </label>
        <div className="flex space-x-2">
          {exerciseModeConfigService.getAvailableModes().map((mode) => (
            <Button
              key={mode}
              onClick={() => handleModeChange(mode)}
              size="sm"
              className={
                localMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          {getModeDescription(localMode)}
        </p>
      </div>

      {/* Exercise Type Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Exercise Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {exerciseModeConfigService.getAvailableExerciseTypes().map((type) => (
            <Button
              key={type}
              onClick={() => handleExerciseTypeChange(type)}
              size="sm"
              className={
                localExerciseType === type
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            >
              {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
            </Button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          {getExerciseTypeDescription(localExerciseType)}
        </p>
      </div>

      {/* Current Configuration Summary */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-sm font-medium text-gray-800 mb-2">Current Settings</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-600">Mode:</span>
            <span className="ml-1 font-medium text-blue-600">{localMode}</span>
          </div>
          <div>
            <span className="text-gray-600">Exercise:</span>
            <span className="ml-1 font-medium text-green-600">
              {localExerciseType.replace('_', ' ')}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Sensitivity:</span>
            <span className="ml-1 font-medium">
              {Math.round(localThresholds[localMode].feedbackSensitivity * 100)}%
            </span>
          </div>
          <div>
            <span className="text-gray-600">Timeout:</span>
            <span className="ml-1 font-medium">
              {localThresholds[localMode].inactivityTimeout}s
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      {isExpanded && showAdvancedSettings && (
        <div className="space-y-4 border-t pt-4">
          <h4 className="text-sm font-medium text-gray-800">Advanced Configuration</h4>
          
          {/* Threshold Editor */}
          {showThresholdEditor && (
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-700">
                Angle Thresholds ({localMode} mode)
              </h5>
              
              {/* Knee Angle Thresholds */}
              <div className="bg-white border rounded-lg p-3">
                <h6 className="text-xs font-medium text-gray-600 mb-2">Knee Angle</h6>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500">Standing (°)</label>
                    <input
                      type="number"
                      value={localThresholds[localMode].kneeAngle.s1Threshold}
                      onChange={(e) => handleThresholdUpdate(
                        localMode,
                        'kneeAngle',
                        {
                          ...localThresholds[localMode].kneeAngle,
                          s1Threshold: parseInt(e.target.value)
                        }
                      )}
                      className="w-full px-2 py-1 text-xs border rounded"
                      min="0"
                      max="180"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Deep Squat (°)</label>
                    <input
                      type="number"
                      value={localThresholds[localMode].kneeAngle.s3Threshold}
                      onChange={(e) => handleThresholdUpdate(
                        localMode,
                        'kneeAngle',
                        {
                          ...localThresholds[localMode].kneeAngle,
                          s3Threshold: parseInt(e.target.value)
                        }
                      )}
                      className="w-full px-2 py-1 text-xs border rounded"
                      min="0"
                      max="180"
                    />
                  </div>
                </div>
              </div>

              {/* Feedback Settings */}
              <div className="bg-white border rounded-lg p-3">
                <h6 className="text-xs font-medium text-gray-600 mb-2">Feedback Settings</h6>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500">
                      Sensitivity: {Math.round(localThresholds[localMode].feedbackSensitivity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={localThresholds[localMode].feedbackSensitivity}
                      onChange={(e) => handleThresholdUpdate(
                        localMode,
                        'feedbackSensitivity',
                        parseFloat(e.target.value)
                      )}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Inactivity Timeout (s)</label>
                    <input
                      type="number"
                      value={localThresholds[localMode].inactivityTimeout}
                      onChange={(e) => handleThresholdUpdate(
                        localMode,
                        'inactivityTimeout',
                        parseInt(e.target.value)
                      )}
                      className="w-full px-2 py-1 text-xs border rounded"
                      min="5"
                      max="60"
                    />
                  </div>
                </div>
              </div>

              {/* Threshold Actions */}
              {hasUnsavedChanges && (
                <div className="flex space-x-2">
                  <Button
                    onClick={applyThresholdChanges}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Apply Changes
                  </Button>
                  <Button
                    onClick={() => {
                      setLocalThresholds(thresholds);
                      setHasUnsavedChanges(false);
                    }}
                    size="sm"
                    className="bg-gray-400 hover:bg-gray-500 text-white"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Configuration History */}
          {configHistory.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">Recent Changes</h5>
              <div className="bg-white border rounded-lg p-2 max-h-32 overflow-y-auto">
                {configHistory.slice(0, 5).map((event, index) => (
                  <div key={index} className="text-xs text-gray-600 py-1">
                    <span className="font-medium">
                      {event.previousMode !== event.newMode 
                        ? `${event.previousMode} → ${event.newMode}`
                        : 'Settings updated'
                      }
                    </span>
                    <span className="ml-2 text-gray-400">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset Button */}
          <div className="flex justify-center">
            <Button
              onClick={resetToDefaults}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Reset to Defaults
            </Button>
          </div>
        </div>
      )}

      {/* Mode Comparison (when expanded) */}
      {isExpanded && (
        <div className="space-y-2 border-t pt-4">
          <h4 className="text-sm font-medium text-gray-800">Mode Comparison</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-blue-50 rounded-lg p-3">
              <h5 className="font-medium text-blue-800 mb-2">Beginner Mode</h5>
              <ul className="space-y-1 text-blue-700">
                <li>• More lenient angle thresholds</li>
                <li>• Longer inactivity timeout</li>
                <li>• Less sensitive feedback</li>
                <li>• More guidance messages</li>
              </ul>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <h5 className="font-medium text-purple-800 mb-2">Pro Mode</h5>
              <ul className="space-y-1 text-purple-700">
                <li>• Strict angle requirements</li>
                <li>• Shorter inactivity timeout</li>
                <li>• Highly sensitive feedback</li>
                <li>• Precise form analysis</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default ExerciseConfigPanel;