'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Exercise } from '@/types/exercise';
import { CreateRoutineModal } from './CreateRoutineModal';

interface WorkoutRoutine {
  id: string;
  name: string;
  exercises: Exercise[];
  createdAt: Date;
  updatedAt: Date;
}

interface WorkoutRoutinesProps {
  onStartRoutine: (routine: WorkoutRoutine) => void;
}

export function WorkoutRoutines({ onStartRoutine }: WorkoutRoutinesProps) {
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([
    {
      id: 'day-1',
      name: 'Day 1',
      exercises: [
        {
          id: 'squat-smith',
          name: 'Squat (Smith Machine)',
          category: 'strength',
          targetMuscles: ['quadriceps'],
          equipment: ['smith-machine'],
          difficulty: 'intermediate',
          instructions: [],
          commonMistakes: [],
          safetyTips: [],
          mediaAssets: { images: [], videos: [], demonstrations: [] },
          metadata: { createdBy: 'system', verified: true, popularity: 95, tags: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'bench-press-dumbbell',
          name: 'Bench Press (Dumbbell)',
          category: 'strength',
          targetMuscles: ['chest'],
          equipment: ['dumbbells'],
          difficulty: 'intermediate',
          instructions: [],
          commonMistakes: [],
          safetyTips: [],
          mediaAssets: { images: [], videos: [], demonstrations: [] },
          metadata: { createdBy: 'system', verified: true, popularity: 90, tags: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'lat-pulldown-close-grip',
          name: 'Lat Pulldown - Close Grip (Cable)',
          category: 'strength',
          targetMuscles: ['lats'],
          equipment: ['cable'],
          difficulty: 'intermediate',
          instructions: [],
          commonMistakes: [],
          safetyTips: [],
          mediaAssets: { images: [], videos: [], demonstrations: [] },
          metadata: { createdBy: 'system', verified: true, popularity: 85, tags: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'day-2',
      name: 'Day 2',
      exercises: [
        {
          id: 'deadlift-barbell',
          name: 'Deadlift (Barbell)',
          category: 'strength',
          targetMuscles: ['hamstrings', 'glutes'],
          equipment: ['barbell'],
          difficulty: 'advanced',
          instructions: [],
          commonMistakes: [],
          safetyTips: [],
          mediaAssets: { images: [], videos: [], demonstrations: [] },
          metadata: { createdBy: 'system', verified: true, popularity: 92, tags: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'incline-bench-press',
          name: 'Incline Bench Press (Dumbbell)',
          category: 'strength',
          targetMuscles: ['chest'],
          equipment: ['dumbbells'],
          difficulty: 'intermediate',
          instructions: [],
          commonMistakes: [],
          safetyTips: [],
          mediaAssets: { images: [], videos: [], demonstrations: [] },
          metadata: { createdBy: 'system', verified: true, popularity: 88, tags: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'seated-cable-row',
          name: 'Seated Cable Row - Bar Wide Grip',
          category: 'strength',
          targetMuscles: ['upper-back'],
          equipment: ['cable'],
          difficulty: 'intermediate',
          instructions: [],
          commonMistakes: [],
          safetyTips: [],
          mediaAssets: { images: [], videos: [], demonstrations: [] },
          metadata: { createdBy: 'system', verified: true, popularity: 86, tags: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'day-3',
      name: 'Day 3',
      exercises: [
        {
          id: 'romanian-deadlift',
          name: 'Romanian Deadlift (Barbell)',
          category: 'strength',
          targetMuscles: ['hamstrings'],
          equipment: ['barbell'],
          difficulty: 'intermediate',
          instructions: [],
          commonMistakes: [],
          safetyTips: [],
          mediaAssets: { images: [], videos: [], demonstrations: [] },
          metadata: { createdBy: 'system', verified: true, popularity: 84, tags: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'bench-press-dumbbell-2',
          name: 'Bench Press (Dumbbell)',
          category: 'strength',
          targetMuscles: ['chest'],
          equipment: ['dumbbells'],
          difficulty: 'intermediate',
          instructions: [],
          commonMistakes: [],
          safetyTips: [],
          mediaAssets: { images: [], videos: [], demonstrations: [] },
          metadata: { createdBy: 'system', verified: true, popularity: 90, tags: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'dumbbell-row',
          name: 'Dumbbell Row',
          category: 'strength',
          targetMuscles: ['upper-back'],
          equipment: ['dumbbells'],
          difficulty: 'intermediate',
          instructions: [],
          commonMistakes: [],
          safetyTips: [],
          mediaAssets: { images: [], videos: [], demonstrations: [] },
          metadata: { createdBy: 'system', verified: true, popularity: 87, tags: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'arnold-press',
          name: 'Arnold Press (Dumbbell)',
          category: 'strength',
          targetMuscles: ['shoulders'],
          equipment: ['dumbbells'],
          difficulty: 'intermediate',
          instructions: [],
          commonMistakes: [],
          safetyTips: [],
          mediaAssets: { images: [], videos: [], demonstrations: [] },
          metadata: { createdBy: 'system', verified: true, popularity: 82, tags: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedRoutines, setExpandedRoutines] = useState(true);

  const handleCreateRoutine = (routineData: Omit<WorkoutRoutine, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRoutine: WorkoutRoutine = {
      ...routineData,
      id: `routine_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setRoutines(prev => [...prev, newRoutine]);
  };

  const handleDeleteRoutine = (routineId: string) => {
    setRoutines(prev => prev.filter(routine => routine.id !== routineId));
  };

  const truncateExerciseList = (exercises: Exercise[], maxLength: number = 50) => {
    const exerciseNames = exercises.map(ex => ex.name).join(', ');
    if (exerciseNames.length <= maxLength) return exerciseNames;
    return exerciseNames.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Workout
          </h1>
          <Button variant="secondary" size="sm">
            🔄
          </Button>
          <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs font-medium">
            PRO
          </div>
        </div>
      </div>

      {/* Start Empty Workout */}
      <Button
        variant="primary"
        className="w-full h-12 text-lg"
        onClick={() => onStartRoutine({
          id: 'empty-workout',
          name: 'Empty Workout',
          exercises: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        })}
      >
        + Start Empty Workout
      </Button>

      {/* Routines Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Routines
          </h2>
          <Button variant="secondary" size="sm">
            📤
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button
            variant="secondary"
            className="h-12 flex items-center justify-center gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="text-lg">📝</span>
            New Routine
          </Button>
          <Button
            variant="secondary"
            className="h-12 flex items-center justify-center gap-2"
          >
            <span className="text-lg">🔍</span>
            Explore
          </Button>
        </div>

        {/* My Routines */}
        <div className="mb-6">
          <button
            onClick={() => setExpandedRoutines(!expandedRoutines)}
            className="flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-400"
          >
            <span className={`transform transition-transform ${expandedRoutines ? 'rotate-90' : ''}`}>
              ▶
            </span>
            <span className="font-medium">My Routines ({routines.length})</span>
          </button>

          <AnimatePresence>
            {expandedRoutines && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {routines.map((routine, index) => (
                  <motion.div
                    key={routine.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {routine.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {truncateExerciseList(routine.exercises)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteRoutine(routine.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
                        >
                          ⋯
                        </button>
                      </div>

                      <Button
                        variant="primary"
                        onClick={() => onStartRoutine(routine)}
                        className="w-full"
                      >
                        Start Routine
                      </Button>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Navigation Placeholder */}
      <div className="h-20" /> {/* Space for bottom navigation */}

      {/* Create Routine Modal */}
      <CreateRoutineModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateRoutine}
      />
    </div>
  );
}