'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Exercise } from '@/types/exercise';
import { ExerciseSelectionModal } from './ExerciseSelectionModal';

interface WorkoutRoutine {
  id: string;
  name: string;
  exercises: Exercise[];
  createdAt: Date;
  updatedAt: Date;
}

interface CreateRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (routine: Omit<WorkoutRoutine, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function CreateRoutineModal({ isOpen, onClose, onSave }: CreateRoutineModalProps) {
  const [routineName, setRoutineName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  const handleSave = () => {
    if (!routineName.trim()) return;

    onSave({
      name: routineName,
      exercises: selectedExercises
    });

    // Reset form
    setRoutineName('');
    setSelectedExercises([]);
    onClose();
  };

  const handleAddExercise = (exercise: Exercise) => {
    if (!selectedExercises.find(ex => ex.id === exercise.id)) {
      setSelectedExercises(prev => [...prev, exercise]);
    }
    setShowExerciseModal(false);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExercises(prev => prev.filter(ex => ex.id !== exerciseId));
  };

  const handleClose = () => {
    setRoutineName('');
    setSelectedExercises([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create Routine
              </h2>
              <Button 
                variant="primary" 
                onClick={handleSave}
                disabled={!routineName.trim()}
              >
                Save
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Routine Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Routine title
                </label>
                <Input
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  placeholder="Enter routine name"
                  className="w-full"
                />
              </div>

              {/* Exercise List or Empty State */}
              <div className="space-y-4">
                {selectedExercises.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏋️</div>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Get started by adding an exercise to your routine.
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => setShowExerciseModal(true)}
                      className="w-full"
                    >
                      + Add exercise
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Exercises ({selectedExercises.length})
                      </h3>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowExerciseModal(true)}
                      >
                        + Add
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {selectedExercises.map((exercise, index) => (
                        <motion.div
                          key={exercise.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {exercise.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                              {exercise.targetMuscles.join(', ')}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveExercise(exercise.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            ✕
                          </button>
                        </motion.div>
                      ))}
                    </div>

                    <Button
                      variant="secondary"
                      onClick={() => setShowExerciseModal(true)}
                      className="w-full mt-4"
                    >
                      + Add exercise
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Exercise Selection Modal */}
      <ExerciseSelectionModal
        isOpen={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        onSelectExercise={handleAddExercise}
        selectedExercises={selectedExercises}
      />
    </>
  );
}