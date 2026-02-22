/**
 * Tests for UserProfileExtended validation
 */

import { validateUserProfile, validateField, isProfileComplete } from '@/utils/profileValidation';
import { UserProfileExtended } from '@/types/nutrition';

describe('UserProfileExtended Validation', () => {
  // Valid profile for testing
  const validProfile: UserProfileExtended = {
    height: 175,
    weight: 75,
    age: 30,
    gender: 'male',
    body_fat_percentage: 15,
    activity_level: 'moderate',
    goal: 'muscle_gain',
    diet_type: 'standard',
    meals_per_day: 4,
    snacks_per_day: 2,
    cooking_time: 'moderate',
    cuisine_preference: ['italian', 'asian'],
    budget_level: 'medium',
    training_level: 'intermediate',
    workout_days_per_week: 4,
    subscription_tier: 'pro',
    plan_duration_weeks: 8
  };

  describe('validateUserProfile', () => {
    it('should validate a correct profile', () => {
      const result = validateUserProfile(validProfile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid height (too low)', () => {
      const profile = { ...validProfile, height: 50 };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Height must be between 100-250 cm');
    });

    it('should reject invalid height (too high)', () => {
      const profile = { ...validProfile, height: 300 };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Height must be between 100-250 cm');
    });

    it('should reject invalid weight (too low)', () => {
      const profile = { ...validProfile, weight: 20 };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Weight must be between 30-300 kg');
    });

    it('should reject invalid weight (too high)', () => {
      const profile = { ...validProfile, weight: 350 };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Weight must be between 30-300 kg');
    });

    it('should reject invalid age (too young)', () => {
      const profile = { ...validProfile, age: 10 };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Age must be between 13-100 years');
    });

    it('should reject invalid age (too old)', () => {
      const profile = { ...validProfile, age: 120 };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Age must be between 13-100 years');
    });

    it('should reject invalid body fat percentage (too low)', () => {
      const profile = { ...validProfile, body_fat_percentage: 2 };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Body fat percentage must be between 3-50%');
    });

    it('should reject invalid body fat percentage (too high)', () => {
      const profile = { ...validProfile, body_fat_percentage: 60 };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Body fat percentage must be between 3-50%');
    });

    it('should accept profile without body fat percentage', () => {
      const profile = { ...validProfile };
      delete profile.body_fat_percentage;
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid activity level', () => {
      const profile = { ...validProfile, activity_level: 'super_active' as any };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Activity level'))).toBe(true);
    });

    it('should reject invalid goal', () => {
      const profile = { ...validProfile, goal: 'get_ripped' as any };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Goal'))).toBe(true);
    });

    it('should reject invalid diet type', () => {
      const profile = { ...validProfile, diet_type: 'carnivore' as any };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Diet type'))).toBe(true);
    });

    it('should reject invalid meals per day', () => {
      const profile = { ...validProfile, meals_per_day: 7 as any };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Meals per day must be 3, 4, 5, or 6');
    });

    it('should reject invalid snacks per day', () => {
      const profile = { ...validProfile, snacks_per_day: 5 as any };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Snacks per day must be 0, 1, 2, or 3');
    });

    it('should reject invalid cooking time', () => {
      const profile = { ...validProfile, cooking_time: 'instant' as any };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Cooking time'))).toBe(true);
    });

    it('should reject non-array cuisine preference', () => {
      const profile = { ...validProfile, cuisine_preference: 'italian' as any };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cuisine preference must be an array');
    });

    it('should reject invalid budget level', () => {
      const profile = { ...validProfile, budget_level: 'luxury' as any };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Budget level'))).toBe(true);
    });

    it('should reject invalid training level', () => {
      const profile = { ...validProfile, training_level: 'expert' as any };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Training level'))).toBe(true);
    });

    it('should reject invalid workout days per week (too low)', () => {
      const profile = { ...validProfile, workout_days_per_week: 0 };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Workout days per week must be between 1-7');
    });

    it('should reject invalid workout days per week (too high)', () => {
      const profile = { ...validProfile, workout_days_per_week: 8 };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Workout days per week must be between 1-7');
    });

    it('should reject invalid subscription tier', () => {
      const profile = { ...validProfile, subscription_tier: 'premium' as any };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Subscription tier'))).toBe(true);
    });

    it('should reject invalid plan duration (too short)', () => {
      const profile = { ...validProfile, plan_duration_weeks: 0 };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Plan duration must be between 1-52 weeks');
    });

    it('should reject invalid plan duration (too long)', () => {
      const profile = { ...validProfile, plan_duration_weeks: 60 };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Plan duration must be between 1-52 weeks');
    });

    it('should accumulate multiple errors', () => {
      const profile = {
        ...validProfile,
        height: 50,
        weight: 20,
        age: 10,
        body_fat_percentage: 60
      };
      const result = validateUserProfile(profile);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validateField', () => {
    it('should validate height field', () => {
      const error = validateField('height', 50);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('Height must be between 100-250 cm');
    });

    it('should accept valid height', () => {
      const error = validateField('height', 175);
      expect(error).toBeNull();
    });

    it('should validate weight field', () => {
      const error = validateField('weight', 20);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('Weight must be between 30-300 kg');
    });

    it('should validate age field', () => {
      const error = validateField('age', 10);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('Age must be between 13-100 years');
    });

    it('should validate body fat percentage field', () => {
      const error = validateField('body_fat_percentage', 60);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('Body fat percentage must be between 3-50%');
    });

    it('should validate workout days per week field', () => {
      const error = validateField('workout_days_per_week', 8);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('Workout days per week must be between 1-7');
    });

    it('should validate plan duration field', () => {
      const error = validateField('plan_duration_weeks', 60);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('Plan duration must be between 1-52 weeks');
    });
  });

  describe('isProfileComplete', () => {
    it('should return true for complete profile', () => {
      expect(isProfileComplete(validProfile)).toBe(true);
    });

    it('should return false for incomplete profile (missing height)', () => {
      const profile = { ...validProfile };
      delete (profile as any).height;
      expect(isProfileComplete(profile)).toBe(false);
    });

    it('should return false for incomplete profile (missing goal)', () => {
      const profile = { ...validProfile };
      delete (profile as any).goal;
      expect(isProfileComplete(profile)).toBe(false);
    });

    it('should return false for empty profile', () => {
      expect(isProfileComplete({})).toBe(false);
    });

    it('should return true even without optional body_fat_percentage', () => {
      const profile = { ...validProfile };
      delete profile.body_fat_percentage;
      // body_fat_percentage is optional, so profile should still be complete
      // However, isProfileComplete checks for all fields including optional ones
      // Let's verify the actual behavior
      const result = isProfileComplete(profile);
      // Since body_fat_percentage is not in requiredFields, it should be true
      expect(result).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle boundary values for height', () => {
      const profile1 = { ...validProfile, height: 100 };
      const profile2 = { ...validProfile, height: 250 };
      expect(validateUserProfile(profile1).isValid).toBe(true);
      expect(validateUserProfile(profile2).isValid).toBe(true);
    });

    it('should handle boundary values for weight', () => {
      const profile1 = { ...validProfile, weight: 30 };
      const profile2 = { ...validProfile, weight: 300 };
      expect(validateUserProfile(profile1).isValid).toBe(true);
      expect(validateUserProfile(profile2).isValid).toBe(true);
    });

    it('should handle boundary values for age', () => {
      const profile1 = { ...validProfile, age: 13 };
      const profile2 = { ...validProfile, age: 100 };
      expect(validateUserProfile(profile1).isValid).toBe(true);
      expect(validateUserProfile(profile2).isValid).toBe(true);
    });

    it('should handle boundary values for body fat percentage', () => {
      const profile1 = { ...validProfile, body_fat_percentage: 3 };
      const profile2 = { ...validProfile, body_fat_percentage: 50 };
      expect(validateUserProfile(profile1).isValid).toBe(true);
      expect(validateUserProfile(profile2).isValid).toBe(true);
    });

    it('should handle all valid genders', () => {
      const genders: Array<'male' | 'female' | 'other'> = ['male', 'female', 'other'];
      genders.forEach(gender => {
        const profile = { ...validProfile, gender };
        expect(validateUserProfile(profile).isValid).toBe(true);
      });
    });

    it('should handle all valid activity levels', () => {
      const levels: Array<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'> = 
        ['sedentary', 'light', 'moderate', 'active', 'very_active'];
      levels.forEach(activity_level => {
        const profile = { ...validProfile, activity_level };
        expect(validateUserProfile(profile).isValid).toBe(true);
      });
    });

    it('should handle all valid goals', () => {
      const goals: Array<'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance'> = 
        ['fat_loss', 'muscle_gain', 'recomposition', 'endurance'];
      goals.forEach(goal => {
        const profile = { ...validProfile, goal };
        expect(validateUserProfile(profile).isValid).toBe(true);
      });
    });

    it('should handle all valid diet types', () => {
      const dietTypes: Array<'standard' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean'> = 
        ['standard', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean'];
      dietTypes.forEach(diet_type => {
        const profile = { ...validProfile, diet_type };
        expect(validateUserProfile(profile).isValid).toBe(true);
      });
    });

    it('should handle all valid meals per day', () => {
      const mealsPerDay: Array<3 | 4 | 5 | 6> = [3, 4, 5, 6];
      mealsPerDay.forEach(meals_per_day => {
        const profile = { ...validProfile, meals_per_day };
        expect(validateUserProfile(profile).isValid).toBe(true);
      });
    });

    it('should handle all valid snacks per day', () => {
      const snacksPerDay: Array<0 | 1 | 2 | 3> = [0, 1, 2, 3];
      snacksPerDay.forEach(snacks_per_day => {
        const profile = { ...validProfile, snacks_per_day };
        expect(validateUserProfile(profile).isValid).toBe(true);
      });
    });

    it('should handle empty cuisine preference array', () => {
      const profile = { ...validProfile, cuisine_preference: [] };
      expect(validateUserProfile(profile).isValid).toBe(true);
    });
  });
});
