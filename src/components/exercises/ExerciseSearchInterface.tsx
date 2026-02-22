'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  ExerciseSearchFilters, 
  ExerciseCategory, 
  DifficultyLevel, 
  Equipment, 
  MuscleGroup 
} from '@/types/exercise';
import { useDebounce } from '@/hooks/useDebounce';

interface ExerciseSearchInterfaceProps {
  onSearch: (searchTerm: string, filters: ExerciseSearchFilters) => void;
  loading: boolean;
  initialSearchTerm?: string;
  initialFilters?: ExerciseSearchFilters;
}

const CATEGORIES: { value: ExerciseCategory; label: string }[] = [
  { value: 'strength', label: 'Strength' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'balance', label: 'Balance' },
  { value: 'functional', label: 'Functional' },
  { value: 'sports', label: 'Sports' },
  { value: 'rehabilitation', label: 'Rehabilitation' },
];

const DIFFICULTY_LEVELS: { value: DifficultyLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: 'none', label: 'No Equipment' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'resistance_bands', label: 'Resistance Bands' },
  { value: 'pull_up_bar', label: 'Pull-up Bar' },
  { value: 'bench', label: 'Bench' },
  { value: 'cable_machine', label: 'Cable Machine' },
  { value: 'yoga_mat', label: 'Yoga Mat' },
  { value: 'stability_ball', label: 'Stability Ball' },
];

const MUSCLE_GROUPS: { value: MuscleGroup; label: string }[] = [
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'triceps', label: 'Triceps' },
  { value: 'abs', label: 'Abs' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'quadriceps', label: 'Quadriceps' },
  { value: 'hamstrings', label: 'Hamstrings' },
  { value: 'calves', label: 'Calves' },
  { value: 'core', label: 'Core' },
  { value: 'full_body', label: 'Full Body' },
];

export function ExerciseSearchInterface({
  onSearch,
  loading,
  initialSearchTerm = '',
  initialFilters = {}
}: ExerciseSearchInterfaceProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [filters, setFilters] = useState<ExerciseSearchFilters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Trigger search when debounced search term or filters change
  useEffect(() => {
    onSearch(debouncedSearchTerm, filters);
  }, [debouncedSearchTerm, filters, onSearch]);

  const handleFilterChange = (key: keyof ExerciseSearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleEquipmentToggle = (equipment: Equipment) => {
    const currentEquipment = filters.equipment || [];
    const newEquipment = currentEquipment.includes(equipment)
      ? currentEquipment.filter(e => e !== equipment)
      : [...currentEquipment, equipment];
    
    handleFilterChange('equipment', newEquipment.length > 0 ? newEquipment : undefined);
  };

  const handleMuscleGroupToggle = (muscleGroup: MuscleGroup) => {
    const currentMuscles = filters.targetMuscles || [];
    const newMuscles = currentMuscles.includes(muscleGroup)
      ? currentMuscles.filter(m => m !== muscleGroup)
      : [...currentMuscles, muscleGroup];
    
    handleFilterChange('targetMuscles', newMuscles.length > 0 ? newMuscles : undefined);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.difficulty) count++;
    if (filters.equipment?.length) count++;
    if (filters.targetMuscles?.length) count++;
    return count;
  };

  return (
    <Card className="mb-8">
      <div className="p-6">
        {/* Search Bar */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search exercises by name, instructions, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? 'primary' : 'secondary'}
            className="relative"
          >
            Filters
            {getActiveFilterCount() > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {getActiveFilterCount()}
              </span>
            )}
          </Button>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t pt-6 mt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={filters.difficulty || ''}
                    onChange={(e) => handleFilterChange('difficulty', e.target.value || undefined)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">All Levels</option>
                    {DIFFICULTY_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Equipment Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Equipment
                  </label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {EQUIPMENT_OPTIONS.map(equipment => (
                      <label key={equipment.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.equipment?.includes(equipment.value) || false}
                          onChange={() => handleEquipmentToggle(equipment.value)}
                          className="mr-2 rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {equipment.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Muscle Groups Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Muscles
                  </label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {MUSCLE_GROUPS.map(muscle => (
                      <label key={muscle.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.targetMuscles?.includes(muscle.value) || false}
                          onChange={() => handleMuscleGroupToggle(muscle.value)}
                          className="mr-2 rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {muscle.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clear Filters Button */}
              {getActiveFilterCount() > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    onClick={clearFilters}
                    variant="secondary"
                    size="sm"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Summary */}
        {(searchTerm || getActiveFilterCount() > 0) && (
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {searchTerm && (
              <span>Searching for "{searchTerm}"</span>
            )}
            {searchTerm && getActiveFilterCount() > 0 && <span> with </span>}
            {getActiveFilterCount() > 0 && (
              <span>{getActiveFilterCount()} filter{getActiveFilterCount() > 1 ? 's' : ''} applied</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}