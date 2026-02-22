/**
 * Profile Update Workflow - Usage Examples
 * 
 * This file demonstrates how to use the profile update workflows
 * in various scenarios.
 */

import {
  applySingleFieldUpdate,
  applyMultipleFieldUpdates,
  getUpdateHistory,
  rollbackToUpdate,
  applyOptimisticUpdate,
  batchUpdateProfiles
} from './profileUpdateWorkflow';
import { UserProfileExtended } from '@/types/nutrition';

// Example profile
const exampleProfile: UserProfileExtended = {
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

/**
 * Example 1: Simple single field update
 * Use case: User updates their weight after a weigh-in
 */
export function example1_SimpleSingleFieldUpdate() {
  const result = applySingleFieldUpdate(
    exampleProfile,
    'weight',
    77, // New weight
    { 
      userId: 'user123',
      validateBeforeApply: true,
      trackHistory: true
    }
  );

  if (result.success) {
    console.log('Weight updated successfully!');
    console.log('New weight:', result.updatedProfile?.weight);
    console.log('Update ID:', result.updateId);
  } else {
    console.error('Update failed:', result.errors);
  }

  return result;
}

/**
 * Example 2: Multiple field update
 * Use case: User completes their profile with multiple fields at once
 */
export function example2_MultipleFieldUpdate() {
  const updates = {
    weight: 77,
    body_fat_percentage: 14,
    workout_days_per_week: 5
  };

  const result = applyMultipleFieldUpdates(
    exampleProfile,
    updates,
    { 
      userId: 'user123',
      validateBeforeApply: true,
      trackHistory: true
    }
  );

  if (result.success) {
    console.log('Profile updated successfully!');
    console.log('Updated fields:', Object.keys(updates));
  } else {
    console.error('Update failed:', result.errors);
  }

  return result;
}

/**
 * Example 3: Update with validation disabled
 * Use case: Admin override or data migration
 */
export function example3_UpdateWithoutValidation() {
  const result = applySingleFieldUpdate(
    exampleProfile,
    'weight',
    77,
    { 
      userId: 'admin',
      validateBeforeApply: false, // Skip validation
      trackHistory: true
    }
  );

  return result;
}

/**
 * Example 4: Rollback to previous state
 * Use case: User made a mistake and wants to undo their changes
 */
export function example4_RollbackUpdate() {
  // First, make an update
  const updateResult = applySingleFieldUpdate(
    exampleProfile,
    'weight',
    77,
    { userId: 'user123' }
  );

  if (!updateResult.success || !updateResult.updateId) {
    return;
  }

  // User realizes they made a mistake and wants to rollback
  const rollbackResult = rollbackToUpdate(
    updateResult.updatedProfile!,
    'user123',
    updateResult.updateId
  );

  if (rollbackResult.success) {
    console.log('Successfully rolled back to previous state');
    console.log('Weight restored to:', rollbackResult.updatedProfile?.weight);
  }

  return rollbackResult;
}

/**
 * Example 5: View update history
 * Use case: User wants to see their profile change history
 */
export function example5_ViewUpdateHistory() {
  // Make several updates
  applySingleFieldUpdate(exampleProfile, 'weight', 76, { userId: 'user123' });
  applySingleFieldUpdate(exampleProfile, 'weight', 77, { userId: 'user123' });
  applySingleFieldUpdate(exampleProfile, 'weight', 78, { userId: 'user123' });

  // Get history
  const history = getUpdateHistory('user123');

  console.log('Update history:');
  history.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.timestamp.toISOString()}`);
    entry.updates.forEach(update => {
      console.log(`   - ${update.field}: ${entry.previousValues[update.field]} → ${update.value}`);
    });
  });

  return history;
}

/**
 * Example 6: Optimistic update with conflict detection
 * Use case: Multiple devices/tabs updating the same profile
 */
export function example6_OptimisticUpdate() {
  // Simulate getting the current version
  const currentVersion = new Date().toISOString();

  // User makes changes on their phone
  const result = applyOptimisticUpdate(
    exampleProfile,
    { weight: 77 },
    {
      userId: 'user123',
      expectedVersion: currentVersion,
      conflictResolution: 'fail' // Fail if there's a conflict
    }
  );

  if (result.success) {
    console.log('Update applied successfully');
  } else {
    console.log('Conflict detected! Profile was modified elsewhere.');
    console.log('Please refresh and try again.');
  }

  return result;
}

/**
 * Example 7: Optimistic update with merge strategy
 * Use case: Automatically merge non-conflicting changes
 */
export function example7_OptimisticUpdateWithMerge() {
  // First update (from device 1)
  applySingleFieldUpdate(exampleProfile, 'weight', 76, { userId: 'user123' });

  // Second update (from device 2) - different field
  const result = applyOptimisticUpdate(
    exampleProfile,
    { height: 180 }, // Different field, no conflict
    {
      userId: 'user123',
      expectedVersion: 'old-version',
      conflictResolution: 'merge' // Try to merge changes
    }
  );

  if (result.success) {
    console.log('Changes merged successfully');
  } else {
    console.log('Conflicting changes detected:', result.errors);
  }

  return result;
}

/**
 * Example 8: Batch update multiple users
 * Use case: Admin applies a setting change to multiple users
 */
export function example8_BatchUpdate() {
  const profiles = new Map<string, UserProfileExtended>([
    ['user1', { ...exampleProfile }],
    ['user2', { ...exampleProfile }],
    ['user3', { ...exampleProfile }]
  ]);

  // Update all users to Pro tier
  const result = batchUpdateProfiles(
    profiles,
    { subscription_tier: 'pro' },
    { trackHistory: true }
  );

  console.log(`Batch update complete:`);
  console.log(`- Successful: ${result.successful}`);
  console.log(`- Failed: ${result.failed}`);

  // Check individual results
  result.results.forEach((updateResult, userId) => {
    if (!updateResult.success) {
      console.log(`Failed to update ${userId}:`, updateResult.errors);
    }
  });

  return result;
}

/**
 * Example 9: Progressive profile building
 * Use case: User fills out profile step by step
 */
export function example9_ProgressiveProfileBuilding() {
  let profile = { ...exampleProfile };

  // Step 1: Basic metrics
  const step1 = applyMultipleFieldUpdates(
    profile,
    {
      height: 175,
      weight: 75,
      age: 30,
      gender: 'male'
    },
    { userId: 'user123' }
  );

  if (step1.success) {
    profile = step1.updatedProfile!;
    console.log('Step 1 complete: Basic metrics');
  }

  // Step 2: Goals and activity
  const step2 = applyMultipleFieldUpdates(
    profile,
    {
      activity_level: 'moderate',
      goal: 'muscle_gain'
    },
    { userId: 'user123' }
  );

  if (step2.success) {
    profile = step2.updatedProfile!;
    console.log('Step 2 complete: Goals and activity');
  }

  // Step 3: Preferences
  const step3 = applyMultipleFieldUpdates(
    profile,
    {
      diet_type: 'standard',
      meals_per_day: 4,
      snacks_per_day: 2,
      cooking_time: 'moderate',
      cuisine_preference: ['italian', 'asian'],
      budget_level: 'medium'
    },
    { userId: 'user123' }
  );

  if (step3.success) {
    profile = step3.updatedProfile!;
    console.log('Step 3 complete: Preferences');
  }

  return profile;
}

/**
 * Example 10: Update with error handling
 * Use case: Robust error handling in production
 */
export function example10_UpdateWithErrorHandling() {
  try {
    const result = applySingleFieldUpdate(
      exampleProfile,
      'weight',
      77,
      { userId: 'user123' }
    );

    if (!result.success) {
      // Handle validation errors
      result.errors?.forEach(error => {
        console.error(`Validation error for ${error.field}: ${error.message}`);
        
        // Show user-friendly message
        switch (error.field) {
          case 'weight':
            console.log('Please enter a valid weight between 30-300 kg');
            break;
          case 'height':
            console.log('Please enter a valid height between 100-250 cm');
            break;
          default:
            console.log(`Invalid value for ${error.field}`);
        }
      });
      
      return null;
    }

    // Success - update UI or database
    console.log('Profile updated successfully');
    return result.updatedProfile;

  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error during profile update:', error);
    return null;
  }
}

/**
 * Example 11: Integration with React component
 * Use case: Using profile updates in a React form
 */
export function example11_ReactIntegration() {
  // This would be inside a React component
  
  const handleWeightUpdate = (newWeight: number) => {
    const result = applySingleFieldUpdate(
      exampleProfile,
      'weight',
      newWeight,
      { 
        userId: 'user123',
        validateBeforeApply: true,
        trackHistory: true
      }
    );

    if (result.success) {
      // Update state
      // setProfile(result.updatedProfile);
      
      // Show success message
      // toast.success('Weight updated successfully!');
      
      // Optionally sync with backend
      // await syncProfileToBackend(result.updatedProfile);
      
      console.log('Weight updated to:', result.updatedProfile?.weight);
    } else {
      // Show error message
      // toast.error(result.errors?.[0]?.message || 'Update failed');
      
      console.error('Update failed:', result.errors);
    }

    return result;
  };

  return handleWeightUpdate;
}

/**
 * Example 12: Undo/Redo functionality
 * Use case: Implementing undo/redo for profile changes
 */
export function example12_UndoRedoFunctionality() {
  const userId = 'user123';
  
  // Make some updates
  const update1 = applySingleFieldUpdate(exampleProfile, 'weight', 76, { userId });
  const update2 = applySingleFieldUpdate(update1.updatedProfile!, 'weight', 77, { userId });
  const update3 = applySingleFieldUpdate(update2.updatedProfile!, 'weight', 78, { userId });

  // Undo last change
  const undoResult = rollbackToUpdate(
    update3.updatedProfile!,
    userId,
    update3.updateId!
  );

  console.log('After undo:', undoResult.updatedProfile?.weight); // Should be 77

  // Undo again
  const undoResult2 = rollbackToUpdate(
    undoResult.updatedProfile!,
    userId,
    update2.updateId!
  );

  console.log('After second undo:', undoResult2.updatedProfile?.weight); // Should be 76

  return undoResult2;
}
