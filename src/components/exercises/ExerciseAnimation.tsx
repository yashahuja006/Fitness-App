'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ExerciseAnimationProps {
  exerciseId: string;
  className?: string;
}

export function ExerciseAnimation({ exerciseId, className = '' }: ExerciseAnimationProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'start' | 'down' | 'up'>('start');

  // Animation timing
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentPhase(prev => {
        switch (prev) {
          case 'start': return 'down';
          case 'down': return 'up';
          case 'up': return 'down';
          default: return 'start';
        }
      });
    }, 1500); // 1.5 second intervals

    return () => clearInterval(interval);
  }, [isPlaying]);

  const getExerciseConfig = () => {
    switch (exerciseId) {
      case 'push-ups':
        return {
          name: 'Push-ups',
          emoji: '💪',
          colorClasses: {
            border: 'border-blue-200',
            bg: 'bg-blue-50',
            button: 'bg-blue-600 hover:bg-blue-700',
            text: 'text-blue-700',
            accent: 'text-blue-600'
          },
          instructions: [
            'Start in plank position',
            'Lower chest to ground',
            'Push back up to start'
          ]
        };
      case 'squats':
        return {
          name: 'Squats',
          emoji: '🏋️',
          colorClasses: {
            border: 'border-green-200',
            bg: 'bg-green-50',
            button: 'bg-green-600 hover:bg-green-700',
            text: 'text-green-700',
            accent: 'text-green-600'
          },
          instructions: [
            'Stand with feet shoulder-width apart',
            'Lower hips back and down',
            'Drive through heels to stand'
          ]
        };
      case 'bicep-curls':
        return {
          name: 'Bicep Curls',
          emoji: '🤲',
          colorClasses: {
            border: 'border-purple-200',
            bg: 'bg-purple-50',
            button: 'bg-purple-600 hover:bg-purple-700',
            text: 'text-purple-700',
            accent: 'text-purple-600'
          },
          instructions: [
            'Stand with arms at sides',
            'Curl weights to shoulders',
            'Lower with control'
          ]
        };
      default:
        return {
          name: 'Exercise',
          emoji: '💪',
          colorClasses: {
            border: 'border-gray-200',
            bg: 'bg-gray-50',
            button: 'bg-gray-600 hover:bg-gray-700',
            text: 'text-gray-700',
            accent: 'text-gray-600'
          },
          instructions: ['Follow the movement']
        };
    }
  };

  const config = getExerciseConfig();

  const renderPushUpAnimation = () => (
    <div className="relative w-full h-32 flex items-center justify-center">
      {/* Ground line */}
      <div className="absolute bottom-4 w-full h-1 bg-gray-300 rounded"></div>
      
      {/* Animated figure */}
      <motion.div
        className="relative"
        animate={{
          y: currentPhase === 'down' ? 20 : 0,
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        {/* Body */}
        <motion.div
          className="w-16 h-3 bg-blue-500 rounded-full"
          animate={{
            scaleY: currentPhase === 'down' ? 0.7 : 1,
          }}
          transition={{ duration: 0.8 }}
        />
        
        {/* Arms */}
        <motion.div
          className="absolute -left-2 top-0 w-6 h-1 bg-blue-600 rounded"
          animate={{
            rotate: currentPhase === 'down' ? -20 : -45,
          }}
          transition={{ duration: 0.8 }}
        />
        <motion.div
          className="absolute -right-2 top-0 w-6 h-1 bg-blue-600 rounded"
          animate={{
            rotate: currentPhase === 'down' ? 20 : 45,
          }}
          transition={{ duration: 0.8 }}
        />
        
        {/* Head */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-400 rounded-full"></div>
      </motion.div>
      
      {/* Movement indicator */}
      <motion.div
        className="absolute right-2 top-1/2 transform -translate-y-1/2"
        animate={{
          y: currentPhase === 'down' ? 10 : -10,
        }}
        transition={{ duration: 0.8 }}
      >
        <div className="text-blue-500 text-xl">
          {currentPhase === 'down' ? '↓' : '↑'}
        </div>
      </motion.div>
    </div>
  );

  const renderSquatAnimation = () => (
    <div className="relative w-full h-32 flex items-center justify-center">
      {/* Ground line */}
      <div className="absolute bottom-4 w-full h-1 bg-gray-300 rounded"></div>
      
      {/* Animated figure */}
      <motion.div
        className="relative flex flex-col items-center"
        animate={{
          y: currentPhase === 'down' ? 15 : 0,
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        {/* Head */}
        <div className="w-4 h-4 bg-green-400 rounded-full mb-1"></div>
        
        {/* Torso */}
        <motion.div
          className="w-3 h-8 bg-green-500 rounded"
          animate={{
            scaleY: currentPhase === 'down' ? 0.8 : 1,
          }}
          transition={{ duration: 0.8 }}
        />
        
        {/* Arms */}
        <motion.div
          className="absolute top-6 -left-3 w-5 h-1 bg-green-600 rounded"
          animate={{
            rotate: currentPhase === 'down' ? 45 : 0,
          }}
          transition={{ duration: 0.8 }}
        />
        <motion.div
          className="absolute top-6 -right-3 w-5 h-1 bg-green-600 rounded"
          animate={{
            rotate: currentPhase === 'down' ? -45 : 0,
          }}
          transition={{ duration: 0.8 }}
        />
        
        {/* Legs */}
        <motion.div
          className="flex space-x-1 mt-1"
          animate={{
            scaleY: currentPhase === 'down' ? 0.6 : 1,
          }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-1 h-6 bg-green-600 rounded"></div>
          <div className="w-1 h-6 bg-green-600 rounded"></div>
        </motion.div>
      </motion.div>
      
      {/* Movement indicator */}
      <motion.div
        className="absolute right-2 top-1/2 transform -translate-y-1/2"
        animate={{
          y: currentPhase === 'down' ? 10 : -10,
        }}
        transition={{ duration: 0.8 }}
      >
        <div className="text-green-500 text-xl">
          {currentPhase === 'down' ? '↓' : '↑'}
        </div>
      </motion.div>
    </div>
  );

  const renderBicepCurlAnimation = () => (
    <div className="relative w-full h-32 flex items-center justify-center">
      {/* Ground line */}
      <div className="absolute bottom-4 w-full h-1 bg-gray-300 rounded"></div>
      
      {/* Animated figure */}
      <div className="relative flex flex-col items-center">
        {/* Head */}
        <div className="w-4 h-4 bg-purple-400 rounded-full mb-1"></div>
        
        {/* Torso */}
        <div className="w-3 h-8 bg-purple-500 rounded"></div>
        
        {/* Arms with weights */}
        <motion.div
          className="absolute top-6 -left-4 flex items-center"
          animate={{
            rotate: currentPhase === 'down' ? 0 : -90,
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <div className="w-4 h-1 bg-purple-600 rounded"></div>
          <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
        </motion.div>
        
        <motion.div
          className="absolute top-6 -right-4 flex items-center flex-row-reverse"
          animate={{
            rotate: currentPhase === 'down' ? 0 : 90,
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <div className="w-4 h-1 bg-purple-600 rounded"></div>
          <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
        </motion.div>
        
        {/* Legs */}
        <div className="flex space-x-1 mt-1">
          <div className="w-1 h-6 bg-purple-600 rounded"></div>
          <div className="w-1 h-6 bg-purple-600 rounded"></div>
        </div>
      </div>
      
      {/* Movement indicator */}
      <motion.div
        className="absolute right-2 top-1/2 transform -translate-y-1/2"
        animate={{
          rotate: currentPhase === 'down' ? 0 : 180,
        }}
        transition={{ duration: 0.8 }}
      >
        <div className="text-purple-500 text-xl">↻</div>
      </motion.div>
    </div>
  );

  const renderAnimation = () => {
    switch (exerciseId) {
      case 'push-ups':
        return renderPushUpAnimation();
      case 'squats':
        return renderSquatAnimation();
      case 'bicep-curls':
        return renderBicepCurlAnimation();
      default:
        return <div className="w-full h-32 flex items-center justify-center text-gray-500">Select an exercise</div>;
    }
  };

  return (
    <div className={`${className}`}>
      <Card className={`p-4 border-2 ${config.colorClasses.border} ${config.colorClasses.bg}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{config.emoji}</span>
            <h3 className="font-semibold text-gray-800">{config.name}</h3>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`text-xs px-2 py-1 ${config.colorClasses.button}`}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </Button>
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`text-xs px-2 py-1 ${config.colorClasses.button}`}
            >
              {isExpanded ? '🔽' : '🔼'}
            </Button>
          </div>
        </div>

        {/* Animation */}
        <div className="mb-3">
          {renderAnimation()}
        </div>

        {/* Phase indicator */}
        <div className="text-center mb-3">
          <span className={`text-sm font-medium ${config.colorClasses.text}`}>
            {currentPhase === 'start' && 'Ready Position'}
            {currentPhase === 'down' && 'Lowering Phase'}
            {currentPhase === 'up' && 'Lifting Phase'}
          </span>
        </div>

        {/* Expandable instructions */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className={`border-t ${config.colorClasses.border} pt-3`}>
                <h4 className="text-sm font-semibold mb-2">How to perform:</h4>
                <ol className="text-xs space-y-1">
                  {config.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className={`${config.colorClasses.accent} font-bold`}>{index + 1}.</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick tips */}
        <div className={`text-xs ${config.colorClasses.accent} mt-2 text-center`}>
          💡 Click ▶️ to play/pause • Click 🔼 for instructions
        </div>
      </Card>
    </div>
  );
}