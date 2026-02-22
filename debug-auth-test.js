// Simple debug test to check form validation
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const userEvent = require('@testing-library/user-event').default;
const React = require('react');

// Mock the useAuth hook
const mockSignIn = jest.fn();
jest.mock('./src/contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    user: null,
    userProfile: null,
    loading: false,
    signUp: jest.fn(),
    logout: jest.fn(),
    resetPassword: jest.fn(),
    updateUserProfile: jest.fn(),
    createUserProfile: jest.fn(),
  }),
}));

const { LoginForm } = require('./src/components/auth/LoginForm');

test('debug validation', async () => {
  const user = userEvent.setup();
  render(React.createElement(LoginForm));
  
  const submitButton = screen.getByRole('button', { name: /sign in/i });
  await user.click(submitButton);
  
  console.log('DOM after submit:', document.body.innerHTML);
  
  await waitFor(() => {
    const errorElement = screen.queryByText(/email address is required/i);
    console.log('Error element found:', errorElement);
    expect(errorElement).toBeInTheDocument();
  });
});