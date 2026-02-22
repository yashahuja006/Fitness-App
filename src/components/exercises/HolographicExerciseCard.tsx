'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Exercise } from '@/types/exercise';
import { Card } from '@/components/ui/Card';

interface HolographicExerciseCardProps {
  exercise: Exercise;
  onClick: (exercise: Exercise) => void;
  index: number;
}

export function HolographicExerciseCard({ exercise, onClick, index }: HolographicExerciseCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Optimized click handler
  const handleClick = useCallback(() => {
    onClick(exercise);
  }, [onClick, exercise]);

  // Memoized difficulty color
  const difficultyColor = useMemo(() => {
    switch (exercise.difficulty) {
      case 'beginner': return 'bg-green-500/90 text-white';
      case 'intermediate': return 'bg-yellow-500/90 text-white';
      case 'advanced': return 'bg-red-500/90 text-white';
      default: return 'bg-blue-500/90 text-white';
    }
  }, [exercise.difficulty]);

  // Memoized category color
  const categoryColor = useMemo(() => {
    switch (exercise.category) {
      case 'strength': return 'bg-blue-500/90 text-white';
      case 'cardio': return 'bg-red-500/90 text-white';
      case 'flexibility': return 'bg-purple-500/90 text-white';
      case 'balance': return 'bg-indigo-500/90 text-white';
      case 'functional': return 'bg-orange-500/90 text-white';
      case 'sports': return 'bg-pink-500/90 text-white';
      case 'rehabilitation': return 'bg-teal-500/90 text-white';
      default: return 'bg-gray-500/90 text-white';
    }
  }, [exercise.category]);

  // Calculate estimated time (based on instructions count and typical exercise duration)
  const estimatedTime = useMemo(() => {
    const baseTime = exercise.duration ? Math.ceil(exercise.duration / 60) : 5;
    const instructionTime = Math.ceil(exercise.instructions.length * 0.5);
    return Math.max(baseTime, instructionTime);
  }, [exercise.duration, exercise.instructions.length]);

  // Get rating or default
  const rating = exercise.metadata.averageRating || 4.5;
  const ratingCount = exercise.metadata.totalRatings || 0;

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Glow effect on hover */}
      {isHovered && (
        <div className="absolute inset-0 rounded-xl bg-cyan-400/20 blur-md pointer-events-none" />
      )}

      {/* Main Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm border border-gray-700/50 cursor-pointer group hover:border-cyan-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20">
        {/* Exercise Thumbnail */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
          {exercise.mediaAssets.images && exercise.mediaAssets.images.length > 0 ? (
            <img
              src={exercise.mediaAssets.images[0]}
              alt={exercise.name}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
              onError={(e) => {
                // Fallback to gradient background if image fails
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl opacity-50">
              {exercise.category === 'strength' && '💪'}
              {exercise.category === 'cardio' && '❤️'}
              {exercise.category === 'flexibility' && '🤸'}
              {exercise.category === 'balance' && '⚖️'}
              {exercise.category === 'functional' && '🏃'}
              {exercise.category === 'sports' && '⚽'}
              {exercise.category === 'rehabilitation' && '🏥'}
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Top badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${categoryColor} shadow-lg`}>
              {exercise.category.toUpperCase()}
            </span>
            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${difficultyColor} shadow-lg`}>
              {exercise.difficulty.toUpperCase()}
            </span>
          </div>

          {/* Time estimate */}
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-semibold text-white shadow-lg">
            {estimatedTime}min
          </div>
        </div>

        <div className="relative z-10 p-4">
          {/* Exercise Name */}
          <h3 className="text-lg font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors duration-200 line-clamp-2">
            {exercise.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-sm ${
                    star <= Math.round(rating)
                      ? 'text-yellow-400'
                      : 'text-gray-600'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-400">
              {rating.toFixed(1)} {ratingCount > 0 && `(${ratingCount})`}
            </span>
          </div>

          {/* Target Muscles */}
          <div className="mb-3">
            <div className="text-xs text-gray-500 mb-1.5 uppercase tracking-wide">Target Muscles</div>
            <div className="flex flex-wrap gap-1.5">
              {exercise.targetMuscles.slice(0, 3).map((muscle) => (
                <span
                  key={muscle}
                  className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded border border-cyan-500/30 font-medium"
                >
                  {muscle.replace('_', ' ')}
                </span>
              ))}
              {exercise.targetMuscles.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-800/50 text-gray-400 text-xs rounded border border-gray-600/30">
                  +{exercise.targetMuscles.length - 3}
                </span>
              )}
            </div>
          </div>

          {/* Equipment */}
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-500 uppercase tracking-wide">Equipment:</span>
              <span className="ml-1.5 text-gray-300 font-medium">
                {exercise.equipment.includes('none') 
                  ? 'No Equipment' 
                  : exercise.equipment.slice(0, 2).map(e => e.replace('-', ' ')).join(', ')}
                {exercise.equipment.length > 2 && !exercise.equipment.includes('none') && '...'}
              </span>
            </div>
            
            {/* Popularity indicator */}
            {exercise.metadata.popularity > 70 && (
              <span className="text-orange-400 font-semibold">🔥 Popular</span>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}