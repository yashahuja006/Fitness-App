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
    },
    {
      id: 4,
      name: 'Bicep Curls',
      videoUrl: 'https://www.youtube.com/embed/ykJmrZ5v0Oo',
      steps: [
        'Stand with feet shoulder-width apart',
        'Hold dumbbells at your sides with palms facing forward',
        'Curl weights up towards shoulders',
        'Keep elbows close to your body',
        'Lower back down with control'
      ]
    },
    {
      id: 5,
      name: 'Lunges',
      videoUrl: 'https://www.youtube.com/embed/QOVaHwm-Q6U',
      steps: [
        'Stand with feet hip-width apart',
        'Step forward with one leg',
        'Lower hips until both knees are at 90 degrees',
        'Push back to starting position',
        'Alternate legs'
      ]
    },
    {
      id: 6,
      name: 'Mountain Climbers',
      videoUrl: 'https://www.youtube.com/embed/nmwgirgXLYM',
      steps: [
        'Start in high plank position',
        'Bring one knee towards chest',
        'Quickly switch legs',
        'Keep core engaged',
        'Maintain steady rhythm'
      ]
    },
    {
      id: 7,
      name: 'Burpees',
      videoUrl: 'https://www.youtube.com/embed/TU8QYVW0gDU',
      steps: [
        'Start standing, then drop into squat',
        'Place hands on ground and jump feet back',
        'Do a push-up',
        'Jump feet back to hands',
        'Explode up into a jump'
      ]
    },
    {
      id: 8,
      name: 'Jumping Jacks',
      videoUrl: 'https://www.youtube.com/embed/c4DAnQ6DtF8',
      steps: [
        'Start with feet together, arms at sides',
        'Jump feet apart while raising arms overhead',
        'Jump back to starting position',
        'Keep movements smooth and controlled',
        'Maintain steady breathing'
      ]
    },
    {
      id: 9,
      name: 'Deadlift',
      videoUrl: 'https://www.youtube.com/embed/op9kVnSso6Q',
      steps: [
        'Stand with feet hip-width apart',
        'Bend at hips and knees to grip barbell',
        'Keep back straight and chest up',
        'Drive through heels to stand up',
        'Lower bar back down with control'
      ]
    },
    {
      id: 10,
      name: 'Shoulder Press',
      videoUrl: 'https://www.youtube.com/embed/qEwKCR5JCog',
      steps: [
        'Stand or sit with dumbbells at shoulder height',
        'Press weights overhead until arms are extended',
        'Keep core engaged',
        'Lower back to shoulder height',
        'Avoid arching your back'
      ]
    },
    {
      id: 11,
      name: 'Bench Press',
      videoUrl: 'https://www.youtube.com/embed/rT7DgCr-3pg',
      steps: [
        'Lie on bench with feet flat on floor',
        'Grip bar slightly wider than shoulder-width',
        'Lower bar to chest with control',
        'Press bar back up to starting position',
        'Keep shoulder blades retracted'
      ]
    },
    {
      id: 12,
      name: 'Pull-Ups',
      videoUrl: 'https://www.youtube.com/embed/eGo4IYlbE5g',
      steps: [
        'Hang from bar with hands shoulder-width apart',
        'Pull yourself up until chin is over bar',
        'Keep core engaged',
        'Lower yourself back down with control',
        'Avoid swinging or kipping'
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
