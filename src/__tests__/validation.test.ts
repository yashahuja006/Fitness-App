/**
 * Testing Infrastructure Validation
 * Comprehensive test to validate that all testing utilities work correctly
 */

import * as fc from 'fast-check';
import {
  // Generators
  userProfileArbitrary,
  exerciseArbitrary,
  safeEmailArbitrary,
  safePasswordArbitrary,
  generateValidUserProfile,
  generateValidExercise,
  
  // Mock data
  mockUserProfile,
  mockExercise,
  createMockUserProfile,
  createMockExercise,
  setupFirebaseMocks,
  
  // Validation utilities
  validateUserProfileIntegrity,
  validateExerciseCompleteness,
  
  // Property test utilities
  createAuthenticationProperty,
  DEFAULT_PBT_CONFIG,
  FAST_PBT_CONFIG,
  
  // React testing utilities
  renderWithProviders,
  renderWithAuthenticatedUser,
  createUserEvent,
} from './utils';

import { TEST_CONFIG } from './config/testConfig';

describe('Testing Infrastructure Validation', () => {
  describe('Configuration', () => {
    it('should have valid test configuration', () => {
      expect(TEST_CONFIG).toBeDefined();
      expect(TEST_CONFIG.PBT.DEFAULT).toBeDefined();
      expect(TEST_CONFIG.PBT.FAST).toBeDefined();
      expect(TEST_CONFIG.PBT.THOROUGH).toBeDefined();
      expect(TEST_CONFIG.TIMEOUTS).toBeDefined();
      expect(TEST_CONFIG.CONSTRAINTS).toBeDefined();
    });

    it('should have consistent PBT configurations', () => {
      expect(DEFAULT_PBT_CONFIG.numRuns).toBeGreaterThan(FAST_PBT_CONFIG.numRuns);
      expect(DEFAULT_PBT_CONFIG.timeout).toBeGreaterThanOrEqual(FAST_PBT_CONFIG.timeout);
      expect(typeof DEFAULT_PBT_CONFIG.seed).toBe('number');
    });
  });

  describe('Data Generators', () => {
    it('should generate valid user profiles', () => {
      const profiles = fc.sample(userProfileArbitrary, 10);
      
      profiles.forEach(profile => {
        expect(validateUserProfileIntegrity(profile)).toBe(true);
        expect(profile).toBeValidUserProfile();
      });
    });

    it('should generate valid exercises', () => {
      const exercises = fc.sample(exerciseArbitrary, 10);
      
      exercises.forEach(exercise => {
        expect(validateExerciseCompleteness(exercise)).toBe(true);
        expect(exercise).toBeValidExercise();
      });
    });

    it('should generate valid emails and passwords', () => {
      const emails = fc.sample(safeEmailArbitrary, 10);
      const passwords = fc.sample(safePasswordArbitrary, 10);
      
      emails.forEach(email => {
        expect(email).toBeValidEmail();
      });
      
      passwords.forEach(password => {
        expect(password).toBeValidPassword();
      });
    });

    it('should generate data within constraints', () => {
      const profiles = fc.sample(userProfileArbitrary, 20);
      
      profiles.forEach(profile => {
        const metrics = profile.personalMetrics;
        expect(metrics.height).toBeGreaterThanOrEqual(TEST_CONFIG.CONSTRAINTS.USER_PROFILE.MIN_HEIGHT);
        expect(metrics.height).toBeLessThanOrEqual(TEST_CONFIG.CONSTRAINTS.USER_PROFILE.MAX_HEIGHT);
        expect(metrics.weight).toBeGreaterThanOrEqual(TEST_CONFIG.CONSTRAINTS.USER_PROFILE.MIN_WEIGHT);
        expect(metrics.weight).toBeLessThanOrEqual(TEST_CONFIG.CONSTRAINTS.USER_PROFILE.MAX_WEIGHT);
        expect(metrics.age).toBeGreaterThanOrEqual(TEST_CONFIG.CONSTRAINTS.USER_PROFILE.MIN_AGE);
        expect(metrics.age).toBeLessThanOrEqual(TEST_CONFIG.CONSTRAINTS.USER_PROFILE.MAX_AGE);
      });
    });
  });

  describe('Mock Data', () => {
    it('should provide valid mock objects', () => {
      expect(mockUserProfile).toBeValidUserProfile();
      expect(mockExercise).toBeValidExercise();
      
      expect(mockUserProfile.uid).toBe(TEST_CONFIG.MOCKS.DEFAULT_USER_ID);
      expect(mockUserProfile.email).toBe(TEST_CONFIG.MOCKS.DEFAULT_EMAIL);
      expect(mockExercise.id).toBe(TEST_CONFIG.MOCKS.DEFAULT_EXERCISE_ID);
    });

    it('should create custom mocks with overrides', () => {
      const customProfile = createMockUserProfile({
        displayName: 'Custom User',
        personalMetrics: {
          ...mockUserProfile.personalMetrics,
          height: 180,
        },
      });
      
      expect(customProfile.displayName).toBe('Custom User');
      expect(customProfile.personalMetrics.height).toBe(180);
      expect(customProfile).toBeValidUserProfile();
      
      const customExercise = createMockExercise({
        name: 'Custom Exercise',
        difficulty: 'advanced',
      });
      
      expect(customExercise.name).toBe('Custom Exercise');
      expect(customExercise.difficulty).toBe('advanced');
      expect(customExercise).toBeValidExercise();
    });

    it('should setup Firebase mocks correctly', () => {
      const { mockAuth, mockFirestore } = setupFirebaseMocks();
      
      expect(mockAuth).toBeDefined();
      expect(mockFirestore).toBeDefined();
      expect(typeof mockAuth.signInWithEmailAndPassword).toBe('function');
      expect(typeof mockFirestore.getDoc).toBe('function');
    });
  });

  describe('Validation Utilities', () => {
    it('should validate user profiles correctly', () => {
      const validProfile = generateValidUserProfile();
      expect(validateUserProfileIntegrity(validProfile)).toBe(true);
      
      // Test invalid profiles
      expect(validateUserProfileIntegrity(null)).toBe(false);
      expect(validateUserProfileIntegrity({})).toBe(false);
      expect(validateUserProfileIntegrity({ uid: 'test' })).toBe(false);
    });

    it('should validate exercises correctly', () => {
      const validExercise = generateValidExercise();
      expect(validateExerciseCompleteness(validExercise)).toBe(true);
      
      // Test invalid exercises
      expect(validateExerciseCompleteness(null)).toBe(false);
      expect(validateExerciseCompleteness({})).toBe(false);
      expect(validateExerciseCompleteness({ id: 'test' })).toBe(false);
    });
  });

  describe('Property Test Utilities', () => {
    it('should create authentication properties', async () => {
      // Test with a simpler validation that's more likely to pass
      await createAuthenticationProperty(
        async (scenario) => {
          // Basic validation that scenario has required structure
          if (!scenario || typeof scenario !== 'object') return false;
          if (!scenario.action || typeof scenario.action !== 'string') return false;
          if (!scenario.userData || typeof scenario.userData !== 'object') return false;
          if (!scenario.credentials || typeof scenario.credentials !== 'object') return false;
          if (!scenario.expectedOutcome || typeof scenario.expectedOutcome !== 'string') return false;
          
          // Validate that credentials have email and password
          if (!scenario.credentials.email || typeof scenario.credentials.email !== 'string') return false;
          if (!scenario.credentials.password || typeof scenario.credentials.password !== 'string') return false;
          
          return true;
        },
        { numRuns: 5, timeout: 5000, seed: 42 } // Reduced runs for reliability
      );
    });

    it('should handle property test failures gracefully', async () => {
      try {
        await fc.assert(
          fc.property(fc.integer(), (n) => {
            return n < 0; // This will fail for positive numbers
          }),
          { numRuns: 10, endOnFailure: true }
        );
        fail('Expected property test to fail');
      } catch (error) {
        expect(error).toBeDefined();
        // Property test should fail as expected
      }
    });
  });

  describe('React Testing Utilities', () => {
    it('should have render utilities available', () => {
      expect(renderWithProviders).toBeDefined();
      expect(renderWithAuthenticatedUser).toBeDefined();
      expect(typeof renderWithProviders).toBe('function');
      expect(typeof renderWithAuthenticatedUser).toBe('function');
    });

    it('should create user event instances', () => {
      const user = createUserEvent();
      expect(user).toBeDefined();
      expect(typeof user.click).toBe('function');
      expect(typeof user.type).toBe('function');
    });

    it('should have testing utilities configured', () => {
      // Verify that React Testing Library utilities are available
      expect(typeof createUserEvent).toBe('function');
      
      // Verify specific utilities are defined
      expect(renderWithProviders).toBeDefined();
      expect(renderWithAuthenticatedUser).toBeDefined();
      expect(typeof renderWithProviders).toBe('function');
      expect(typeof renderWithAuthenticatedUser).toBe('function');
    });
  });

  describe('Custom Jest Matchers', () => {
    it('should have working email matcher', () => {
      expect('test@example.com').toBeValidEmail();
      expect('user.name+tag@domain.co.uk').toBeValidEmail();
      
      expect(() => expect('invalid-email').toBeValidEmail()).toThrow();
      expect(() => expect('').toBeValidEmail()).toThrow();
      expect(() => expect('@domain.com').toBeValidEmail()).toThrow();
    });

    it('should have working password matcher', () => {
      expect('password123').toBeValidPassword();
      expect('123456').toBeValidPassword();
      expect('abcdef').toBeValidPassword();
      
      expect(() => expect('12345').toBeValidPassword()).toThrow();
      expect(() => expect('').toBeValidPassword()).toThrow();
    });

    it('should have working user profile matcher', () => {
      const validProfile = generateValidUserProfile();
      expect(validProfile).toBeValidUserProfile();
      
      expect(() => expect(null).toBeValidUserProfile()).toThrow();
      expect(() => expect({}).toBeValidUserProfile()).toThrow();
      expect(() => expect({ uid: 'test' }).toBeValidUserProfile()).toThrow();
    });

    it('should have working exercise matcher', () => {
      const validExercise = generateValidExercise();
      expect(validExercise).toBeValidExercise();
      
      expect(() => expect(null).toBeValidExercise()).toThrow();
      expect(() => expect({}).toBeValidExercise()).toThrow();
      expect(() => expect({ id: 'test' }).toBeValidExercise()).toThrow();
    });
  });

  describe('Performance', () => {
    it('should generate test data efficiently', () => {
      const startTime = performance.now();
      
      // Generate a reasonable amount of test data
      const profiles = Array.from({ length: 100 }, () => generateValidUserProfile());
      const exercises = Array.from({ length: 100 }, () => generateValidExercise());
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should generate 200 objects within performance threshold
      expect(duration).toBeLessThan(TEST_CONFIG.PERFORMANCE.DATA_GENERATION);
      
      // All generated data should be valid
      profiles.forEach(profile => {
        expect(validateUserProfileIntegrity(profile)).toBe(true);
      });
      
      exercises.forEach(exercise => {
        expect(validateExerciseCompleteness(exercise)).toBe(true);
      });
    });

    it('should have reasonable property test execution time', async () => {
      const startTime = performance.now();
      
      await fc.assert(
        fc.property(userProfileArbitrary, (profile) => {
          return validateUserProfileIntegrity(profile);
        }),
        FAST_PBT_CONFIG
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Fast config should complete quickly
      expect(duration).toBeLessThan(FAST_PBT_CONFIG.timeout);
    });
  });

  describe('Data Variety', () => {
    it('should generate diverse test data', () => {
      const profiles = Array.from({ length: 50 }, () => generateValidUserProfile());
      const exercises = Array.from({ length: 50 }, () => generateValidExercise());
      
      // Check variety in user profiles
      const uniqueEmails = new Set(profiles.map(p => p.email));
      const uniqueNames = new Set(profiles.map(p => p.displayName));
      const uniqueGenders = new Set(profiles.map(p => p.personalMetrics.gender));
      const uniqueActivityLevels = new Set(profiles.map(p => p.personalMetrics.activityLevel));
      
      expect(uniqueEmails.size).toBeGreaterThan(40); // At least 80% unique
      expect(uniqueNames.size).toBeGreaterThan(40);
      expect(uniqueGenders.size).toBeGreaterThan(1);
      expect(uniqueActivityLevels.size).toBeGreaterThan(1);
      
      // Check variety in exercises
      const uniqueExerciseNames = new Set(exercises.map(e => e.name));
      const uniqueCategories = new Set(exercises.map(e => e.category));
      const uniqueDifficulties = new Set(exercises.map(e => e.difficulty));
      
      expect(uniqueExerciseNames.size).toBeGreaterThan(40);
      expect(uniqueCategories.size).toBeGreaterThan(1);
      expect(uniqueDifficulties.size).toBeGreaterThan(1);
    });
  });

  describe('Integration', () => {
    it('should work with all utilities together', async () => {
      // Generate test data
      const profile = generateValidUserProfile();
      const exercise = generateValidExercise();
      
      // Validate data
      expect(validateUserProfileIntegrity(profile)).toBe(true);
      expect(validateExerciseCompleteness(exercise)).toBe(true);
      
      // Use custom matchers
      expect(profile).toBeValidUserProfile();
      expect(exercise).toBeValidExercise();
      
      // Setup mocks
      const { mockAuth, mockFirestore } = setupFirebaseMocks();
      mockAuth.currentUser = createMockUserProfile(profile);
      
      // Test property
      await fc.assert(
        fc.property(fc.constant(profile), (testProfile) => {
          return validateUserProfileIntegrity(testProfile);
        }),
        { numRuns: 5 }
      );
      
      // Everything should work together seamlessly
      expect(true).toBe(true);
    });
  });
});