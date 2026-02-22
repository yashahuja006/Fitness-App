import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import * as firebaseAuth from 'firebase/auth';
import * as firestore from 'firebase/firestore';
import * as fc from 'fast-check';

// Mock Firebase modules
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
}));

const mockFirebaseAuth = firebaseAuth as jest.Mocked<typeof firebaseAuth>;
const mockFirestore = firestore as jest.Mocked<typeof firestore>;

// Property-based test generators with safer constraints
const safeEmailArbitrary = fc.string({ minLength: 3, maxLength: 20 })
  .map(s => s.replace(/[^a-zA-Z0-9]/g, 'a'))
  .filter(s => s.length >= 3)
  .map(s => `${s}@example.com`);

const safePasswordArbitrary = fc.string({ minLength: 6, maxLength: 20 })
  .map(s => s.replace(/[^a-zA-Z0-9]/g, 'A'))
  .filter(s => s.length >= 6);

const safeDisplayNameArbitrary = fc.string({ minLength: 1, maxLength: 20 })
  .map(s => s.replace(/[^a-zA-Z0-9 ]/g, 'A'))
  .filter(s => s.trim().length >= 1);

const validUserDataArbitrary = fc.record({
  email: safeEmailArbitrary,
  password: safePasswordArbitrary,
  displayName: safeDisplayNameArbitrary,
});

const safeFirebaseUserArbitrary = fc.record({
  uid: fc.string({ minLength: 10, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z0-9]/g, 'u')),
  email: safeEmailArbitrary,
  displayName: fc.option(safeDisplayNameArbitrary, { nil: null }),
  photoURL: fc.option(fc.constant('https://example.com/photo.jpg'), { nil: null }),
});

describe('AuthContext Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Firestore functions
    mockFirestore.doc.mockReturnValue({} as any);
    mockFirestore.getDoc.mockResolvedValue({
      exists: () => false,
    } as any);
    mockFirestore.setDoc.mockResolvedValue(undefined);
    mockFirestore.updateDoc.mockResolvedValue(undefined);
  });

  /**
   * **Validates: Requirements 7.1, 7.2**
   * Property 24: User Registration and Authentication
   * 
   * For any valid user registration data (email, password, displayName),
   * the system should successfully create a Firebase user account,
   * update the user's profile, and create a corresponding user profile in Firestore.
   */
  it('Property: User registration creates valid user accounts and profiles', async () => {
    await fc.assert(
      fc.asyncProperty(validUserDataArbitrary, async (userData) => {
        // Arrange
        const mockUser = {
          uid: `user-${userData.email.split('@')[0]}`,
          email: userData.email,
          displayName: userData.displayName,
          photoURL: null,
        };

        mockFirebaseAuth.createUserWithEmailAndPassword.mockResolvedValue({
          user: mockUser,
        } as any);
        mockFirebaseAuth.updateProfile.mockResolvedValue(undefined);

        const mockUnsubscribe = jest.fn();
        mockFirebaseAuth.onAuthStateChanged.mockReturnValue(mockUnsubscribe);

        // Create a test component that captures the auth context
        let capturedAuth: any = null;
        const TestComponent = () => {
          capturedAuth = useAuth();
          return null;
        };

        // Act
        const { unmount } = render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );

        // Wait for initial auth state
        await waitFor(() => {
          expect(capturedAuth).not.toBeNull();
        });

        let signUpResult: any = null;
        let signUpError: any = null;

        await act(async () => {
          try {
            signUpResult = await capturedAuth.signUp(
              userData.email,
              userData.password,
              userData.displayName
            );
          } catch (error) {
            signUpError = error;
          }
        });

        // Assert
        expect(signUpError).toBeNull();
        expect(signUpResult).toBeDefined();
        expect(signUpResult.uid).toBe(mockUser.uid);
        expect(signUpResult.email).toBe(userData.email);

        // Verify Firebase Auth calls
        expect(mockFirebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
          {},
          userData.email,
          userData.password
        );
        expect(mockFirebaseAuth.updateProfile).toHaveBeenCalledWith(mockUser, {
          displayName: userData.displayName,
        });

        // Verify Firestore profile creation
        expect(mockFirestore.setDoc).toHaveBeenCalled();
        const setDocCall = mockFirestore.setDoc.mock.calls[0];
        const profileData = setDocCall[1];
        
        // The profile should contain valid structure
        expect(typeof profileData.email).toBe('string');
        expect(typeof profileData.displayName).toBe('string');
        expect(profileData.personalMetrics).toBeDefined();
        expect(profileData.preferences).toBeDefined();
        expect(profileData.createdAt).toBeInstanceOf(Date);
        expect(profileData.updatedAt).toBeInstanceOf(Date);

        unmount();
      }),
      { numRuns: 15 }
    );
  });

  /**
   * **Validates: Requirements 7.1, 7.2**
   * Property 24: User Registration and Authentication
   * 
   * For any valid user credentials (email, password),
   * the system should successfully authenticate the user
   * and load their profile from Firestore.
   */
  it('Property: User authentication loads existing user profiles', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: safeEmailArbitrary,
          password: safePasswordArbitrary,
        }),
        safeFirebaseUserArbitrary,
        async (credentials, mockUser) => {
          // Arrange
          const mockUserProfile = {
            uid: mockUser.uid,
            email: mockUser.email,
            displayName: mockUser.displayName || 'Test User',
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

          mockFirebaseAuth.signInWithEmailAndPassword.mockResolvedValue({
            user: mockUser,
          } as any);

          mockFirestore.getDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({
              ...mockUserProfile,
              createdAt: { toDate: () => mockUserProfile.createdAt },
              updatedAt: { toDate: () => mockUserProfile.updatedAt },
            }),
          } as any);

          const mockUnsubscribe = jest.fn();
          mockFirebaseAuth.onAuthStateChanged.mockReturnValue(mockUnsubscribe);

          // Create a test component that captures the auth context
          let capturedAuth: any = null;
          const TestComponent = () => {
            capturedAuth = useAuth();
            return null;
          };

          // Act
          const { unmount } = render(
            <AuthProvider>
              <TestComponent />
            </AuthProvider>
          );

          // Wait for initial auth state
          await waitFor(() => {
            expect(capturedAuth).not.toBeNull();
          });

          let signInResult: any = null;
          let signInError: any = null;

          await act(async () => {
            try {
              signInResult = await capturedAuth.signIn(
                credentials.email,
                credentials.password
              );
            } catch (error) {
              signInError = error;
            }
          });

          // Assert
          expect(signInError).toBeNull();
          expect(signInResult).toBeDefined();
          expect(signInResult.uid).toBe(mockUser.uid);

          // Verify Firebase Auth calls
          expect(mockFirebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
            {},
            credentials.email,
            credentials.password
          );

          unmount();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 7.1, 7.2**
   * Property 24: User Registration and Authentication
   * 
   * For any authenticated user, the system should maintain
   * authentication state consistency and provide access to
   * user profile data.
   */
  it('Property: Authentication state consistency is maintained', async () => {
    await fc.assert(
      fc.asyncProperty(safeFirebaseUserArbitrary, async (mockUser) => {
        // Arrange
        const mockUnsubscribe = jest.fn();
        let authStateCallback: (user: any) => void;
        
        mockFirebaseAuth.onAuthStateChanged.mockImplementation((auth, callback) => {
          authStateCallback = callback;
          return mockUnsubscribe;
        });

        // Create a test component that captures the auth context
        let capturedAuth: any = null;
        const TestComponent = () => {
          capturedAuth = useAuth();
          return null;
        };

        // Act
        const { unmount } = render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );

        // Wait for initial state
        await waitFor(() => {
          expect(capturedAuth).not.toBeNull();
        });

        // Initially no user
        expect(capturedAuth.user).toBeNull();
        expect(capturedAuth.userProfile).toBeNull();

        // Simulate user sign in
        await act(async () => {
          authStateCallback!(mockUser);
        });

        await waitFor(() => {
          expect(capturedAuth.loading).toBe(false);
        });

        // Assert authenticated state
        expect(capturedAuth.user).toBeTruthy();
        expect(capturedAuth.user.uid).toBe(mockUser.uid);
        expect(capturedAuth.user.email).toBe(mockUser.email);

        // Simulate user sign out
        await act(async () => {
          authStateCallback!(null);
        });

        await waitFor(() => {
          expect(capturedAuth.loading).toBe(false);
        });

        // Assert unauthenticated state
        expect(capturedAuth.user).toBeNull();
        expect(capturedAuth.userProfile).toBeNull();

        unmount();
      }),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 7.1, 7.2**
   * Property 24: User Registration and Authentication
   * 
   * For any user without an existing profile, the system should
   * automatically create a default profile with valid structure
   * and required fields.
   */
  it('Property: Default profiles are created for users without existing profiles', async () => {
    await fc.assert(
      fc.asyncProperty(safeFirebaseUserArbitrary, async (mockUser) => {
        // Arrange
        mockFirestore.getDoc.mockResolvedValue({
          exists: () => false, // No existing profile
        } as any);

        const mockUnsubscribe = jest.fn();
        let authStateCallback: (user: any) => void;
        
        mockFirebaseAuth.onAuthStateChanged.mockImplementation((auth, callback) => {
          authStateCallback = callback;
          return mockUnsubscribe;
        });

        // Create a test component that captures the auth context
        let capturedAuth: any = null;
        const TestComponent = () => {
          capturedAuth = useAuth();
          return null;
        };

        // Act
        const { unmount } = render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );

        // Wait for initial state
        await waitFor(() => {
          expect(capturedAuth).not.toBeNull();
        });

        // Simulate user sign in without existing profile
        await act(async () => {
          authStateCallback!(mockUser);
        });

        await waitFor(() => {
          expect(capturedAuth.loading).toBe(false);
        });

        // Assert
        expect(mockFirestore.setDoc).toHaveBeenCalled();
        
        const setDocCall = mockFirestore.setDoc.mock.calls[0];
        const profileData = setDocCall[1];
        
        // Verify default profile structure has required fields
        expect(typeof profileData.email).toBe('string');
        expect(typeof profileData.displayName).toBe('string');
        
        // Verify required personal metrics structure
        expect(profileData.personalMetrics).toBeDefined();
        expect(typeof profileData.personalMetrics.height).toBe('number');
        expect(typeof profileData.personalMetrics.weight).toBe('number');
        expect(typeof profileData.personalMetrics.age).toBe('number');
        expect(['male', 'female', 'other']).toContain(profileData.personalMetrics.gender);
        expect(['sedentary', 'light', 'moderate', 'active', 'very_active']).toContain(profileData.personalMetrics.activityLevel);
        expect(Array.isArray(profileData.personalMetrics.fitnessGoals)).toBe(true);
        
        // Verify required preferences structure
        expect(profileData.preferences).toBeDefined();
        expect(['metric', 'imperial']).toContain(profileData.preferences.units);
        expect(['light', 'dark', 'auto']).toContain(profileData.preferences.theme);
        expect(profileData.preferences.notifications).toBeDefined();
        expect(profileData.preferences.privacy).toBeDefined();
        
        // Verify timestamps
        expect(profileData.createdAt).toBeInstanceOf(Date);
        expect(profileData.updatedAt).toBeInstanceOf(Date);

        unmount();
      }),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Requirements 7.1, 7.2**
   * Property 24: User Registration and Authentication
   * 
   * For any password reset request with a valid email,
   * the system should successfully send a password reset email
   * through Firebase Auth.
   */
  it('Property: Password reset functionality works for valid emails', async () => {
    await fc.assert(
      fc.asyncProperty(safeEmailArbitrary, async (email) => {
        // Arrange
        mockFirebaseAuth.sendPasswordResetEmail.mockResolvedValue(undefined);

        const mockUnsubscribe = jest.fn();
        mockFirebaseAuth.onAuthStateChanged.mockReturnValue(mockUnsubscribe);

        // Create a test component that captures the auth context
        let capturedAuth: any = null;
        const TestComponent = () => {
          capturedAuth = useAuth();
          return null;
        };

        // Act
        const { unmount } = render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );

        // Wait for initial state
        await waitFor(() => {
          expect(capturedAuth).not.toBeNull();
        });

        let resetError: any = null;

        await act(async () => {
          try {
            await capturedAuth.resetPassword(email);
          } catch (error) {
            resetError = error;
          }
        });

        // Assert
        expect(resetError).toBeNull();
        expect(mockFirebaseAuth.sendPasswordResetEmail).toHaveBeenCalledWith(
          {},
          email
        );

        unmount();
      }),
      { numRuns: 10 }
    );
  });
});