'use client';

import { useState, useCallback } from 'react';
import { ExerciseRecommendation, RecommendationContext } from '@/types/exercise';
import { UserProfile } from '@/types/auth';
import { ExerciseRecommendationServiceDev } from '@/lib/exerciseRecommendationService.dev';

interface UseExerciseRecommendationsReturn {
  recommendations: ExerciseRecommendation[];
  loading: boolean;
  error: string | null;
  getPersonalizedRecommendations: (
    userProfile: UserProfile,
    context?: Partial<RecommendationContext>,
    count?: number
  ) => Promise<void>;
  getAlternativeSuggestions: (
    searchTerm: string,
    userProfile: UserProfile,
    count?: number
  ) => Promise<void>;
  getSimilarExercises: (
    exerciseId: string,
    userProfile: UserProfile,
    count?: number
  ) => Promise<void>;
  getGoalBasedRecommendations: (
    goals: string[],
    userProfile: UserProfile,
    count?: number
  ) => Promise<void>;
  clearRecommendations: () => void;
}

// Force development service usage since we're using seed data
const serviceToUse = ExerciseRecommendationServiceDev;

export function useExerciseRecommendations(): UseExerciseRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<ExerciseRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPersonalizedRecommendations = useCallback(async (
    userProfile: UserProfile,
    context: Partial<RecommendationContext> = {},
    count: number = 10
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await serviceToUse.getPersonalizedRecommendations(
        userProfile,
        context,
        count
      );
      setRecommendations(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recommendations');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAlternativeSuggestions = useCallback(async (
    searchTerm: string,
    userProfile: UserProfile,
    count: number = 5
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await serviceToUse.getAlternativeSuggestions(
        searchTerm,
        userProfile,
        count
      );
      setRecommendations(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get alternative suggestions');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSimilarExercises = useCallback(async (
    exerciseId: string,
    userProfile: UserProfile,
    count: number = 5
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await serviceToUse.getSimilarExercises(
        exerciseId,
        userProfile,
        count
      );
      setRecommendations(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get similar exercises');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getGoalBasedRecommendations = useCallback(async (
    goals: string[],
    userProfile: UserProfile,
    count: number = 8
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await serviceToUse.getGoalBasedRecommendations(
        goals,
        userProfile,
        count
      );
      setRecommendations(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get goal-based recommendations');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearRecommendations = useCallback(() => {
    setRecommendations([]);
    setError(null);
  }, []);

  return {
    recommendations,
    loading,
    error,
    getPersonalizedRecommendations,
    getAlternativeSuggestions,
    getSimilarExercises,
    getGoalBasedRecommendations,
    clearRecommendations,
  };
}