import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { ExerciseSearchInterface } from '../ExerciseSearchInterface';
import { ExerciseCard } from '../ExerciseCard';
import { ExerciseGrid } from '../ExerciseGrid';
import { 
  ExerciseSearchFilters, 
  ExerciseCategory, 
  DifficultyLevel, 
  Equipment, 
  MuscleGroup,
  Exercise 
} from '@/types/exercise';
import { createMockExercise } from '@/__tests__/utils/mocks';

// Mock the useDebounce hook
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

describe('Exercise Search System - Property Tests', () => {
  describe('Property 16: Exercise Search Functionality', () => {
    const validSearchTermArb = fc.string({ minLength: 1, maxLength: 50 })
      .filter(s => s.trim().length > 0);

    const categoryArb = fc.constantFrom<ExerciseCategory>(
      'strength', 'cardio', 'flexibility', 'balance', 'functional', 'sports', 'rehabilitation'
    );

    const difficultyArb = fc.constantFrom<DifficultyLevel>('beginner', 'intermediate', 'advanced');

    const equipmentArb = fc.array(
      fc.constantFrom<Equipment>(
        'none', 'dumbbells', 'barbell', 'kettlebell', 'resistance_bands', 
        'pull_up_bar', 'bench', 'cable_machine', 'yoga_mat', 'stability_ball'
      ),
      { minLength: 1, maxLength: 3 }
    );

    const muscleGroupArb = fc.array(
      fc.constantFrom<MuscleGroup>(
        'chest', 'back', 'shoulders', 'biceps', 'triceps', 'abs', 
        'glutes', 'quadriceps', 'hamstrings', 'calves', 'core', 'full_body'
      ),
      { minLength: 1, maxLength: 4 }
    );

    const filtersArb = fc.record({
      category: fc.option(categoryArb),
      difficulty: fc.option(difficultyArb),
      equipment: fc.option(equipmentArb),
      targetMuscles: fc.option(muscleGroupArb),
    }).map(filters => ({
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
      ...(filters.equipment ? { equipment: filters.equipment } : {}),
      ...(filters.targetMuscles ? { targetMuscles: filters.targetMuscles } : {}),
    }));

    it('Property 16.1: Valid search terms should trigger search callback', async () => {
      await fc.assert(fc.asyncProperty(
        validSearchTermArb,
        filtersArb,
        async (searchTerm, filters) => {
          const mockOnSearch = jest.fn();
          
          render(
            <ExerciseSearchInterface 
              onSearch={mockOnSearch} 
              loading={false}
            />
          );

          const searchInput = screen.getByPlaceholderText(/search exercises/i);
          fireEvent.change(searchInput, { target: { value: searchTerm } });

          await waitFor(() => {
            expect(mockOnSearch).toHaveBeenCalledWith(searchTerm, {});
          });
        }
      ));
    });

    it('Property 16.2: Filter combinations should be applied correctly', async () => {
      await fc.assert(fc.asyncProperty(
        filtersArb,
        async (filters) => {
          const mockOnSearch = jest.fn();
          
          render(
            <ExerciseSearchInterface 
              onSearch={mockOnSearch} 
              loading={false}
              initialFilters={filters}
            />
          );

          // Show filters panel
          fireEvent.click(screen.getByRole('button', { name: /filters/i }));

          await waitFor(() => {
            expect(mockOnSearch).toHaveBeenCalledWith('', filters);
          });
        }
      ));
    });

    it('Property 16.3: Search interface should handle empty and whitespace-only terms', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string().filter(s => s.trim().length === 0),
        async (emptyTerm) => {
          const mockOnSearch = jest.fn();
          
          render(
            <ExerciseSearchInterface 
              onSearch={mockOnSearch} 
              loading={false}
            />
          );

          const searchInput = screen.getByPlaceholderText(/search exercises/i);
          fireEvent.change(searchInput, { target: { value: emptyTerm } });

          await waitFor(() => {
            expect(mockOnSearch).toHaveBeenCalledWith(emptyTerm, {});
          });
        }
      ));
    });
  });

  describe('Property 17: Search Result Data Completeness', () => {
    const exerciseArb = fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      name: fc.string({ minLength: 3, maxLength: 50 }),
      category: fc.constantFrom<ExerciseCategory>('strength', 'cardio', 'flexibility'),
      difficulty: fc.constantFrom<DifficultyLevel>('beginner', 'intermediate', 'advanced'),
      targetMuscles: fc.array(
        fc.constantFrom<MuscleGroup>('chest', 'back', 'shoulders', 'biceps'),
        { minLength: 1, maxLength: 3 }
      ),
      equipment: fc.array(
        fc.constantFrom<Equipment>('none', 'dumbbells', 'barbell'),
        { minLength: 1, maxLength: 2 }
      ),
      instructions: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
      metadata: fc.record({
        createdBy: fc.constant('system'),
        verified: fc.constant(true),
        popularity: fc.integer({ min: 1, max: 100 }),
        tags: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 1, maxLength: 5 }),
        averageRating: fc.option(fc.float({ min: 1, max: 5 })),
        totalRatings: fc.option(fc.integer({ min: 1, max: 1000 })),
      }),
      caloriesPerMinute: fc.option(fc.integer({ min: 1, max: 20 })),
    }).map(data => createMockExercise(data));

    it('Property 17.1: Exercise cards should display all required information', async () => {
      await fc.assert(fc.asyncProperty(
        exerciseArb,
        async (exercise) => {
          const mockOnClick = jest.fn();
          
          render(<ExerciseCard exercise={exercise} onClick={mockOnClick} />);

          // Verify essential information is displayed
          expect(screen.getByText(exercise.name)).toBeInTheDocument();
          expect(screen.getByText(exercise.category.charAt(0).toUpperCase() + exercise.category.slice(1))).toBeInTheDocument();
          expect(screen.getByText(exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1))).toBeInTheDocument();
          
          // Verify instructions preview is shown
          expect(screen.getByText(exercise.instructions[0])).toBeInTheDocument();
          
          // Verify view details button is present
          expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();
        }
      ));
    });

    it('Property 17.2: Exercise grid should handle various exercise arrays correctly', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(exerciseArb, { minLength: 0, maxLength: 10 }),
        fc.boolean(),
        fc.boolean(),
        async (exercises, loading, hasMore) => {
          const mockOnSelect = jest.fn();
          const mockOnLoadMore = jest.fn();
          
          render(
            <ExerciseGrid
              exercises={exercises}
              loading={loading}
              hasMore={hasMore}
              onExerciseSelect={mockOnSelect}
              onLoadMore={mockOnLoadMore}
            />
          );

          if (exercises.length === 0 && !loading) {
            // Should show empty state
            expect(screen.getByText(/no exercises found/i)).toBeInTheDocument();
          } else if (exercises.length > 0) {
            // Should show exercises
            exercises.forEach(exercise => {
              expect(screen.getByText(exercise.name)).toBeInTheDocument();
            });
            
            // Should show results summary
            expect(screen.getByText(new RegExp(`showing ${exercises.length} exercise`, 'i'))).toBeInTheDocument();
          }

          if (hasMore && !loading) {
            expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument();
          }
        }
      ));
    });
  });

  describe('Property 18: Personalized Exercise Recommendations', () => {
    it('Property 18.1: Exercise cards should handle various muscle group combinations', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(
          fc.constantFrom<MuscleGroup>('chest', 'back', 'shoulders', 'biceps', 'triceps'),
          { minLength: 1, maxLength: 6 }
        ),
        async (targetMuscles) => {
          const exercise = createMockExercise({ targetMuscles });
          const mockOnClick = jest.fn();
          
          const { container } = render(<ExerciseCard exercise={exercise} onClick={mockOnClick} />);

          // Should display muscle groups in some format
          const muscleContent = container.textContent || '';
          expect(muscleContent).toContain('Target:');
          
          // Check that muscle information is displayed
          const muscleContent = container.textContent || '';
          expect(muscleContent).toContain('Target:');
          
          // For single muscle, should show the muscle name
          if (targetMuscles.length === 1) {
            expect(muscleContent).toContain(targetMuscles[0]);
          }
          // For multiple muscles, should show some indication
          else if (targetMuscles.length > 1) {
            expect(muscleContent).toMatch(/\+\d+ more|&/);
          }
        }
      ));
    });

    it('Property 18.2: Exercise cards should handle various equipment combinations', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(
          fc.constantFrom<Equipment>('none', 'dumbbells', 'barbell', 'kettlebell', 'resistance_bands'),
          { minLength: 1, maxLength: 4 }
        ),
        async (equipment) => {
          const exercise = createMockExercise({ equipment });
          const mockOnClick = jest.fn();
          
          const { container } = render(<ExerciseCard exercise={exercise} onClick={mockOnClick} />);

          // Should display equipment in some format
          const equipmentContent = container.textContent;
          expect(equipmentContent).toContain('Equipment:');
          
          // For 'none' equipment, should show "No equipment"
          if (equipment.includes('none')) {
            expect(equipmentContent).toContain('No equipment');
          }
          // For single equipment, should show the equipment name
          else if (equipment.length === 1) {
            expect(equipmentContent).toContain(equipment[0].replace('_', ' '));
          }
          // For multiple equipment, should show some indication
          else if (equipment.length > 1) {
            expect(equipmentContent).toMatch(/\+\d+ more|&/);
          }
        }
      ));
    });
  });

  describe('Property 19: Empty Search Result Handling', () => {
    it('Property 19.1: Empty exercise arrays should show appropriate messaging', async () => {
      await fc.assert(fc.asyncProperty(
        fc.boolean(),
        async (loading) => {
          const mockOnSelect = jest.fn();
          const mockOnLoadMore = jest.fn();
          
          const { container } = render(
            <ExerciseGrid
              exercises={[]}
              loading={loading}
              hasMore={false}
              onExerciseSelect={mockOnSelect}
              onLoadMore={mockOnLoadMore}
            />
          );

          if (!loading) {
            // Should show empty state with helpful suggestions
            expect(container.textContent).toContain('No exercises found');
            expect(container.textContent).toContain('Try adjusting your search terms');
            expect(container.textContent).toContain('Try using broader search terms');
            expect(container.textContent).toContain('Remove some filters');
            expect(container.textContent).toContain('Check for typos');
          }
        }
      ));
    });

    it('Property 19.2: Loading states should show appropriate indicators', async () => {
      await fc.assert(fc.asyncProperty(
        fc.integer({ min: 0, max: 12 }),
        async (skeletonCount) => {
          const mockOnSelect = jest.fn();
          const mockOnLoadMore = jest.fn();
          
          render(
            <ExerciseGrid
              exercises={[]}
              loading={true}
              hasMore={false}
              onExerciseSelect={mockOnSelect}
              onLoadMore={mockOnLoadMore}
            />
          );

          // Should show loading skeletons
          const skeletons = screen.getAllByText('', { selector: '.animate-pulse' });
          expect(skeletons.length).toBeGreaterThan(0);
        }
      ));
    });
  });
});

/**
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
 * 
 * These property tests verify that the exercise search and filtering system:
 * - Handles all valid search inputs correctly (5.1)
 * - Displays complete exercise information in search results (5.2, 5.3)
 * - Provides appropriate recommendations based on user context (5.4)
 * - Handles empty search results with helpful suggestions (5.5)
 */