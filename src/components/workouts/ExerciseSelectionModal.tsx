'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Exercise } from '@/types/exercise';

// For now, we'll use a fallback service until the real one is available
const fallbackSearchExercises = async (query: string, options?: any): Promise<Exercise[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const sampleExercises: Exercise[] = [
    {
      id: 'push-up',
      name: 'Push-up',
      category: 'strength',
      targetMuscles: ['chest', 'triceps'],
      equipment: ['bodyweight'],
      difficulty: 'beginner',
      instructions: ['Start in plank position', 'Lower body to ground', 'Push back up'],
      commonMistakes: ['Sagging hips', 'Incomplete range of motion'],
      safetyTips: ['Keep core engaged', 'Maintain straight line'],
      mediaAssets: { images: [], videos: [], demonstrations: [] },
      metadata: { createdBy: 'system', verified: true, popularity: 95, tags: ['bodyweight', 'push'] },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'squat',
      name: 'Bodyweight Squat',
      category: 'strength',
      targetMuscles: ['quadriceps', 'glutes'],
      equipment: ['bodyweight'],
      difficulty: 'beginner',
      instructions: ['Stand with feet shoulder-width apart', 'Lower into squat position', 'Return to standing'],
      commonMistakes: ['Knees caving in', 'Not going deep enough'],
      safetyTips: ['Keep chest up', 'Weight on heels'],
      mediaAssets: { images: [], videos: [], demonstrations: [] },
      metadata: { createdBy: 'system', verified: true, popularity: 90, tags: ['bodyweight', 'legs'] },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'plank',
      name: 'Plank',
      category: 'strength',
      targetMuscles: ['core', 'shoulders'],
      equipment: ['bodyweight'],
      difficulty: 'beginner',
      instructions: ['Start in push-up position', 'Hold position', 'Keep body straight'],
      commonMistakes: ['Sagging hips', 'Holding breath'],
      safetyTips: ['Engage core', 'Breathe normally'],
      mediaAssets: { images: [], videos: [], demonstrations: [] },
      metadata: { createdBy: 'system', verified: true, popularity: 85, tags: ['bodyweight', 'core'] },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'jumping-jacks',
      name: 'Jumping Jacks',
      category: 'cardio',
      targetMuscles: ['legs', 'shoulders'],
      equipment: ['bodyweight'],
      difficulty: 'beginner',
      instructions: ['Start with feet together', 'Jump feet apart while raising arms', 'Return to start'],
      commonMistakes: ['Landing too hard', 'Not fully extending arms'],
      safetyTips: ['Land softly', 'Keep core engaged'],
      mediaAssets: { images: [], videos: [], demonstrations: [] },
      metadata: { createdBy: 'system', verified: true, popularity: 80, tags: ['bodyweight', 'cardio'] },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'burpees',
      name: 'Burpees',
      category: 'cardio',
      targetMuscles: ['full-body'],
      equipment: ['bodyweight'],
      difficulty: 'intermediate',
      instructions: ['Start standing', 'Drop to squat', 'Jump back to plank', 'Do push-up', 'Jump feet forward', 'Jump up'],
      commonMistakes: ['Skipping push-up', 'Not jumping high enough'],
      safetyTips: ['Maintain form', 'Modify if needed'],
      mediaAssets: { images: [], videos: [], demonstrations: [] },
      metadata: { createdBy: 'system', verified: true, popularity: 75, tags: ['bodyweight', 'hiit'] },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  // Filter based on options
  let filtered = sampleExercises;
  
  if (query.trim()) {
    filtered = filtered.filter(ex => 
      ex.name.toLowerCase().includes(query.toLowerCase()) ||
      ex.targetMuscles.some(muscle => muscle.toLowerCase().includes(query.toLowerCase()))
    );
  }
  
  if (options?.equipment && options.equipment.length > 0) {
    filtered = filtered.filter(ex => 
      ex.equipment.some(eq => options.equipment.includes(eq))
    );
  }
  
  if (options?.targetMuscles && options.targetMuscles.length > 0) {
    filtered = filtered.filter(ex => 
      ex.targetMuscles.some(muscle => options.targetMuscles.includes(muscle))
    );
  }
  
  return filtered.slice(0, options?.limit || 20);
};

const fallbackGetExercisesByCategory = async (category: string, value: string): Promise<Exercise[]> => {
  return fallbackSearchExercises('', { 
    [category === 'equipment' ? 'equipment' : 'targetMuscles']: [value],
    limit: 20 
  });
};

interface ExerciseSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  selectedExercises?: string[]; // Just IDs instead of full Exercise objects
}

export function ExerciseSelectionModal({ 
  isOpen, 
  onClose, 
  onSelectExercise, 
  selectedExercises = [] 
}: ExerciseSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'equipment' | 'muscles'>('equipment');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const [muscleFilter, setMuscleFilter] = useState('all');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  // Load exercises when modal opens or filters change
  useEffect(() => {
    if (!isOpen) return;

    const loadExercises = async () => {
      setLoading(true);
      try {
        let results: Exercise[] = [];
        
        if (searchQuery.trim()) {
          // Search by query
          results = await fallbackSearchExercises(searchQuery, {
            equipment: equipmentFilter !== 'all' ? [equipmentFilter] : undefined,
            targetMuscles: muscleFilter !== 'all' ? [muscleFilter] : undefined,
            limit: 50
          });
        } else if (equipmentFilter !== 'all') {
          results = await fallbackGetExercisesByCategory('equipment', equipmentFilter);
        } else if (muscleFilter !== 'all') {
          results = await fallbackGetExercisesByCategory('muscle', muscleFilter);
        } else {
          // Get popular exercises
          results = await fallbackSearchExercises('', { limit: 50 });
        }
        
        setExercises(results);
      } catch (error) {
        console.error('Failed to load exercises:', error);
        setExercises([]);
      } finally {
        setLoading(false);
      }
    };

    loadExercises();
  }, [isOpen, searchQuery, equipmentFilter, muscleFilter]);

  const isExerciseSelected = (exercise: Exercise) => {
    return selectedExercises.includes(exercise.id);
  };

  const getExerciseIcon = (exercise: Exercise) => {
    const primaryMuscle = exercise.targetMuscles[0];
    const iconMap: Record<string, string> = {
      'chest': '💪',
      'back': '🏋️',
      'shoulders': '💪',
      'arms': '💪',
      'biceps': '💪',
      'triceps': '💪',
      'legs': '🦵',
      'quadriceps': '🦵',
      'hamstrings': '🦵',
      'calves': '🦵',
      'glutes': '🍑',
      'core': '🔥',
      'abdominals': '🔥',
      'cardio': '❤️'
    };
    return iconMap[primaryMuscle] || '🏋️‍♂️';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add Exercise
            </h2>
            <Button variant="primary" disabled>
              Create
            </Button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </span>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exercise"
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setSelectedTab('equipment')}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'equipment'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400'
              }`}
            >
              All Equipment
            </button>
            <button
              onClick={() => setSelectedTab('muscles')}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'muscles'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400'
              }`}
            >
              All Muscles
            </button>
          </div>

          {/* Filter Content */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            {selectedTab === 'equipment' && (
              <div>
                <h3 className="text-center font-medium text-gray-900 dark:text-white mb-4">
                  Equipment
                </h3>
                <div className="space-y-3">
                  {[
                    { id: 'all', name: 'All Equipment', icon: '🏋️' },
                    { id: 'bodyweight', name: 'Bodyweight', icon: '🤸' },
                    { id: 'barbell', name: 'Barbell', icon: '🏋️' },
                    { id: 'dumbbell', name: 'Dumbbell', icon: '🏋️' },
                    { id: 'kettlebell', name: 'Kettlebell', icon: '⚫' },
                    { id: 'machine', name: 'Machine', icon: '🏢' },
                    { id: 'cable', name: 'Cable', icon: '🔗' }
                  ].map((equipment) => (
                    <button
                      key={equipment.id}
                      onClick={() => setEquipmentFilter(equipment.id)}
                      className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
                        equipmentFilter === equipment.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-lg">{equipment.icon}</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {equipment.name}
                      </span>
                      {equipmentFilter === equipment.id && (
                        <span className="ml-auto text-blue-500">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'muscles' && (
              <div>
                <h3 className="text-center font-medium text-gray-900 dark:text-white mb-4">
                  Muscle Group
                </h3>
                <div className="space-y-3">
                  {[
                    { id: 'all', name: 'All Muscles', icon: '💪' },
                    { id: 'chest', name: 'Chest', icon: '💪' },
                    { id: 'back', name: 'Back', icon: '🏋️' },
                    { id: 'shoulders', name: 'Shoulders', icon: '💪' },
                    { id: 'arms', name: 'Arms', icon: '💪' },
                    { id: 'legs', name: 'Legs', icon: '🦵' },
                    { id: 'core', name: 'Core', icon: '🔥' },
                    { id: 'cardio', name: 'Cardio', icon: '❤️' }
                  ].map((muscle) => (
                    <button
                      key={muscle.id}
                      onClick={() => setMuscleFilter(muscle.id)}
                      className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
                        muscleFilter === muscle.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-lg">{muscle.icon}</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {muscle.name}
                      </span>
                      {muscleFilter === muscle.id && (
                        <span className="ml-auto text-blue-500">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Exercise List */}
          <div className="flex-1 overflow-y-auto max-h-96">
            <div className="p-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">⏳</div>
                  <p className="text-gray-500 dark:text-gray-400">Loading exercises...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {exercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      onClick={() => onSelectExercise(exercise)}
                      className={`
                        flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
                          isExerciseSelected(exercise)
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }
                      `}
                    >
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-lg">{getExerciseIcon(exercise)}</span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {exercise.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {exercise.targetMuscles.join(', ')} • {exercise.difficulty}
                        </div>
                      </div>
                      {isExerciseSelected(exercise) && (
                        <span className="text-blue-500">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {!loading && exercises.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-2">🔍</div>
                  <p>No exercises found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}