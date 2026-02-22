import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseCard } from '../ExerciseCard';
import { createMockExercise } from '@/__tests__/utils/mocks';

describe('ExerciseCard', () => {
  const mockOnClick = jest.fn();
  const mockExercise = createMockExercise({
    name: 'Push-Up',
    category: 'strength',
    difficulty: 'beginner',
    targetMuscles: ['chest', 'triceps'],
    equipment: ['none'],
    instructions: ['Start in plank position', 'Lower body to ground'],
    metadata: {
      createdBy: 'system',
      verified: true,
      popularity: 95,
      tags: ['bodyweight', 'upper-body'],
      averageRating: 4.8,
      totalRatings: 1250,
    },
    caloriesPerMinute: 7,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders exercise information correctly', () => {
    render(<ExerciseCard exercise={mockExercise} onClick={mockOnClick} />);
    
    expect(screen.getByText('Push-Up')).toBeInTheDocument();
    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText(/chest & triceps/i)).toBeInTheDocument();
    expect(screen.getByText(/no equipment/i)).toBeInTheDocument();
    expect(screen.getByText('7/min')).toBeInTheDocument();
  });

  it('displays rating and popularity correctly', () => {
    render(<ExerciseCard exercise={mockExercise} onClick={mockOnClick} />);
    
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
  });

  it('shows instruction preview', () => {
    render(<ExerciseCard exercise={mockExercise} onClick={mockOnClick} />);
    
    expect(screen.getByText('Start in plank position')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    render(<ExerciseCard exercise={mockExercise} onClick={mockOnClick} />);
    
    const card = screen.getByRole('button', { name: /view details/i }).closest('div');
    if (card?.parentElement) {
      fireEvent.click(card.parentElement);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onClick when view details button is clicked', () => {
    render(<ExerciseCard exercise={mockExercise} onClick={mockOnClick} />);
    
    const viewDetailsButton = screen.getByRole('button', { name: /view details/i });
    fireEvent.click(viewDetailsButton);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('formats multiple muscle groups correctly', () => {
    const exerciseWithManyMuscles = createMockExercise({
      targetMuscles: ['chest', 'triceps', 'shoulders', 'core'],
    });

    render(<ExerciseCard exercise={exerciseWithManyMuscles} onClick={mockOnClick} />);
    
    expect(screen.getByText(/chest \+3 more/i)).toBeInTheDocument();
  });

  it('formats multiple equipment correctly', () => {
    const exerciseWithManyEquipment = createMockExercise({
      equipment: ['dumbbells', 'bench', 'resistance_bands'],
    });

    render(<ExerciseCard exercise={exerciseWithManyEquipment} onClick={mockOnClick} />);
    
    expect(screen.getByText(/dumbbells \+2 more/i)).toBeInTheDocument();
  });

  it('handles exercise without rating gracefully', () => {
    const exerciseWithoutRating = createMockExercise({
      metadata: {
        ...mockExercise.metadata,
        averageRating: undefined,
        totalRatings: undefined,
      },
    });

    render(<ExerciseCard exercise={exerciseWithoutRating} onClick={mockOnClick} />);
    
    expect(screen.queryByText('★')).not.toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument(); // popularity should still show
  });

  it('handles exercise without calories per minute', () => {
    const exerciseWithoutCalories = createMockExercise({
      caloriesPerMinute: undefined,
    });

    render(<ExerciseCard exercise={exerciseWithoutCalories} onClick={mockOnClick} />);
    
    expect(screen.queryByText(/\/min/)).not.toBeInTheDocument();
  });

  it('applies correct difficulty color classes', () => {
    const { rerender } = render(<ExerciseCard exercise={mockExercise} onClick={mockOnClick} />);
    
    // Beginner should have green styling
    expect(screen.getByText('Beginner')).toHaveClass('bg-green-100', 'text-green-800');
    
    // Test intermediate
    const intermediateExercise = createMockExercise({ difficulty: 'intermediate' });
    rerender(<ExerciseCard exercise={intermediateExercise} onClick={mockOnClick} />);
    expect(screen.getByText('Intermediate')).toHaveClass('bg-yellow-100', 'text-yellow-800');
    
    // Test advanced
    const advancedExercise = createMockExercise({ difficulty: 'advanced' });
    rerender(<ExerciseCard exercise={advancedExercise} onClick={mockOnClick} />);
    expect(screen.getByText('Advanced')).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('applies correct category color classes', () => {
    render(<ExerciseCard exercise={mockExercise} onClick={mockOnClick} />);
    
    expect(screen.getByText('Strength')).toHaveClass('bg-blue-100', 'text-blue-800');
  });
});