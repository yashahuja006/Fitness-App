/**
 * Exercise State Management Hook
 * 
 * Task 12.2: Enhanced React hooks - Create useExerciseState hook for state management
 * - Implemented exercise state tracking
 * - Added state history management
 * - Included sequence validation
 * - Added state timing and transitions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  ExerciseState,
  ExerciseAngles,
  StateTransition,
  ExerciseMode,
  ExerciseType
} from '@/types/advancedPose';

interface UseExerciseStateOptions {
  exerciseType?: ExerciseType;
  exerciseMode?: ExerciseMode;
  onStateChange?: (transition: StateTransition) => void;
  onValidSequence?: (sequence: ExerciseState[]) => void;
  onInvalidSequence?: (sequence: ExerciseState[]) => void;
  maxHistoryLength?: number;
  stateTimeoutMs?: number;
}

interface UseExerciseStateReturn {
  currentState: ExerciseState;
  stateHistory: StateTransition[];
  isValidSequence: boolean;
  timeInState: number;
  sequenceProgress: number; // 0-1, progress through valid sequence
  lastValidSequence: ExerciseState[] | null;
  resetState: () => void;
  updateState: (angles: ExerciseAngles) => StateTransition | null;
  getStateSequence: () => ExerciseState[];
  isSequenceComplete: () => boolean;
  getTimeSinceLastTransition: () => number;
}

export function useExerciseState(options: UseExerciseStateOptions = {}): UseExerciseStateReturn {
  const {
    exerciseType = 'squat',
    exerciseMode = 'beginner',
    onStateChange,
    onValidSequence,
    onInvalidSequence,
    maxHistoryLength = 50,
    stateTimeoutMs = 30000, // 30 seconds
  } = options;

  const [currentState, setCurrentState] = useState<ExerciseState>('s1');
  const [stateHistory, setStateHistory] = useState<StateTransition[]>([]);
  const [timeInState, setTimeInState] = useState(0);
  const [lastValidSequence, setLastValidSequence] = useState<ExerciseState[] | null>(null);
  
  const stateStartTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get exercise-specific thresholds based on mode
  const getThresholds = useCallback(() => {
    const baseThresholds = {
      squat: {
        s1Threshold: 160, // Standing position
        s3Threshold: 80,  // Deep squat position
        hysteresis: 5,    // Degrees of hysteresis to prevent oscillation
      }
    };

    const modeMultipliers = {
      beginner: { tolerance: 1.2, hysteresis: 1.5 },
      pro: { tolerance: 0.8, hysteresis: 0.7 }
    };

    const base = baseThresholds[exerciseType] || baseThresholds.squat;
    const multiplier = modeMultipliers[exerciseMode];

    return {
      s1Threshold: base.s1Threshold * multiplier.tolerance,
      s3Threshold: base.s3Threshold * multiplier.tolerance,
      hysteresis: base.hysteresis * multiplier.hysteresis,
    };
  }, [exerciseType, exerciseMode]);

  // Determine next state based on angles and current state
  const determineNextState = useCallback((angles: ExerciseAngles, current: ExerciseState): ExerciseState => {
    const thresholds = getThresholds();
    const kneeAngle = angles.kneeAngle;

    switch (current) {
      case 's1': // Standing
        if (kneeAngle < thresholds.s1Threshold - thresholds.hysteresis) {
          return 's2'; // Transition to movement
        }
        return 's1';

      case 's2': // Transition
        if (kneeAngle > thresholds.s1Threshold) {
          return 's1'; // Back to standing
        }
        if (kneeAngle < thresholds.s3Threshold) {
          return 's3'; // Deep squat
        }
        return 's2';

      case 's3': // Deep squat
        if (kneeAngle > thresholds.s3Threshold + thresholds.hysteresis) {
          return 's2'; // Transition back up
        }
        return 's3';

      default:
        return 's1';
    }
  }, [getThresholds]);

  // Validate if a sequence represents a complete, valid repetition
  const validateSequence = useCallback((sequence: ExerciseState[]): boolean => {
    if (sequence.length < 4) return false;

    // Valid squat sequence: s1 -> s2 -> s3 -> s2 -> s1
    const validPattern = ['s1', 's2', 's3', 's2', 's1'];
    
    // Find the pattern in the sequence
    for (let i = 0; i <= sequence.length - validPattern.length; i++) {
      const subsequence = sequence.slice(i, i + validPattern.length);
      if (subsequence.every((state, index) => state === validPattern[index])) {
        return true;
      }
    }

    return false;
  }, []);

  // Calculate sequence progress (0-1)
  const calculateSequenceProgress = useCallback((sequence: ExerciseState[]): number => {
    const validPattern = ['s1', 's2', 's3', 's2', 's1'];
    
    if (sequence.length === 0) return 0;
    
    // Find the longest matching prefix
    let maxMatch = 0;
    for (let start = Math.max(0, sequence.length - validPattern.length); start < sequence.length; start++) {
      let match = 0;
      for (let i = 0; i < Math.min(validPattern.length, sequence.length - start); i++) {
        if (sequence[start + i] === validPattern[i]) {
          match++;
        } else {
          break;
        }
      }
      maxMatch = Math.max(maxMatch, match);
    }
    
    return maxMatch / validPattern.length;
  }, []);

  // Update state based on new angles
  const updateState = useCallback((angles: ExerciseAngles): StateTransition | null => {
    const nextState = determineNextState(angles, currentState);
    
    if (nextState !== currentState) {
      const transition: StateTransition = {
        previousState: currentState,
        currentState: nextState,
        timestamp: Date.now(),
        triggerAngles: angles,
      };

      // Update state
      setCurrentState(nextState);
      
      // Add to history
      setStateHistory(prev => {
        const newHistory = [transition, ...prev].slice(0, maxHistoryLength);
        
        // Check for valid sequence completion
        const recentSequence = newHistory.slice(0, 10).map(t => t.previousState).reverse();
        recentSequence.push(nextState);
        
        if (validateSequence(recentSequence)) {
          setLastValidSequence(recentSequence);
          onValidSequence?.(recentSequence);
        } else if (recentSequence.length >= 8) {
          // Sequence is long enough but invalid
          onInvalidSequence?.(recentSequence);
        }
        
        return newHistory;
      });

      // Reset state timer
      stateStartTimeRef.current = Date.now();
      setTimeInState(0);

      // Notify callback
      onStateChange?.(transition);

      return transition;
    }

    return null;
  }, [currentState, determineNextState, maxHistoryLength, validateSequence, onStateChange, onValidSequence, onInvalidSequence]);

  // Reset state to initial
  const resetState = useCallback(() => {
    setCurrentState('s1');
    setStateHistory([]);
    setTimeInState(0);
    setLastValidSequence(null);
    stateStartTimeRef.current = Date.now();
  }, []);

  // Get current state sequence
  const getStateSequence = useCallback((): ExerciseState[] => {
    const sequence = stateHistory.slice(0, 10).map(t => t.previousState).reverse();
    sequence.push(currentState);
    return sequence;
  }, [stateHistory, currentState]);

  // Check if current sequence is complete
  const isSequenceComplete = useCallback((): boolean => {
    const sequence = getStateSequence();
    return validateSequence(sequence);
  }, [getStateSequence, validateSequence]);

  // Get time since last transition
  const getTimeSinceLastTransition = useCallback((): number => {
    if (stateHistory.length === 0) return Date.now() - stateStartTimeRef.current;
    return Date.now() - stateHistory[0].timestamp;
  }, [stateHistory]);

  // Calculate if current sequence is valid
  const isValidSequence = validateSequence(getStateSequence());
  
  // Calculate sequence progress
  const sequenceProgress = calculateSequenceProgress(getStateSequence());

  // Update time in state
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeInState(Date.now() - stateStartTimeRef.current);
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentState]);

  // Handle state timeout
  useEffect(() => {
    if (timeInState > stateTimeoutMs && currentState !== 's1') {
      // Auto-reset to standing if stuck in a state too long
      console.warn(`State timeout: resetting from ${currentState} to s1 after ${timeInState}ms`);
      resetState();
    }
  }, [timeInState, stateTimeoutMs, currentState, resetState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    currentState,
    stateHistory,
    isValidSequence,
    timeInState,
    sequenceProgress,
    lastValidSequence,
    resetState,
    updateState,
    getStateSequence,
    isSequenceComplete,
    getTimeSinceLastTransition,
  };
}