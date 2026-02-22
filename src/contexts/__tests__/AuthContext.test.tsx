import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import * as firebaseAuth from 'firebase/auth';
import * as firestore from 'firebase/firestore';

// Mock Firebase modules
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
}));

const mockFirebaseAuth = firebaseAuth as jest.Mocked<typeof firebaseAuth>;
const mockFirestore = firestore as jest.Mocked<typeof firestore>;

// Test component to access auth context
const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="user">{auth.user ? auth.user.email : 'null'}</div>
      <div data-testid="loading">{auth.loading.toString()}</div>
      <div data-testid="profile">{auth.userProfile ? auth.userProfile.displayName : 'null'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
  } as any;

  const mockUserProfile = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    personalMetrics: {
      height: 175,
      weight: 70,
      age: 30,
      gender: 'male' as const,
      activityLevel: 'moderate' as const,
      fitnessGoals: ['weight_loss'],
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
    jest.clearAllMocks();
    
    // Mock Firestore functions
    mockFirestore.doc.mockReturnValue({} as any);
    mockFirestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        ...mockUserProfile,
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
      }),
    } as any);
    mockFirestore.setDoc.mockResolvedValue(undefined);
    mockFirestore.updateDoc.mockResolvedValue(undefined);
  });

  it('provides authentication context to children', async () => {
    const mockUnsubscribe = jest.fn();
    mockFirebaseAuth.onAuthStateChanged.mockReturnValue(mockUnsubscribe);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    expect(screen.getByTestId('profile')).toHaveTextContent('null');
  });

  it('updates context when user signs in', async () => {
    const mockUnsubscribe = jest.fn();
    let authStateCallback: (user: any) => void;
    
    mockFirebaseAuth.onAuthStateChanged.mockImplementation((auth, callback) => {
      authStateCallback = callback;
      return mockUnsubscribe;
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Simulate user sign in
    await act(async () => {
      authStateCallback(mockUser);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('profile')).toHaveTextContent('Test User');
    });
  });

  it('creates user profile when user signs up', async () => {
    mockFirebaseAuth.createUserWithEmailAndPassword.mockResolvedValue({
      user: mockUser,
    } as any);
    mockFirebaseAuth.updateProfile.mockResolvedValue(undefined);

    const TestSignUpComponent = () => {
      const { signUp } = useAuth();
      return (
        <button onClick={() => signUp('test@example.com', 'password123', 'Test User')}>
          Sign Up
        </button>
      );
    };

    render(
      <AuthProvider>
        <TestSignUpComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Sign Up').click();
    });

    await waitFor(() => {
      expect(mockFirebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        'test@example.com',
        'password123'
      );
      expect(mockFirebaseAuth.updateProfile).toHaveBeenCalledWith(mockUser, {
        displayName: 'Test User',
      });
      expect(mockFirestore.setDoc).toHaveBeenCalled();
    });
  });

  it('signs in existing user', async () => {
    mockFirebaseAuth.signInWithEmailAndPassword.mockResolvedValue({
      user: mockUser,
    } as any);

    const TestSignInComponent = () => {
      const { signIn } = useAuth();
      return (
        <button onClick={() => signIn('test@example.com', 'password123')}>
          Sign In
        </button>
      );
    };

    render(
      <AuthProvider>
        <TestSignInComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Sign In').click();
    });

    await waitFor(() => {
      expect(mockFirebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        'test@example.com',
        'password123'
      );
    });
  });

  it('sends password reset email', async () => {
    mockFirebaseAuth.sendPasswordResetEmail.mockResolvedValue(undefined);

    const TestResetComponent = () => {
      const { resetPassword } = useAuth();
      return (
        <button onClick={() => resetPassword('test@example.com')}>
          Reset Password
        </button>
      );
    };

    render(
      <AuthProvider>
        <TestResetComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Reset Password').click();
    });

    await waitFor(() => {
      expect(mockFirebaseAuth.sendPasswordResetEmail).toHaveBeenCalledWith(
        {},
        'test@example.com'
      );
    });
  });

  it('signs out user', async () => {
    mockFirebaseAuth.signOut.mockResolvedValue(undefined);

    const TestSignOutComponent = () => {
      const { logout } = useAuth();
      return (
        <button onClick={() => logout()}>
          Sign Out
        </button>
      );
    };

    render(
      <AuthProvider>
        <TestSignOutComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Sign Out').click();
    });

    await waitFor(() => {
      expect(mockFirebaseAuth.signOut).toHaveBeenCalledWith({});
    });
  });

  it('updates user profile', async () => {
    const mockUnsubscribe = jest.fn();
    let authStateCallback: (user: any) => void;
    
    mockFirebaseAuth.onAuthStateChanged.mockImplementation((auth, callback) => {
      authStateCallback = callback;
      return mockUnsubscribe;
    });

    const TestUpdateComponent = () => {
      const { updateUserProfile } = useAuth();
      return (
        <button onClick={() => updateUserProfile({ displayName: 'Updated Name' })}>
          Update Profile
        </button>
      );
    };

    render(
      <AuthProvider>
        <TestUpdateComponent />
      </AuthProvider>
    );

    // Set up authenticated user
    await act(async () => {
      authStateCallback(mockUser);
    });

    await act(async () => {
      screen.getByText('Update Profile').click();
    });

    await waitFor(() => {
      expect(mockFirestore.updateDoc).toHaveBeenCalled();
    });
  });

  it('throws error when useAuth is used outside provider', () => {
    const TestComponent = () => {
      useAuth();
      return null;
    };

    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );

    consoleSpy.mockRestore();
  });

  it('creates default profile when user profile does not exist', async () => {
    const mockUnsubscribe = jest.fn();
    let authStateCallback: (user: any) => void;
    
    mockFirebaseAuth.onAuthStateChanged.mockImplementation((auth, callback) => {
      authStateCallback = callback;
      return mockUnsubscribe;
    });

    // Mock profile not existing
    mockFirestore.getDoc.mockResolvedValue({
      exists: () => false,
    } as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Simulate user sign in
    await act(async () => {
      authStateCallback(mockUser);
    });

    await waitFor(() => {
      expect(mockFirestore.setDoc).toHaveBeenCalled();
    });
  });
});