import { WorkoutSession, WorkoutExercise } from '@/types/workout';
import { Exercise } from '@/types/exercise';

// Local storage keys
const WORKOUT_HISTORY_KEY = 'fitness-app-workout-history';
const WORKOUT_ROUTINES_KEY = 'fitness-app-workout-routines';

export interface WorkoutRoutine {
  id: string;
  name: string;
  exercises: Exercise[];
  createdAt: Date;
  updatedAt: Date;
}

// Workout History Management
export const saveWorkoutSession = (workout: WorkoutSession): void => {
  try {
    const existingHistory = getWorkoutHistory();
    const updatedHistory = [workout, ...existingHistory];
    localStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Failed to save workout session:', error);
  }
};

export const getWorkoutHistory = (): WorkoutSession[] => {
  try {
    const stored = localStorage.getItem(WORKOUT_HISTORY_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((workout: any) => ({
      ...workout,
      startTime: new Date(workout.startTime),
      endTime: new Date(workout.endTime),
      createdAt: new Date(workout.createdAt),
      updatedAt: new Date(workout.updatedAt),
    }));
  } catch (error) {
    console.error('Failed to load workout history:', error);
    return [];
  }
};

export const deleteWorkoutSession = (workoutId: string): void => {
  try {
    const existingHistory = getWorkoutHistory();
    const updatedHistory = existingHistory.filter(w => w.id !== workoutId);
    localStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Failed to delete workout session:', error);
  }
};

// Workout Routines Management
export const saveWorkoutRoutine = (routine: Omit<WorkoutRoutine, 'id' | 'createdAt' | 'updatedAt'>): WorkoutRoutine => {
  try {
    const newRoutine: WorkoutRoutine = {
      ...routine,
      id: `routine_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const existingRoutines = getWorkoutRoutines();
    const updatedRoutines = [...existingRoutines, newRoutine];
    localStorage.setItem(WORKOUT_ROUTINES_KEY, JSON.stringify(updatedRoutines));
    
    return newRoutine;
  } catch (error) {
    console.error('Failed to save workout routine:', error);
    throw error;
  }
};

export const getWorkoutRoutines = (): WorkoutRoutine[] => {
  try {
    const stored = localStorage.getItem(WORKOUT_ROUTINES_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((routine: any) => ({
      ...routine,
      createdAt: new Date(routine.createdAt),
      updatedAt: new Date(routine.updatedAt),
    }));
  } catch (error) {
    console.error('Failed to load workout routines:', error);
    return [];
  }
};

export const updateWorkoutRoutine = (routineId: string, updates: Partial<WorkoutRoutine>): void => {
  try {
    const existingRoutines = getWorkoutRoutines();
    const updatedRoutines = existingRoutines.map(routine => 
      routine.id === routineId 
        ? { ...routine, ...updates, updatedAt: new Date() }
        : routine
    );
    localStorage.setItem(WORKOUT_ROUTINES_KEY, JSON.stringify(updatedRoutines));
  } catch (error) {
    console.error('Failed to update workout routine:', error);
  }
};

export const deleteWorkoutRoutine = (routineId: string): void => {
  try {
    const existingRoutines = getWorkoutRoutines();
    const updatedRoutines = existingRoutines.filter(r => r.id !== routineId);
    localStorage.setItem(WORKOUT_ROUTINES_KEY, JSON.stringify(updatedRoutines));
  } catch (error) {
    console.error('Failed to delete workout routine:', error);
  }
};

// Convert routine to workout session
export const startWorkoutFromRoutine = (routine: WorkoutRoutine): Partial<WorkoutSession> => {
  const workoutExercises: WorkoutExercise[] = routine.exercises.map(exercise => ({
    id: `exercise_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    sets: [],
    targetSets: 3, // Default target sets
    targetReps: 10, // Default target reps
  }));

  return {
    name: routine.name,
    exercises: workoutExercises,
    startTime: new Date(),
    isTemplate: false,
    tags: [],
  };
};

// Analytics and Statistics
export const getWorkoutStats = (workouts: WorkoutSession[]) => {
  const totalWorkouts = workouts.length;
  const totalVolume = workouts.reduce((sum, w) => sum + w.totalVolume, 0);
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
  const avgDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;
  
  // Calculate muscle group distribution
  const muscleGroups: Record<string, number> = {};
  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      // Simple muscle group detection based on exercise name
      const exerciseName = exercise.exerciseName.toLowerCase();
      let primaryMuscle = 'other';
      
      if (exerciseName.includes('chest') || exerciseName.includes('bench')) primaryMuscle = 'chest';
      else if (exerciseName.includes('back') || exerciseName.includes('row') || exerciseName.includes('pulldown')) primaryMuscle = 'back';
      else if (exerciseName.includes('shoulder') || exerciseName.includes('press')) primaryMuscle = 'shoulders';
      else if (exerciseName.includes('leg') || exerciseName.includes('squat') || exerciseName.includes('deadlift')) primaryMuscle = 'legs';
      else if (exerciseName.includes('arm') || exerciseName.includes('bicep') || exerciseName.includes('tricep')) primaryMuscle = 'arms';
      
      muscleGroups[primaryMuscle] = (muscleGroups[primaryMuscle] || 0) + exercise.sets.length;
    });
  });

  return {
    totalWorkouts,
    totalVolume,
    totalDuration,
    avgDuration,
    muscleGroups,
  };
};

// Get workout streak
export const getWorkoutStreak = (workouts: WorkoutSession[]): number => {
  if (workouts.length === 0) return 0;
  
  const sortedWorkouts = [...workouts]
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 30; i++) { // Check last 30 days
    const hasWorkout = sortedWorkouts.some(w => {
      const workoutDate = new Date(w.startTime);
      workoutDate.setHours(0, 0, 0, 0);
      return workoutDate.getTime() === currentDate.getTime();
    });
    
    if (hasWorkout) {
      streak++;
    } else if (streak > 0) {
      break; // Streak is broken
    }
    
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return streak;
};