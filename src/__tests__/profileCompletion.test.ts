/**
 * Tests for Profile Completion Tracking
 */

import {
  calculateProfileCompletion,
  getMissingRequiredFields,
  isProfileReadyForPlanGeneration,
  getCategoryCompletionStatus,
  getFieldMetadata,
  getAllFieldMetadata,
  getFieldMetadataByCategory
} from '@/utils/profileCompletion';
import { UserProfileExtended, ProfileFieldCategory } from '@/types/nutrition';

describe('Profile Completion Tracking', () => {
  
  describe('calculateProfileCompletion', () => {
    it('should return 0% completion for empty profile', () => {
      const emptyProfile: Partial<UserProfileExtended> = {};
      const status = calculateProfileCompletion(emptyProfile);
      
      expect(status.completionPercentage).toBe(0);
      expect(status.isComplete).toBe(false);
      expect(status.completedFields).toBe(0);
      expect(status.missingRequiredFields.length).toBeGreaterThan(0);
    });
    
    it('should return 100% completion for fully complete profile', () => {
      const completeProfile: UserProfileExtended = {
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
        cuisine_preference: ['Italian', 'Asian'],
        budget_level: 'medium',
        training_level: 'intermediate',
        workout_days_per_week: 4,
        subscription_tier: 'pro',
        plan_duration_weeks: 8
      };
      
      const status = calculateProfileCompletion(completeProfile);
      
      expect(status.completionPercentage).toBe(100);
      expect(status.isComplete).toBe(true);
      expect(status.completedFields).toBe(17);
      expect(status.missingRequiredFields.length).toBe(0);
    });
    
    it('should calculate partial completion correctly', () => {
      const partialProfile: Partial<UserProfileExtended> = {
        height: 175,
        weight: 75,
        age: 30,
        gender: 'male'
      };
      
      const status = calculateProfileCompletion(partialProfile);
      
      expect(status.completionPercentage).toBeGreaterThan(0);
      expect(status.completionPercentage).toBeLessThan(100);
      expect(status.isComplete).toBe(false);
      expect(status.completedFields).toBe(4);
    });
    
    it('should handle optional fields correctly', () => {
      const profileWithoutBodyFat: Partial<UserProfileExtended> = {
        height: 175,
        weight: 75,
        age: 30,
        gender: 'male',
        activity_level: 'moderate',
        goal: 'fat_loss',
        diet_type: 'standard',
        meals_per_day: 3,
        snacks_per_day: 1,
        cooking_time: 'quick',
        cuisine_preference: ['Mediterranean'],
        budget_level: 'medium',
        training_level: 'beginner',
        workout_days_per_week: 3,
        subscription_tier: 'free',
        plan_duration_weeks: 4
      };
      
      const status = calculateProfileCompletion(profileWithoutBodyFat);
      
      // Should be complete even without body_fat_percentage (optional field)
      expect(status.isComplete).toBe(true);
      expect(status.missingOptionalFields.length).toBe(1);
      expect(status.missingOptionalFields[0].field).toBe('body_fat_percentage');
    });
    
    it('should provide next recommended fields', () => {
      const partialProfile: Partial<UserProfileExtended> = {
        height: 175,
        weight: 75
      };
      
      const status = calculateProfileCompletion(partialProfile);
      
      expect(status.nextRecommendedFields.length).toBeGreaterThan(0);
      expect(status.nextRecommendedFields.length).toBeLessThanOrEqual(3);
      // Should recommend fields by priority
      expect(status.nextRecommendedFields[0].priority).toBeLessThanOrEqual(
        status.nextRecommendedFields.at(-1)!.priority
      );
    });
    
    it('should generate appropriate user-friendly messages', () => {
      const emptyProfile: Partial<UserProfileExtended> = {};
      const emptyStatus = calculateProfileCompletion(emptyProfile);
      expect(emptyStatus.userFriendlyMessage).toContain('get started');
      
      const partialProfile: Partial<UserProfileExtended> = {
        height: 175,
        weight: 75,
        age: 30,
        gender: 'male'
      };
      const partialStatus = calculateProfileCompletion(partialProfile);
      expect(partialStatus.userFriendlyMessage).toBeTruthy();
      expect(partialStatus.userFriendlyMessage.length).toBeGreaterThan(0);
      
      const completeProfile: UserProfileExtended = {
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
        cuisine_preference: ['Italian'],
        budget_level: 'medium',
        training_level: 'intermediate',
        workout_days_per_week: 4,
        subscription_tier: 'pro',
        plan_duration_weeks: 8
      };
      const completeStatus = calculateProfileCompletion(completeProfile);
      expect(completeStatus.userFriendlyMessage).toContain('complete');
    });
    
    it('should track completion by category', () => {
      const profileWithBasicMetrics: Partial<UserProfileExtended> = {
        height: 175,
        weight: 75,
        age: 30,
        gender: 'male',
        body_fat_percentage: 15
      };
      
      const status = calculateProfileCompletion(profileWithBasicMetrics);
      
      expect(status.categoryCompletionPercentage[ProfileFieldCategory.BASIC_METRICS]).toBe(100);
      expect(status.categoryCompletionPercentage[ProfileFieldCategory.ACTIVITY_GOALS]).toBe(0);
      expect(status.completedFieldsByCategory[ProfileFieldCategory.BASIC_METRICS]).toBe(5);
    });
    
    it('should handle empty arrays as incomplete', () => {
      const profileWithEmptyArray: Partial<UserProfileExtended> = {
        height: 175,
        weight: 75,
        age: 30,
        gender: 'male',
        cuisine_preference: [] // Empty array should be incomplete
      };
      
      const status = calculateProfileCompletion(profileWithEmptyArray);
      
      const cuisineField = status.missingRequiredFields.find(f => f.field === 'cuisine_preference');
      expect(cuisineField).toBeDefined();
    });
    
    it('should handle empty strings as incomplete', () => {
      const profileWithEmptyString: Partial<UserProfileExtended> = {
        height: 175,
        weight: 75,
        age: 30,
        gender: '' as any // Empty string should be incomplete
      };
      
      const status = calculateProfileCompletion(profileWithEmptyString);
      
      const genderField = status.missingRequiredFields.find(f => f.field === 'gender');
      expect(genderField).toBeDefined();
    });
  });
  
  describe('getMissingRequiredFields', () => {
    it('should return all required fields for empty profile', () => {
      const emptyProfile: Partial<UserProfileExtended> = {};
      const missing = getMissingRequiredFields(emptyProfile);
      
      expect(missing.length).toBeGreaterThan(0);
      expect(missing).toContain('height');
      expect(missing).toContain('weight');
      expect(missing).toContain('age');
    });
    
    it('should return empty array for complete profile', () => {
      const completeProfile: UserProfileExtended = {
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
        cuisine_preference: ['Italian'],
        budget_level: 'medium',
        training_level: 'intermediate',
        workout_days_per_week: 4,
        subscription_tier: 'pro',
        plan_duration_weeks: 8
      };
      
      const missing = getMissingRequiredFields(completeProfile);
      expect(missing.length).toBe(0);
    });
    
    it('should not include optional fields in missing required fields', () => {
      const profileWithoutOptional: Partial<UserProfileExtended> = {
        height: 175,
        weight: 75,
        age: 30,
        gender: 'male',
        // body_fat_percentage is optional
        activity_level: 'moderate',
        goal: 'fat_loss',
        diet_type: 'standard',
        meals_per_day: 3,
        snacks_per_day: 1,
        cooking_time: 'quick',
        cuisine_preference: ['Mediterranean'],
        budget_level: 'medium',
        training_level: 'beginner',
        workout_days_per_week: 3,
        subscription_tier: 'free',
        plan_duration_weeks: 4
      };
      
      const missing = getMissingRequiredFields(profileWithoutOptional);
      expect(missing).not.toContain('body_fat_percentage');
    });
  });
  
  describe('isProfileReadyForPlanGeneration', () => {
    it('should return false for incomplete profile', () => {
      const incompleteProfile: Partial<UserProfileExtended> = {
        height: 175,
        weight: 75
      };
      
      expect(isProfileReadyForPlanGeneration(incompleteProfile)).toBe(false);
    });
    
    it('should return true for complete profile', () => {
      const completeProfile: UserProfileExtended = {
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
        cuisine_preference: ['Italian'],
        budget_level: 'medium',
        training_level: 'intermediate',
        workout_days_per_week: 4,
        subscription_tier: 'pro',
        plan_duration_weeks: 8
      };
      
      expect(isProfileReadyForPlanGeneration(completeProfile)).toBe(true);
    });
    
    it('should return true even without optional fields', () => {
      const profileWithoutOptional: Partial<UserProfileExtended> = {
        height: 175,
        weight: 75,
        age: 30,
        gender: 'male',
        activity_level: 'moderate',
        goal: 'fat_loss',
        diet_type: 'standard',
        meals_per_day: 3,
        snacks_per_day: 1,
        cooking_time: 'quick',
        cuisine_preference: ['Mediterranean'],
        budget_level: 'medium',
        training_level: 'beginner',
        workout_days_per_week: 3,
        subscription_tier: 'free',
        plan_duration_weeks: 4
      };
      
      expect(isProfileReadyForPlanGeneration(profileWithoutOptional)).toBe(true);
    });
  });
  
  describe('getCategoryCompletionStatus', () => {
    it('should calculate category completion correctly', () => {
      const profileWithBasicMetrics: Partial<UserProfileExtended> = {
        height: 175,
        weight: 75,
        age: 30,
        gender: 'male',
        body_fat_percentage: 15
      };
      
      const basicMetricsStatus = getCategoryCompletionStatus(
        profileWithBasicMetrics,
        ProfileFieldCategory.BASIC_METRICS
      );
      
      expect(basicMetricsStatus.percentage).toBe(100);
      expect(basicMetricsStatus.completed).toBe(5);
      expect(basicMetricsStatus.total).toBe(5);
      expect(basicMetricsStatus.missingFields.length).toBe(0);
      
      const activityGoalsStatus = getCategoryCompletionStatus(
        profileWithBasicMetrics,
        ProfileFieldCategory.ACTIVITY_GOALS
      );
      
      expect(activityGoalsStatus.percentage).toBe(0);
      expect(activityGoalsStatus.completed).toBe(0);
      expect(activityGoalsStatus.missingFields.length).toBeGreaterThan(0);
    });
    
    it('should handle partial category completion', () => {
      const partialProfile: Partial<UserProfileExtended> = {
        height: 175,
        weight: 75,
        age: 30
        // Missing gender and body_fat_percentage
      };
      
      const status = getCategoryCompletionStatus(
        partialProfile,
        ProfileFieldCategory.BASIC_METRICS
      );
      
      expect(status.percentage).toBeGreaterThan(0);
      expect(status.percentage).toBeLessThan(100);
      expect(status.completed).toBe(3);
      expect(status.missingFields.length).toBeGreaterThan(0);
    });
  });
  
  describe('Field Metadata Functions', () => {
    it('should get metadata for specific field', () => {
      const heightMeta = getFieldMetadata('height');
      
      expect(heightMeta).toBeDefined();
      expect(heightMeta?.field).toBe('height');
      expect(heightMeta?.category).toBe(ProfileFieldCategory.BASIC_METRICS);
      expect(heightMeta?.required).toBe(true);
      expect(heightMeta?.displayName).toBeTruthy();
      expect(heightMeta?.description).toBeTruthy();
    });
    
    it('should return undefined for invalid field', () => {
      const invalidMeta = getFieldMetadata('invalid_field' as any);
      expect(invalidMeta).toBeUndefined();
    });
    
    it('should get all field metadata', () => {
      const allMetadata = getAllFieldMetadata();
      
      expect(allMetadata.length).toBe(17); // Total number of fields
      expect(allMetadata.every(meta => meta.field && meta.category)).toBe(true);
    });
    
    it('should get field metadata by category', () => {
      const basicMetricsFields = getFieldMetadataByCategory(ProfileFieldCategory.BASIC_METRICS);
      
      expect(basicMetricsFields.length).toBe(5);
      expect(basicMetricsFields.every(meta => meta.category === ProfileFieldCategory.BASIC_METRICS)).toBe(true);
      expect(basicMetricsFields.map(m => m.field)).toContain('height');
      expect(basicMetricsFields.map(m => m.field)).toContain('weight');
    });
    
    it('should have correct priority ordering', () => {
      const allMetadata = getAllFieldMetadata();
      
      // Check that priorities are unique and sequential
      const priorities = allMetadata.map(m => m.priority).sort((a, b) => a - b);
      expect(priorities[0]).toBe(1); // Should start at 1
      expect(priorities.at(-1)).toBe(17); // Should end at 17
    });
  });
  
  describe('Progressive Profile Building', () => {
    it('should recommend fields in priority order', () => {
      const emptyProfile: Partial<UserProfileExtended> = {};
      const status = calculateProfileCompletion(emptyProfile);
      
      // First recommended field should be height (priority 1)
      expect(status.nextRecommendedFields[0].field).toBe('height');
    });
    
    it('should update recommendations as profile is built', () => {
      const step1: Partial<UserProfileExtended> = {
        height: 175
      };
      const status1 = calculateProfileCompletion(step1);
      expect(status1.nextRecommendedFields[0].field).toBe('weight');
      
      const step2: Partial<UserProfileExtended> = {
        height: 175,
        weight: 75
      };
      const status2 = calculateProfileCompletion(step2);
      expect(status2.nextRecommendedFields[0].field).toBe('age');
      
      const step3: Partial<UserProfileExtended> = {
        height: 175,
        weight: 75,
        age: 30
      };
      const status3 = calculateProfileCompletion(step3);
      expect(status3.nextRecommendedFields[0].field).toBe('gender');
    });
    
    it('should provide encouraging messages at different completion stages', () => {
      const stages = [
        { profile: {}, expectedKeyword: 'started' },
        { profile: { height: 175, weight: 75 }, expectedKeyword: 'start' },
        { 
          profile: { 
            height: 175, 
            weight: 75, 
            age: 30, 
            gender: 'male' as const,
            activity_level: 'moderate' as const,
            goal: 'muscle_gain' as const,
            diet_type: 'standard' as const,
            meals_per_day: 4 as const
          }, 
          expectedKeyword: 'complete' 
        }
      ];
      
      for (const stage of stages) {
        const status = calculateProfileCompletion(stage.profile);
        expect(status.userFriendlyMessage.toLowerCase()).toContain(stage.expectedKeyword);
      }
    });
  });
});
