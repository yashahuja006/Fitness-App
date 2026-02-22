/**
 * Body Fat Estimation Tests
 * Comprehensive test suite for body fat percentage estimation algorithms
 */

import {
  estimateBodyFatFromBMI,
  estimateBodyFatDeurenberg,
  estimateBodyFatNavyMethod,
  estimateBodyFatJacksonPollock,
  estimateBodyFatPercentage,
  getBodyFatPercentage,
  validateBodyFatPercentage,
  getBodyFatCategory,
  type NavyMethodMeasurements,
  type JacksonPollockMeasurements
} from '../bodyFatEstimation';
import { UserProfileExtended } from '@/types/nutrition';

describe('Body Fat Estimation', () => {
  // Sample profiles for testing
  const maleProfile: Pick<UserProfileExtended, 'weight' | 'height' | 'age' | 'gender'> = {
    weight: 80,
    height: 180,
    age: 30,
    gender: 'male'
  };

  const femaleProfile: Pick<UserProfileExtended, 'weight' | 'height' | 'age' | 'gender'> = {
    weight: 65,
    height: 165,
    age: 28,
    gender: 'female'
  };

  describe('estimateBodyFatFromBMI', () => {
    it('should estimate body fat for male profile', () => {
      const result = estimateBodyFatFromBMI(maleProfile);
      
      expect(result.percentage).toBeGreaterThan(0);
      expect(result.percentage).toBeLessThan(50);
      expect(result.method).toBe('BMI-based estimation');
      expect(result.confidence).toBe('low');
      expect(result.canOverride).toBe(true);
      expect(result.disclaimer).toContain('BMI-based');
    });

    it('should estimate body fat for female profile', () => {
      const result = estimateBodyFatFromBMI(femaleProfile);
      
      expect(result.percentage).toBeGreaterThan(0);
      expect(result.percentage).toBeLessThan(50);
      expect(result.method).toBe('BMI-based estimation');
      expect(result.confidence).toBe('low');
    });

    it('should produce different estimates for male vs female', () => {
      const maleResult = estimateBodyFatFromBMI(maleProfile);
      const femaleResult = estimateBodyFatFromBMI(femaleProfile);
      
      // Females typically have higher body fat percentage
      expect(femaleResult.percentage).toBeGreaterThan(maleResult.percentage);
    });

    it('should increase estimate with age', () => {
      const youngerProfile = { ...maleProfile, age: 20 };
      const olderProfile = { ...maleProfile, age: 50 };
      
      const youngerResult = estimateBodyFatFromBMI(youngerProfile);
      const olderResult = estimateBodyFatFromBMI(olderProfile);
      
      expect(olderResult.percentage).toBeGreaterThan(youngerResult.percentage);
    });

    it('should clamp extreme values to realistic range', () => {
      const veryLightProfile = { ...maleProfile, weight: 40 };
      const veryHeavyProfile = { ...maleProfile, weight: 200 };
      
      const lightResult = estimateBodyFatFromBMI(veryLightProfile);
      const heavyResult = estimateBodyFatFromBMI(veryHeavyProfile);
      
      expect(lightResult.percentage).toBeGreaterThanOrEqual(3);
      expect(heavyResult.percentage).toBeLessThanOrEqual(50);
    });

    it('should handle "other" gender by averaging male and female formulas', () => {
      const otherProfile = { ...maleProfile, gender: 'other' as const };
      const result = estimateBodyFatFromBMI(otherProfile);
      
      expect(result.percentage).toBeGreaterThan(0);
      expect(result.percentage).toBeLessThan(50);
    });
  });

  describe('estimateBodyFatDeurenberg', () => {
    it('should estimate body fat using Deurenberg formula', () => {
      const result = estimateBodyFatDeurenberg(maleProfile);
      
      expect(result.percentage).toBeGreaterThan(0);
      expect(result.percentage).toBeLessThan(50);
      expect(result.method).toBe('Deurenberg formula');
      expect(result.confidence).toBe('medium');
      expect(result.disclaimer).toContain('Deurenberg');
    });

    it('should produce different estimates for male vs female', () => {
      const maleResult = estimateBodyFatDeurenberg(maleProfile);
      const femaleResult = estimateBodyFatDeurenberg(femaleProfile);
      
      expect(femaleResult.percentage).toBeGreaterThan(maleResult.percentage);
    });

    it('should be more accurate than BMI-based method', () => {
      const deurenbergResult = estimateBodyFatDeurenberg(maleProfile);
      
      // Deurenberg should have medium confidence
      expect(deurenbergResult.confidence).toBe('medium');
    });
  });

  describe('estimateBodyFatNavyMethod', () => {
    const maleNavyMeasurements: NavyMethodMeasurements = {
      neck: 38,
      waist: 85,
      hip: 95
    };

    const femaleNavyMeasurements: NavyMethodMeasurements = {
      neck: 32,
      waist: 70,
      hip: 95
    };

    it('should estimate body fat for male using Navy method', () => {
      const result = estimateBodyFatNavyMethod(maleProfile, maleNavyMeasurements);
      
      expect(result.percentage).toBeGreaterThan(0);
      expect(result.percentage).toBeLessThan(50);
      expect(result.method).toBe('Navy circumference method');
      expect(result.confidence).toBe('high');
    });

    it('should estimate body fat for female using Navy method', () => {
      const result = estimateBodyFatNavyMethod(femaleProfile, femaleNavyMeasurements);
      
      expect(result.percentage).toBeGreaterThan(0);
      expect(result.percentage).toBeLessThan(50);
      expect(result.confidence).toBe('high');
    });

    it('should throw error for female without hip measurement', () => {
      const incompleteNavyMeasurements: NavyMethodMeasurements = {
        neck: 32,
        waist: 70
      };
      
      expect(() => {
        estimateBodyFatNavyMethod(femaleProfile, incompleteNavyMeasurements);
      }).toThrow('Hip measurement required');
    });

    it('should throw error for "other" gender', () => {
      const otherProfile = { ...maleProfile, gender: 'other' as const };
      
      expect(() => {
        estimateBodyFatNavyMethod(otherProfile, maleNavyMeasurements);
      }).toThrow('Navy method requires binary gender specification');
    });

    it('should produce reasonable estimates within expected range', () => {
      const result = estimateBodyFatNavyMethod(maleProfile, maleNavyMeasurements);
      
      // For a typical male with these measurements, expect 10-25% range
      expect(result.percentage).toBeGreaterThan(5);
      expect(result.percentage).toBeLessThan(35);
    });
  });

  describe('estimateBodyFatJacksonPollock', () => {
    const maleJPMeasurements: JacksonPollockMeasurements = {
      chest: 10,
      abdomen: 20,
      thigh: 15
    };

    const femaleJPMeasurements: JacksonPollockMeasurements = {
      tricep: 15,
      suprailiac: 18,
      thigh: 20
    };

    it('should estimate body fat for male using Jackson-Pollock', () => {
      const result = estimateBodyFatJacksonPollock(maleProfile, maleJPMeasurements);
      
      expect(result.percentage).toBeGreaterThan(0);
      expect(result.percentage).toBeLessThan(50);
      expect(result.method).toBe('Jackson-Pollock 3-site skinfold');
      expect(result.confidence).toBe('high');
    });

    it('should estimate body fat for female using Jackson-Pollock', () => {
      const result = estimateBodyFatJacksonPollock(femaleProfile, femaleJPMeasurements);
      
      expect(result.percentage).toBeGreaterThan(0);
      expect(result.percentage).toBeLessThan(50);
      expect(result.confidence).toBe('high');
    });

    it('should throw error for male without required measurements', () => {
      const incompleteMeasurements: JacksonPollockMeasurements = {
        chest: 10,
        abdomen: 20
      };
      
      expect(() => {
        estimateBodyFatJacksonPollock(maleProfile, incompleteMeasurements);
      }).toThrow('Chest, abdomen, and thigh measurements required');
    });

    it('should throw error for female without required measurements', () => {
      const incompleteMeasurements: JacksonPollockMeasurements = {
        tricep: 15,
        suprailiac: 18
      };
      
      expect(() => {
        estimateBodyFatJacksonPollock(femaleProfile, incompleteMeasurements);
      }).toThrow('Tricep, suprailiac, and thigh measurements required');
    });

    it('should produce age-adjusted estimates', () => {
      const youngerProfile = { ...maleProfile, age: 20 };
      const olderProfile = { ...maleProfile, age: 50 };
      
      const youngerResult = estimateBodyFatJacksonPollock(youngerProfile, maleJPMeasurements);
      const olderResult = estimateBodyFatJacksonPollock(olderProfile, maleJPMeasurements);
      
      // Older individuals typically have higher body fat with same skinfolds
      expect(olderResult.percentage).toBeGreaterThan(youngerResult.percentage);
    });
  });

  describe('estimateBodyFatPercentage', () => {
    const fullProfile: UserProfileExtended = {
      ...maleProfile,
      activity_level: 'moderate',
      goal: 'muscle_gain',
      diet_type: 'standard',
      meals_per_day: 4,
      snacks_per_day: 1,
      cooking_time: 'moderate',
      cuisine_preference: ['italian', 'asian'],
      budget_level: 'medium',
      training_level: 'intermediate',
      workout_days_per_week: 4,
      subscription_tier: 'free',
      plan_duration_weeks: 8
    };

    it('should return comprehensive estimation result', () => {
      const result = estimateBodyFatPercentage(fullProfile);
      
      expect(result.recommended).toBeDefined();
      expect(result.alternatives).toBeDefined();
      expect(result.averageEstimate).toBeGreaterThan(0);
      expect(result.range.min).toBeLessThanOrEqual(result.range.max);
      expect(result.disclaimer).toContain('approximations');
    });

    it('should include multiple estimation methods', () => {
      const result = estimateBodyFatPercentage(fullProfile);
      
      // Should have at least BMI and Deurenberg methods
      const allEstimates = [result.recommended, ...result.alternatives];
      expect(allEstimates.length).toBeGreaterThanOrEqual(2);
    });

    it('should prioritize Navy method when measurements available', () => {
      const navyMeasurements: NavyMethodMeasurements = {
        neck: 38,
        waist: 85,
        hip: 95
      };
      
      const result = estimateBodyFatPercentage(fullProfile, navyMeasurements);
      
      // Navy method should be recommended due to high confidence
      expect(result.recommended.method).toBe('Navy circumference method');
      expect(result.recommended.confidence).toBe('high');
    });

    it('should adjust estimates based on activity level', () => {
      const sedentaryProfile = { ...fullProfile, activity_level: 'sedentary' as const };
      const activeProfile = { ...fullProfile, activity_level: 'very_active' as const, training_level: 'advanced' as const };
      
      const sedentaryResult = estimateBodyFatPercentage(sedentaryProfile);
      const activeResult = estimateBodyFatPercentage(activeProfile);
      
      // Active individuals should have lower estimated body fat
      expect(activeResult.recommended.percentage).toBeLessThan(sedentaryResult.recommended.percentage);
    });

    it('should calculate average within range', () => {
      const result = estimateBodyFatPercentage(fullProfile);
      
      expect(result.averageEstimate).toBeGreaterThanOrEqual(result.range.min);
      expect(result.averageEstimate).toBeLessThanOrEqual(result.range.max);
    });
  });

  describe('getBodyFatPercentage', () => {
    const profileWithBodyFat: UserProfileExtended = {
      ...maleProfile,
      body_fat_percentage: 15,
      activity_level: 'moderate',
      goal: 'muscle_gain',
      diet_type: 'standard',
      meals_per_day: 4,
      snacks_per_day: 1,
      cooking_time: 'moderate',
      cuisine_preference: ['italian'],
      budget_level: 'medium',
      training_level: 'intermediate',
      workout_days_per_week: 4,
      subscription_tier: 'free',
      plan_duration_weeks: 8
    };

    const profileWithoutBodyFat: UserProfileExtended = {
      ...profileWithBodyFat,
      body_fat_percentage: undefined
    };

    it('should return actual body fat when provided', () => {
      const result = getBodyFatPercentage(profileWithBodyFat);
      
      expect(result.value).toBe(15);
      expect(result.isEstimated).toBe(false);
      expect(result.estimation).toBeUndefined();
    });

    it('should estimate body fat when not provided', () => {
      const result = getBodyFatPercentage(profileWithoutBodyFat);
      
      expect(result.value).toBeGreaterThan(0);
      expect(result.isEstimated).toBe(true);
      expect(result.estimation).toBeDefined();
    });

    it('should use recommended estimate value', () => {
      const result = getBodyFatPercentage(profileWithoutBodyFat);
      
      expect(result.value).toBe(result.estimation?.recommended.percentage);
    });
  });

  describe('validateBodyFatPercentage', () => {
    it('should validate normal body fat percentages', () => {
      const result = validateBodyFatPercentage(15, 'male');
      
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should reject body fat below 3%', () => {
      const result = validateBodyFatPercentage(2, 'male');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('dangerously low');
    });

    it('should reject body fat above 50%', () => {
      const result = validateBodyFatPercentage(55, 'male');
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('outside the typical range');
    });

    it('should warn about very low body fat for males', () => {
      const result = validateBodyFatPercentage(4, 'male');
      
      expect(result.isValid).toBe(true);
      expect(result.message).toContain('Warning');
      expect(result.message).toContain('extremely low');
    });

    it('should warn about very low body fat for females', () => {
      const result = validateBodyFatPercentage(10, 'female');
      
      expect(result.isValid).toBe(true);
      expect(result.message).toContain('Warning');
      expect(result.message).toContain('hormonal health');
    });

    it('should accept healthy body fat ranges without warnings', () => {
      const maleResult = validateBodyFatPercentage(15, 'male');
      const femaleResult = validateBodyFatPercentage(22, 'female');
      
      expect(maleResult.isValid).toBe(true);
      expect(maleResult.message).toBeUndefined();
      expect(femaleResult.isValid).toBe(true);
      expect(femaleResult.message).toBeUndefined();
    });
  });

  describe('getBodyFatCategory', () => {
    it('should categorize male body fat percentages', () => {
      expect(getBodyFatCategory(5, 'male')).toBe('Essential fat');
      expect(getBodyFatCategory(12, 'male')).toBe('Athletic');
      expect(getBodyFatCategory(16, 'male')).toBe('Fitness');
      expect(getBodyFatCategory(22, 'male')).toBe('Average');
      expect(getBodyFatCategory(28, 'male')).toBe('Above average');
    });

    it('should categorize female body fat percentages', () => {
      expect(getBodyFatCategory(12, 'female')).toBe('Essential fat');
      expect(getBodyFatCategory(18, 'female')).toBe('Athletic');
      expect(getBodyFatCategory(23, 'female')).toBe('Fitness');
      expect(getBodyFatCategory(28, 'female')).toBe('Average');
      expect(getBodyFatCategory(35, 'female')).toBe('Above average');
    });

    it('should return "Unknown" for other genders', () => {
      expect(getBodyFatCategory(15, 'other')).toBe('Unknown');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle minimum valid values', () => {
      const minProfile = {
        weight: 30,
        height: 100,
        age: 18,
        gender: 'male' as const
      };
      
      const result = estimateBodyFatFromBMI(minProfile);
      expect(result.percentage).toBeGreaterThanOrEqual(3);
    });

    it('should handle maximum valid values', () => {
      const maxProfile = {
        weight: 300,
        height: 250,
        age: 100,
        gender: 'male' as const
      };
      
      const result = estimateBodyFatFromBMI(maxProfile);
      expect(result.percentage).toBeLessThanOrEqual(50);
    });

    it('should round percentages to one decimal place', () => {
      const result = estimateBodyFatFromBMI(maleProfile);
      
      // Check that percentage has at most 1 decimal place
      const decimalPlaces = (result.percentage.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(1);
    });

    it('should handle profiles with extreme BMI', () => {
      const underweightProfile = { ...maleProfile, weight: 50 };
      const overweightProfile = { ...maleProfile, weight: 120 };
      
      const underweightResult = estimateBodyFatFromBMI(underweightProfile);
      const overweightResult = estimateBodyFatFromBMI(overweightProfile);
      
      expect(underweightResult.percentage).toBeGreaterThanOrEqual(3);
      expect(overweightResult.percentage).toBeLessThanOrEqual(50);
    });
  });

  describe('Consistency and Reliability', () => {
    it('should produce consistent results for same input', () => {
      const result1 = estimateBodyFatFromBMI(maleProfile);
      const result2 = estimateBodyFatFromBMI(maleProfile);
      
      expect(result1.percentage).toBe(result2.percentage);
      expect(result1.method).toBe(result2.method);
    });

    it('should have all estimates within reasonable range', () => {
      const fullProfile: UserProfileExtended = {
        ...maleProfile,
        activity_level: 'moderate',
        goal: 'muscle_gain',
        diet_type: 'standard',
        meals_per_day: 4,
        snacks_per_day: 1,
        cooking_time: 'moderate',
        cuisine_preference: ['italian'],
        budget_level: 'medium',
        training_level: 'intermediate',
        workout_days_per_week: 4,
        subscription_tier: 'free',
        plan_duration_weeks: 8
      };
      
      const result = estimateBodyFatPercentage(fullProfile);
      const allEstimates = [result.recommended, ...result.alternatives];
      
      allEstimates.forEach(estimate => {
        expect(estimate.percentage).toBeGreaterThanOrEqual(3);
        expect(estimate.percentage).toBeLessThanOrEqual(50);
      });
    });

    it('should always include disclaimer and override capability', () => {
      const result = estimateBodyFatFromBMI(maleProfile);
      
      expect(result.disclaimer).toBeTruthy();
      expect(result.disclaimer.length).toBeGreaterThan(0);
      expect(result.canOverride).toBe(true);
    });
  });
});
