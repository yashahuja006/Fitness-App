'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExerciseRecommendation } from '@/types/exercise';
import { UserProfile } from '@/types/auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ExerciseRecommendations } from './ExerciseRecommendations';
import { useExerciseRecommendations } from '@/hooks/useExerciseRecommendations';

interface EmptySearchResultsProps {
  searchTerm: string;
  userProfile: UserProfile | null;
  onExerciseSelect: (recommendation: ExerciseRecommendation) => void;
  onClearSearch: () => void;
  onModifySearch: (newTerm: string) => void;
}

export function EmptySearchResults({
  searchTerm,
  userProfile,
  onExerciseSelect,
  onClearSearch,
  onModifySearch,
}: EmptySearchResultsProps) {
  const {
    recommendations,
    loading,
    error,
    getAlternativeSuggestions,
    getPersonalizedRecommendations,
  } = useExerciseRecommendations();

  const [showAlternatives, setShowAlternatives] = useState(false);

  // Load alternative suggestions when component mounts
  useEffect(() => {
    if (userProfile && searchTerm && !showAlternatives) {
      getAlternativeSuggestions(searchTerm, userProfile, 6);
      setShowAlternatives(true);
    }
  }, [searchTerm, userProfile, getAlternativeSuggestions, showAlternatives]);

  const handleGetGeneralRecommendations = () => {
    if (userProfile) {
      getPersonalizedRecommendations(userProfile, {}, 8);
    }
  };

  const searchSuggestions = [
    'Try broader terms (e.g., "chest" instead of "incline dumbbell press")',
    'Remove some filters to see more results',
    'Check spelling and try alternative names',
    'Use muscle group names (chest, back, legs, etc.)',
    'Try equipment-based searches (dumbbells, bodyweight, etc.)',
  ];

  const popularSearchTerms = [
    'push ups', 'squats', 'planks', 'burpees', 'lunges',
    'chest workout', 'back exercises', 'core training',
    'dumbbell exercises', 'bodyweight workout'
  ];

  return (
    <div className="space-y-6">
      {/* Main Empty State */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          No exercises found for "{searchTerm}"
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Don't worry! We have some suggestions to help you find the perfect exercises.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Button onClick={onClearSearch} variant="primary">
            Clear Search
          </Button>
          <Button onClick={handleGetGeneralRecommendations} variant="secondary">
            Get Recommendations
          </Button>
        </div>
      </motion.div>

      {/* Search Tips */}
      <Card>
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            💡 Search Tips
          </h4>
          <ul className="space-y-2">
            {searchSuggestions.map((tip, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start text-sm text-gray-600 dark:text-gray-400"
              >
                <span className="text-blue-500 mr-2 mt-0.5">•</span>
                {tip}
              </motion.li>
            ))}
          </ul>
        </div>
      </Card>

      {/* Popular Search Terms */}
      <Card>
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🔥 Popular Searches
          </h4>
          <div className="flex flex-wrap gap-2">
            {popularSearchTerms.map((term) => (
              <Button
                key={term}
                onClick={() => onModifySearch(term)}
                variant="secondary"
                size="sm"
                className="text-sm"
              >
                {term}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Alternative Suggestions */}
      {userProfile && showAlternatives && (
        <ExerciseRecommendations
          recommendations={recommendations}
          loading={loading}
          title="Alternative Suggestions"
          subtitle={`Based on your search for "${searchTerm}", here are some exercises you might like`}
          onExerciseSelect={onExerciseSelect}
          onRefresh={() => getAlternativeSuggestions(searchTerm, userProfile, 6)}
          maxDisplay={6}
        />
      )}

      {/* Error State */}
      {error && (
        <Card>
          <div className="p-6 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Unable to Load Suggestions
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <Button
              onClick={() => getAlternativeSuggestions(searchTerm, userProfile!, 6)}
              variant="secondary"
            >
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* Fallback Content */}
      {!userProfile && (
        <Card>
          <div className="p-6 text-center">
            <div className="text-4xl mb-4">👤</div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Sign In for Personalized Suggestions
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create an account to get personalized exercise recommendations based on your fitness level and goals.
            </p>
            <Button variant="primary">
              Sign In
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}