import {
  validatePersonalMetrics,
  validateUserPreferences,
  validateUserProfile,
  checkProfileCompleteness,
  calculateBMI,
  getBMICategory,
  sanitizeFormData,
} from '../validation';
import { UserProfile, PersonalMetrics, UserPreferences } from '@/types/auth';

describe('validation utilities', () => {
  describe('validatePersonalMetrics', () => {
    it('validates valid personal metrics', () => {
      const validMetrics: PersonalMetrics = {
        height: 175,
        weight: 70,
        age: 25,
        gender: 'male',
        activityLevel: 'moderate',
        fitnessGoals: ['Weight Loss', 'Muscle Gain'],
      };

      const result = validatePersonalMetrics(validMetrics);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates height constraints', () => {
      const invalidMetrics = { height: 0 };
      const result = validatePersonalMetrics(invalidMetrics);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'height',
        message: 'Height must be greater than 0',
      });
    });

    it('validates height range', () => {
      const tooShort = validatePersonalMetrics({ height: 30 });
      const tooTall = validatePersonalMetrics({ height: 350 });

      expect(tooShort.errors).toContainEqual({
        field: 'height',
        message: 'Height must be between 50cm and 300cm',
      });

      expect(tooTall.errors).toContainEqual({
        field: 'height',
        message: 'Height must be between 50cm and 300cm',
      });
    });

    it('validates weight constraints', () => {
      const invalidWeight = validatePersonalMetrics({ weight: 0 });
      const tooLight = validatePersonalMetrics({ weight: 10 });
      const tooHeavy = validatePersonalMetrics({ weight: 600 });

      expect(invalidWeight.errors).toContainEqual({
        field: 'weight',
        message: 'Weight must be greater than 0',
      });

      expect(tooLight.errors).toContainEqual({
        field: 'weight',
        message: 'Weight must be between 20kg and 500kg',
      });

      expect(tooHeavy.errors).toContainEqual({
        field: 'weight',
        message: 'Weight must be between 20kg and 500kg',
      });
    });

    it('validates age constraints', () => {
      const invalidAge = validatePersonalMetrics({ age: 0 });
      const tooYoung = validatePersonalMetrics({ age: 10 });
      const tooOld = validatePersonalMetrics({ age: 150 });

      expect(invalidAge.errors).toContainEqual({
        field: 'age',
        message: 'Age must be greater than 0',
      });

      expect(tooYoung.errors).toContainEqual({
        field: 'age',
        message: 'Age must be between 13 and 120 years',
      });

      expect(tooOld.errors).toContainEqual({
        field: 'age',
        message: 'Age must be between 13 and 120 years',
      });
    });

    it('validates gender options', () => {
      const invalidGender = validatePersonalMetrics({ gender: 'invalid' as any });

      expect(invalidGender.errors).toContainEqual({
        field: 'gender',
        message: 'Gender must be male, female, or other',
      });
    });

    it('validates activity level options', () => {
      const invalidActivity = validatePersonalMetrics({ activityLevel: 'invalid' as any });

      expect(invalidActivity.errors).toContainEqual({
        field: 'activityLevel',
        message: 'Invalid activity level',
      });
    });

    it('validates fitness goals', () => {
      const noGoals = validatePersonalMetrics({ fitnessGoals: [] });
      const tooManyGoals = validatePersonalMetrics({ 
        fitnessGoals: ['Goal1', 'Goal2', 'Goal3', 'Goal4', 'Goal5', 'Goal6'] 
      });

      expect(noGoals.errors).toContainEqual({
        field: 'fitnessGoals',
        message: 'At least one fitness goal is required',
      });

      expect(tooManyGoals.errors).toContainEqual({
        field: 'fitnessGoals',
        message: 'Maximum 5 fitness goals allowed',
      });
    });
  });

  describe('validateUserPreferences', () => {
    it('validates valid preferences', () => {
      const validPreferences: UserPreferences = {
        units: 'metric',
        theme: 'auto',
        notifications: {
          workoutReminders: true,
          progressUpdates: true,
          socialUpdates: false,
          systemUpdates: true,
        },
        privacy: {
          profileVisibility: 'private',
          shareProgress: false,
          shareWorkouts: false,
        },
      };

      const result = validateUserPreferences(validPreferences);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates units options', () => {
      const invalidUnits = validateUserPreferences({ units: 'invalid' as any });

      expect(invalidUnits.errors).toContainEqual({
        field: 'units',
        message: 'Units must be metric or imperial',
      });
    });

    it('validates theme options', () => {
      const invalidTheme = validateUserPreferences({ theme: 'invalid' as any });

      expect(invalidTheme.errors).toContainEqual({
        field: 'theme',
        message: 'Theme must be light, dark, or auto',
      });
    });

    it('validates privacy settings', () => {
      const invalidPrivacy = validateUserPreferences({
        privacy: {
          profileVisibility: 'invalid' as any,
          shareProgress: 'not-boolean' as any,
          shareWorkouts: 'not-boolean' as any,
        },
      });

      expect(invalidPrivacy.errors).toContainEqual({
        field: 'privacy.profileVisibility',
        message: 'Invalid profile visibility setting',
      });

      expect(invalidPrivacy.errors).toContainEqual({
        field: 'privacy.shareProgress',
        message: 'Share progress must be a boolean',
      });

      expect(invalidPrivacy.errors).toContainEqual({
        field: 'privacy.shareWorkouts',
        message: 'Share workouts must be a boolean',
      });
    });
  });

  describe('validateUserProfile', () => {
    it('validates complete user profile', () => {
      const validProfile: Partial<UserProfile> = {
        displayName: 'Test User',
        email: 'test@example.com',
        personalMetrics: {
          height: 175,
          weight: 70,
          age: 25,
          gender: 'male',
          activityLevel: 'moderate',
          fitnessGoals: ['Weight Loss'],
        },
        preferences: {
          units: 'metric',
          theme: 'auto',
          notifications: {
            workoutReminders: true,
            progressUpdates: true,
            socialUpdates: false,
            systemUpdates: true,
          },
          privacy: {
            profileVisibility: 'private',
            shareProgress: false,
            shareWorkouts: false,
          },
        },
      };

      const result = validateUserProfile(validProfile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates display name', () => {
      const emptyName = validateUserProfile({ displayName: '' });
      const shortName = validateUserProfile({ displayName: 'A' });
      const longName = validateUserProfile({ displayName: 'A'.repeat(51) });

      expect(emptyName.errors).toContainEqual({
        field: 'displayName',
        message: 'Display name is required',
      });

      expect(shortName.errors).toContainEqual({
        field: 'displayName',
        message: 'Display name must be at least 2 characters',
      });

      expect(longName.errors).toContainEqual({
        field: 'displayName',
        message: 'Display name must be less than 50 characters',
      });
    });

    it('validates email format', () => {
      const invalidEmail = validateUserProfile({ email: 'invalid-email' });

      expect(invalidEmail.errors).toContainEqual({
        field: 'email',
        message: 'Invalid email format',
      });
    });
  });

  describe('checkProfileCompleteness', () => {
    const completeProfile: UserProfile = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      personalMetrics: {
        height: 175,
        weight: 70,
        age: 25,
        gender: 'male',
        activityLevel: 'moderate',
        fitnessGoals: ['Weight Loss'],
      },
      preferences: {
        units: 'metric',
        theme: 'auto',
        notifications: {
          workoutReminders: true,
          progressUpdates: true,
          socialUpdates: false,
          systemUpdates: true,
        },
        privacy: {
          profileVisibility: 'private',
          shareProgress: false,
          shareWorkouts: false,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('validates complete profile', () => {
      const result = checkProfileCompleteness(completeProfile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('identifies missing required fields', () => {
      const incompleteProfile = {
        ...completeProfile,
        displayName: '',
        personalMetrics: {
          ...completeProfile.personalMetrics,
          height: 0,
          weight: 0,
          age: 0,
          gender: '' as any,
          activityLevel: '' as any,
          fitnessGoals: [],
        },
      };

      const result = checkProfileCompleteness(incompleteProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('handles null profile', () => {
      const result = checkProfileCompleteness(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'profile',
        message: 'Profile does not exist',
      });
    });
  });

  describe('calculateBMI', () => {
    it('calculates BMI correctly', () => {
      const bmi = calculateBMI(175, 70);
      expect(bmi).toBeCloseTo(22.86, 2);
    });

    it('returns null for invalid inputs', () => {
      expect(calculateBMI(0, 70)).toBeNull();
      expect(calculateBMI(175, 0)).toBeNull();
      expect(calculateBMI(-175, 70)).toBeNull();
    });
  });

  describe('getBMICategory', () => {
    it('categorizes BMI correctly', () => {
      expect(getBMICategory(17)).toBe('Underweight');
      expect(getBMICategory(22)).toBe('Normal weight');
      expect(getBMICategory(27)).toBe('Overweight');
      expect(getBMICategory(32)).toBe('Obese');
    });
  });

  describe('sanitizeFormData', () => {
    it('sanitizes string inputs', () => {
      const data = {
        name: '  Test Name  ',
        description: 'Test <script>alert("xss")</script> description',
      };

      const sanitized = sanitizeFormData(data);
      expect(sanitized.name).toBe('Test Name');
      expect(sanitized.description).toBe('Test alert("xss") description');
    });

    it('handles numbers and booleans', () => {
      const data = {
        age: 25,
        height: 175.5,
        active: true,
        invalid: Infinity,
      };

      const sanitized = sanitizeFormData(data);
      expect(sanitized.age).toBe(25);
      expect(sanitized.height).toBe(175.5);
      expect(sanitized.active).toBe(true);
      expect(sanitized.invalid).toBe(0);
    });

    it('sanitizes nested objects and arrays', () => {
      const data = {
        user: {
          name: '  John Doe  ',
          email: 'john@example.com',
        },
        goals: ['  Weight Loss  ', 'Muscle <span>Gain</span>'],
      };

      const sanitized = sanitizeFormData(data);
      expect(sanitized.user.name).toBe('John Doe');
      expect(sanitized.goals).toEqual(['Weight Loss', 'Muscle Gain']);
    });
  });
});