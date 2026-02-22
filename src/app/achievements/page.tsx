'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { Card } from '@/components/ui/Card';
import { AchievementCard } from '@/components/gamification/AchievementCard';
import { LevelBadge } from '@/components/gamification/LevelBadge';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { WorkoutGamificationService } from '@/lib/workoutGamificationService';
import { GamificationEngine } from '@/lib/gamificationEngine';
import { UserXP } from '@/types/program';
import { motion } from 'framer-motion';

export default function AchievementsPage() {
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [userStats, setUserStats] = useState({
    totalWorkouts: 0,
    currentStreak: 0,
    longestStreak: 0,
    programsCompleted: 0,
    totalPRs: 0,
  });

  useEffect(() => {
    // Load user data
    const savedXP = localStorage.getItem('userXP');
    if (savedXP) {
      setUserXP(JSON.parse(savedXP));
    }

    const savedAchievements = localStorage.getItem('unlockedAchievements');
    if (savedAchievements) {
      setUnlockedAchievements(JSON.parse(savedAchievements));
    }

    const stats = WorkoutGamificationService.getUserStats();
    setUserStats(stats);
  }, []);

  const allAchievements = GamificationEngine.getAchievements(userStats);

  const categories = [
    {
      id: 'workouts',
      name: 'Workout Milestones',
      achievements: allAchievements.filter(a => 
        ['first_workout', '100_workouts', '500_workouts', '1000_workouts'].includes(a.id)
      ),
    },
    {
      id: 'streaks',
      name: 'Consistency Streaks',
      achievements: allAchievements.filter(a => 
        ['7_day_streak', '30_day_streak', '90_day_streak', '365_day_streak'].includes(a.id)
      ),
    },
    {
      id: 'programs',
      name: 'Program Completion',
      achievements: allAchievements.filter(a => 
        ['first_program', '5_programs', '10_programs'].includes(a.id)
      ),
    },
  ];

  const unlockedCount = unlockedAchievements.length;
  const totalCount = allAchievements.length;
  const completionPercentage = (unlockedCount / totalCount) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Achievements
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your fitness journey milestones and unlock rewards
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Level Card */}
          <Card className="p-6 bg-linear-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Current Level</p>
                <p className="text-3xl font-bold">{userXP?.level || 1}</p>
                <p className="text-blue-100 text-xs mt-1">
                  {GamificationEngine.getLevelTitle(userXP?.level || 1)}
                </p>
              </div>
              <LevelBadge level={userXP?.level || 1} size="lg" animated={false} />
            </div>
          </Card>

          {/* XP Card */}
          <Card className="p-6 bg-linear-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">Total XP</p>
                <p className="text-3xl font-bold">{userXP?.totalXP.toLocaleString() || 0}</p>
                <p className="text-purple-100 text-xs mt-1">
                  {userXP?.nextLevelXP ? `${userXP.nextLevelXP - userXP.currentLevelXP} to next level` : ''}
                </p>
              </div>
              <div className="text-4xl opacity-80">⭐</div>
            </div>
          </Card>

          {/* Streak Card */}
          <Card className="p-6 bg-linear-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm mb-1">Current Streak</p>
                <p className="text-3xl font-bold">{userStats.currentStreak} days</p>
                <p className="text-orange-100 text-xs mt-1">
                  Longest: {userStats.longestStreak} days
                </p>
              </div>
              <div className="text-4xl opacity-80">🔥</div>
            </div>
          </Card>

          {/* Achievements Card */}
          <Card className="p-6 bg-linear-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Achievements</p>
                <p className="text-3xl font-bold">{unlockedCount}/{totalCount}</p>
                <p className="text-green-100 text-xs mt-1">
                  {completionPercentage.toFixed(0)}% Complete
                </p>
              </div>
              <div className="text-4xl opacity-80">🏆</div>
            </div>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Overall Progress
            </h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {unlockedCount} of {totalCount} unlocked
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <motion.div
              className="bg-linear-to-r from-green-500 to-green-600 h-4 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </Card>

        {/* Achievement Categories */}
        {categories.map((category, idx) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {category.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.achievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  unlocked={unlockedAchievements.includes(achievement.id)}
                />
              ))}
            </div>
          </motion.div>
        ))}

        {/* Empty State */}
        {allAchievements.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Start Your Journey
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Complete workouts and maintain streaks to unlock achievements!
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
