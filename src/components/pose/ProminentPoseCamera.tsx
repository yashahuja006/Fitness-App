'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedPoseCamera } from './EnhancedPoseCamera';
import { SimpleCameraTest } from './SimpleCameraTest';
import { SimplePoseDetection } from './SimplePoseDetection';
import { ExerciseSelector, type ExerciseType } from './ExerciseSelector';
import { ExerciseDemonstration } from '@/components/exercises/ExerciseDemonstration';
import { voiceFeedbackService } from '@/lib/voiceFeedbackService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ClientOnly } from '@/components/ui/ClientOnly';
import type { FormAnalysis } from '@/types/pose';
import { RepData } from '@/lib/repCounter';

interface ProminentPoseCameraProps {
  className?: string;
}

type ViewMode = 'demo' | 'camera' | 'both' | 'test' | 'simple';

export function ProminentPoseCamera({ className = '' }: ProminentPoseCameraProps) {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('push-up');
  const [viewMode, setViewMode] = useState<ViewMode>('simple'); // Start with simple detection
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [formScore, setFormScore] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const handleFormAnalysis = useCallback((analysis: FormAnalysis) => {
    setFormScore(Math.round(analysis.correctness * 100));
    
    // Provide voice feedback if enabled
    if (voiceEnabled && analysis.issues.length > 0) {
      voiceFeedbackService.provideFormFeedback(analysis, selectedExercise);
    }
  }, [selectedExercise, voiceEnabled]);

  const handleRepCompleted = useCallback((repData: RepData) => {
    setRepCount(prev => prev + 1);
    
    // Provide encouragement
    if (voiceEnabled) {
      if (repData.violations.length === 0) {
        voiceFeedbackService.provideEncouragement('progress');
      }
    }
  }, [voiceEnabled]);

  const startCamera = () => {
    setIsCameraActive(true);
    setViewMode('camera');
    setRepCount(0);
    setFormScore(0);
    
    if (voiceEnabled) {
      voiceFeedbackService.provideEncouragement('start');
    }
  };

  const stopCamera = () => {
    setIsCameraActive(false);
    setViewMode('demo');
    voiceFeedbackService.stop();
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    voiceFeedbackService.updateConfig({ enabled: !voiceEnabled });
  };

  const getExerciseName = (exerciseId: ExerciseType) => {
    const names = {
      'push-up': 'Push-ups',
      'squat': 'Squats', 
      'bicep-curls': 'Bicep Curls'
    };
    return names[exerciseId] || 'Exercise';
  };

  return (
    <div className={`max-w-6xl mx-auto space-y-6 ${className}`}>
      {/* Header with Controls */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              AI Pose Detection & Form Analysis
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Get real-time feedback on your exercise form with voice coaching
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Exercise Selector */}
            <div className="min-w-48">
              <ExerciseSelector
                selectedExercise={selectedExercise}
                onExerciseChange={setSelectedExercise}
              />
            </div>
            
            {/* Voice Toggle */}
            <Button
              onClick={toggleVoice}
              variant={voiceEnabled ? 'primary' : 'secondary'}
              className="flex items-center gap-2"
            >
              {voiceEnabled ? '🎤' : '🔇'}
              {voiceEnabled ? 'Voice On' : 'Voice Off'}
            </Button>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex justify-center mt-6">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex">
            <button
              onClick={() => setViewMode('demo')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'demo'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📹 Exercise Demo
            </button>
            <button
              onClick={() => setViewMode('test')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'test'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📷 Camera Test
            </button>
            <button
              onClick={() => setViewMode('simple')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'simple'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              🎯 Simple Detection
            </button>
            <button
              onClick={() => setViewMode('camera')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'camera'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              🤖 AI Analysis
            </button>
            <button
              onClick={() => setViewMode('both')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'both'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📱 Side by Side
            </button>
          </div>
        </div>
      </Card>

      {/* Main Content Area */}
      <ClientOnly>
        <AnimatePresence mode="wait">
        {viewMode === 'demo' && (
          <motion.div
            key="demo"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Exercise Demonstration */}
            <div>
              <ExerciseDemonstration
                exerciseId={selectedExercise}
                exerciseName={getExerciseName(selectedExercise)}
              />
            </div>

            {/* Start Camera CTA */}
            <div className="flex items-center justify-center">
              <Card className="p-8 text-center w-full">
                <div className="text-6xl mb-4">📸</div>
                <h3 className="text-xl font-bold mb-4">Ready to Start?</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Turn on your camera to get real-time form analysis and rep counting for {getExerciseName(selectedExercise).toLowerCase()}.
                </p>
                <Button
                  onClick={startCamera}
                  className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3"
                >
                  🎥 Start Camera Analysis
                </Button>
                <div className="mt-4 text-sm text-gray-500">
                  <div>✓ Real-time form feedback</div>
                  <div>✓ Automatic rep counting</div>
                  <div>✓ Voice coaching {voiceEnabled ? '(enabled)' : '(disabled)'}</div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {viewMode === 'test' && (
          <motion.div
            key="test"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Camera Test Mode</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Test your camera connection before using AI pose detection. This simple test helps verify that your camera is working properly.
              </p>
            </Card>
            
            <SimpleCameraTest />
            
            <Card className="p-4 mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Troubleshooting Tips
              </h4>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <div>• Make sure you grant camera permissions when prompted</div>
                <div>• Close other applications that might be using your camera</div>
                <div>• Try refreshing the page if the camera doesn't start</div>
                <div>• Use a modern browser (Chrome, Firefox, Edge, Safari)</div>
              </div>
            </Card>
          </motion.div>
        )}

        {viewMode === 'simple' && (
          <motion.div
            key="simple"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Simple Pose Detection</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Motion-based exercise detection that works reliably without complex AI models. 
                Perfect for basic rep counting and form feedback.
              </p>
            </Card>
            
            <SimplePoseDetection exerciseId={selectedExercise} />
          </motion.div>
        )}

        {viewMode === 'camera' && (
          <motion.div
            key="camera"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {/* Camera Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{repCount}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Reps</div>
              </Card>
              <Card className="p-4 text-center">
                <div className={`text-2xl font-bold ${
                  formScore >= 80 ? 'text-green-600' : 
                  formScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {formScore}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Form Score</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 capitalize">
                  {selectedExercise.replace('-', ' ')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Exercise</div>
              </Card>
              <Card className="p-4 text-center">
                <div className={`text-2xl font-bold ${voiceEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                  {voiceEnabled ? '🎤' : '🔇'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Voice Coach</div>
              </Card>
            </div>

            {/* Camera Component - Temporarily disabled due to MediaPipe issues */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">AI Analysis (Coming Soon)</h3>
                <Button
                  onClick={stopCamera}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Stop Camera
                </Button>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
                <div className="text-4xl mb-4">🚧</div>
                <h4 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  AI Pose Detection Temporarily Unavailable
                </h4>
                <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                  We're experiencing issues with the MediaPipe library. Please use the Camera Test mode to verify your camera works.
                </p>
                <Button
                  onClick={() => setViewMode('test')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Try Camera Test Instead
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {viewMode === 'both' && (
          <motion.div
            key="both"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 xl:grid-cols-2 gap-6"
          >
            {/* Exercise Demo */}
            <div>
              <Card className="p-4 mb-4">
                <h3 className="text-lg font-semibold mb-2">Exercise Reference</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Watch the demo while practicing with the camera
                </p>
              </Card>
              <ExerciseDemonstration
                exerciseId={selectedExercise}
                exerciseName={getExerciseName(selectedExercise)}
              />
            </div>

            {/* Live Camera */}
            <div>
              <Card className="p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Your Form</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Reps: {repCount} | Form: {formScore}%
                    </p>
                  </div>
                  <Button
                    onClick={isCameraActive ? stopCamera : startCamera}
                    className={isCameraActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                  >
                    {isCameraActive ? 'Stop' : 'Start'} Camera
                  </Button>
                </div>
              </Card>
              
              {isCameraActive ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-4">🚧</div>
                  <h4 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    AI Analysis Temporarily Disabled
                  </h4>
                  <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                    MediaPipe library is having issues. Use Camera Test mode instead.
                  </p>
                  <Button
                    onClick={() => setViewMode('test')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Switch to Camera Test
                  </Button>
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <div className="text-4xl mb-4">📸</div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Camera is ready to analyze your {getExerciseName(selectedExercise).toLowerCase()}
                  </p>
                  <Button
                    onClick={startCamera}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Start Camera
                  </Button>
                </Card>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </ClientOnly>

      {/* Instructions */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          How to Use
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <div className="font-medium mb-1">1. Choose Exercise</div>
            <div>Select from push-ups, squats, or bicep curls</div>
          </div>
          <div>
            <div className="font-medium mb-1">2. Watch Demo</div>
            <div>Learn proper form from video tutorials</div>
          </div>
          <div>
            <div className="font-medium mb-1">3. Start Camera</div>
            <div>Get real-time feedback and rep counting</div>
          </div>
        </div>
      </Card>
    </div>
  );
}