/**
 * Infrastructure property-based tests
 * Tests the testing infrastructure itself to ensure it works correctly
 */

import * as fc from 'fast-check';
import {
  userProfileArbitrary,
  exerciseArbitrary,
  safeEmailArbitrary,
  safePasswordArbitrary,
  generateValidUserProfile,
  generateValidExercise,
} from './utils/generators';
import {
  validateUserProfileIntegrity,
  validateExerciseCompleteness,
  createAuthenticationProperty,
  DEFAULT_PBT_CONFIG,
  FAST_PBT_CONFIG,
} from './utils/propertyTestUtils';
import {
  mockUserProfile,
  mockExercise,
  createMockUserProfile,
  createMockExercise,
  assertValidUserProfile,
  assertValidExercise,
} from './utils/mocks';

describe('Testing Infrastructure Property Tests', () => {
  describe('Data Generators', () => {
    /**
     * **Validates: Testing Infrastructure**
     * Property: Generated user profiles have valid structure and data integrity
     * 
     * For any generated user profile, the profile should have all required fields
     * with valid data types and constraints.
     */
    it('Property: Generated user profiles maintain data integrity', async () => {
      await fc.assert(
        fc.property(userProfileArbitrary, (profile) => {
          return validateUserProfileIntegrity(profile);
        }),
        FAST_PBT_CONFIG
      );
    });

    /**
     * **Validates: Testing Infrastructure**
     * Property: Generated exercises have complete and valid data
     * 
     * For any generated exercise, the exercise should have all required fields
     * with proper structure and valid constraints.
     */
    it('Property: Generated exercises maintain completeness', async () => {
      await fc.assert(
        fc.property(exerciseArbitrary, (exercise) => {
          return validateExerciseCompleteness(exercise);
        }),
        FAST_PBT_CONFIG
      );
    });

    /**
     * **Validates: Testing Infrastructure**
     * Property: Email generator produces valid email addresses
     * 
     * For any generated email, it should match standard email format
     * and be usable in authentication scenarios.
     */
    it('Property: Email generator produces valid emails', async () => {
      await fc.assert(
        fc.property(safeEmailArbitrary, (email) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email) && email.length >= 5 && email.length <= 50;
        }),
        FAST_PBT_CONFIG
      );
    });

    /**
     * **Validates: Testing Infrastructure**
     * Property: Password generator produces valid passwords
     * 
     * For any generated password, it should meet minimum security requirements
     * and be usable in authentication scenarios.
     */
    it('Property: Password generator produces valid passwords', async () => {
      await fc.assert(
        fc.property(safePasswordArbitrary, (password) => {
          return password.length >= 6 && password.length <= 20 && /^[a-zA-Z0-9]+$/.test(password);
        }),
        FAST_PBT_CONFIG
      );
    });
  });

  describe('Mock Data Utilities', () => {
    it('should provide valid mock user profile', () => {
      assertValidUserProfile(mockUserProfile);
      expect(mockUserProfile).toBeValidUserProfile();
    });

    it('should provide valid mock exercise', () => {
      assertValidExercise(mockExercise);
      expect(mockExercise).toBeValidExercise();
    });

    it('should create mock user profiles with overrides', () => {
      const customProfile = createMockUserProfile({
        displayName: 'Custom User',
        personalMetrics: {
          ...mockUserProfile.personalMetrics,
          height: 180,
          weight: 75,
        },
      });

      expect(customProfile.displayName).toBe('Custom User');
      expect(customProfile.personalMetrics.height).toBe(180);
      expect(customProfile.personalMetrics.weight).toBe(75);
      assertValidUserProfile(customProfile);
    });

    it('should create mock exercises with overrides', () => {
      const customExercise = createMockExercise({
        name: 'Custom Exercise',
        difficulty: 'advanced',
        targetMuscles: ['legs', 'glutes'],
      });

      expect(customExercise.name).toBe('Custom Exercise');
      expect(customExercise.difficulty).toBe('advanced');
      expect(customExercise.targetMuscles).toEqual(['legs', 'glutes']);
      assertValidExercise(customExercise);
    });
  });

  describe('Property Test Utilities', () => {
    /**
     * **Validates: Testing Infrastructure**
     * Property: Property test utilities work correctly
     * 
     * The property test utilities should be able to create and run
     * property tests with proper configuration and error handling.
     */
    it('Property: Authentication property test utility works', async () => {
      // This is a meta-test: testing the property test utility itself
      await createAuthenticationProperty(
        async (scenario) => {
          // Simple validation that the scenario has required structure
          return (
            scenario &&
            typeof scenario === 'object' &&
            scenario.action &&
            scenario.userData &&
            scenario.credentials &&
            scenario.expectedOutcome
          );
        },
        { numRuns: 5, timeout: 5000 }
      );
    });

    it('should validate user profile integrity correctly', () => {
      // Valid profile should pass
      const validProfile = generateValidUserProfile();
      expect(validateUserProfileIntegrity(validProfile)).toBe(true);

      // Invalid profiles should fail
      expect(validateUserProfileIntegrity(null)).toBe(false);
      expect(validateUserProfileIntegrity({})).toBe(false);
      expect(validateUserProfileIntegrity({ uid: 'test' })).toBe(false);
    });

    it('should validate exercise completeness correctly', () => {
      // Valid exercise should pass
      const validExercise = generateValidExercise();
      expect(validateExerciseCompleteness(validExercise)).toBe(true);

      // Invalid exercises should fail
      expect(validateExerciseCompleteness(null)).toBe(false);
      expect(validateExerciseCompleteness({})).toBe(false);
      expect(validateExerciseCompleteness({ id: 'test' })).toBe(false);
    });
  });

  describe('Custom Jest Matchers', () => {
    it('should have working custom matchers', () => {
      const validEmail = 'test@example.com';
      const invalidEmail = 'invalid-email';
      const validPassword = 'password123';
      const invalidPassword = '123';

      expect(validEmail).toBeValidEmail();
      expect(() => expect(invalidEmail).toBeValidEmail()).toThrow();
      
      expect(validPassword).toBeValidPassword();
      expect(() => expect(invalidPassword).toBeValidPassword()).toThrow();

      const validProfile = generateValidUserProfile();
      expect(validProfile).toBeValidUserProfile();

      const validExercise = generateValidExercise();
      expect(validExercise).toBeValidExercise();
    });
  });

  describe('Performance and Reliability', () => {
    /**
     * **Validates: Testing Infrastructure**
     * Property: Test data generation is performant
     * 
     * Generating test data should be fast enough for practical use
     * in property-based tests with many iterations.
     */
    it('Property: Data generation is performant', async () => {
      const startTime = performance.now();
      
      // Generate a reasonable amount of test data
      const profiles = Array.from({ length: 100 }, () => generateValidUserProfile());
      const exercises = Array.from({ length: 100 }, () => generateValidExercise());
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should generate 200 objects in less than 1 second
      expect(duration).toBeLessThan(1000);
      
      // All generated data should be valid
      profiles.forEach(profile => {
        expect(validateUserProfileIntegrity(profile)).toBe(true);
      });
      
      exercises.forEach(exercise => {
        expect(validateExerciseCompleteness(exercise)).toBe(true);
      });
    });

    /**
     * **Validates: Testing Infrastructure**
     * Property: Generated data has sufficient variety
     * 
     * The generators should produce diverse data to ensure
     * comprehensive testing coverage.
     */
    it('Property: Generated data has sufficient variety', async () => {
      const profiles = Array.from({ length: 50 }, () => generateValidUserProfile());
      const exercises = Array.from({ length: 50 }, () => generateValidExercise());
      
      // Check variety in user profiles
      const uniqueEmails = new Set(profiles.map(p => p.email));
      const uniqueNames = new Set(profiles.map(p => p.displayName));
      const uniqueHeights = new Set(profiles.map(p => p.personalMetrics.height));
      
      expect(uniqueEmails.size).toBeGreaterThan(40); // At least 80% unique
      expect(uniqueNames.size).toBeGreaterThan(40);
      expect(uniqueHeights.size).toBeGreaterThan(30);
      
      // Check variety in exercises
      const uniqueExerciseNames = new Set(exercises.map(e => e.name));
      const uniqueCategories = new Set(exercises.map(e => e.category));
      const uniqueDifficulties = new Set(exercises.map(e => e.difficulty));
      
      expect(uniqueExerciseNames.size).toBeGreaterThan(40);
      expect(uniqueCategories.size).toBeGreaterThan(1);
      expect(uniqueDifficulties.size).toBeGreaterThan(1);
    });
  });
});

// Additional infrastructure tests for specific scenarios
describe('Testing Infrastructure Edge Cases', () => {
  it('should handle edge cases in user profile generation', () => {
    // Test boundary values
    const profiles = Array.from({ length: 20 }, () => generateValidUserProfile());
    
    profiles.forEach(profile => {
      // Height should be within realistic bounds
      expect(profile.personalMetrics.height).toBeGreaterThanOrEqual(50);
      expect(profile.personalMetrics.height).toBeLessThanOrEqual(300);
      
      // Weight should be within realistic bounds
      expect(profile.personalMetrics.weight).toBeGreaterThanOrEqual(20);
      expect(profile.personalMetrics.weight).toBeLessThanOrEqual(500);
      
      // Age should be within realistic bounds
      expect(profile.personalMetrics.age).toBeGreaterThanOrEqual(13);
      expect(profile.personalMetrics.age).toBeLessThanOrEqual(120);
      
      // Fitness goals should not be empty
      expect(profile.personalMetrics.fitnessGoals.length).toBeGreaterThan(0);
      expect(profile.personalMetrics.fitnessGoals.length).toBeLessThanOrEqual(5);
    });
  });

  it('should handle edge cases in exercise generation', () => {
    const exercises = Array.from({ length: 20 }, () => generateValidExercise());
    
    exercises.forEach(exercise => {
      // Name should not be empty
      expect(exercise.name.trim().length).toBeGreaterThan(0);
      
      // Should have at least one target muscle
      expect(exercise.targetMuscles.length).toBeGreaterThan(0);
      
      // Should have at least one instruction
      expect(exercise.instructions.length).toBeGreaterThan(0);
      
      // Instructions should not be empty strings
      exercise.instructions.forEach(instruction => {
        expect(instruction.trim().length).toBeGreaterThan(0);
      });
      
      // Metadata should be present
      expect(exercise.metadata).toBeDefined();
      expect(typeof exercise.metadata.verified).toBe('boolean');
      expect(typeof exercise.metadata.popularity).toBe('number');
    });
  });
});
