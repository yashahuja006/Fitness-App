'use client';

import { useState } from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CameraWorkoutInterface } from '@/components/workouts/CameraWorkoutInterface';

export default function PoseDemoPage() {
  const [isActive, setIsActive] = useState(false);

  if (isActive) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                AI Pose Detection Demo
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time pose detection and form analysis
              </p>
            </div>
            <Button variant="secondary" onClick={() => setIsActive(false)}>
              Stop Demo
            </Button>
          </div>

          <CameraWorkoutInterface onCancel={() => setIsActive(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Pose Detection Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Experience real-time pose detection and form analysis with AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Demo Info Card */}
          <Card className="p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Real-Time Form Analysis
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Our AI-powered pose detection system analyzes your exercise form in real-time,
                providing instant feedback and corrections.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start">
                <span className="text-2xl mr-3">✅</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Automatic Rep Counting</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Counts your reps automatically with quality assessment
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-2xl mr-3">📊</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Form Scoring</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get a score for each rep based on your form quality
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-2xl mr-3">🎤</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Voice Feedback</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive audio coaching and corrections during your workout
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-2xl mr-3">📈</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Progress Tracking</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track your improvement over time with detailed analytics
                  </p>
                </div>
              </div>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={() => setIsActive(true)}
            >
              Start Pose Detection Demo
            </Button>
          </Card>

          {/* Supported Exercises Card */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Supported Exercises
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Push-Ups</h3>
                  <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">ACTIVE</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Full form analysis with chest depth and elbow angle tracking
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Squats</h3>
                  <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">ACTIVE</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Knee and hip angle analysis with depth tracking
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Bicep Curls</h3>
                  <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">ACTIVE</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Elbow angle and range of motion tracking
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Planks</h3>
                  <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">BETA</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Body alignment and stability tracking
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Lunges</h3>
                  <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">BETA</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Knee alignment and balance analysis
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
