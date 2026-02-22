'use client';

import { useState } from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function VideoDemoPage() {
  const [selectedVideo, setSelectedVideo] = useState(0);

  const exercises = [
    {
      id: 1,
      name: 'Push-Up',
      videoUrl: 'https://www.youtube.com/embed/IODxDxX7oi4',
      steps: [
        'Start in a plank position with hands slightly wider than shoulder-width',
        'Keep your body in a straight line from head to heels',
        'Lower your body until chest nearly touches the floor',
        'Push back up to starting position',
        'Repeat for desired number of reps'
      ]
    },
    {
      id: 2,
      name: 'Squat',
      videoUrl: 'https://www.youtube.com/embed/aclHkVaku9U',
      steps: [
        'Stand with feet shoulder-width apart',
        'Keep chest up and core engaged',
        'Lower down by bending knees and hips',
        'Go down until thighs are parallel to ground',
        'Push through heels to return to start'
      ]
    },
    {
      id: 3,
      name: 'Plank',
      videoUrl: 'https://www.youtube.com/embed/pSHjTRCQxIw',
      steps: [
        'Start in forearm plank position',
        'Keep body in straight line',
        'Engage core and glutes',
        'Hold position without sagging',
        'Breathe steadily throughout'
      ]
    }
  ];

  const currentExercise = exercises[selectedVideo];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Video Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Watch exercise demonstrations with step-by-step instructions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {currentExercise.name}
              </h2>
              
              {/* YouTube Video Player */}
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  src={currentExercise.videoUrl}
                  title={currentExercise.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Step-by-Step Instructions */}
              <div className="mt-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Step-by-Step Instructions
                </h3>
                <ol className="space-y-3">
                  {currentExercise.steps.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 pt-1">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </Card>
          </div>

          {/* Exercise List Sidebar */}
          <div>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Select Exercise
              </h3>
              <div className="space-y-3">
                {exercises.map((exercise, index) => (
                  <button
                    key={exercise.id}
                    onClick={() => setSelectedVideo(index)}
                    className={`w-full text-left p-4 rounded-lg transition-all ${
                      selectedVideo === index
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-semibold">{exercise.name}</div>
                    <div className={`text-sm mt-1 ${
                      selectedVideo === index ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      Watch demonstration
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button className="w-full" variant="primary">
                  Start Workout with AI Camera
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
