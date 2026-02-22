'use client';

import { useState } from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AIIntegrationDemoPage() {
  const [activeService, setActiveService] = useState<string | null>(null);

  const aiServices = [
    {
      id: 'pose-detection',
      name: 'Pose Detection',
      icon: '🎯',
      provider: 'TensorFlow.js + MediaPipe',
      status: 'active',
      description: 'Real-time body pose estimation and tracking',
      features: [
        '33 body keypoints detection',
        '60 FPS performance',
        'Multi-person support',
        'Angle calculation'
      ],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'gemini-ai',
      name: 'Gemini AI Coach',
      icon: '🤖',
      provider: 'Google Gemini API',
      status: 'active',
      description: 'Conversational AI for fitness guidance and nutrition advice',
      features: [
        'Natural language understanding',
        'Personalized recommendations',
        'Workout plan generation',
        'Nutrition analysis'
      ],
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'voice-synthesis',
      name: 'Voice Feedback',
      icon: '🎤',
      provider: 'Web Speech API',
      status: 'active',
      description: 'Text-to-speech for real-time coaching feedback',
      features: [
        'Multiple voice options',
        'Adjustable speed',
        'Real-time feedback',
        'Multi-language support'
      ],
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'form-analysis',
      name: 'Form Analysis',
      icon: '📊',
      provider: 'Custom ML Model',
      status: 'active',
      description: 'Advanced exercise form scoring and correction',
      features: [
        'Real-time form scoring',
        'Movement pattern analysis',
        'Correction suggestions',
        'Progress tracking'
      ],
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'nutrition-ai',
      name: 'Nutrition AI',
      icon: '🥗',
      provider: 'Gemini API + Custom Logic',
      status: 'active',
      description: 'AI-powered meal planning and nutrition tracking',
      features: [
        'Personalized meal plans',
        'Macro calculation',
        'Recipe generation',
        'Dietary restrictions'
      ],
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'progress-prediction',
      name: 'Progress Prediction',
      icon: '📈',
      provider: 'Machine Learning',
      status: 'beta',
      description: 'Predictive analytics for fitness goals',
      features: [
        'Goal timeline estimation',
        'Performance forecasting',
        'Plateau detection',
        'Adaptive recommendations'
      ],
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Integration Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore the AI services powering your fitness journey
          </p>
        </div>

        {/* AI Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {aiServices.map((service) => (
            <Card
              key={service.id}
              className={`p-6 cursor-pointer transition-all hover:shadow-xl ${
                activeService === service.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setActiveService(service.id)}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center text-3xl mb-4`}>
                {service.icon}
              </div>

              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {service.name}
                </h3>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  service.status === 'active' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-yellow-500 text-white'
                }`}>
                  {service.status.toUpperCase()}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {service.description}
              </p>

              <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                Provider: {service.provider}
              </div>

              <div className="space-y-2">
                {service.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Integration Architecture */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Integration Architecture
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Frontend Layer */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-3xl mb-4">
                💻
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                Frontend Layer
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Next.js + React + TypeScript
              </p>
              <div className="space-y-1 text-xs text-gray-500 dark:text-gray-500">
                <div>• Real-time UI updates</div>
                <div>• WebRTC camera access</div>
                <div>• State management</div>
                <div>• Responsive design</div>
              </div>
            </div>

            {/* AI Processing Layer */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl mb-4">
                🧠
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                AI Processing
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                TensorFlow.js + Gemini API
              </p>
              <div className="space-y-1 text-xs text-gray-500 dark:text-gray-500">
                <div>• Pose estimation</div>
                <div>• Form analysis</div>
                <div>• NLP processing</div>
                <div>• Predictions</div>
              </div>
            </div>

            {/* Backend Layer */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-3xl mb-4">
                🗄️
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                Backend Layer
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Firebase + Express.js
              </p>
              <div className="space-y-1 text-xs text-gray-500 dark:text-gray-500">
                <div>• Data persistence</div>
                <div>• Authentication</div>
                <div>• API endpoints</div>
                <div>• Cloud storage</div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              🔄 Data Flow
            </h4>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center">
                <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded mr-2">1</span>
                Camera captures video frame
              </div>
              <div className="flex items-center">
                <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded mr-2">2</span>
                TensorFlow.js processes pose detection
              </div>
              <div className="flex items-center">
                <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded mr-2">3</span>
                Custom ML model analyzes form
              </div>
              <div className="flex items-center">
                <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded mr-2">4</span>
                Feedback engine generates corrections
              </div>
              <div className="flex items-center">
                <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded mr-2">5</span>
                Voice API delivers audio feedback
              </div>
              <div className="flex items-center">
                <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded mr-2">6</span>
                Results saved to Firebase
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
