'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navigation } from '@/components/ui/Navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ProgressData {
  date: string;
  weight: number;
  bodyFat?: number;
  muscleGain?: number;
  workoutsCompleted: number;
  totalWorkoutTime: number;
}

export default function ProgressPage() {
  const [progressData] = useState<ProgressData[]>([
    {
      date: '2026-01-29',
      weight: 70,
      bodyFat: 15,
      muscleGain: 2,
      workoutsCompleted: 12,
      totalWorkoutTime: 480
    },
    {
      date: '2026-01-22',
      weight: 69.5,
      bodyFat: 15.5,
      muscleGain: 1.5,
      workoutsCompleted: 8,
      totalWorkoutTime: 320
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Progress Tracking
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor your fitness journey and track your improvements
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl mb-2">🏋️</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Workouts This Week
              </h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                5
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl mb-2">⏱️</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Total Time
              </h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                8h 20m
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl mb-2">📈</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Weight Change
              </h3>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                +0.5kg
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Form Score
              </h3>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                85%
              </p>
            </div>
          </Card>
        </div>

        {/* Progress Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Weight Progress
              </h3>
              <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">
                  Weight tracking chart will be implemented here
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Workout Frequency
              </h3>
              <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">
                  Workout frequency chart will be implemented here
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Progress */}
        <Card className="mt-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Progress
            </h3>
            <div className="space-y-4">
              {progressData.map((data, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(data.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {data.workoutsCompleted} workouts completed
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {data.weight}kg
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {data.totalWorkoutTime}min total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}