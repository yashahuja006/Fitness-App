'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Exercise } from '@/types/exercise';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { YouTubeVideoPlayer } from './YouTubeVideoPlayer';

interface ExerciseDetailModalProps {
  exercise: Exercise;
  isOpen: boolean;
  onClose: () => void;
}

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const CATEGORY_COLORS = {
  strength: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  cardio: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  flexibility: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  balance: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  functional: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  sports: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  rehabilitation: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
};

export function ExerciseDetailModal({ exercise, isOpen, onClose }: ExerciseDetailModalProps) {
  if (!isOpen) return null;

  const formatMuscleGroup = (muscle: string) => {
    return muscle.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatEquipment = (equipment: string) => {
    return equipment.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <Card className="bg-white dark:bg-gray-800">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        {exercise.name}
                      </h2>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${CATEGORY_COLORS[exercise.category]}`}>
                          {exercise.category.charAt(0).toUpperCase() + exercise.category.slice(1)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${DIFFICULTY_COLORS[exercise.difficulty]}`}>
                          {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                        </span>
                        {exercise.equipment.includes('none') && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            No Equipment
                          </span>
                        )}
                      </div>

                      {/* Rating and Stats */}
                      <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                        {exercise.metadata.averageRating && (
                          <div className="flex items-center">
                            <span className="text-yellow-400 mr-1">★</span>
                            <span className="font-medium">{exercise.metadata.averageRating.toFixed(1)}</span>
                            <span className="ml-1">({exercise.metadata.totalRatings} reviews)</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <span className="mr-1">👁</span>
                          <span>{exercise.metadata.popularity} views</span>
                        </div>
                        {exercise.caloriesPerMinute && (
                          <div className="flex items-center">
                            <span className="mr-1">🔥</span>
                            <span>{exercise.caloriesPerMinute} cal/min</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={onClose}
                      variant="secondary"
                      size="sm"
                      className="ml-4"
                    >
                      ✕
                    </Button>
                  </div>

                  {/* Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Video Section */}
                      {exercise.mediaAssets.videos && exercise.mediaAssets.videos.length > 0 && (
                        <section>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Exercise Demonstration
                          </h3>
                          <div className="grid grid-cols-1 gap-4">
                            {exercise.mediaAssets.videos.map((videoUrl, index) => (
                              <YouTubeVideoPlayer
                                key={index}
                                videoUrl={videoUrl}
                                title={`${exercise.name} - Demonstration ${index + 1}`}
                                autoLoop={true}
                                className="w-full"
                              />
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Instructions */}
                      <section>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                          Instructions
                        </h3>
                        <ol className="space-y-3">
                          {exercise.instructions.map((instruction, index) => (
                            <li key={index} className="flex">
                              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                                {index + 1}
                              </span>
                              <span className="text-gray-700 dark:text-gray-300">
                                {instruction}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </section>

                      {/* Common Mistakes */}
                      {exercise.commonMistakes.length > 0 && (
                        <section>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Common Mistakes to Avoid
                          </h3>
                          <ul className="space-y-2">
                            {exercise.commonMistakes.map((mistake, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-red-500 mr-2 mt-1">⚠️</span>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {mistake}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}

                      {/* Safety Tips */}
                      {exercise.safetyTips.length > 0 && (
                        <section>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Safety Tips
                          </h3>
                          <ul className="space-y-2">
                            {exercise.safetyTips.map((tip, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-green-500 mr-2 mt-1">✅</span>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {tip}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                      {/* Exercise Details */}
                      <Card className="p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                          Exercise Details
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Target Muscles:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {exercise.targetMuscles.map(muscle => (
                                <span key={muscle} className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs">
                                  {formatMuscleGroup(muscle)}
                                </span>
                              ))}
                            </div>
                          </div>

                          {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Secondary Muscles:</span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {exercise.secondaryMuscles.map(muscle => (
                                  <span key={muscle} className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded text-xs">
                                    {formatMuscleGroup(muscle)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Equipment:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {exercise.equipment.map(equipment => (
                                <span key={equipment} className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded text-xs">
                                  {formatEquipment(equipment)}
                                </span>
                              ))}
                            </div>
                          </div>

                          {exercise.repetitions && (
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Repetitions:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">
                                {exercise.repetitions.min}-{exercise.repetitions.max} reps
                              </span>
                            </div>
                          )}

                          {exercise.sets && (
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Sets:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">
                                {exercise.sets.min}-{exercise.sets.max} sets
                              </span>
                            </div>
                          )}

                          {exercise.restTime && (
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Rest Time:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">
                                {exercise.restTime}s
                              </span>
                            </div>
                          )}

                          {exercise.duration && (
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Duration:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">
                                {exercise.duration}s
                              </span>
                            </div>
                          )}
                        </div>
                      </Card>

                      {/* Tags */}
                      {exercise.metadata.tags.length > 0 && (
                        <Card className="p-4">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                            Tags
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {exercise.metadata.tags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded text-xs">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </Card>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <Button className="w-full" size="lg">
                          Add to Workout
                        </Button>
                        <Button variant="secondary" className="w-full">
                          Save to Favorites
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}