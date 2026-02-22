'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface FeedbackMessage {
  id: number;
  type: 'correction' | 'encouragement' | 'warning' | 'achievement';
  message: string;
  timestamp: number;
  severity?: 'low' | 'medium' | 'high';
}

export default function FeedbackEngineDemoPage() {
  const [isActive, setIsActive] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [formScore, setFormScore] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackMessage[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const sampleFeedback: FeedbackMessage[] = [
    { id: 1, type: 'encouragement', message: 'Great start! Keep your core engaged.', timestamp: 2000 },
    { id: 2, type: 'correction', message: 'Lower your chest a bit more for full range.', timestamp: 5000, severity: 'medium' },
    { id: 3, type: 'encouragement', message: 'Perfect form on that rep!', timestamp: 8000 },
    { id: 4, type: 'warning', message: 'Watch your elbow flare - keep them closer to body.', timestamp: 11000, severity: 'high' },
    { id: 5, type: 'encouragement', message: 'Excellent! You\'re maintaining good tempo.', timestamp: 14000 },
    { id: 6, type: 'achievement', message: '🎉 10 reps completed! Great job!', timestamp: 17000 },
    { id: 7, type: 'correction', message: 'Keep your back straight - avoid sagging hips.', timestamp: 20000, severity: 'medium' },
    { id: 8, type: 'encouragement', message: 'Strong finish! You\'re doing amazing!', timestamp: 23000 }
  ];

  useEffect(() => {
    if (isActive) {
      let currentIndex = 0;
      const startTime = Date.now();

      const interval = setInterval(() => {
        if (currentIndex < sampleFeedback.length) {
          const elapsed = Date.now() - startTime;
          const nextFeedback = sampleFeedback[currentIndex];

          if (elapsed >= nextFeedback.timestamp) {
            setFeedback(prev => [...prev, nextFeedback]);
            
            // Update rep count
            if (nextFeedback.type === 'achievement' || currentIndex % 2 === 0) {
              setRepCount(prev => Math.min(prev + 1, 10));
            }

            // Update form score
            if (nextFeedback.type === 'encouragement') {
              setFormScore(prev => Math.min(prev + 5, 95));
            } else if (nextFeedback.type === 'correction') {
              setFormScore(prev => Math.max(prev - 3, 70));
            }

            // Voice feedback simulation
            if (voiceEnabled) {
              console.log('🔊 Voice:', nextFeedback.message);
            }

            currentIndex++;
          }
        } else {
          clearInterval(interval);
          setIsActive(false);
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [isActive, voiceEnabled]);

  const handleStart = () => {
    setIsActive(true);
    setRepCount(0);
    setFormScore(85);
    setFeedback([]);
  };

  const handleStop = () => {
    setIsActive(false);
  };

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'correction': return '⚠️';
      case 'encouragement': return '💪';
      case 'warning': return '🚨';
      case 'achievement': return '🎉';
      default: return '💬';
    }
  };

  const getFeedbackColor = (type: string) => {
    switch (type) {
      case 'correction': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'encouragement': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'achievement': return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      default: return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Adaptive Feedback Engine Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Experience real-time AI coaching with voice and visual feedback
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Control Panel */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Controls
              </h3>
              
              <div className="space-y-4">
                <Button
                  onClick={isActive ? handleStop : handleStart}
                  variant={isActive ? 'secondary' : 'primary'}
                  className="w-full"
                  size="lg"
                >
                  {isActive ? '⏹ Stop Demo' : '▶️ Start Demo'}
                </Button>

                <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Voice Feedback
                  </span>
                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      voiceEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        voiceEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </Card>

            {/* Live Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Live Stats
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Reps</span>
                    <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">
                      {repCount}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Form Score</span>
                    <span className={`font-bold text-2xl ${
                      formScore >= 90 ? 'text-green-600 dark:text-green-400' :
                      formScore >= 80 ? 'text-blue-600 dark:text-blue-400' :
                      'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {formScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        formScore >= 90 ? 'bg-green-500' :
                        formScore >= 80 ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${formScore}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Feedback Types
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center">
                      <span className="mr-1">💪</span>
                      <span className="text-gray-900 dark:text-white">
                        {feedback.filter(f => f.type === 'encouragement').length}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">⚠️</span>
                      <span className="text-gray-900 dark:text-white">
                        {feedback.filter(f => f.type === 'correction').length}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">🚨</span>
                      <span className="text-gray-900 dark:text-white">
                        {feedback.filter(f => f.type === 'warning').length}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">🎉</span>
                      <span className="text-gray-900 dark:text-white">
                        {feedback.filter(f => f.type === 'achievement').length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Feedback Stream */}
          <div className="lg:col-span-2">
            <Card className="p-6 h-[600px] flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Real-Time Feedback Stream
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-3">
                {feedback.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-4xl mb-2">💬</div>
                      <p>Start the demo to see feedback</p>
                    </div>
                  </div>
                ) : (
                  feedback.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border ${getFeedbackColor(item.type)} animate-fade-in`}
                    >
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">{getFeedbackIcon(item.type)}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                              {item.type}
                            </span>
                            {item.severity && (
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                item.severity === 'high' ? 'bg-red-500 text-white' :
                                item.severity === 'medium' ? 'bg-yellow-500 text-white' :
                                'bg-gray-500 text-white'
                              }`}>
                                {item.severity}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 dark:text-white">
                            {item.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
