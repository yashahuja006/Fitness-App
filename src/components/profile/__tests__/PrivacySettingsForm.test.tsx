import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PrivacySettingsForm } from '../PrivacySettingsForm';
import { useAuth } from '@/contexts/AuthContext';

// Mock the auth context
jest.mock('@/contexts/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('PrivacySettingsForm', () => {
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
      fitnessGoals: ['Weight Loss'],
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

    jest.clearAllMocks();
  });

  it('renders privacy settings form with current values', () => {
    render(<PrivacySettingsForm />);

    expect(screen.getByDisplayValue('private')).toBeInTheDocument();
    expect(screen.getByLabelText(/share progress data/i)).not.toBeChecked();
    expect(screen.getByLabelText(/share workout details/i)).not.toBeChecked();
    expect(screen.getByLabelText(/workout reminders/i)).toBeChecked();
    expect(screen.getByLabelText(/progress updates/i)).toBeChecked();
    expect(screen.getByLabelText(/social updates/i)).not.toBeChecked();
    expect(screen.getByLabelText(/system updates/i)).toBeChecked();
  });

  it('updates privacy settings when form is submitted', async () => {
    mockUpdateUserProfile.mockResolvedValue(undefined);

    render(<PrivacySettingsForm onSuccess={mockOnSuccess} />);

    // Change profile visibility
    const profileVisibility = screen.getByLabelText(/profile visibility/i);
    fireEvent.change(profileVisibility, { target: { value: 'public' } });

    // Toggle share progress
    const shareProgress = screen.getByLabelText(/share progress data/i);
    fireEvent.click(shareProgress);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save privacy settings/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({
        preferences: {
          ...mockUserProfile.preferences,
          privacy: {
            profileVisibility: 'public',
            shareProgress: true,
            shareWorkouts: false,
          },
          notifications: mockUserProfile.preferences.notifications,
        },
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('updates notification settings', async () => {
    mockUpdateUserProfile.mockResolvedValue(undefined);

    render(<PrivacySettingsForm />);

    // Toggle workout reminders
    const workoutReminders = screen.getByLabelText(/workout reminders/i);
    fireEvent.click(workoutReminders);

    // Toggle social updates
    const socialUpdates = screen.getByLabelText(/social updates/i);
    fireEvent.click(socialUpdates);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save privacy settings/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({
        preferences: {
          ...mockUserProfile.preferences,
          privacy: mockUserProfile.preferences.privacy,
          notifications: {
            workoutReminders: false,
            progressUpdates: true,
            socialUpdates: true,
            systemUpdates: true,
          },
        },
      });
    });
  });

  it('shows success message after successful update', async () => {
    mockUpdateUserProfile.mockResolvedValue(undefined);

    render(<PrivacySettingsForm />);

    const submitButton = screen.getByRole('button', { name: /save privacy settings/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Privacy settings updated successfully!')).toBeInTheDocument();
    });
  });

  it('shows error message when update fails', async () => {
    mockUpdateUserProfile.mockRejectedValue(new Error('Update failed'));

    render(<PrivacySettingsForm />);

    const submitButton = screen.getByRole('button', { name: /save privacy settings/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update privacy settings. Please try again.')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    mockUpdateUserProfile.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<PrivacySettingsForm />);

    const submitButton = screen.getByRole('button', { name: /save privacy settings/i });
    fireEvent.click(submitButton);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('Save Privacy Settings')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<PrivacySettingsForm onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('clears messages when user makes changes', async () => {
    mockUpdateUserProfile.mockRejectedValue(new Error('Update failed'));

    render(<PrivacySettingsForm />);

    // Submit to generate error
    const submitButton = screen.getByRole('button', { name: /save privacy settings/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update privacy settings. Please try again.')).toBeInTheDocument();
    });

    // Make a change to clear error
    const shareProgress = screen.getByLabelText(/share progress data/i);
    fireEvent.click(shareProgress);

    expect(screen.queryByText('Failed to update privacy settings. Please try again.')).not.toBeInTheDocument();
  });

  it('handles missing user profile gracefully', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-uid' } as any,
      userProfile: null,
      loading: false,
      signUp: jest.fn(),
      signIn: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      updateUserProfile: mockUpdateUserProfile,
      createUserProfile: jest.fn(),
    });

    render(<PrivacySettingsForm />);

    // Should render with default values
    expect(screen.getByDisplayValue('private')).toBeInTheDocument();
    expect(screen.getByLabelText(/workout reminders/i)).toBeChecked();
  });

  it('displays data privacy notice', () => {
    render(<PrivacySettingsForm />);

    expect(screen.getByText('Data Privacy Notice')).toBeInTheDocument();
    expect(screen.getByText(/Your fitness data is encrypted and stored securely/)).toBeInTheDocument();
  });

  it('has proper form structure and labels', () => {
    render(<PrivacySettingsForm />);

    // Check section headers
    expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
    expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    expect(screen.getByText('Data Management')).toBeInTheDocument();

    // Check form controls
    expect(screen.getByLabelText(/profile visibility/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/share progress data/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/share workout details/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/workout reminders/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/progress updates/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/social updates/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/system updates/i)).toBeInTheDocument();
  });
});