'use client';

import { motion } from 'framer-motion';
import { Exercise } from '@/types/exercise';
import { Card } from '@/components/ui/Card';
import { ExerciseVideoThumbnail } from './ExerciseVideoThumbnail';

interface ExerciseCardProps {
  exercise: Exercise;
  onClick: () => void;
}

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const CATEGORY_COLORS = {
  strength: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  cardio: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  flexibility: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  balance: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  functional: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  sports: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  rehabilitation: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
};

export function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
  const formatMuscleGroups = (muscles: string[]) => {
    if (muscles.length === 0) return '';
    if (muscles.length === 1) return muscles[0].replace('_', ' ');
    if (muscles.length === 2) return muscles.map(m => m.replace('_', ' ')).join(' & ');
    return `${muscles[0].replace('_', ' ')} +${muscles.length - 1} more`;
  };

  const formatEquipment = (equipment: string[]) => {
    if (equipment.includes('none')) return 'No equipment';
    if (equipment.length === 1) return equipment[0].replace('_', ' ');
    if (equipment.length === 2) return equipment.map(e => e.replace('_', ' ')).join(' & ');
    return `${equipment[0].replace('_', ' ')} +${equipment.length - 1} more`;
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="h-full cursor-pointer hover:shadow-lg transition-shadow duration-200"
        onClick={onClick}
      >
        <div className="p-6">
          {/* Video Thumbnail */}
          {exercise.mediaAssets.videos && exercise.mediaAssets.videos.length > 0 && (
            <div className="mb-4">
              <ExerciseVideoThumbnail
                videoUrl={exercise.mediaAssets.videos[0]}
                title={exercise.name}
                className="w-full"
              />
            </div>
          )}

          {/* Header */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {exercise.name}
            </h3>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[exercise.category]}`}>
                {exercise.category.charAt(0).toUpperCase() + exercise.category.slice(1)}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${DIFFICULTY_COLORS[exercise.difficulty]}`}>
                {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
              </span>
            </div>
          </div>

          {/* Exercise Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium mr-2">Target:</span>
              <span className="capitalize">{formatMuscleGroups(exercise.targetMuscles)}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium mr-2">Equipment:</span>
              <span className="capitalize">{formatEquipment(exercise.equipment)}</span>
            </div>

            {exercise.caloriesPerMinute && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium mr-2">Calories:</span>
                <span>{exercise.caloriesPerMinute}/min</span>
              </div>
            )}
          </div>

          {/* Instructions Preview */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {exercise.instructions[0]}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              {exercise.metadata.averageRating && (
                <div className="flex items-center">
                  <span className="text-yellow-400 mr-1">★</span>
                  <span>{exercise.metadata.averageRating.toFixed(1)}</span>
                </div>
              )}
              <div className="flex items-center">
                <span className="mr-1">👁</span>
                <span>{exercise.metadata.popularity}</span>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
            >
              View Details →
            </motion.button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}