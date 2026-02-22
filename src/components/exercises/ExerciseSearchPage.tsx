'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Exercise, ExerciseSearchFilters, ExerciseRecommendation } from '@/types/exercise';
import { useAuth } from '@/hooks/useAuth';
import { useExerciseSearch } from '@/hooks/useExerciseSearch';
import { useExerciseRecommendations } from '@/hooks/useExerciseRecommendations';
import { ExerciseSearchInterface } from './ExerciseSearchInterface';
import { ExerciseGrid } from './ExerciseGrid';
import { ExerciseRecommendations } from './ExerciseRecommendations';
import { EmptySearchResults } from './EmptySearchResults';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ExerciseSearchPageProps {
  onExerciseSelect: (exercise: Exercise) => void;
  initialSearchTerm?: string;
  initialFilters?: ExerciseSearchFilters;
}

export function ExerciseSearchPage({
  onExerciseSelect,
  initialSearchTerm = '',
  initialFilters = {},
}: ExerciseSearchPageProps) {
  const { userProfile } = useAuth();
  const {
    exercises,
    loading: searchLoading,
    error: searchError,
    hasMore,
    searchExercises,
    loadMore,
    clearResults,
  } = useExerciseSearch();

  const {
    recommendations,
    loading: recommendationsLoading,
    getPersonalizedRecommendations,
    getGoalBasedRecommendations,
    clearRecommendations,
  } = useExerciseRecommendations();

  const [currentSearchTerm, setCurrentSearchTerm] = useState(initialSearchTerm);
  const [currentFilters, setCurrentFilters] = useState<ExerciseSearchFilters>(initialFilters);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const loadInitialRecommendations = useCallback(async () => {
    if (!userProfile) return;

    setShowRecommendations(true);
    
    // Load personalized recommendations based on user goals
    if (userProfile.personalMetrics.fitnessGoals.length > 0) {
      await getGoalBasedRecommendations(
        userProfile.personalMetrics.fitnessGoals,
        userProfile,
        8
      );
    } else {
      await getPersonalizedRecommendations(userProfile, {}, 8);
    }
  }, [userProfile, getGoalBasedRecommendations, getPersonalizedRecommendations]);

  const handleSearch = useCallback(async (searchTerm: string, filters: ExerciseSearchFilters) => {
    setCurrentSearchTerm(searchTerm);
    setCurrentFilters(filters);
    setHasSearched(true);
    setShowRecommendations(false);
    clearRecommendations();
    
    await searchExercises(searchTerm, filters);
  }, [searchExercises, clearRecommendations]);

  // Load initial content when component mounts - only once
  useEffect(() => {
    if (initialLoadDone) return;

    const loadInitialContent = async () => {
      if (userProfile && !initialSearchTerm) {
        await loadInitialRecommendations();
      } else if (!userProfile && !initialSearchTerm) {
        // Load some default exercises for non-authenticated users immediately
        await handleSearch('', {});
      }
      setInitialLoadDone(true);
    };

    // Load immediately without delay for better UX
    loadInitialContent();
  }, [userProfile, initialSearchTerm, initialLoadDone]); // Removed function dependencies to prevent loops

  // Perform initial search if search term is provided - only once
  useEffect(() => {
    if (initialSearchTerm && !initialLoadDone) {
      handleSearch(initialSearchTerm, initialFilters);
      setInitialLoadDone(true);
    }
  }, [initialSearchTerm, initialFilters, initialLoadDone]); // Removed function dependency to prevent loops

  const handleExerciseSelect = (exercise: Exercise) => {
    onExerciseSelect(exercise);
  };

  const handleRecommendationSelect = (recommendation: ExerciseRecommendation) => {
    onExerciseSelect(recommendation.exercise);
  };

  const handleClearSearch = () => {
    setCurrentSearchTerm('');
    setCurrentFilters({});
    setHasSearched(false);
    clearResults();
    
    if (userProfile) {
      loadInitialRecommendations();
    }
  };

  const handleModifySearch = (newSearchTerm: string) => {
    handleSearch(newSearchTerm, {});
  };

  const handleRefreshRecommendations = () => {
    if (userProfile) {
      loadInitialRecommendations();
    }
  };

  // Determine what to show
  const showEmptyResults = hasSearched && exercises.length === 0 && !searchLoading;
  const showSearchResults = hasSearched && exercises.length > 0;
  const showInitialRecommendations = !hasSearched && showRecommendations && recommendations.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Exercise Library
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Discover exercises tailored to your fitness level and goals
        </p>
      </div>

      {/* Search Interface */}
      <ExerciseSearchInterface
        onSearch={handleSearch}
        loading={searchLoading}
        initialSearchTerm={currentSearchTerm}
        initialFilters={currentFilters}
      />

      {/* Error State */}
      {searchError && (
        <Card className="mb-8">
          <div className="p-6 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Search Error
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchError}
            </p>
            <Button
              onClick={() => handleSearch(currentSearchTerm, currentFilters)}
              variant="secondary"
            >
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* Search Results */}
      {showSearchResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Search Results
              {currentSearchTerm && (
                <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">
                  for "{currentSearchTerm}"
                </span>
              )}
            </h2>
            <Button
              onClick={handleClearSearch}
              variant="secondary"
              size="sm"
            >
              Clear Search
            </Button>
          </div>
          
          <ExerciseGrid
            exercises={exercises}
            loading={searchLoading}
            hasMore={hasMore}
            onExerciseSelect={handleExerciseSelect}
            onLoadMore={loadMore}
          />
        </motion.div>
      )}

      {/* Empty Search Results with Alternatives */}
      {showEmptyResults && (
        <EmptySearchResults
          searchTerm={currentSearchTerm}
          userProfile={userProfile}
          onExerciseSelect={handleRecommendationSelect}
          onClearSearch={handleClearSearch}
          onModifySearch={handleModifySearch}
        />
      )}

      {/* Initial Recommendations */}
      {showInitialRecommendations && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <ExerciseRecommendations
            recommendations={recommendations}
            loading={recommendationsLoading}
            title="Recommended for You"
            subtitle={
              userProfile?.personalMetrics.fitnessGoals.length
                ? `Based on your goals: ${userProfile.personalMetrics.fitnessGoals.join(', ')}`
                : 'Personalized recommendations based on your profile'
            }
            onExerciseSelect={handleRecommendationSelect}
            onRefresh={handleRefreshRecommendations}
            showScores={false}
          />
        </motion.div>
      )}

      {/* Welcome Message for New Users */}
      {!userProfile && !hasSearched && (
        <Card>
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">🏋️‍♀️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to the Exercise Library
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Explore thousands of exercises or create an account to get personalized recommendations 
              based on your fitness level, goals, and available equipment.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="primary">
                Sign Up for Recommendations
              </Button>
              <Button 
                variant="secondary"
                onClick={() => handleSearch('', {})}
              >
                Browse All Exercises
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Loading State for Initial Load */}
      {!hasSearched && !showRecommendations && !userProfile && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-400/80">
            Loading exercise library...
          </p>
        </div>
      )}

      {/* Loading State for Authenticated Users */}
      {!hasSearched && !showRecommendations && userProfile && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-400/80">
            Loading personalized recommendations...
          </p>
        </div>
      )}
    </div>
  );
}