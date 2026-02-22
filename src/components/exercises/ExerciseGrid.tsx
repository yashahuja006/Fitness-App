'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Exercise } from '@/types/exercise';
import { HolographicExerciseCard } from './HolographicExerciseCard';
import { Exercise3DDemo } from './Exercise3DDemo';
import { Button } from '@/components/ui/Button';

interface ExerciseGridProps {
  exercises: Exercise[];
  loading: boolean;
  hasMore: boolean;
  onExerciseSelect: (exercise: Exercise) => void;
  onLoadMore: () => void;
}

export function ExerciseGrid({
  exercises,
  loading,
  hasMore,
  onExerciseSelect,
  onLoadMore
}: ExerciseGridProps) {
  const [selectedExerciseFor3D, setSelectedExerciseFor3D] = useState<Exercise | null>(null);

  const handleExerciseClick = (exercise: Exercise) => {
    // Show 3D demo first, then allow selection
    setSelectedExerciseFor3D(exercise);
  };

  const handle3DClose = () => {
    setSelectedExerciseFor3D(null);
  };

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExerciseFor3D(null);
    onExerciseSelect(exercise);
  };

  if (loading && exercises.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(12)].map((_, index) => (
          <motion.div
            key={`loading-${index}`}
            className="h-64 bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-xl border border-cyan-500/10 backdrop-blur-sm"
            animate={{
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.1,
            }}
          >
            {/* Simplified holographic loading effect */}
            <div className="relative w-full h-full overflow-hidden rounded-xl">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent"
                animate={{
                  x: [-100, 300],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: index * 0.2,
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (exercises.length === 0 && !loading) {
    return null; // Let parent component handle empty state with recommendations
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {exercises.map((exercise, index) => (
            <HolographicExerciseCard
              key={exercise.id}
              exercise={exercise}
              onClick={handleExerciseClick}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Load More Button */}
      {hasMore && (
        <motion.div
          className="flex justify-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="secondary"
            onClick={onLoadMore}
            disabled={loading}
            className="relative overflow-hidden group bg-gradient-to-r from-gray-800 to-gray-900 border border-cyan-500/30 text-cyan-400 hover:text-white"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <motion.div
                  className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <span>Loading...</span>
              </div>
            ) : (
              <>
                <span className="relative z-10">Load More Exercises</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-600/20"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.5 }}
                />
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Results Summary */}
      <motion.div 
        className="mt-6 text-center text-sm text-cyan-400/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.span
          animate={{
            textShadow: [
              '0 0 0px rgba(0, 255, 255, 0)',
              '0 0 10px rgba(0, 255, 255, 0.5)',
              '0 0 0px rgba(0, 255, 255, 0)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          Showing {exercises.length} exercise{exercises.length === 1 ? '' : 's'}
          {hasMore && ' (more available)'}
        </motion.span>
      </motion.div>

      {/* 3D Demo Modal */}
      <Exercise3DDemo
        exercise={selectedExerciseFor3D}
        isVisible={!!selectedExerciseFor3D}
        onClose={handle3DClose}
      />

      {/* Quick Action Button for 3D Demo */}
      <AnimatePresence>
        {selectedExerciseFor3D && (
          <motion.div
            className="fixed bottom-6 right-6 z-40"
            initial={{ scale: 0, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Button
              variant="primary"
              onClick={() => handleSelectExercise(selectedExerciseFor3D)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/25 relative overflow-hidden group"
            >
              <span className="relative z-10">Select Exercise</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                animate={{
                  x: [-100, 100],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}