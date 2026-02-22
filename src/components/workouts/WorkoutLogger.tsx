'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkoutSession, WorkoutExercise, WorkoutSet } from '@/types/workout';
import { Exercise } from '@/types/exercise';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ExerciseSelectionModal } from './ExerciseSelectionModal';

interface WorkoutLoggerProps {
  initialWorkout?: Partial<WorkoutSession>;
  onSave: (workout: WorkoutSession) => void;
  onCancel: () => void;
}

export function WorkoutLogger({ initialWorkout, onSave, onCancel }: WorkoutLoggerProps) {
  const [workout, setWorkout] = useState<Partial<WorkoutSession>>({
    name: 'Quick Workout',
    exercises: [],
    startTime: new Date(),
    isTemplate: false,
    tags: [],
    ...initialWorkout,
  });

  const [isResting, setIsResting] = useState(false);
  const [restTimer, setRestTimer] = useState(0);
  const [workoutTimer, setWorkoutTimer] = useState(0);

  // ID counter for generating unique IDs
  const [idCounter, setIdCounter] = useState(0);
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  // Workout timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (workout.startTime && !workout.endTime) {
        setWorkoutTimer(Math.floor((Date.now() - workout.startTime.getTime()) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [workout.startTime, workout.endTime]);

  // Rest timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer]);

  const addExercise = (exercise: Exercise) => {
    const newExercise: WorkoutExercise = {
      id: `exercise_${Date.now()}`,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: [],
      targetSets: 3,
      targetReps: exercise.repetitions?.max || 10,
    };

    setWorkout(prev => ({
      ...prev,
      exercises: [...(prev.exercises || []), newExercise],
    }));
  };

  const addSet = (exerciseIndex: number) => {
    const exercise = workout.exercises?.[exerciseIndex];
    if (!exercise) return;

    const lastSet = exercise.sets.at(-1);
    setIdCounter(prev => prev + 1);
    const setId = `set_${idCounter + 1}`;
    const newSet: WorkoutSet = {
      id: setId,
      reps: lastSet?.reps || exercise.targetReps || 10,
      weight: lastSet?.weight || exercise.targetWeight || 0,
      completed: false,
      restTime: 60, // default 60 seconds rest
    };

    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises?.map((ex, idx) => 
        idx === exerciseIndex 
          ? { ...ex, sets: [...ex.sets, newSet] }
          : ex
      ),
    }));
  };

  const updateSet = (exerciseIndex: number, setIndex: number, updates: Partial<WorkoutSet>) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises?.map((ex, exIdx) => 
        exIdx === exerciseIndex 
          ? {
              ...ex,
              sets: ex.sets.map((set, setIdx) => 
                setIdx === setIndex ? { ...set, ...updates } : set
              )
            }
          : ex
      ),
    }));
  };

  const completeSet = (exerciseIndex: number, setIndex: number) => {
    updateSet(exerciseIndex, setIndex, { completed: true });
    
    // Start rest timer
    const exercise = workout.exercises?.[exerciseIndex];
    const set = exercise?.sets[setIndex];
    if (set?.restTime) {
      setRestTimer(set.restTime);
      setIsResting(true);
    }
  };

  const finishWorkout = () => {
    setIdCounter(prev => prev + 1);
    const workoutId = `workout_${idCounter + 1}`;
    const now = new Date();
    const completedWorkout: WorkoutSession = {
      id: workoutId,
      userId: 'current-user', // Replace with actual user ID
      name: workout.name || 'Quick Workout',
      exercises: workout.exercises || [],
      startTime: workout.startTime || new Date(),
      endTime: now,
      duration: Math.floor(workoutTimer / 60),
      totalVolume: calculateTotalVolume(),
      notes: workout.notes,
      tags: workout.tags || [],
      isTemplate: false,
      createdAt: now,
      updatedAt: now,
    };

    onSave(completedWorkout);
  };

  const calculateTotalVolume = (): number => {
    return (workout.exercises || []).reduce((total, exercise) => {
      return total + exercise.sets.reduce((exerciseTotal, set) => {
        return exerciseTotal + (set.completed ? (set.weight || 0) * set.reps : 0);
      }, 0);
    }, 0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Workout Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {workout.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Duration: {formatTime(workoutTimer)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={finishWorkout}>
              Finish Workout
            </Button>
          </div>
        </div>

        {/* Rest Timer */}
        <AnimatePresence>
          {isResting && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg text-center"
            >
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                Rest: {formatTime(restTimer)}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsResting(false)}
                className="mt-2"
              >
                Skip Rest
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Exercise List */}
      <div className="space-y-4">
        {workout.exercises?.map((exercise, exerciseIndex) => (
          <Card key={exercise.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {exercise.exerciseName}
              </h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => addSet(exerciseIndex)}
              >
                Add Set
              </Button>
            </div>

            {/* Sets Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Set
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Weight
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Reps
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {exercise.sets.map((set, setIndex) => (
                    <tr key={set.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-3 text-sm text-gray-900 dark:text-white">
                        {setIndex + 1}
                      </td>
                      <td className="py-3 px-3">
                        <Input
                          type="number"
                          value={set.weight || ''}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, { 
                            weight: Number.parseFloat(e.target.value) || 0 
                          })}
                          className="w-20"
                          disabled={set.completed}
                        />
                      </td>
                      <td className="py-3 px-3">
                        <Input
                          type="number"
                          value={set.reps}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, { 
                            reps: Number.parseInt(e.target.value) || 0 
                          })}
                          className="w-20"
                          disabled={set.completed}
                        />
                      </td>
                      <td className="py-3 px-3">
                        {set.completed ? (
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            ✓ Done
                          </span>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => completeSet(exerciseIndex, setIndex)}
                          >
                            Complete
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {exercise.sets.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No sets added yet. Click &quot;Add Set&quot; to start logging.
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Add Exercise Button */}
      <Card className="p-6 text-center">
        <Button
          variant="secondary"
          onClick={() => setShowExerciseModal(true)}
        >
          Add Exercise
        </Button>
      </Card>

      {/* Exercise Selection Modal */}
      <ExerciseSelectionModal
        isOpen={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        onSelectExercise={addExercise}
        selectedExercises={workout.exercises?.map(we => we.exerciseId) || []}
      />

      {/* Workout Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Workout Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {workout.exercises?.length || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Exercises</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {workout.exercises?.reduce((total, ex) => total + ex.sets.length, 0) || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Sets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {calculateTotalVolume().toFixed(0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Volume (kg)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatTime(workoutTimer)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Duration</div>
          </div>
        </div>
      </Card>
    </div>
  );
}