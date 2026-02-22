import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProfileForm } from '../UserProfileForm';
import { useAuth } from '@/contexts/AuthContext';
import { validateUserProfile } from '@/utils/validation';

// Mock the auth context
jest.mock('@/contexts/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the validation utility
jest.mock('@/utils/validation');
const mockValidateUserProfile = validateUserProfile as jest.MockedFunction<typeof validateUserProfile>;

describe('UserProfileForm', () => {
  const mockUpdateUserProfile = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  const mockUserProfile = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    personalMetrics: {
      height: 175,
      weight: 70,
      age: 25,
      gender: 'male' as const,
      activityLevel: 'moderate' as const,
      fitnessGoals: ['Weight Loss', 'Muscle Gain'],
    },
    preferences: {
      units: 'metric' as const,
      theme: 'auto' as const,
      notifications: {
        workoutReminders: true,
        progressUpdates: true,
        socialUpdates: false,
        systemUpdates: true,
      },
      privacy: {
        profileVisibility: 'private' as const,
        shareProgress: false,
        shareWorkouts: false,
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-uid' } as any,
      userProfile: mockUserProfile,
      loading: false,
      signUp: jest.fn(),
      signIn: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      updateUserProfile: mockUpdateUserProfile,
      createUserProfile: jest.fn(),
    });

    mockValidateUserProfile.mockReturnValue({
      isValid: true,
      errors: [],
    });

    jest.clearAllMocks();
  });

  it('renders form with user profile data', () => {
    render(<UserProfileForm />);

    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('175')).toBeInTheDocument();
    expect(screen.getByDisplayValue('70')).toBeInTheDocument();
    expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    expect(screen.getByDisplayValue('male')).toBeInTheDocument();
    expect(screen.getByDisplayValue('moderate')).toBeInTheDocument();
  });

  it('shows validation errors when form is invalid', async () => {
    mockValidateUserProfile.mockReturnValue({
      isValid: false,
      errors: [
        { field: 'displayName', message: 'Display name is required' },
        { field: 'height', message: 'Height must be greater than 0' },
      ],
    });

    render(<UserProfileForm />);

    const submitButton = screen.getByRole('button', { name: /save profile/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please correct the errors below before submitting.')).toBeInTheDocument();
      expect(screen.getByText('Display name is required')).toBeInTheDocument();
      expect(screen.getByText('Height must be greater than 0')).toBeInTheDocument();
    });

    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    mockUpdateUserProfile.mockResolvedValue(undefined);

    render(<UserProfileForm onSuccess={mockOnSuccess} />);

    const displayNameInput = screen.getByLabelText(/display name/i);
    fireEvent.change(displayNameInput, { target: { value: 'Updated Name' } });

    const submitButton = screen.getByRole('button', { name: /save profile/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: 'Updated Name',
        })
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles form submission error', async () => {
    mockUpdateUserProfile.mockRejectedValue(new Error('Update failed'));

    render(<UserProfileForm />);

    const submitButton = screen.getByRole('button', { name: /save profile/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update profile. Please try again.')).toBeInTheDocument();
    });
  });

  it('updates fitness goals correctly', () => {
    render(<UserProfileForm />);

    const strengthGoal = screen.getByLabelText('Strength');
    fireEvent.click(strengthGoal);

    expect(strengthGoal).toBeChecked();
  });

  it('validates required fields', async () => {
    mockValidateUserProfile.mockReturnValue({
      isValid: false,
      errors: [
        { field: 'displayName', message: 'Display name is required' },
        { field: 'height', message: 'Height is required' },
        { field: 'weight', message: 'Weight is required' },
        { field: 'age', message: 'Age is required' },
        { field: 'gender', message: 'Gender is required' },
        { field: 'activityLevel', message: 'Activity level is required' },
        { field: 'fitnessGoals', message: 'At least one fitness goal is required' },
      ],
    });

    render(<UserProfileForm />);

    // Clear all form fields
    const displayNameInput = screen.getByLabelText(/display name/i);
    fireEvent.change(displayNameInput, { target: { value: '' } });

    const submitButton = screen.getByRole('button', { name: /save profile/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Display name is required')).toBeInTheDocument();
      expect(screen.getByText('Height is required')).toBeInTheDocument();
      expect(screen.getByText('Weight is required')).toBeInTheDocument();
      expect(screen.getByText('Age is required')).toBeInTheDocument();
      expect(screen.getByText('Gender is required')).toBeInTheDocument();
      expect(screen.getByText('Activity level is required')).toBeInTheDocument();
      expect(screen.getByText('At least one fitness goal is required')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    mockUpdateUserProfile.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<UserProfileForm />);

    const submitButton = screen.getByRole('button', { name: /save profile/i });
    fireEvent.click(submitButton);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('Save Profile')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<UserProfileForm onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('clears errors when user starts typing', async () => {
    mockValidateUserProfile.mockReturnValue({
      isValid: false,
      errors: [{ field: 'displayName', message: 'Display name is required' }],
    });

    render(<UserProfileForm />);

    const submitButton = screen.getByRole('button', { name: /save profile/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Display name is required')).toBeInTheDocument();
    });

    const displayNameInput = screen.getByLabelText(/display name/i);
    fireEvent.change(displayNameInput, { target: { value: 'New Name' } });

    expect(screen.queryByText('Display name is required')).not.toBeInTheDocument();
  });
});