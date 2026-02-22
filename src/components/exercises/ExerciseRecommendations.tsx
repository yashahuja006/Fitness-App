'use client';

import { motion } from 'framer-motion';
import { ExerciseRecommendation } from '@/types/exercise';
import { ExerciseCard } from './ExerciseCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ExerciseRecommendationsProps {
  recommendations: ExerciseRecommendation[];
  loading: boolean;
  title: string;
  subtitle?: string;
  onExerciseSelect: (recommendation: ExerciseRecommendation) => void;
  onRefresh?: () => void;
  showScores?: boolean;
  maxDisplay?: number;
}

export function ExerciseRecommendations({
  recommendations,
  loading,
  title,
  subtitle,
  onExerciseSelect,
  onRefresh,
  showScores = false,
  maxDisplay,
}: ExerciseRecommendationsProps) {
  const displayedRecommendations = maxDisplay 
    ? recommendations.slice(0, maxDisplay)
    : recommendations;

  if (loading) {
    return (
      <Card className="mb-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
              {subtitle && (
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 animate-pulse"
              >
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div className="flex gap-2 mb-3">
                  <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="mb-8">
        <div className="p-6 text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No recommendations available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We couldn't find any exercises matching your criteria at the moment.
          </p>
          {onRefresh && (
            <Button onClick={onRefresh} variant="secondary">
              Try Again
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {title}
            </h2>
            {subtitle && (
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {subtitle}
              </p>
            )}
          </div>
          
          {onRefresh && (
            <Button
              onClick={onRefresh}
              variant="secondary"
              size="sm"
            >
              Refresh
            </Button>
          )}
        </div>

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedRecommendations.map((recommendation, index) => (
            <motion.div
              key={recommendation.exercise.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="relative"
            >
              {/* Recommendation Score Badge */}
              {showScores && (
                <div className="absolute top-2 right-2 z-10 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                  {Math.round(recommendation.score)}
                </div>
              )}
              
              {/* Exercise Card */}
              <div className="h-full">
                <ExerciseCard
                  exercise={recommendation.exercise}
                  onClick={() => onExerciseSelect(recommendation)}
                />
                
                {/* Recommendation Reason */}
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
                    Why recommended:
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {recommendation.reason}
                  </p>
                  
                  {/* Matched Criteria Tags */}
                  {recommendation.matchedCriteria.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {recommendation.matchedCriteria.slice(0, 3).map((criteria) => (
                        <span
                          key={criteria}
                          className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                        >
                          {criteria}
                        </span>
                      ))}
                      {recommendation.matchedCriteria.length > 3 && (
                        <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                          +{recommendation.matchedCriteria.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Show More Button */}
        {maxDisplay && recommendations.length > maxDisplay && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {maxDisplay} of {recommendations.length} recommendations
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {recommendations.length} personalized recommendation{recommendations.length !== 1 ? 's' : ''} 
            {' '}based on your profile and preferences
          </p>
        </div>
      </div>
    </Card>
  );
}