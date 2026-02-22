'use client';

import { useState, useCallback } from 'react';
import { Exercise, ExerciseSearchFilters } from '@/types/exercise';
import { ExerciseService } from '@/lib/exerciseService';
import { ExerciseServiceDev } from '@/lib/exerciseService.dev';
import { QueryDocumentSnapshot } from 'firebase/firestore';

interface UseExerciseSearchReturn {
  exercises: Exercise[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  searchExercises: (searchTerm: string, filters: ExerciseSearchFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  clearResults: () => void;
}

// Use development service for now since Firebase database isn't seeded yet
const isDevelopment = true; // Force development mode for exercise data
const serviceToUse = isDevelopment ? ExerciseServiceDev : ExerciseService;

export function useExerciseSearch(): UseExerciseSearchReturn {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [currentFilters, setCurrentFilters] = useState<ExerciseSearchFilters>({});
  const [offset, setOffset] = useState(0);

  const searchExercises = useCallback(async (
    searchTerm: string, 
    filters: ExerciseSearchFilters
  ) => {
    setLoading(true);
    setError(null);
    setCurrentSearchTerm(searchTerm);
    setCurrentFilters(filters);
    setLastDoc(null);
    setOffset(0);

    try {
      if (isDevelopment) {
        const result = await ExerciseServiceDev.searchExercises(
          searchTerm || undefined,
          filters,
          12, // Reduced page size for faster loading
          0 // offset
        );

        setExercises(result.exercises);
        setHasMore(result.hasMore);
        setOffset(12);
      } else {
        const result = await ExerciseService.searchExercises(
          searchTerm || undefined,
          filters,
          12 // Reduced page size
        );

        setExercises(result.exercises);
        setHasMore(result.hasMore);
        setLastDoc((result as any).lastDoc || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search exercises');
      setExercises([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      if (isDevelopment) {
        const result = await ExerciseServiceDev.searchExercises(
          currentSearchTerm || undefined,
          currentFilters,
          12,
          offset
        );

        setExercises(prev => [...prev, ...result.exercises]);
        setHasMore(result.hasMore);
        setOffset(prev => prev + 12);
      } else {
        const result = await ExerciseService.searchExercises(
          currentSearchTerm || undefined,
          currentFilters,
          12,
          lastDoc || undefined
        );

        setExercises(prev => [...prev, ...result.exercises]);
        setHasMore(result.hasMore);
        setLastDoc((result as any).lastDoc || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more exercises');
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, currentSearchTerm, currentFilters, lastDoc, offset]);

  const clearResults = useCallback(() => {
    setExercises([]);
    setError(null);
    setHasMore(false);
    setLastDoc(null);
    setCurrentSearchTerm('');
    setCurrentFilters({});
    setOffset(0);
  }, []);

  return {
    exercises,
    loading,
    error,
    hasMore,
    searchExercises,
    loadMore,
    clearResults,
  };
}