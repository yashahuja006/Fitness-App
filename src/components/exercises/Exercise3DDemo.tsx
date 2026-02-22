'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Exercise } from '@/types/exercise';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Exercise3DDemoProps {
  exercise: Exercise | null;
  isVisible: boolean;
  onClose: () => void;
}

export function Exercise3DDemo({ exercise, isVisible, onClose }: Exercise3DDemoProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized animation phases
  const animationPhases = useMemo(() => {
    if (!exercise) return [];
    
    const name = exercise.name.toLowerCase();
    
    if (name.includes('push')) {
      return [
        { name: 'Starting Position', description: 'Plank position, hands shoulder-width apart' },
        { name: 'Descent', description: 'Lower body until chest nearly touches floor' },
        { name: 'Bottom Position', description: 'Maintain straight line from head to heels' },
        { name: 'Ascent', description: 'Push back up to starting position' },
      ];
    } else if (name.includes('squat')) {
      return [
        { name: 'Standing', description: 'Feet shoulder-width apart, core engaged' },
        { name: 'Descent', description: 'Lower by bending hips and knees' },
        { name: 'Bottom', description: 'Thighs parallel to floor' },
        { name: 'Ascent', description: 'Drive through heels to stand' },
      ];
    } else if (name.includes('deadlift')) {
      return [
        { name: 'Setup', description: 'Bar over mid-foot, grip shoulder-width' },
        { name: 'Lift Off', description: 'Drive through heels, chest up' },
        { name: 'Lockout', description: 'Stand tall, shoulders back' },
        { name: 'Descent', description: 'Lower with control, hips back' },
      ];
    } else {
      return [
        { name: 'Preparation', description: 'Get into starting position' },
        { name: 'Execution', description: 'Perform the movement' },
        { name: 'Peak', description: 'Hold the peak contraction' },
        { name: 'Return', description: 'Return to starting position' },
      ];
    }
  }, [exercise?.name]);

  useEffect(() => {
    if (isPlaying && animationPhases.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % animationPhases.length);
      }, 2000 / animationSpeed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, animationSpeed, animationPhases.length]);

  const handleClose = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
    onClose();
  }, [onClose]);

  // Minimal 3D visualization
  const getVisualization = useCallback((exerciseName: string, step: number) => {
    const name = exerciseName.toLowerCase();
    
    if (name.includes('push')) {
      return <PushUpVisualization step={step} />;
    } else if (name.includes('squat')) {
      return <SquatVisualization step={step} />;
    } else if (name.includes('deadlift')) {
      return <DeadliftVisualization step={step} />;
    } else {
      return <GenericVisualization />;
    }
  }, []);

  // Early return after all hooks
  if (!exercise) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={handleClose}
        >
          <motion.div
            className="w-full max-w-4xl"
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-cyan-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {exercise.name} - 3D Demo
                    </h2>
                    <p className="text-cyan-400">
                      Interactive exercise demonstration
                    </p>
                  </div>
                  <Button variant="secondary" onClick={handleClose}>
                    Close
                  </Button>
                </div>
              </div>

              {/* Visualization */}
              <div className="p-6">
                {getVisualization(exercise.name, currentStep)}
              </div>

              {/* Controls */}
              <div className="p-6 border-t border-cyan-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant={isPlaying ? 'secondary' : 'primary'}
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? 'Pause' : 'Play'}
                    </Button>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">Speed:</span>
                      <select
                        value={animationSpeed}
                        onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                        className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm"
                      >
                        <option value={0.5}>0.5x</option>
                        <option value={1}>1x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2}>2x</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-400">Current Phase:</div>
                    <div className="text-cyan-400 font-medium">
                      {animationPhases[currentStep]?.name}
                    </div>
                  </div>
                </div>

                {/* Phase Description */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-white font-medium mb-2">
                    Phase {currentStep + 1}: {animationPhases[currentStep]?.name}
                  </div>
                  <div className="text-gray-300 text-sm">
                    {animationPhases[currentStep]?.description}
                  </div>
                </div>

                {/* Phase Indicators */}
                <div className="flex justify-center space-x-2 mt-4">
                  {animationPhases.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                        index === currentStep
                          ? 'bg-cyan-400'
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Ultra-simplified visualization components
function PushUpVisualization({ step }: { step: number }) {
  const positions = [0, -5, -10, 0];
  const currentY = positions[step] || 0;
  
  return (
    <div className="relative w-full h-64 flex items-center justify-center bg-gradient-to-b from-gray-900/50 to-gray-800/50 rounded-lg">
      <motion.div
        className="w-24 h-6 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full relative"
        animate={{ y: currentY }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Arms */}
        <div className="absolute -left-2 top-1 w-4 h-4 bg-purple-500 rounded-full" />
        <div className="absolute -right-2 top-1 w-4 h-4 bg-purple-500 rounded-full" />
        {/* Head */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-yellow-500 rounded-full" />
      </motion.div>
      
      <div className="absolute bottom-4 left-4 text-cyan-400 text-sm">
        Push-up Motion
      </div>
    </div>
  );
}

function SquatVisualization({ step }: { step: number }) {
  const positions = [0, -10, -20, 0];
  const currentY = positions[step] || 0;
  
  return (
    <div className="relative w-full h-64 flex items-center justify-center bg-gradient-to-b from-gray-900/50 to-gray-800/50 rounded-lg">
      <motion.div
        className="flex flex-col items-center"
        animate={{ y: currentY }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Head */}
        <div className="w-6 h-6 bg-yellow-500 rounded-full mb-1" />
        {/* Body */}
        <div className="w-8 h-12 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg mb-1" />
        {/* Legs */}
        <div className="flex space-x-1">
          <div className="w-3 h-8 bg-purple-500 rounded-lg" />
          <div className="w-3 h-8 bg-purple-500 rounded-lg" />
        </div>
      </motion.div>
      
      <div className="absolute bottom-4 left-4 text-cyan-400 text-sm">
        Squat Motion
      </div>
    </div>
  );
}

function DeadliftVisualization({ step }: { step: number }) {
  const positions = [0, 10, 20, 0];
  const barY = positions[step] || 0;
  
  return (
    <div className="relative w-full h-64 flex items-center justify-center bg-gradient-to-b from-gray-900/50 to-gray-800/50 rounded-lg">
      <div className="flex flex-col items-center">
        {/* Barbell */}
        <motion.div
          className="w-16 h-2 bg-gray-500 rounded-full mb-4"
          animate={{ y: -barY }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        />
        {/* Body */}
        <div className="w-6 h-16 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg" />
      </div>
      
      <div className="absolute bottom-4 left-4 text-cyan-400 text-sm">
        Deadlift Motion
      </div>
    </div>
  );
}

function GenericVisualization() {
  return (
    <div className="relative w-full h-64 flex items-center justify-center bg-gradient-to-b from-gray-900/50 to-gray-800/50 rounded-lg">
      <motion.div
        className="w-20 h-20 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center text-3xl"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      >
        💪
      </motion.div>
      
      <div className="absolute bottom-4 left-4 text-cyan-400 text-sm">
        Exercise Motion
      </div>
    </div>
  );
}