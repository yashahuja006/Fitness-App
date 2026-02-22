'use client';

import { ExerciseDetail } from '@/data/exerciseDatabase';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface ExerciseInfoModalProps {
  exercise: ExerciseDetail;
  isOpen: boolean;
  onClose: () => void;
}

export function ExerciseInfoModal({ exercise, isOpen, onClose }: ExerciseInfoModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleStartWorkout = () => {
    router.push('/pose-demo');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {exercise.name}
            </h2>
            <div className="flex gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                exercise.difficulty === 'beginner' ? 'bg-green-500 text-white' :
                exercise.difficulty === 'intermediate' ? 'bg-yellow-500 text-white' :
                'bg-red-500 text-white'
              }`}>
                {exercise.difficulty.toUpperCase()}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-500 text-white">
                {exercise.category}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-500 text-white">
                {exercise.duration} • {exercise.calories} cal
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Video */}
          {exercise.videoUrl && (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                src={exercise.videoUrl}
                title={exercise.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* Equipment */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Equipment Needed
            </h3>
            <div className="flex gap-2 flex-wrap">
              {exercise.equipment.map((item, index) => (
                <span key={index} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Muscles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Primary Muscles
              </h3>
              <div className="space-y-2">
                {exercise.primaryMuscles.map((muscle, index) => (
                  <div key={index} className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <span className="text-blue-600 dark:text-blue-400 mr-2">💪</span>
                    <span className="text-gray-900 dark:text-white font-medium">{muscle}</span>
                  </div>
                ))}
              </div>
            </div>

            {exercise.secondaryMuscles.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Secondary Muscles
                </h3>
                <div className="space-y-2">
                  {exercise.secondaryMuscles.map((muscle, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                      <span className="text-gray-600 dark:text-gray-400 mr-2">✓</span>
                      <span className="text-gray-900 dark:text-white">{muscle}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Step-by-Step Instructions
            </h3>
            <ol className="space-y-3">
              {exercise.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start">
                  <span className="shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 pt-1">
                    {instruction}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Tips */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Pro Tips
            </h3>
            <div className="space-y-2">
              {exercise.tips.map((tip, index) => (
                <div key={index} className="flex items-start p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <span className="text-yellow-600 dark:text-yellow-400 mr-2">💡</span>
                  <span className="text-gray-900 dark:text-white">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button 
              className="flex-1" 
              size="lg"
              onClick={handleStartWorkout}
            >
              Start Workout with AI Coach
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1" 
              size="lg"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
