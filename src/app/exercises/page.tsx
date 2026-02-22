'use client';

import { useState } from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { Card } from '@/components/ui/Card';
import { exerciseDatabase, ExerciseDetail } from '@/data/exerciseDatabase';
import { ExerciseInfoModal } from '@/components/exercises/ExerciseInfoModal';

export default function ExercisesPage() {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDetail | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  const categories = ['all', ...Array.from(new Set(exerciseDatabase.map(e => e.category)))];
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];

  const filteredExercises = exerciseDatabase.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.primaryMuscles.some(m => m.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || exercise.category === filterCategory;
    const matchesDifficulty = filterDifficulty === 'all' || exercise.difficulty === filterDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Exercise Library
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover exercises tailored to your fitness level and goals
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search exercises or muscles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
              ))}
            </select>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {difficulties.map(diff => (
                <option key={diff} value={diff}>{diff === 'all' ? 'All Levels' : diff.charAt(0).toUpperCase() + diff.slice(1)}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Results Count */}
        <div className="mb-4 text-gray-600 dark:text-gray-400">
          Showing {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''}
        </div>

        {/* Exercise Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredExercises.map((exercise) => (
            <Card
              key={exercise.id}
              className="p-4 cursor-pointer hover:shadow-xl transition-all hover:scale-105"
              onClick={() => setSelectedExercise(exercise)}
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  exercise.difficulty === 'beginner' ? 'bg-green-500 text-white' :
                  exercise.difficulty === 'intermediate' ? 'bg-yellow-500 text-white' :
                  'bg-red-500 text-white'
                }`}>
                  {exercise.difficulty.toUpperCase()}
                </span>
                <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-500 text-white">
                  {exercise.category}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {exercise.name}
              </h3>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                <div className="font-semibold mb-1">Target Muscles:</div>
                <div className="flex flex-wrap gap-1">
                  {exercise.primaryMuscles.map((muscle, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs">
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                <div className="font-semibold mb-1">Equipment:</div>
                <div className="flex flex-wrap gap-1">
                  {exercise.equipment.map((item, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center text-sm">
                  <span className="text-yellow-500 mr-1">⭐</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{exercise.rating}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">({exercise.ratingCount})</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {exercise.duration} • {exercise.calories} cal
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredExercises.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No exercises found. Try adjusting your filters.
            </p>
          </div>
        )}
      </div>

      {selectedExercise && (
        <ExerciseInfoModal
          exercise={selectedExercise}
          isOpen={true}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </div>
  );
}