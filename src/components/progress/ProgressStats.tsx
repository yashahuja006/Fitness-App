/**
 * Progress Statistics Component
 * Displays key workout statistics in a grid layout
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import type { ProgressAnalytics } from '@/lib/progressTrackingService';

interface ProgressStatsProps {
  analytics: ProgressAnalytics;
  timeframe: 'week' | 'month' | 'year' | 'all';
}

export function ProgressStats({ analytics, timeframe }: ProgressStatsProps) {
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k lbs`;
    }
    return `${volume} lbs`;
  };

  const getTimeframeLabel = (timeframe: string): string => {
    switch (timeframe) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      default: return 'All Time';
    }
  };

  const stats = [
    {
      title: 'Total Workouts',
      value: analytics.totalWorkouts.toString(),
      subtitle: getTimeframeLabel(timeframe),
      icon: '🏋️',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Total Volume',
      value: formatVolume(analytics.totalVolume),
      subtitle: 'Weight lifted',
      icon: '💪',
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'Total Time',
      value: formatDuration(analytics.totalDuration),
      subtitle: 'Workout duration',
      icon: '⏱️',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'Current Streak',
      value: `${analytics.currentStreak} days`,
      subtitle: `Longest: ${analytics.longestStreak} days`,
      icon: '🔥',
      color: 'bg-orange-50 text-orange-600'
    },
    {
      title: 'Avg Duration',
      value: formatDuration(Math.round(analytics.averageDuration)),
      subtitle: 'Per workout',
      icon: '📊',
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      title: 'Frequency',
      value: `${analytics.workoutFrequency.toFixed(1)}/week`,
      subtitle: 'Workout frequency',
      icon: '📅',
      color: 'bg-teal-50 text-teal-600'
    },
    {
      title: 'Consistency',
      value: `${analytics.consistencyScore}%`,
      subtitle: 'Consistency score',
      icon: '🎯',
      color: 'bg-pink-50 text-pink-600'
    },
    {
      title: 'Progress',
      value: analytics.volumeProgression.length > 1 
        ? `${((analytics.volumeProgression[analytics.volumeProgression.length - 1] / analytics.volumeProgression[0] - 1) * 100).toFixed(0)}%`
        : '0%',
      subtitle: 'Volume increase',
      icon: '📈',
      color: 'bg-emerald-50 text-emerald-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-lg">{stat.icon}</span>
                <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <p className="text-xs text-gray-500">{stat.subtitle}</p>
            </div>
            <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center`}>
              <span className="text-xl">{stat.icon}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}