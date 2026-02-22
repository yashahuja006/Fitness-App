import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordResetForm } from '../PasswordResetForm';
import { useAuth } from '@/contexts/AuthContext';

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('PasswordResetForm', () => {
  const mockResetPassword = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnSwitchToLogin = jest.fn();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      resetPassword: mockResetPassword,
      user: null,
      userProfile: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      logout: jest.fn(),
      updateUserProfile: jest.fn(),
      createUserProfile: jest.fn(),
    });
    jest.clearAllMocks();
  });

  it('renders password reset form with all required elements', () => {
    render(<PasswordResetForm />);
    
    expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset email/i })).toBeInTheDocument();
    expect(screen.getByText(/back to sign in/i)).toBeInTheDocument();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<PasswordResetForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('validates required email field', async () => {
    const user = userEvent.setup();
    render(<PasswordResetForm />);
    
    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email address is required/i)).toBeInTheDocument();
    });
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('submits form with valid email', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue(undefined);
    
    render(<PasswordResetForm onSuccess={mockOnSuccess} />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('shows success message after successful submission', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue(undefined);
    
    render(<PasswordResetForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/reset email sent!/i)).toBeInTheDocument();
      expect(screen.getByText(/check your email for instructions/i)).toBeInTheDocument();
    });
  });

  it('handles authentication errors', async () => {
    const user = userEvent.setup();
    const authError = { code: 'auth/user-not-found', message: 'User not found' };
    mockResetPassword.mockRejectedValue(authError);
    
    render(<PasswordResetForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/no account found with this email address/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<PasswordResetForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    expect(screen.getByText(/sending/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('calls switch to login handler', async () => {
    const user = userEvent.setup();
    render(<PasswordResetForm onSwitchToLogin={mockOnSwitchToLogin} />);
    
    await user.click(screen.getByText(/back to sign in/i));
    expect(mockOnSwitchToLogin).toHaveBeenCalled();
  });

  it('calls switch to login handler from success state', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue(undefined);
    
    render(<PasswordResetForm onSwitchToLogin={mockOnSwitchToLogin} />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/reset email sent!/i)).toBeInTheDocument();
    });
    
    await user.click(screen.getByText(/back to sign in/i));
    expect(mockOnSwitchToLogin).toHaveBeenCalled();
  });

  it('clears error when user starts typing', async () => {
    const user = userEvent.setup();
    const authError = { code: 'auth/user-not-found', message: 'User not found' };
    mockResetPassword.mockRejectedValue(authError);
    
    render(<PasswordResetForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset email/i });
    
    // Trigger error
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/no account found with this email address/i)).toBeInTheDocument();
    });
    
    // Clear error by typing
    await user.type(emailInput, 'a');
    expect(screen.queryByText(/no account found with this email address/i)).not.toBeInTheDocument();
  });
});