import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../RegisterForm';
import { useAuth } from '@/contexts/AuthContext';

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('RegisterForm', () => {
  const mockSignUp = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnSwitchToLogin = jest.fn();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      signUp: mockSignUp,
      user: null,
      userProfile: null,
      loading: false,
      signIn: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      updateUserProfile: jest.fn(),
      createUserProfile: jest.fn(),
    });
    jest.clearAllMocks();
  });

  it('renders registration form with all required fields', () => {
    render(<RegisterForm />);
    
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('validates display name requirements', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/display name is required/i)).toBeInTheDocument();
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('validates display name minimum length', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    
    const displayNameInput = screen.getByLabelText(/display name/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await user.type(displayNameInput, 'a');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/display name must be at least 2 characters long/i)).toBeInTheDocument();
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    
    const displayNameInput = screen.getByLabelText(/display name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await user.type(displayNameInput, 'John Doe');
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('validates password strength requirements', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    
    const displayNameInput = screen.getByLabelText(/display name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await user.type(displayNameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'weakpass');
    await user.type(confirmPasswordInput, 'weakpass');
    await user.click(submitButton);
    
    expect(screen.getByText(/password must contain at least one uppercase letter, one lowercase letter, and one number/i)).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('validates password confirmation match', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    
    const displayNameInput = screen.getByLabelText(/display name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await user.type(displayNameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'StrongPass123');
    await user.type(confirmPasswordInput, 'DifferentPass123');
    await user.click(submitButton);
    
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({} as any);
    
    render(<RegisterForm onSuccess={mockOnSuccess} />);
    
    const displayNameInput = screen.getByLabelText(/display name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await user.type(displayNameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'StrongPass123');
    await user.type(confirmPasswordInput, 'StrongPass123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('john@example.com', 'StrongPass123', 'John Doe');
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles authentication errors', async () => {
    const user = userEvent.setup();
    const authError = { code: 'auth/email-already-in-use', message: 'Email already in use' };
    mockSignUp.mockRejectedValue(authError);
    
    render(<RegisterForm />);
    
    const displayNameInput = screen.getByLabelText(/display name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await user.type(displayNameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'StrongPass123');
    await user.type(confirmPasswordInput, 'StrongPass123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/an account with this email already exists/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<RegisterForm />);
    
    const displayNameInput = screen.getByLabelText(/display name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await user.type(displayNameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'StrongPass123');
    await user.type(confirmPasswordInput, 'StrongPass123');
    await user.click(submitButton);
    
    expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('calls switch to login handler', async () => {
    const user = userEvent.setup();
    render(<RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />);
    
    await user.click(screen.getByText(/already have an account/i));
    expect(mockOnSwitchToLogin).toHaveBeenCalled();
  });
});