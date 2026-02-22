/**
 * Exercise Selector Component
 * Allows users to choose between different exercises
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export type ExerciseType = 'pushup' | 'squat' | 'bicep_curl';

interface ExerciseSelectorProps {
  selectedExercise: ExerciseType;
  onExerciseChange: (exercise: ExerciseType) => void;
  className?: string;
}

const EXERCISES = [
  {
    id: 'pushup' as ExerciseType,
    name: 'Push-ups',
    description: 'Upper body strength exercise',
    instructions: 'Position yourself in plank position, lower chest to ground and push back up',
    keyPoints: ['Keep body straight', 'Lower to 90° elbow angle', 'Controlled movement'],
  },
  {
    id: 'squat' as ExerciseType,
    name: 'Squats',
    description: 'Lower body strength exercise',
    instructions: 'Stand with feet shoulder-width apart, lower hips back and down',
    keyPoints: ['Knees track over toes', 'Lower to 90° knee angle', 'Keep chest up'],
  },
  {
    id: 'bicep_curl' as ExerciseType,
    name: 'Bicep Curls',
    description: 'Arm strength exercise',
    instructions: 'Stand upright, curl weights up by flexing at the elbow',
    keyPoints: ['Keep elbows at sides', 'Full range of motion', 'Controlled movement'],
  },
];

export function ExerciseSelector({
  selectedExercise,
  onExerciseChange,
  className = '',
}: ExerciseSelectorProps) {
  const selectedExerciseData = EXERCISES.find(ex => ex.id === selectedExercise);

  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Select Exercise</h3>
      
      {/* Exercise Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {EXERCISES.map((exercise) => (
          <Button
            key={exercise.id}
            onClick={() => onExerciseChange(exercise.id)}
            className={`p-4 h-auto flex flex-col items-center text-center ${
              selectedExercise === exercise.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="font-medium mb-1">{exercise.name}</div>
            <div className="text-xs opacity-75">{exercise.description}</div>
          </Button>
        ))}
      </div>

      {/* Selected Exercise Details */}
      {selectedExerciseData && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            {selectedExerciseData.name} - Instructions
          </h4>
          <p className="text-sm text-blue-800 mb-3">
            {selectedExerciseData.instructions}
          </p>
          <div>
            <h5 className="text-sm font-medium text-blue-900 mb-1">Key Points:</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              {selectedExerciseData.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}