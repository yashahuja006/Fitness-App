import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';
import { useAuth } from '@/contexts/AuthContext';

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('LoginForm', () => {
  const mockSignIn = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnSwitchToRegister = jest.fn();
  const mockOnSwitchToReset = jest.fn();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      user: null,
      userProfile: null,
      loading: false,
      signUp: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      updateUserProfile: jest.fn(),
      createUserProfile: jest.fn(),
    });
    jest.clearAllMocks();
  });

  it('renders login form with all required fields', () => {
    render(<LoginForm />);
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
    expect(screen.getByText(/create an account/i)).toBeInTheDocument();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email address is required/i)).toBeInTheDocument();
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({} as any);
    
    render(<LoginForm onSuccess={mockOnSuccess} />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles authentication errors', async () => {
    const user = userEvent.setup();
    const authError = { code: 'auth/user-not-found', message: 'User not found' };
    mockSignIn.mockRejectedValue(authError);
    
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/no account found with this email address/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('calls switch handlers when links are clicked', async () => {
    const user = userEvent.setup();
    render(
      <LoginForm 
        onSwitchToRegister={mockOnSwitchToRegister}
        onSwitchToReset={mockOnSwitchToReset}
      />
    );
    
    await user.click(screen.getByText(/create an account/i));
    expect(mockOnSwitchToRegister).toHaveBeenCalled();
    
    await user.click(screen.getByText(/forgot your password/i));
    expect(mockOnSwitchToReset).toHaveBeenCalled();
  });

  it('clears error when user starts typing', async () => {
    const user = userEvent.setup();
    const authError = { code: 'auth/user-not-found', message: 'User not found' };
    mockSignIn.mockRejectedValue(authError);
    
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Trigger error
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/no account found with this email address/i)).toBeInTheDocument();
    });
    
    // Clear error by typing
    await user.type(emailInput, 'a');
    expect(screen.queryByText(/no account found with this email address/i)).not.toBeInTheDocument();
  });
});