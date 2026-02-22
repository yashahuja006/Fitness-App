'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ClientOnly } from '@/components/ui/ClientOnly';

interface ExerciseDemonstrationProps {
  exerciseId: string;
  exerciseName: string;
  className?: string;
}

// High-quality exercise demonstration videos from YouTube (embedded)
const EXERCISE_VIDEOS = {
  'push-up': {
    embedId: 'IODxDxX7oi4', // Perfect Push-Up Form
    title: 'Perfect Push-Up Form',
    duration: '2:15',
    description: 'Learn proper push-up technique with detailed form breakdown'
  },
  'squat': {
    embedId: 'YaXPRqUwItQ', // Perfect Squat Form
    title: 'Perfect Squat Technique',
    duration: '3:20',
    description: 'Master the bodyweight squat with proper depth and alignment'
  },
  'bicep-curls': {
    embedId: 'ykJmrZ5v0Oo', // Perfect Bicep Curl Form
    title: 'Perfect Bicep Curl Form',
    duration: '2:45',
    description: 'Learn proper bicep curl technique for maximum effectiveness'
  }
};

// CSS animations for exercise demonstrations
const EXERCISE_ANIMATIONS = {
  'push-up': {
    keyframes: [
      { transform: 'translateY(0px)', backgroundColor: '#3B82F6' },
      { transform: 'translateY(20px)', backgroundColor: '#1D4ED8' },
      { transform: 'translateY(0px)', backgroundColor: '#3B82F6' }
    ],
    duration: 2000,
    description: 'Push-up motion: Start in plank, lower chest to ground, push back up'
  },
  'squat': {
    keyframes: [
      { transform: 'scaleY(1)', backgroundColor: '#10B981' },
      { transform: 'scaleY(0.7)', backgroundColor: '#059669' },
      { transform: 'scaleY(1)', backgroundColor: '#10B981' }
    ],
    duration: 2500,
    description: 'Squat motion: Stand tall, lower hips back and down, return to standing'
  },
  'bicep-curls': {
    keyframes: [
      { transform: 'rotate(0deg)', backgroundColor: '#F59E0B' },
      { transform: 'rotate(90deg)', backgroundColor: '#D97706' },
      { transform: 'rotate(0deg)', backgroundColor: '#F59E0B' }
    ],
    duration: 2200,
    description: 'Bicep curl motion: Arms at sides, curl weights up, lower with control'
  }
};

export function ExerciseDemonstration({ 
  exerciseId, 
  exerciseName, 
  className = '' 
}: ExerciseDemonstrationProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const videoData = EXERCISE_VIDEOS[exerciseId as keyof typeof EXERCISE_VIDEOS];
  const animationData = EXERCISE_ANIMATIONS[exerciseId as keyof typeof EXERCISE_ANIMATIONS];

  // Fallback animation data if exercise not found
  const safeAnimationData = animationData || {
    keyframes: [
      { transform: 'scale(1)', backgroundColor: '#6B7280' },
      { transform: 'scale(1.1)', backgroundColor: '#4B5563' },
      { transform: 'scale(1)', backgroundColor: '#6B7280' }
    ],
    duration: 2000,
    description: 'Basic exercise movement demonstration'
  };

  // Fallback video data if exercise not found
  const safeVideoData = videoData || {
    embedId: 'dQw4w9WgXcQ', // Rick Roll as fallback (just kidding, this won't be used)
    title: `${exerciseName} Tutorial`,
    duration: '2-3 min',
    description: `Learn proper ${exerciseName.toLowerCase()} technique`
  };

  const startAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), safeAnimationData.duration);
  };

  return (
    <ClientOnly>
      <div className={`space-y-4 ${className}`}>
      {/* Animation Demo */}
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Exercise Animation</h3>
          
          {/* Animated Exercise Icon */}
          <div className="flex justify-center mb-4">
            <motion.div
              className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
              animate={isAnimating ? safeAnimationData.keyframes : {}}
              transition={{
                duration: safeAnimationData.duration / 1000,
                repeat: isAnimating ? Infinity : 0,
                ease: "easeInOut"
              }}
              style={{ backgroundColor: safeAnimationData.keyframes[0].backgroundColor }}
            >
              {exerciseId === 'push-up' && '💪'}
              {exerciseId === 'squat' && '🏋️'}
              {exerciseId === 'bicep-curls' && '🤲'}
              {!['push-up', 'squat', 'bicep-curls'].includes(exerciseId) && '🏃'}
            </motion.div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {safeAnimationData.description}
          </p>

          <Button
            onClick={startAnimation}
            disabled={isAnimating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isAnimating ? 'Animating...' : 'Show Animation'}
          </Button>
        </div>
      </Card>

      {/* Video Demonstration */}
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Video Demonstration</h3>
          
          {!showVideo ? (
            <div className="space-y-4">
              {/* Video Thumbnail */}
              <div className="relative bg-gray-200 dark:bg-gray-700 rounded-lg aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎥</div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {safeVideoData.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Duration: {safeVideoData.duration}
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {safeVideoData.description}
              </p>
              
              <Button
                onClick={() => setShowVideo(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                ▶️ Watch Tutorial Video
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* YouTube Embed */}
              {safeVideoData.embedId && safeVideoData.embedId !== 'dQw4w9WgXcQ' ? (
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${safeVideoData.embedId}?autoplay=1&rel=0&modestbranding=1`}
                    title={`${exerciseName} Tutorial`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎥</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Video tutorial coming soon for {exerciseName}
                    </p>
                  </div>
                </div>
              )}
              
              <Button
                onClick={() => setShowVideo(false)}
                variant="secondary"
              >
                Close Video
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Tips */}
      <Card className="p-4">
        <h4 className="font-medium mb-2">Quick Form Tips</h4>
        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          {exerciseId === 'push-up' && (
            <>
              <div>• Keep body in straight line from head to heels</div>
              <div>• Lower chest to floor, push back up</div>
              <div>• Keep core engaged throughout movement</div>
            </>
          )}
          {exerciseId === 'squat' && (
            <>
              <div>• Feet shoulder-width apart, toes slightly out</div>
              <div>• Lower hips back and down, chest up</div>
              <div>• Knees track over toes, weight on heels</div>
            </>
          )}
          {exerciseId === 'bicep-curls' && (
            <>
              <div>• Keep elbows close to your sides</div>
              <div>• Curl weights up slowly, squeeze at top</div>
              <div>• Lower with control, don't swing</div>
            </>
          )}
        </div>
      </Card>
    </div>
    </ClientOnly>
  );
}