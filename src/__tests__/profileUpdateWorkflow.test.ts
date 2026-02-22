/**
 * Tests for Profile Update Workflows
 */

import {
  applySingleFieldUpdate,
  applyMultipleFieldUpdates,
  getUpdateHistory,
  rollbackToUpdate,
  clearUpdateHistory,
  getMostRecentUpdate,
  applyOptimisticUpdate,
  batchUpdateProfiles
} from '@/utils/profileUpdateWorkflow';
import { UserProfileExtended } from '@/types/nutrition';

describe('Profile Update Workflows', () => {
  // Base valid profile for testing
  const baseProfile: UserProfileExtended = {
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

  beforeEach(() => {
    // Clear history before each test
    clearUpdateHistory('test-user');
  });

  describe('applySingleFieldUpdate', () => {
    it('should successfully update a single field', () => {
      const result = applySingleFieldUpdate(
        baseProfile,
        'weight',
        80,
        { userId: 'test-user' }
      );

      expect(result.success).toBe(true);
      expect(result.updatedProfile?.weight).toBe(80);
      expect(result.updateId).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should reject invalid field values', () => {
      const result = applySingleFieldUpdate(
        baseProfile,
        'weight',
        500, // Invalid: exceeds max
        { userId: 'test-user' }
      );

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].field).toBe('weight');
    });

    it('should track update history', () => {
      applySingleFieldUpdate(
        baseProfile,
        'weight',
        80,
        { userId: 'test-user', trackHistory: true }
      );

      const history = getUpdateHistory('test-user');
      expect(history.length).toBe(1);
      expect(history[0].updates[0].field).toBe('weight');
      expect(history[0].updates[0].value).toBe(80);
      expect(history[0].previousValues.weight).toBe(75);
    });

    it('should not track history when disabled', () => {
      applySingleFieldUpdate(
        baseProfile,
        'weight',
        80,
        { userId: 'test-user', trackHistory: false }
      );

      const history = getUpdateHistory('test-user');
      expect(history.length).toBe(0);
    });

    it('should skip validation when disabled', () => {
      const result = applySingleFieldUpdate(
        baseProfile,
        'weight',
        500, // Invalid value
        { userId: 'test-user', validateBeforeApply: false }
      );

      expect(result.success).toBe(true);
      expect(result.updatedProfile?.weight).toBe(500);
    });
  });

  describe('applyMultipleFieldUpdates', () => {
    it('should successfully update multiple fields', () => {
      const updates = {
        weight: 80,
        height: 180,
        age: 31
      };

      const result = applyMultipleFieldUpdates(
        baseProfile,
        updates,
        { userId: 'test-user' }
      );

      expect(result.success).toBe(true);
      expect(result.updatedProfile?.weight).toBe(80);
      expect(result.updatedProfile?.height).toBe(180);
      expect(result.updatedProfile?.age).toBe(31);
    });

    it('should reject if any field is invalid', () => {
      const updates = {
        weight: 80,
        height: 500 // Invalid: exceeds max
      };

      const result = applyMultipleFieldUpdates(
        baseProfile,
        updates,
        { userId: 'test-user' }
      );

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should track all updates in history', () => {
      const updates = {
        weight: 80,
        height: 180
      };

      applyMultipleFieldUpdates(
        baseProfile,
        updates,
        { userId: 'test-user' }
      );

      const history = getUpdateHistory('test-user');
      expect(history.length).toBe(1);
      expect(history[0].updates.length).toBe(2);
      expect(history[0].previousValues.weight).toBe(75);
      expect(history[0].previousValues.height).toBe(175);
    });

    it('should update complex fields like arrays', () => {
      const updates = {
        cuisine_preference: ['mexican', 'indian', 'thai']
      };

      const result = applyMultipleFieldUpdates(
        baseProfile,
        updates,
        { userId: 'test-user' }
      );

      expect(result.success).toBe(true);
      expect(result.updatedProfile?.cuisine_preference).toEqual(['mexican', 'indian', 'thai']);
    });
  });

  describe('rollbackToUpdate', () => {
    it('should rollback to previous state', () => {
      // Make an update
      const updateResult = applySingleFieldUpdate(
        baseProfile,
        'weight',
        80,
        { userId: 'test-user' }
      );

      expect(updateResult.updatedProfile?.weight).toBe(80);

      // Rollback
      const rollbackResult = rollbackToUpdate(
        updateResult.updatedProfile!,
        'test-user',
        updateResult.updateId!
      );

      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.updatedProfile?.weight).toBe(75); // Original value
    });

    it('should fail rollback for non-existent update ID', () => {
      const result = rollbackToUpdate(
        baseProfile,
        'test-user',
        'non-existent-id'
      );

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].message).toContain('not found');
    });

    it('should track rollback in history', () => {
      // Make an update
      const updateResult = applySingleFieldUpdate(
        baseProfile,
        'weight',
        80,
        { userId: 'test-user' }
      );

      // Rollback
      rollbackToUpdate(
        updateResult.updatedProfile!,
        'test-user',
        updateResult.updateId!
      );

      const history = getUpdateHistory('test-user');
      expect(history.length).toBe(2); // Original update + rollback
    });

    it('should rollback multiple field updates', () => {
      // Make multiple updates
      const updateResult = applyMultipleFieldUpdates(
        baseProfile,
        { weight: 80, height: 180 },
        { userId: 'test-user' }
      );

      // Rollback
      const rollbackResult = rollbackToUpdate(
        updateResult.updatedProfile!,
        'test-user',
        updateResult.updateId!
      );

      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.updatedProfile?.weight).toBe(75);
      expect(rollbackResult.updatedProfile?.height).toBe(175);
    });
  });

  describe('Update History Management', () => {
    it('should maintain chronological order', () => {
      applySingleFieldUpdate(baseProfile, 'weight', 76, { userId: 'test-user' });
      applySingleFieldUpdate(baseProfile, 'weight', 77, { userId: 'test-user' });
      applySingleFieldUpdate(baseProfile, 'weight', 78, { userId: 'test-user' });

      const history = getUpdateHistory('test-user');
      expect(history.length).toBe(3);
      expect(history[0].updates[0].value).toBe(76);
      expect(history[1].updates[0].value).toBe(77);
      expect(history[2].updates[0].value).toBe(78);
    });

    it('should get most recent update', () => {
      applySingleFieldUpdate(baseProfile, 'weight', 76, { userId: 'test-user' });
      applySingleFieldUpdate(baseProfile, 'weight', 77, { userId: 'test-user' });

      const mostRecent = getMostRecentUpdate('test-user');
      expect(mostRecent).toBeDefined();
      expect(mostRecent!.updates[0].value).toBe(77);
    });

    it('should return undefined for empty history', () => {
      const mostRecent = getMostRecentUpdate('test-user');
      expect(mostRecent).toBeUndefined();
    });

    it('should clear history', () => {
      applySingleFieldUpdate(baseProfile, 'weight', 76, { userId: 'test-user' });
      applySingleFieldUpdate(baseProfile, 'weight', 77, { userId: 'test-user' });

      clearUpdateHistory('test-user');

      const history = getUpdateHistory('test-user');
      expect(history.length).toBe(0);
    });
  });

  describe('applyOptimisticUpdate', () => {
    it('should succeed when no version conflict', () => {
      const result = applyOptimisticUpdate(
        baseProfile,
        { weight: 80 },
        { userId: 'test-user' }
      );

      expect(result.success).toBe(true);
      expect(result.updatedProfile?.weight).toBe(80);
    });

    it('should fail on version conflict with fail strategy', () => {
      // Make an initial update
      applySingleFieldUpdate(baseProfile, 'weight', 76, { userId: 'test-user' });
      const mostRecent = getMostRecentUpdate('test-user');

      // Try to update with old version
      const result = applyOptimisticUpdate(
        baseProfile,
        { weight: 80 },
        {
          userId: 'test-user',
          expectedVersion: 'old-version',
          conflictResolution: 'fail'
        }
      );

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].message).toContain('modified');
    });

    it('should overwrite on version conflict with overwrite strategy', () => {
      // Make an initial update
      applySingleFieldUpdate(baseProfile, 'weight', 76, { userId: 'test-user' });

      // Force update with overwrite strategy
      const result = applyOptimisticUpdate(
        baseProfile,
        { weight: 80 },
        {
          userId: 'test-user',
          expectedVersion: 'old-version',
          conflictResolution: 'overwrite'
        }
      );

      expect(result.success).toBe(true);
      expect(result.updatedProfile?.weight).toBe(80);
    });

    it('should merge non-conflicting fields', () => {
      // Update weight
      const firstUpdate = applySingleFieldUpdate(
        baseProfile,
        'weight',
        76,
        { userId: 'test-user' }
      );

      // Try to update height (non-conflicting field)
      const result = applyOptimisticUpdate(
        firstUpdate.updatedProfile!,
        { height: 180 },
        {
          userId: 'test-user',
          expectedVersion: 'old-version',
          conflictResolution: 'merge'
        }
      );

      expect(result.success).toBe(true);
      expect(result.updatedProfile?.height).toBe(180);
    });

    it('should detect conflicting fields in merge strategy', () => {
      // Update weight
      applySingleFieldUpdate(baseProfile, 'weight', 76, { userId: 'test-user' });

      // Try to update weight again (conflicting field)
      const result = applyOptimisticUpdate(
        baseProfile,
        { weight: 80 },
        {
          userId: 'test-user',
          expectedVersion: 'old-version',
          conflictResolution: 'merge'
        }
      );

      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('Conflicting');
    });
  });

  describe('batchUpdateProfiles', () => {
    it('should update multiple profiles', () => {
      const profiles = new Map<string, UserProfileExtended>([
        ['user1', { ...baseProfile }],
        ['user2', { ...baseProfile }],
        ['user3', { ...baseProfile }]
      ]);

      const result = batchUpdateProfiles(
        profiles,
        { weight: 80 }
      );

      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.results.size).toBe(3);
    });

    it('should handle partial failures', () => {
      const profiles = new Map<string, UserProfileExtended>([
        ['user1', { ...baseProfile }],
        ['user2', { ...baseProfile }],
        ['user3', { ...baseProfile }]
      ]);

      const result = batchUpdateProfiles(
        profiles,
        { weight: 500 } // Invalid value
      );

      expect(result.successful).toBe(0);
      expect(result.failed).toBe(3);
    });

    it('should track history for each user', () => {
      // Clear any existing history
      clearUpdateHistory('user1');
      clearUpdateHistory('user2');
      
      const profiles = new Map<string, UserProfileExtended>([
        ['user1', { ...baseProfile }],
        ['user2', { ...baseProfile }]
      ]);

      batchUpdateProfiles(
        profiles,
        { weight: 80 },
        { trackHistory: true }
      );

      expect(getUpdateHistory('user1').length).toBe(1);
      expect(getUpdateHistory('user2').length).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty updates object', () => {
      const result = applyMultipleFieldUpdates(
        baseProfile,
        {},
        { userId: 'test-user' }
      );

      expect(result.success).toBe(true);
      expect(result.updatedProfile).toEqual(baseProfile);
    });

    it('should handle updating optional fields', () => {
      const profileWithoutBodyFat = { ...baseProfile };
      delete profileWithoutBodyFat.body_fat_percentage;

      const result = applySingleFieldUpdate(
        profileWithoutBodyFat,
        'body_fat_percentage',
        18,
        { userId: 'test-user' }
      );

      expect(result.success).toBe(true);
      expect(result.updatedProfile?.body_fat_percentage).toBe(18);
    });

    it('should preserve other fields during update', () => {
      const result = applySingleFieldUpdate(
        baseProfile,
        'weight',
        80,
        { userId: 'test-user' }
      );

      expect(result.updatedProfile?.height).toBe(baseProfile.height);
      expect(result.updatedProfile?.age).toBe(baseProfile.age);
      expect(result.updatedProfile?.goal).toBe(baseProfile.goal);
    });
  });
});
