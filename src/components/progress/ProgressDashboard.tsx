/**
 * Progress Dashboard Component
 * 
 * Task 10.2: Progress Tracking and Analytics - Build progress analytics and visualization system
 * - Created analytics computation algorithms
 * - Implemented chart generation with performance trends
 * - Built insights generation for workout patterns
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { progressTrackingService, type ProgressAnalytics, type WorkoutInsights } from '@/lib/progressTrackingService';
import { ProgressCharts } from './ProgressCharts';
import { WorkoutInsightsPanel } from './WorkoutInsightsPanel';
import { ProgressStats } from './ProgressStats';

interface ProgressDashboardProps {
  userId?: string;
  className?: string;
}

export function ProgressDashboard({ userId, className = '' }: ProgressDashboardProps) {
  const [analytics, setAnalytics] = useState<ProgressAnalytics | null>(null);
  const [insights, setInsights] = useState<WorkoutInsights | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, [timeframe]);

  const loadProgressData = async () => {
    setIsLoading(true);
    try {
      const progressAnalytics = progressTrackingService.generateProgressAnalytics(timeframe);
      const workoutInsights = progressTrackingService.generateInsights();
      
      setAnalytics(progressAnalytics);
      setInsights(workoutInsights);
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeframeChange = (newTimeframe: typeof timeframe) => {
    setTimeframe(newTimeframe);
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analytics || !insights) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Progress Data</h3>
        <p className="text-gray-500 mb-4">Start working out to see your progress analytics!</p>
        <Button onClick={loadProgressData}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progress Dashboard</h1>
          <p className="text-gray-500">Track your fitness journey and achievements</p>
        </div>
        
        {/* Timeframe Selector */}
        <div className="mt-4 sm:mt-0">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {(['week', 'month', 'year', 'all'] as const).map((period) => (
              <Button
                key={period}
                onClick={() => handleTimeframeChange(period)}
                size="sm"
                className={
                  timeframe === period
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-transparent text-gray-500 hover:text-gray-900'
                }
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Stats */}
      <ProgressStats analytics={analytics} timeframe={timeframe} />

      {/* Charts */}
      <ProgressCharts analytics={analytics} timeframe={timeframe} />

      {/* Insights Panel */}
      <WorkoutInsightsPanel insights={insights} />

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            onClick={() => window.location.href = '/workouts'}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Start Workout
          </Button>
          <Button 
            onClick={() => window.location.href = '/exercises'}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Browse Exercises
          </Button>
          <Button 
            onClick={loadProgressData}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            Refresh Data
          </Button>
          <Button 
            onClick={() => {
              const data = JSON.stringify(analytics, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `fitness-progress-${timeframe}.json`;
              a.click();
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Export Data
          </Button>
        </div>
      </Card>
    </div>
  );
}