'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Navigation } from '@/components/ui/Navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Program } from '@/types/program';
import { XPProgressBar } from '@/components/gamification/XPProgressBar';
import { WeeklyScoreCard } from '@/components/gamification/WeeklyScoreCard';

export default function ActiveProgramPage() {
  const router = useRouter();
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [completedWorkouts, setCompletedWorkouts] = useState<number[]>([]);

  useEffect(() => {
    const programData = localStorage.getItem('activeProgram');
    const weekData = localStorage.getItem('currentWeek');
    const dateData = localStorage.getItem('programStartDate');
    
    if (programData) {
      setActiveProgram(JSON.parse(programData));
    }
    if (weekData) {
      setCurrentWeek(parseInt(weekData));
    }
    if (dateData) {
      setStartDate(new Date(dateData));
    }

    // Load completed workouts
    const completed = localStorage.getItem('completedWorkouts');
    if (completed) {
      setCompletedWorkouts(JSON.parse(completed));
    }
  }, []);

  if (!activeProgram) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No active program</p>
            <Button variant="primary" onClick={() => router.push('/programs')}>
              Browse Programs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const progress = (currentWeek / activeProgram.duration) * 100;
  const daysElapsed = startDate ? Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const currentSplit = activeProgram.splits[new Date().getDay() % activeProgram.splits.length];
  const isDeloadWeek = activeProgram.deloadWeeks.includes(currentWeek);
  
  const weeklyCompliance = completedWorkouts.length > 0 
    ? (completedWorkouts.filter(w => w >= (currentWeek - 1) * 7 && w < currentWeek * 7).length / activeProgram.daysPerWeek) * 100
    : 0;

  const mockWeeklyScore = {
    week: currentWeek,
    score: Math.round(weeklyCompliance * 0.4 + 70),
    breakdown: {
      completion: Math.round(weeklyCompliance * 0.4),
      consistency: 25,
      intensity: 18,
      progression: 8,
    },
    grade: (weeklyCompliance >= 90 ? 'A' : weeklyCompliance >= 80 ? 'B' : weeklyCompliance >= 70 ? 'C' : 'D') as 'A' | 'B' | 'C' | 'D',
  };

  const mockUserXP = {
    totalXP: 3500,
    level: 4,
    currentLevelXP: 1500,
    nextLevelXP: 5000,
    xpSources: {
      workoutCompletion: 2000,
      streakBonus: 800,
      milestones: 500,
      perfectWeeks: 200,
    },
  };

  const handleLogWorkout = () => {
    router.push('/workouts');
  };

  const handleEndProgram = () => {
    if (confirm('Are you sure you want to end this program?')) {
      localStorage.removeItem('activeProgram');
      localStorage.removeItem('currentWeek');
      localStorage.removeItem('programStartDate');
      router.push('/programs');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {activeProgram.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Week {currentWeek} of {activeProgram.duration} • Day {daysElapsed}
              </p>
            </div>
            <Button variant="secondary" onClick={handleEndProgram}>
              End Program
            </Button>
          </div>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Program Progress</span>
              <span className="font-semibold text-gray-900 dark:text-white">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's workout */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Today's Workout
                </h2>
                {isDeloadWeek && (
                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full text-sm font-medium">
                    🔄 Deload Week
                  </span>
                )}
              </div>

              {currentSplit ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {currentSplit.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {currentSplit.exercises} exercises • {currentSplit.estimatedDuration} min
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {currentSplit.muscleGroups.map(muscle => (
                        <span
                          key={muscle}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Button variant="primary" onClick={handleLogWorkout} className="w-full">
                    Start Workout
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Rest Day</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Recovery is just as important as training!
                  </p>
                </div>
              )}
            </Card>

            {/* Weekly score */}
            <WeeklyScoreCard weeklyScore={mockWeeklyScore} />

            {/* Compliance metrics */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                This Week's Progress
              </h2>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {completedWorkouts.filter(w => w >= (currentWeek - 1) * 7 && w < currentWeek * 7).length}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {activeProgram.daysPerWeek}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Scheduled</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(weeklyCompliance)}%
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Compliance</p>
                </div>
              </div>

              {weeklyCompliance < 70 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    💡 Your compliance is below target. Try to complete at least 70% of scheduled workouts for best results.
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* XP Progress */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Your Progress
              </h3>
              <XPProgressBar userXP={mockUserXP} showDetails={true} />
            </Card>

            {/* Quick stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Program Stats
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Days Elapsed</span>
                  <span className="font-medium text-gray-900 dark:text-white">{daysElapsed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Days Remaining</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {activeProgram.duration * 7 - daysElapsed}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Workouts</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {completedWorkouts.length} / {activeProgram.duration * activeProgram.daysPerWeek}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Next Deload</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Week {activeProgram.deloadWeeks.find(w => w > currentWeek) || '-'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Button variant="primary" onClick={handleLogWorkout} className="w-full">
                  Log Workout
                </Button>
                <Button variant="secondary" onClick={() => router.push(`/programs/${activeProgram.id}`)} className="w-full">
                  View Program Details
                </Button>
                <Button variant="secondary" onClick={() => router.push('/workouts')} className="w-full">
                  View History
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
