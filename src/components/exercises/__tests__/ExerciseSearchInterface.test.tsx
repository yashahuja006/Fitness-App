import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExerciseSearchInterface } from '../ExerciseSearchInterface';
import { ExerciseSearchFilters } from '@/types/exercise';

// Mock the useDebounce hook
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

describe('ExerciseSearchInterface', () => {
  const mockOnSearch = jest.fn();
  const defaultProps = {
    onSearch: mockOnSearch,
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input and filters button', () => {
    render(<ExerciseSearchInterface {...defaultProps} />);
    
    expect(screen.getByPlaceholderText(/search exercises/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
  });

  it('calls onSearch when search term changes', async () => {
    render(<ExerciseSearchInterface {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/search exercises/i);
    fireEvent.change(searchInput, { target: { value: 'push up' } });

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('push up', {});
    });
  });

  it('shows and hides filter panel when filters button is clicked', () => {
    render(<ExerciseSearchInterface {...defaultProps} />);
    
    const filtersButton = screen.getByRole('button', { name: /filters/i });
    
    // Initially filters should be hidden
    expect(screen.queryByText('Category')).not.toBeInTheDocument();
    
    // Click to show filters
    fireEvent.click(filtersButton);
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Difficulty')).toBeInTheDocument();
    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('Target Muscles')).toBeInTheDocument();
    
    // Click to hide filters
    fireEvent.click(filtersButton);
    expect(screen.queryByText('Category')).not.toBeInTheDocument();
  });

  it('applies category filter correctly', async () => {
    render(<ExerciseSearchInterface {...defaultProps} />);
    
    // Show filters
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    
    // Select strength category
    const categorySelect = screen.getByDisplayValue('All Categories');
    fireEvent.change(categorySelect, { target: { value: 'strength' } });

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('', { category: 'strength' });
    });
  });

  it('applies difficulty filter correctly', async () => {
    render(<ExerciseSearchInterface {...defaultProps} />);
    
    // Show filters
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    
    // Select beginner difficulty
    const difficultySelect = screen.getByDisplayValue('All Levels');
    fireEvent.change(difficultySelect, { target: { value: 'beginner' } });

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('', { difficulty: 'beginner' });
    });
  });

  it('applies equipment filters correctly', async () => {
    render(<ExerciseSearchInterface {...defaultProps} />);
    
    // Show filters
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    
    // Select dumbbells equipment
    const dumbbellsCheckbox = screen.getByLabelText('Dumbbells');
    fireEvent.click(dumbbellsCheckbox);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('', { equipment: ['dumbbells'] });
    });
  });

  it('applies muscle group filters correctly', async () => {
    render(<ExerciseSearchInterface {...defaultProps} />);
    
    // Show filters
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    
    // Select chest muscle group
    const chestCheckbox = screen.getByLabelText('Chest');
    fireEvent.click(chestCheckbox);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('', { targetMuscles: ['chest'] });
    });
  });

  it('shows active filter count badge', () => {
    const filtersWithCount: ExerciseSearchFilters = {
      category: 'strength',
      difficulty: 'beginner',
      equipment: ['dumbbells'],
    };

    render(
      <ExerciseSearchInterface 
        {...defaultProps} 
        initialFilters={filtersWithCount}
      />
    );
    
    const filtersButton = screen.getByRole('button', { name: /filters/i });
    expect(filtersButton).toHaveTextContent('3');
  });

  it('clears all filters when clear button is clicked', async () => {
    const filtersWithCount: ExerciseSearchFilters = {
      category: 'strength',
      difficulty: 'beginner',
    };

    render(
      <ExerciseSearchInterface 
        {...defaultProps} 
        initialFilters={filtersWithCount}
        initialSearchTerm="push up"
      />
    );
    
    // Show filters
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    
    // Click clear filters
    const clearButton = screen.getByRole('button', { name: /clear all filters/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('', {});
    });
  });

  it('displays search summary correctly', () => {
    render(
      <ExerciseSearchInterface 
        {...defaultProps} 
        initialSearchTerm="push up"
        initialFilters={{ category: 'strength' }}
      />
    );
    
    expect(screen.getByText(/searching for "push up"/i)).toBeInTheDocument();
    expect(screen.getByText(/with 1 filter applied/i)).toBeInTheDocument();
  });
});