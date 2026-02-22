'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { WorkoutSession } from '@/types/workout';

interface WorkoutStatsProps {
  workouts: WorkoutSession[];
  selectedDate?: Date;
}

interface MuscleGroupData {
  name: string;
  percentage: number;
  color: string;
}

export function WorkoutStats({ workouts, selectedDate }: WorkoutStatsProps) {
  const stats = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();

    const weeklyData = last7Days.map(date => {
      const dayWorkouts = workouts.filter(w => {
        const workoutDate = new Date(w.startTime);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === date.getTime();
      });

      const totalVolume = dayWorkouts.reduce((sum, w) => sum + w.totalVolume, 0);
      const totalSets = dayWorkouts.reduce((sum, w) => 
        sum + w.exercises.reduce((exSum, ex) => exSum + ex.sets.length, 0), 0
      );

      return {
        date,
        volume: totalVolume,
        sets: totalSets,
        workouts: dayWorkouts.length,
        day: date.toLocaleDateString('en', { weekday: 'short' }).charAt(0)
      };
    });

    // Calculate muscle group distribution
    const muscleGroups: { [key: string]: number } = {};
    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        // This would normally come from exercise data
        const primaryMuscle = exercise.exerciseName.toLowerCase().includes('chest') ? 'Chest' :
                             exercise.exerciseName.toLowerCase().includes('back') ? 'Back' :
                             exercise.exerciseName.toLowerCase().includes('shoulder') ? 'Shoulders' :
                             exercise.exerciseName.toLowerCase().includes('leg') || exercise.exerciseName.toLowerCase().includes('squat') ? 'Legs' :
                             exercise.exerciseName.toLowerCase().includes('arm') || exercise.exerciseName.toLowerCase().includes('bicep') || exercise.exerciseName.toLowerCase().includes('tricep') ? 'Arms' :
                             'Other';
        
        muscleGroups[primaryMuscle] = (muscleGroups[primaryMuscle] || 0) + exercise.sets.length;
      });
    });

    const totalSets = Object.values(muscleGroups).reduce((sum, sets) => sum + sets, 0);
    const muscleGroupData: MuscleGroupData[] = Object.entries(muscleGroups)
      .map(([name, sets]) => ({
        name,
        percentage: totalSets > 0 ? (sets / totalSets) * 100 : 0,
        color: name === 'Chest' ? '#3B82F6' :
               name === 'Back' ? '#10B981' :
               name === 'Shoulders' ? '#F59E0B' :
               name === 'Legs' ? '#EF4444' :
               name === 'Arms' ? '#8B5CF6' :
               '#6B7280'
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return {
      weeklyData,
      muscleGroupData,
      totalWorkouts: workouts.length,
      totalVolume: workouts.reduce((sum, w) => sum + w.totalVolume, 0),
      totalSets: workouts.reduce((sum, w) => 
        sum + w.exercises.reduce((exSum, ex) => exSum + ex.sets.length, 0), 0
      ),
      avgDuration: workouts.length > 0 
        ? workouts.reduce((sum, w) => sum + (w.duration || 0), 0) / workouts.length 
        : 0
    };
  }, [workouts]);

  const maxVolume = Math.max(...stats.weeklyData.map(d => d.volume), 1);

  return (
    <div className="space-y-6">
      {/* Body Graph Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Last 7 days body graph
        </h2>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <span className="text-lg">❓</span>
        </button>
      </div>

      {/* Weekly Chart */}
      <Card className="p-6">
        <div className="flex items-end justify-between h-32 mb-4">
          {stats.weeklyData.map((day, index) => (
            <div key={day.date.getTime()} className="flex flex-col items-center flex-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(day.volume / maxVolume) * 100}%` }}
                transition={{ delay: index * 0.1 }}
                className={`
                  w-8 rounded-t-lg mb-2 min-h-[4px]
                  ${day.date.getDate() === 23 
                    ? 'bg-blue-500' 
                    : day.volume > 0 
                      ? 'bg-blue-300' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }
                `}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {day.day}
              </span>
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {day.date.getDate()}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* 3D Body Model */}
      <Card className="p-6">
        <div className="flex justify-center items-center h-64 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
          <div className="text-center">
            <div className="text-6xl mb-4">🏃‍♂️</div>
            <p className="text-gray-600 dark:text-gray-400">
              3D Body Model
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Visual representation of worked muscles
            </p>
          </div>
        </div>
      </Card>

      {/* Advanced Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Advanced statistics
        </h3>

        <div className="space-y-4">
          {/* Set count per muscle group */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400">📊</span>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Set count per muscle group
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Number of sets logged for each muscle group.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded">
                PRO
              </span>
              <span className="text-gray-400">→</span>
            </div>
          </div>

          {/* Muscle distribution (Chart) */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400">📈</span>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Muscle distribution (Chart)
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Compare your current and previous muscle distributions.
                </div>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </div>

          {/* Muscle distribution (Body) */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400">🏃‍♂️</span>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Muscle distribution (Body)
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Weekly heat map of muscles worked.
                </div>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </div>
        </div>
      </Card>

      {/* Muscle Group Distribution */}
      {stats.muscleGroupData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Muscle Group Distribution
          </h3>
          
          <div className="space-y-3">
            {stats.muscleGroupData.map((muscle, index) => (
              <div key={muscle.name} className="flex items-center gap-3">
                <div className="w-12 text-sm font-medium text-gray-600 dark:text-gray-400">
                  {muscle.name}
                </div>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${muscle.percentage}%` }}
                    transition={{ delay: index * 0.1 }}
                    className="h-2 rounded-full"
                    style={{ backgroundColor: muscle.color }}
                  />
                </div>
                <div className="w-12 text-sm font-medium text-gray-900 dark:text-white text-right">
                  {muscle.percentage.toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalWorkouts}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Workouts
          </div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.totalVolume.toFixed(0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Volume (kg)
          </div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.totalSets}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Sets
          </div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {Math.round(stats.avgDuration)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Avg Duration (min)
          </div>
        </Card>
      </div>
    </div>
  );
}