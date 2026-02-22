'use client';

import { useState } from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function FormAnalysisDemoPage() {
  const [selectedExercise, setSelectedExercise] = useState('push-up');

  const exercises = [
    { id: 'push-up', name: 'Push-Up', icon: '💪' },
    { id: 'squat', name: 'Squat', icon: '🏋️' },
    { id: 'bicep-curl', name: 'Bicep Curl', icon: '🤲' },
    { id: 'plank', name: 'Plank', icon: '🧘' }
  ];

  const formMetrics = {
    'push-up': {
      score: 85,
      grade: 'B+',
      breakdown: {
        alignment: 90,
        rangeOfMotion: 82,
        posture: 88,
        timing: 80,
        consistency: 85
      },
      strengths: [
        'Excellent elbow alignment',
        'Good core engagement',
        'Consistent tempo'
      ],
      improvements: [
        {
          title: 'Increase Depth',
          description: 'Lower your chest closer to the ground for full range of motion',
          priority: 'high',
          expectedImprovement: 15
        },
        {
          title: 'Widen Hand Position',
          description: 'Place hands slightly wider for better chest activation',
          priority: 'medium',
          expectedImprovement: 8
        }
      ]
    },
    'squat': {
      score: 78,
      grade: 'B',
      breakdown: {
        alignment: 75,
        rangeOfMotion: 80,
        posture: 82,
        timing: 76,
        consistency: 77
      },
      strengths: [
        'Good knee tracking',
        'Stable core position'
      ],
      improvements: [
        {
          title: 'Increase Depth',
          description: 'Squat deeper to reach parallel or below',
          priority: 'high',
          expectedImprovement: 20
        },
        {
          title: 'Chest Up',
          description: 'Keep chest more upright throughout the movement',
          priority: 'high',
          expectedImprovement: 12
        }
      ]
    },
    'bicep-curl': {
      score: 92,
      grade: 'A',
      breakdown: {
        alignment: 95,
        rangeOfMotion: 90,
        posture: 93,
        timing: 88,
        consistency: 94
      },
      strengths: [
        'Perfect elbow position',
        'Excellent control',
        'Full range of motion',
        'No momentum usage'
      ],
      improvements: [
        {
          title: 'Slow Down Eccentric',
          description: 'Take 3 seconds to lower the weight for better muscle engagement',
          priority: 'low',
          expectedImprovement: 5
        }
      ]
    },
    'plank': {
      score: 88,
      grade: 'B+',
      breakdown: {
        alignment: 92,
        rangeOfMotion: 85,
        posture: 90,
        timing: 84,
        consistency: 89
      },
      strengths: [
        'Strong core engagement',
        'Good shoulder position',
        'Neutral spine'
      ],
      improvements: [
        {
          title: 'Hip Position',
          description: 'Raise hips slightly to maintain perfect alignment',
          priority: 'medium',
          expectedImprovement: 10
        }
      ]
    }
  };

  const currentMetrics = formMetrics[selectedExercise as keyof typeof formMetrics];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-500';
    if (grade.startsWith('B')) return 'bg-blue-500';
    if (grade.startsWith('C')) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Form Analysis Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            See detailed form analysis and improvement suggestions
          </p>
        </div>

        {/* Exercise Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {exercises.map((exercise) => (
            <button
              key={exercise.id}
              onClick={() => setSelectedExercise(exercise.id)}
              className={`p-4 rounded-lg transition-all ${
                selectedExercise === exercise.id
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:shadow-md'
              }`}
            >
              <div className="text-3xl mb-2">{exercise.icon}</div>
              <div className="font-semibold text-sm">{exercise.name}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overall Score */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Overall Form Score
            </h3>
            
            <div className="text-center mb-6">
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(currentMetrics.score)}`}>
                {currentMetrics.score}
              </div>
              <div className={`inline-block px-4 py-2 rounded-full text-white font-bold ${getGradeColor(currentMetrics.grade)}`}>
                Grade: {currentMetrics.grade}
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(currentMetrics.breakdown).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className={`font-semibold ${getScoreColor(value)}`}>
                      {value}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        value >= 90 ? 'bg-green-500' :
                        value >= 80 ? 'bg-blue-500' :
                        value >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Strengths & Improvements */}
          <div className="lg:col-span-2 space-y-6">
            {/* Strengths */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">💪</span>
                Your Strengths
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentMetrics.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                    <span className="text-sm text-gray-900 dark:text-white">{strength}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Improvements */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">🎯</span>
                Areas for Improvement
              </h3>
              <div className="space-y-4">
                {currentMetrics.improvements.map((improvement, index) => (
                  <div key={index} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {improvement.title}
                      </h4>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        improvement.priority === 'high' ? 'bg-red-500 text-white' :
                        improvement.priority === 'medium' ? 'bg-yellow-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {improvement.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {improvement.description}
                    </p>
                    <div className="flex items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400 mr-2">
                        Expected improvement:
                      </span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        +{improvement.expectedImprovement}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Action Button */}
            <div className="flex gap-4">
              <Button className="flex-1" size="lg">
                Start Workout with AI Coach
              </Button>
              <Button variant="secondary" className="flex-1" size="lg">
                View Detailed Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
