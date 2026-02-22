/**
 * Workout Insights Panel Component
 * Displays AI-generated insights, recommendations, and achievements
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { WorkoutInsights } from '@/lib/progressTrackingService';

interface WorkoutInsightsPanelProps {
  insights: WorkoutInsights;
}

export function WorkoutInsightsPanel({ insights }: WorkoutInsightsPanelProps) {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'achievements' | 'goals'>('recommendations');

  const tabs = [
    { id: 'recommendations', label: 'Recommendations', count: insights.recommendations.length },
    { id: 'achievements', label: 'Achievements', count: insights.achievements.length },
    { id: 'goals', label: 'Goals', count: insights.nextGoals.length }
  ] as const;

  const getProgressPercentage = (current: number, target: number): number => {
    return Math.min(100, Math.round((current / target) * 100));
  };

  const formatGoalValue = (value: number, unit: string): string => {
    if (unit === 'lbs' && value >= 1000) {
      return `${(value / 1000).toFixed(1)}k ${unit}`;
    }
    return `${value} ${unit}`;
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Workout Insights</h3>
          <p className="text-gray-500">AI-powered analysis of your fitness journey</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="mt-4 sm:mt-0">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                size="sm"
                className={
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-transparent text-gray-500 hover:text-gray-900'
                }
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1 bg-gray-200 text-gray-600 text-xs rounded-full px-2 py-0.5">
                    {tab.count}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {insights.recommendations.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Recommendations */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <span className="mr-2">💡</span>
                      Recommendations
                    </h4>
                    <div className="space-y-3">
                      {insights.recommendations.map((recommendation, index) => (
                        <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                          <p className="text-sm text-blue-800">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths and Weak Points */}
                  <div className="space-y-4">
                    {insights.strengths.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <span className="mr-2">💪</span>
                          Strengths
                        </h4>
                        <div className="space-y-2">
                          {insights.strengths.map((strength, index) => (
                            <div key={index} className="p-2 bg-green-50 rounded-lg">
                              <p className="text-sm text-green-800">{strength}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {insights.weakPoints.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <span className="mr-2">⚠️</span>
                          Areas for Improvement
                        </h4>
                        <div className="space-y-2">
                          {insights.weakPoints.map((weakPoint, index) => (
                            <div key={index} className="p-2 bg-yellow-50 rounded-lg">
                              <p className="text-sm text-yellow-800">{weakPoint}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">💡</div>
                <p>No recommendations available yet</p>
                <p className="text-sm">Complete more workouts to get personalized insights</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div>
            {insights.achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.achievements.map((achievement, index) => (
                  <div key={achievement.id} className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">🏆</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            {achievement.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {achievement.unlockedAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">🏆</div>
                <p>No achievements unlocked yet</p>
                <p className="text-sm">Keep working out to earn your first achievement!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'goals' && (
          <div>
            {insights.nextGoals.length > 0 ? (
              <div className="space-y-4">
                {insights.nextGoals.map((goal, index) => {
                  const progress = getProgressPercentage(goal.currentValue, goal.targetValue);
                  const isCompleted = progress >= 100;
                  
                  return (
                    <div key={goal.id} className={`p-4 rounded-lg border-2 ${
                      isCompleted 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                            {isCompleted && <span className="text-green-500">✅</span>}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                        </div>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                          {goal.category}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">
                            {formatGoalValue(goal.currentValue, goal.unit)} / {formatGoalValue(goal.targetValue, goal.unit)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isCompleted ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{progress}% complete</span>
                          <span>Due: {goal.deadline.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">🎯</div>
                <p>No active goals</p>
                <p className="text-sm">Goals will be generated based on your workout history</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}