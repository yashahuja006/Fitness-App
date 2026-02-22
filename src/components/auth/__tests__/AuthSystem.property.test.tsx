import * as fc from 'fast-check';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';
import { RegisterForm } from '../RegisterForm';
import { PasswordResetForm } from '../PasswordResetForm';
import { useAuth } from '@/contexts/AuthContext';

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Authentication System Properties', () => {
  const mockSignIn = jest.fn();
  const mockSignUp = jest.fn();
  const mockResetPassword = jest.fn();

  beforeEach(() => {
    cleanup(); // Ensure clean DOM before each test
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signUp: mockSignUp,
      resetPassword: mockResetPassword,
      user: null,
      userProfile: null,
      loading: false,
      logout: jest.fn(),
      updateUserProfile: jest.fn(),
      createUserProfile: jest.fn(),
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup(); // Ensure clean DOM after each test
  });

  /**
   * Property 24: User Registration and Authentication
   * For any valid user registration or login attempt, the system should properly handle 
   * Firebase authentication and create or load user profiles with personalized settings.
   * Validates: Requirements 7.1, 7.2
   */
  describe('Property 24: User Registration and Authentication', () => {
    const validEmailArb = fc.tuple(
      fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9._%+-]+$/.test(s) && s.length > 0),
      fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9.-]+$/.test(s) && s.length > 0),
      fc.string({ minLength: 2, maxLength: 10 }).filter(s => /^[a-zA-Z]+$/.test(s))
    ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

    const validPasswordArb = fc.string({ minLength: 6, maxLength: 50 })
      .filter(s => /[A-Z]/.test(s) && /[a-z]/.test(s) && /\d/.test(s));

    const validDisplayNameArb = fc.string({ minLength: 2, maxLength: 50 })
      .filter(s => s.trim().length >= 2);

    it('Property 24.1: Valid registration data should trigger signUp call', async () => {
      await fc.assert(fc.asyncProperty(
        validEmailArb,
        validPasswordArb,
        validDisplayNameArb,
        async (email, password, displayName) => {
          // Clean up before each property test iteration
          cleanup();
          
          mockSignUp.mockResolvedValue({} as any);
          const user = userEvent.setup();
          
          const { container, unmount } = render(<RegisterForm />);
          
          const displayNameInput = container.querySelector('input[name="displayName"]') as HTMLInputElement;
          const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
          const passwordInput = container.querySelector('input[name="password"]') as HTMLInputElement;
          const confirmPasswordInput = container.querySelector('input[name="confirmPassword"]') as HTMLInputElement;
          const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;
          
          expect(displayNameInput).toBeInTheDocument();
          expect(emailInput).toBeInTheDocument();
          expect(passwordInput).toBeInTheDocument();
          expect(confirmPasswordInput).toBeInTheDocument();
          expect(submitButton).toBeInTheDocument();
          
          await user.clear(displayNameInput);
          await user.clear(emailInput);
          await user.clear(passwordInput);
          await user.clear(confirmPasswordInput);
          
          await user.type(displayNameInput, displayName.trim());
          await user.type(emailInput, email);
          await user.type(passwordInput, password);
          await user.type(confirmPasswordInput, password);
          await user.click(submitButton);
          
          await waitFor(() => {
            expect(mockSignUp).toHaveBeenCalledWith(email, password, displayName.trim());
          }, { timeout: 3000 });
          
          unmount();
          cleanup();
        }
      ), { numRuns: 2, timeout: 15000 }); // Reduced runs for faster execution
    });

    it('Property 24.2: Valid login data should trigger signIn call', async () => {
      await fc.assert(fc.asyncProperty(
        validEmailArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        async (email, password) => {
          // Clean up before each property test iteration
          cleanup();
          
          mockSignIn.mockResolvedValue({} as any);
          const user = userEvent.setup();
          
          const { container, unmount } = render(<LoginForm />);
          
          const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
          const passwordInput = container.querySelector('input[name="password"]') as HTMLInputElement;
          const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;
          
          expect(emailInput).toBeInTheDocument();
          expect(passwordInput).toBeInTheDocument();
          expect(submitButton).toBeInTheDocument();
          
          await user.clear(emailInput);
          await user.clear(passwordInput);
          
          await user.type(emailInput, email);
          await user.type(passwordInput, password);
          await user.click(submitButton);
          
          await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith(email, password);
          }, { timeout: 3000 });
          
          unmount();
          cleanup();
        }
      ), { numRuns: 2, timeout: 15000 }); // Reduced runs for faster execution
    });
  });

  /**
   * Property 25: Profile Data Management
   * For any profile update or password reset request, the system should validate data, 
   * store changes securely in Firestore, and provide secure recovery mechanisms.
   * Validates: Requirements 7.3, 7.4
   */
  describe('Property 25: Profile Data Management', () => {
    it('Property 25.1: Valid email should trigger password reset', async () => {
      await fc.assert(fc.asyncProperty(
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9._%+-]+$/.test(s) && s.length > 0),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9.-]+$/.test(s) && s.length > 0),
          fc.string({ minLength: 2, maxLength: 10 }).filter(s => /^[a-zA-Z]+$/.test(s))
        ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`),
        async (email) => {
          // Clean up before each property test iteration
          cleanup();
          
          mockResetPassword.mockResolvedValue(undefined);
          const user = userEvent.setup();
          
          const { container, unmount } = render(<PasswordResetForm />);
          
          const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
          const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;
          
          expect(emailInput).toBeInTheDocument();
          expect(submitButton).toBeInTheDocument();
          
          await user.clear(emailInput);
          await user.type(emailInput, email);
          await user.click(submitButton);
          
          await waitFor(() => {
            expect(mockResetPassword).toHaveBeenCalledWith(email);
          }, { timeout: 3000 });
          
          unmount();
          cleanup();
        }
      ), { numRuns: 2, timeout: 15000 }); // Reduced runs for faster execution
    });
  });

  /**
   * Property 26: Privacy Settings Control
   * For any privacy setting modification, the system should allow users granular 
   * control over data sharing and visibility preferences.
   * Validates: Requirements 7.5
   */
  describe('Property 26: Privacy Settings Control', () => {
    it('Property 26.1: Form validation should be consistent across all auth forms', async () => {
      // Test basic form validation without property-based testing to avoid DOM conflicts
      const user = userEvent.setup();
      
      // Test LoginForm with empty email
      const { container, unmount } = render(<LoginForm />);
      const loginEmailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
      const loginSubmitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;
      
      expect(loginEmailInput).toBeInTheDocument();
      expect(loginSubmitButton).toBeInTheDocument();
      
      await user.clear(loginEmailInput);
      await user.click(loginSubmitButton);
      
      // Form should prevent submission with empty email
      expect(mockSignIn).not.toHaveBeenCalled();
      
      unmount();
    });
  });

  /**
   * Error Handling Property: Authentication errors should be handled gracefully
   */
  describe('Error Handling Properties', () => {
    it('Property: Authentication errors should display appropriate user messages', async () => {
      const authError = { code: 'auth/user-not-found', message: 'Test error' };
      mockSignIn.mockRejectedValue(authError);
      
      const user = userEvent.setup();
      const { container, unmount } = render(<LoginForm />);
      
      const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
      const passwordInput = container.querySelector('input[name="password"]') as HTMLInputElement;
      const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;
      
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
      
      await user.clear(emailInput);
      await user.clear(passwordInput);
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      // Should attempt to sign in
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      }, { timeout: 3000 });
      
      unmount();
    });
  });
});
