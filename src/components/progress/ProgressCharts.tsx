/**
 * Progress Charts Component
 * Displays various charts for workout progress visualization
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import type { ProgressAnalytics } from '@/lib/progressTrackingService';

interface ProgressChartsProps {
  analytics: ProgressAnalytics;
  timeframe: 'week' | 'month' | 'year' | 'all';
}

export function ProgressCharts({ analytics, timeframe }: ProgressChartsProps) {
  // Simple bar chart component (can be replaced with a proper charting library)
  const SimpleBarChart = ({ data, title, color = '#3B82F6' }: {
    data: { label: string; value: number }[];
    title: string;
    color?: string;
  }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-20 text-xs text-gray-600 truncate">{item.label}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                <div
                  className="h-4 rounded-full transition-all duration-300"
                  style={{
                    width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                    backgroundColor: color
                  }}
                />
                <span className="absolute right-2 top-0 text-xs text-gray-600 leading-4">
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Simple line chart component
  const SimpleLineChart = ({ data, title, color = '#10B981' }: {
    data: number[];
    title: string;
    color?: string;
  }) => {
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue;
    
    return (
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
        <div className="h-32 relative bg-gray-50 rounded-lg p-4">
          <svg className="w-full h-full" viewBox="0 0 300 100">
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2"
              points={data.map((value, index) => {
                const x = (index / (data.length - 1)) * 280 + 10;
                const y = range > 0 ? 90 - ((value - minValue) / range) * 80 : 50;
                return `${x},${y}`;
              }).join(' ')}
            />
            {data.map((value, index) => {
              const x = (index / (data.length - 1)) * 280 + 10;
              const y = range > 0 ? 90 - ((value - minValue) / range) * 80 : 50;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="3"
                  fill={color}
                />
              );
            })}
          </svg>
          <div className="absolute bottom-1 left-4 text-xs text-gray-500">
            Min: {minValue}
          </div>
          <div className="absolute bottom-1 right-4 text-xs text-gray-500">
            Max: {maxValue}
          </div>
        </div>
      </div>
    );
  };

  // Prepare muscle group data
  const muscleGroupData = Object.entries(analytics.muscleGroupDistribution)
    .map(([group, count]) => ({
      label: group.charAt(0).toUpperCase() + group.slice(1),
      value: count
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); // Top 6 muscle groups

  // Prepare strength progression data (show top 3 exercises)
  const strengthProgressionData = Object.entries(analytics.strengthProgression)
    .filter(([_, values]) => values.length > 1)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Muscle Group Distribution */}
      <Card className="p-6">
        <SimpleBarChart
          data={muscleGroupData}
          title="Muscle Group Distribution"
          color="#3B82F6"
        />
        {muscleGroupData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No muscle group data available</p>
            <p className="text-sm">Complete some workouts to see distribution</p>
          </div>
        )}
      </Card>

      {/* Volume Progression */}
      <Card className="p-6">
        <SimpleLineChart
          data={analytics.volumeProgression.length > 0 ? analytics.volumeProgression : [0]}
          title="Volume Progression Over Time"
          color="#10B981"
        />
        {analytics.volumeProgression.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No volume progression data</p>
            <p className="text-sm">Complete more workouts to see trends</p>
          </div>
        )}
      </Card>

      {/* Strength Progression */}
      <Card className="p-6 lg:col-span-2">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Strength Progression (Top Exercises)</h4>
        {strengthProgressionData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {strengthProgressionData.map(([exercise, weights], index) => (
              <div key={exercise}>
                <SimpleLineChart
                  data={weights}
                  title={exercise.length > 20 ? exercise.substring(0, 20) + '...' : exercise}
                  color={['#EF4444', '#F59E0B', '#8B5CF6'][index]}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No strength progression data available</p>
            <p className="text-sm">Complete multiple sessions with the same exercises to see progression</p>
          </div>
        )}
      </Card>

      {/* Workout Frequency Heatmap (Simple version) */}
      <Card className="p-6 lg:col-span-2">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Workout Consistency</h4>
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold text-gray-900">
            {analytics.consistencyScore}%
          </div>
          <div className="text-sm text-gray-500">
            {analytics.workoutFrequency.toFixed(1)} workouts/week
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="h-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300"
            style={{ width: `${analytics.consistencyScore}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Inconsistent</span>
          <span>Very Consistent</span>
        </div>
        
        {/* Streak Information */}
        <div className="mt-4 p-3 bg-orange-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-orange-500">🔥</span>
            <span className="text-sm font-medium text-orange-800">
              Current streak: {analytics.currentStreak} days
            </span>
          </div>
          <div className="text-xs text-orange-600 mt-1">
            Longest streak: {analytics.longestStreak} days
          </div>
        </div>
      </Card>
    </div>
  );
}