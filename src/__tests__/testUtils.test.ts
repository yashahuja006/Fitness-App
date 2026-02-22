/**
 * Test utilities verification
 */

import * as fc from 'fast-check';
import { 
  safeEmailArbitrary, 
  safePasswordArbitrary,
  mockUserProfile,
  mockExercise,
  validateUserProfileIntegrity,
  validateExerciseCompleteness
} from './utils';

describe('Test Utilities', () => {
  describe('Fast-check generators', () => {
    it('should generate valid emails', () => {
      fc.assert(
        fc.property(safeEmailArbitrary, (email) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email) && email.length >= 5;
        }),
        { numRuns: 5 }
      );
    });

    it('should generate valid passwords', () => {
      fc.assert(
        fc.property(safePasswordArbitrary, (password) => {
          return password.length >= 6 && password.length <= 20;
        }),
        { numRuns: 5 }
      );
    });
  });

  describe('Mock data', () => {
    it('should provide valid mock user profile', () => {
      expect(mockUserProfile).toBeDefined();
      expect(mockUserProfile.uid).toBe('test-uid-123');
      expect(mockUserProfile.email).toBe('test@example.com');
      expect(mockUserProfile.displayName).toBe('Test User');
      expect(validateUserProfileIntegrity(mockUserProfile)).toBe(true);
    });

    it('should provide valid mock exercise', () => {
      expect(mockExercise).toBeDefined();
      expect(mockExercise.id).toBe('exercise-123');
      expect(mockExercise.name).toBe('Push-ups');
      expect(mockExercise.category).toBe('strength');
      expect(validateExerciseCompleteness(mockExercise)).toBe(true);
    });
  });

  describe('Validation utilities', () => {
    it('should validate user profile integrity', () => {
      expect(validateUserProfileIntegrity(mockUserProfile)).toBe(true);
      expect(validateUserProfileIntegrity(null)).toBe(false);
      expect(validateUserProfileIntegrity({})).toBe(false);
    });

    it('should validate exercise completeness', () => {
      expect(validateExerciseCompleteness(mockExercise)).toBe(true);
      expect(validateExerciseCompleteness(null)).toBe(false);
      expect(validateExerciseCompleteness({})).toBe(false);
    });
  });
});
