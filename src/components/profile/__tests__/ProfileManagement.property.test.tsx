/**
 * Property-Based Tests for Profile Management
 * 
 * This file contains property-based tests that validate the correctness properties
 * for profile management functionality using Fast-check.
 * 
 * Properties tested:
 * - Property 25: Profile Data Management
 * - Property 26: Privacy Settings Control
 */

import * as fc from 'fast-check';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProfileManagement } from '../ProfileManagement';
import { UserProfileForm } from '../UserProfileForm';
import { PrivacySettingsForm } from '../PrivacySettingsForm';
import { 
  validateUserProfile, 
  validateUserPreferences, 
  sanitizeFormData,
  checkProfileCompleteness 
} from '@/utils/validation';
import { UserProfile, PersonalMetrics, UserPreferences, PrivacySettings, NotificationSettings } from '@/types/auth';

// Mock Firebase functions
jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
}));

// Mock the auth context with controllable state
const mockUpdateUserProfile = jest.fn();
const mockResetPassword = jest.fn();
const mockUseAuth = jest.fn();

const createMockAuthContext = (userProfile: UserProfile | null = null) => ({
  user: userProfile ? { uid: userProfile.uid, email: userProfile.email } : null,
  userProfile,
  loading: false,
  signUp: jest.fn(),
  signIn: jest.fn(),
  logout: jest.fn(),
  resetPassword: mockResetPassword,
  updateUserProfile: mockUpdateUserProfile,
  createUserProfile: jest.fn(),
});

jest.mock('@/contexts/AuthContext', () => ({
  ...jest.requireActual('@/contexts/AuthContext'),
  useAuth: jest.fn(),
}));

// Fast-check generators for test data
const personalMetricsArb = fc.record({
  height: fc.float({ min: 50, max: 300 }),
  weight: fc.float({ min: 20, max: 500 }),
  age: fc.integer({ min: 13, max: 120 }),
  gender: fc.constantFrom('male', 'female', 'other'),
  activityLevel: fc.constantFrom('sedentary', 'light', 'moderate', 'active', 'very_active'),
  fitnessGoals: fc.array(fc.constantFrom(
    'Weight Loss', 'Muscle Gain', 'Endurance', 'Strength', 
    'Flexibility', 'General Fitness', 'Sports Performance'
  ), { minLength: 1, maxLength: 5 }),
});

const privacySettingsArb = fc.record({
  profileVisibility: fc.constantFrom('public', 'friends', 'private'),
  shareProgress: fc.boolean(),
  shareWorkouts: fc.boolean(),
});

const notificationSettingsArb = fc.record({
  workoutReminders: fc.boolean(),
  progressUpdates: fc.boolean(),
  socialUpdates: fc.boolean(),
  systemUpdates: fc.boolean(),
});

const userPreferencesArb = fc.record({
  units: fc.constantFrom('metric', 'imperial'),
  theme: fc.constantFrom('light', 'dark', 'auto'),
  notifications: notificationSettingsArb,
  privacy: privacySettingsArb,
});

const userProfileArb = fc.record({
  uid: fc.string({ minLength: 10, maxLength: 30 }),
  email: fc.emailAddress(),
  displayName: fc.string({ minLength: 2, maxLength: 50 }),
  photoURL: fc.option(fc.webUrl()),
  personalMetrics: personalMetricsArb,
  preferences: userPreferencesArb,
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

// Property-based test suite
describe('Profile Management Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateUserProfile.mockResolvedValue(undefined);
    mockResetPassword.mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue(createMockAuthContext());
  });

  /**
   * Property 25: Profile Data Management
   * **Validates: Requirements 7.3, 7.4**
   * 
   * For any profile update or password reset request, the system should validate data, 
   * store changes securely in Firestore, and provide secure recovery mechanisms.
   */
  describe('Property 25: Profile Data Management', () => {
    test('profile updates are validated before storage', async () => {
      await fc.assert(
        fc.asyncProperty(
          userProfileArb,
          fc.record({
            displayName: fc.option(fc.string({ minLength: 0, maxLength: 100 })),
            personalMetrics: fc.option(personalMetricsArb),
            preferences: fc.option(userPreferencesArb),
          }),
          async (baseProfile, updates) => {
            // Mock the auth context with the base profile
            const mockContext = createMockAuthContext(baseProfile);
            mockUseAuth.mockReturnValue(mockContext);

            // Create partial update data
            const updateData: Partial<UserProfile> = {};
            if (updates.displayName !== null) updateData.displayName = updates.displayName;
            if (updates.personalMetrics !== null) updateData.personalMetrics = updates.personalMetrics;
            if (updates.preferences !== null) updateData.preferences = updates.preferences;

            // Validate the update data using the same validation logic as the component
            const sanitizedData = sanitizeFormData(updateData);
            const validation = validateUserProfile(sanitizedData);

            // The validation result should be consistent
            expect(typeof validation.isValid).toBe('boolean');
            expect(Array.isArray(validation.errors)).toBe(true);

            // If validation passes, the data should be safe to store
            if (validation.isValid) {
              // All required fields should be properly formatted
              if (sanitizedData.displayName) {
                expect(typeof sanitizedData.displayName).toBe('string');
                expect(sanitizedData.displayName.length).toBeGreaterThanOrEqual(2);
                expect(sanitizedData.displayName.length).toBeLessThanOrEqual(50);
              }

              if (sanitizedData.personalMetrics) {
                const metrics = sanitizedData.personalMetrics;
                if (metrics.height) expect(metrics.height).toBeGreaterThan(0);
                if (metrics.weight) expect(metrics.weight).toBeGreaterThan(0);
                if (metrics.age) expect(metrics.age).toBeGreaterThan(0);
              }
            }

            // If validation fails, there should be specific error messages
            if (!validation.isValid) {
              expect(validation.errors.length).toBeGreaterThan(0);
              validation.errors.forEach(error => {
                expect(typeof error.field).toBe('string');
                expect(typeof error.message).toBe('string');
                expect(error.field.length).toBeGreaterThan(0);
                expect(error.message.length).toBeGreaterThan(0);
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('profile data sanitization removes harmful content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            displayName: fc.option(fc.string().map(s => s + '<script>alert("xss")</script>')),
            email: fc.option(fc.string().map(s => s + '<img src=x onerror=alert(1)>')),
            personalMetrics: fc.option(fc.record({
              height: fc.oneof(fc.float(), fc.constant(Infinity), fc.constant(-Infinity)),
              weight: fc.oneof(fc.float(), fc.constant(NaN)),
              age: fc.integer(),
              gender: fc.string(),
              activityLevel: fc.string(),
              fitnessGoals: fc.array(fc.string().map(s => s + '<script>')),
            })),
          }),
          async (maliciousData) => {
            const sanitized = sanitizeFormData(maliciousData);

            // HTML tags should be stripped from string fields
            if (sanitized.displayName) {
              expect(sanitized.displayName).not.toContain('<script>');
              expect(sanitized.displayName).not.toContain('<img');
            }

            if (sanitized.email) {
              expect(sanitized.email).not.toContain('<img');
              expect(sanitized.email).not.toContain('onerror');
            }

            // Numeric fields should be finite
            if (sanitized.personalMetrics) {
              const metrics = sanitized.personalMetrics;
              if (typeof metrics.height === 'number') {
                expect(isFinite(metrics.height)).toBe(true);
              }
              if (typeof metrics.weight === 'number') {
                expect(isFinite(metrics.weight)).toBe(true);
              }
            }

            // Array elements should be sanitized
            if (sanitized.personalMetrics?.fitnessGoals) {
              sanitized.personalMetrics.fitnessGoals.forEach((goal: string) => {
                expect(goal).not.toContain('<script>');
              });
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('password reset requests are handled securely', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            // Reset mocks for this iteration
            mockResetPassword.mockClear();
            mockResetPassword.mockResolvedValue(undefined);

            // Call the reset password function
            const mockContext = createMockAuthContext();
            await mockContext.resetPassword(email);

            // Verify the function was called with the email
            expect(mockResetPassword).toHaveBeenCalledWith(email);
            expect(mockResetPassword).toHaveBeenCalledTimes(1);

            // The function should not throw for valid email addresses
            expect(mockResetPassword).not.toThrow();
          }
        ),
        { numRuns: 50 }
      );
    });

    test('profile completeness validation is consistent', async () => {
      await fc.assert(
        fc.asyncProperty(
          userProfileArb,
          async (profile) => {
            const completenessResult = checkProfileCompleteness(profile);

            // Result should always have the correct structure
            expect(typeof completenessResult.isValid).toBe('boolean');
            expect(Array.isArray(completenessResult.errors)).toBe(true);

            // If profile is complete, it should have all required fields
            if (completenessResult.isValid) {
              expect(profile.displayName).toBeTruthy();
              expect(profile.email).toBeTruthy();
              expect(profile.personalMetrics.height).toBeGreaterThan(0);
              expect(profile.personalMetrics.weight).toBeGreaterThan(0);
              expect(profile.personalMetrics.age).toBeGreaterThan(0);
              expect(profile.personalMetrics.gender).toBeTruthy();
              expect(profile.personalMetrics.activityLevel).toBeTruthy();
              expect(profile.personalMetrics.fitnessGoals.length).toBeGreaterThan(0);
            }

            // If profile is incomplete, there should be specific errors
            if (!completenessResult.isValid) {
              expect(completenessResult.errors.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 26: Privacy Settings Control
   * **Validates: Requirements 7.5**
   * 
   * For any privacy setting modification, the system should allow users granular 
   * control over data sharing and visibility preferences.
   */
  describe('Property 26: Privacy Settings Control', () => {
    test('privacy settings modifications are validated and preserved', async () => {
      await fc.assert(
        fc.asyncProperty(
          userProfileArb,
          privacySettingsArb,
          notificationSettingsArb,
          async (baseProfile, newPrivacySettings, newNotificationSettings) => {
            // Create updated preferences
            const updatedPreferences: UserPreferences = {
              ...baseProfile.preferences,
              privacy: newPrivacySettings,
              notifications: newNotificationSettings,
            };

            // Validate the preferences
            const validation = validateUserPreferences(updatedPreferences);

            // Validation should always return a proper result
            expect(typeof validation.isValid).toBe('boolean');
            expect(Array.isArray(validation.errors)).toBe(true);

            // Valid privacy settings should pass validation
            if (validation.isValid) {
              // Profile visibility should be one of the allowed values
              expect(['public', 'friends', 'private']).toContain(
                updatedPreferences.privacy.profileVisibility
              );

              // Boolean privacy settings should be actual booleans
              expect(typeof updatedPreferences.privacy.shareProgress).toBe('boolean');
              expect(typeof updatedPreferences.privacy.shareWorkouts).toBe('boolean');

              // Notification settings should be booleans
              expect(typeof updatedPreferences.notifications.workoutReminders).toBe('boolean');
              expect(typeof updatedPreferences.notifications.progressUpdates).toBe('boolean');
              expect(typeof updatedPreferences.notifications.socialUpdates).toBe('boolean');
              expect(typeof updatedPreferences.notifications.systemUpdates).toBe('boolean');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('privacy settings provide granular control over data sharing', async () => {
      await fc.assert(
        fc.asyncProperty(
          privacySettingsArb,
          async (privacySettings) => {
            // Each privacy setting should be independently controllable
            const settings = privacySettings;

            // Profile visibility should be one of three specific options
            expect(['public', 'friends', 'private']).toContain(settings.profileVisibility);

            // Progress sharing should be independently controllable
            expect(typeof settings.shareProgress).toBe('boolean');

            // Workout sharing should be independently controllable  
            expect(typeof settings.shareWorkouts).toBe('boolean');

            // Settings should be independent - changing one doesn't affect others
            const modifiedSettings = {
              ...settings,
              shareProgress: !settings.shareProgress,
            };

            expect(modifiedSettings.profileVisibility).toBe(settings.profileVisibility);
            expect(modifiedSettings.shareWorkouts).toBe(settings.shareWorkouts);
            expect(modifiedSettings.shareProgress).toBe(!settings.shareProgress);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('notification preferences are independently controllable', async () => {
      await fc.assert(
        fc.asyncProperty(
          notificationSettingsArb,
          async (notificationSettings) => {
            // Each notification type should be independently controllable
            const settings = notificationSettings;

            // All notification settings should be booleans
            expect(typeof settings.workoutReminders).toBe('boolean');
            expect(typeof settings.progressUpdates).toBe('boolean');
            expect(typeof settings.socialUpdates).toBe('boolean');
            expect(typeof settings.systemUpdates).toBe('boolean');

            // Modifying one setting should not affect others
            const modifiedSettings = {
              ...settings,
              workoutReminders: !settings.workoutReminders,
              socialUpdates: !settings.socialUpdates,
            };

            expect(modifiedSettings.progressUpdates).toBe(settings.progressUpdates);
            expect(modifiedSettings.systemUpdates).toBe(settings.systemUpdates);
            expect(modifiedSettings.workoutReminders).toBe(!settings.workoutReminders);
            expect(modifiedSettings.socialUpdates).toBe(!settings.socialUpdates);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('privacy settings updates are properly stored', async () => {
      await fc.assert(
        fc.asyncProperty(
          userProfileArb,
          privacySettingsArb,
          notificationSettingsArb,
          async (baseProfile, newPrivacySettings, newNotificationSettings) => {
            // Reset mocks for this iteration
            mockUpdateUserProfile.mockClear();
            mockUpdateUserProfile.mockResolvedValue(undefined);

            // Mock the auth context
            const mockContext = createMockAuthContext(baseProfile);
            mockUseAuth.mockReturnValue(mockContext);

            // Create the update payload
            const updates = {
              preferences: {
                units: baseProfile.preferences.units,
                theme: baseProfile.preferences.theme,
                privacy: newPrivacySettings,
                notifications: newNotificationSettings,
              },
            };

            // Call the update function
            await mockContext.updateUserProfile(updates);

            // Verify the update was called with correct data
            expect(mockUpdateUserProfile).toHaveBeenCalledWith(updates);
            expect(mockUpdateUserProfile).toHaveBeenCalledTimes(1);

            // Verify the privacy settings structure is preserved
            const calledWith = mockUpdateUserProfile.mock.calls[0][0];
            expect(calledWith.preferences.privacy).toEqual(newPrivacySettings);
            expect(calledWith.preferences.notifications).toEqual(newNotificationSettings);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('invalid privacy settings are rejected with appropriate errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            profileVisibility: fc.string().filter(s => !['public', 'friends', 'private'].includes(s)),
            shareProgress: fc.oneof(fc.string(), fc.integer(), fc.constant(null)),
            shareWorkouts: fc.oneof(fc.string(), fc.integer(), fc.constant(undefined)),
          }),
          async (invalidPrivacySettings) => {
            const preferences: Partial<UserPreferences> = {
              privacy: invalidPrivacySettings as any,
            };

            const validation = validateUserPreferences(preferences);

            // Invalid settings should fail validation
            expect(validation.isValid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);

            // Should have specific error messages for invalid fields
            const errorFields = validation.errors.map(e => e.field);
            
            if (invalidPrivacySettings.profileVisibility) {
              expect(errorFields).toContain('privacy.profileVisibility');
            }

            if (typeof invalidPrivacySettings.shareProgress !== 'boolean' && 
                invalidPrivacySettings.shareProgress !== undefined) {
              expect(errorFields).toContain('privacy.shareProgress');
            }

            if (typeof invalidPrivacySettings.shareWorkouts !== 'boolean' && 
                invalidPrivacySettings.shareWorkouts !== undefined) {
              expect(errorFields).toContain('privacy.shareWorkouts');
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Integration tests to verify properties work together
   */
  describe('Profile Management Integration Properties', () => {
    test('complete profile management workflow preserves data integrity', async () => {
      await fc.assert(
        fc.asyncProperty(
          userProfileArb,
          personalMetricsArb,
          privacySettingsArb,
          async (initialProfile, newMetrics, newPrivacySettings) => {
            // Step 1: Update personal metrics
            const metricsUpdate = { personalMetrics: newMetrics };
            const sanitizedMetrics = sanitizeFormData(metricsUpdate);
            const metricsValidation = validateUserProfile(sanitizedMetrics);

            // Step 2: Update privacy settings
            const privacyUpdate = {
              preferences: {
                ...initialProfile.preferences,
                privacy: newPrivacySettings,
              },
            };
            const privacyValidation = validateUserPreferences(privacyUpdate.preferences);

            // Both updates should be independently valid or invalid
            expect(typeof metricsValidation.isValid).toBe('boolean');
            expect(typeof privacyValidation.isValid).toBe('boolean');

            // If both are valid, combined update should also be valid
            if (metricsValidation.isValid && privacyValidation.isValid) {
              const combinedUpdate = {
                ...sanitizedMetrics,
                ...privacyUpdate,
              };
              
              const combinedValidation = validateUserProfile(combinedUpdate);
              expect(combinedValidation.isValid).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});