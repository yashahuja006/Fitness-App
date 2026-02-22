/**
 * AI Performance Nutrition & Training Engine - Profile Update Workflows
 * Handles profile updates with validation, history tracking, and rollback capability
 */

import { 
  UserProfileExtended, 
  ValidationResult,
  ValidationError
} from '@/types/nutrition';
import { validateUserProfile, validateField } from './profileValidation';
import { calculateProfileCompletion } from './profileCompletion';

/**
 * Profile update operation
 */
export interface ProfileUpdate {
  field: keyof UserProfileExtended;
  value: unknown;
  timestamp: Date;
}

/**
 * Profile update result
 */
export interface ProfileUpdateResult {
  success: boolean;
  updatedProfile?: UserProfileExtended;
  errors?: ValidationError[];
  updateId?: string;
  timestamp?: Date;
}

/**
 * Profile update history entry
 */
export interface ProfileUpdateHistoryEntry {
  updateId: string;
  timestamp: Date;
  updates: ProfileUpdate[];
  previousValues: Partial<UserProfileExtended>;
  newValues: Partial<UserProfileExtended>;
  userId?: string;
}

/**
 * Profile update options
 */
export interface ProfileUpdateOptions {
  validateBeforeApply?: boolean;
  trackHistory?: boolean;
  userId?: string;
}

/**
 * In-memory history storage (in production, this would be in a database)
 */
const updateHistory: Map<string, ProfileUpdateHistoryEntry[]> = new Map();

/**
 * Generate a unique update ID
 */
function generateUpdateId(): string {
  return `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Apply a single field update to a profile
 */
export function applySingleFieldUpdate(
  profile: UserProfileExtended,
  field: keyof UserProfileExtended,
  value: unknown,
  options: ProfileUpdateOptions = {}
): ProfileUpdateResult {
  const { validateBeforeApply = true, trackHistory = true, userId } = options;
  
  // Validate the field update
  if (validateBeforeApply) {
    const validationError = validateField(field, value);
    if (validationError) {
      return {
        success: false,
        errors: [validationError]
      };
    }
  }
  
  // Store previous value
  const previousValue = profile[field];
  
  // Create updated profile
  const updatedProfile = {
    ...profile,
    [field]: value
  } as UserProfileExtended;
  
  // Validate the entire profile after update
  if (validateBeforeApply) {
    const profileValidation = validateUserProfile(updatedProfile);
    if (!profileValidation.isValid) {
      return {
        success: false,
        errors: profileValidation.errors.map(err => ({
          field,
          message: err
        }))
      };
    }
  }
  
  // Track history
  const updateId = generateUpdateId();
  const timestamp = new Date();
  
  if (trackHistory) {
    addToHistory(userId || 'anonymous', {
      updateId,
      timestamp,
      updates: [{ field, value, timestamp }],
      previousValues: { [field]: previousValue },
      newValues: { [field]: value },
      userId
    });
  }
  
  return {
    success: true,
    updatedProfile,
    updateId,
    timestamp
  };
}

/**
 * Apply multiple field updates to a profile
 */
export function applyMultipleFieldUpdates(
  profile: UserProfileExtended,
  updates: Partial<UserProfileExtended>,
  options: ProfileUpdateOptions = {}
): ProfileUpdateResult {
  const { validateBeforeApply = true, trackHistory = true, userId } = options;
  
  const errors: ValidationError[] = [];
  const previousValues: Partial<UserProfileExtended> = {};
  const updatesList: ProfileUpdate[] = [];
  const timestamp = new Date();
  
  // Validate each field update
  if (validateBeforeApply) {
    for (const [field, value] of Object.entries(updates)) {
      const validationError = validateField(field as keyof UserProfileExtended, value);
      if (validationError) {
        errors.push(validationError);
      }
    }
    
    if (errors.length > 0) {
      return {
        success: false,
        errors
      };
    }
  }
  
  // Store previous values and create update list
  for (const field of Object.keys(updates) as (keyof UserProfileExtended)[]) {
    previousValues[field] = profile[field];
    updatesList.push({
      field,
      value: updates[field],
      timestamp
    });
  }
  
  // Create updated profile
  const updatedProfile = {
    ...profile,
    ...updates
  } as UserProfileExtended;
  
  // Validate the entire profile after updates
  if (validateBeforeApply) {
    const profileValidation = validateUserProfile(updatedProfile);
    if (!profileValidation.isValid) {
      return {
        success: false,
        errors: profileValidation.errors.map(err => ({
          field: 'profile',
          message: err
        }))
      };
    }
  }
  
  // Track history
  const updateId = generateUpdateId();
  
  if (trackHistory) {
    addToHistory(userId || 'anonymous', {
      updateId,
      timestamp,
      updates: updatesList,
      previousValues,
      newValues: updates,
      userId
    });
  }
  
  return {
    success: true,
    updatedProfile,
    updateId,
    timestamp
  };
}

/**
 * Add an entry to the update history
 */
function addToHistory(userId: string, entry: ProfileUpdateHistoryEntry): void {
  const userHistory = updateHistory.get(userId) || [];
  userHistory.push(entry);
  updateHistory.set(userId, userHistory);
}

/**
 * Get update history for a user
 */
export function getUpdateHistory(userId: string): ProfileUpdateHistoryEntry[] {
  return updateHistory.get(userId) || [];
}

/**
 * Get a specific update by ID
 */
export function getUpdateById(userId: string, updateId: string): ProfileUpdateHistoryEntry | undefined {
  const history = getUpdateHistory(userId);
  return history.find(entry => entry.updateId === updateId);
}

/**
 * Rollback to a previous profile state
 */
export function rollbackToUpdate(
  currentProfile: UserProfileExtended,
  userId: string,
  updateId: string
): ProfileUpdateResult {
  const update = getUpdateById(userId, updateId);
  
  if (!update) {
    return {
      success: false,
      errors: [{
        field: 'updateId',
        message: `Update with ID ${updateId} not found`
      }]
    };
  }
  
  // Apply previous values to rollback
  const rolledBackProfile = {
    ...currentProfile,
    ...update.previousValues
  } as UserProfileExtended;
  
  // Validate the rolled back profile
  const validation = validateUserProfile(rolledBackProfile);
  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors.map(err => ({
        field: 'profile',
        message: err
      }))
    };
  }
  
  // Track the rollback as a new update
  const rollbackUpdateId = generateUpdateId();
  const timestamp = new Date();
  
  addToHistory(userId, {
    updateId: rollbackUpdateId,
    timestamp,
    updates: Object.entries(update.previousValues).map(([field, value]) => ({
      field: field as keyof UserProfileExtended,
      value,
      timestamp
    })),
    previousValues: update.newValues,
    newValues: update.previousValues,
    userId
  });
  
  return {
    success: true,
    updatedProfile: rolledBackProfile,
    updateId: rollbackUpdateId,
    timestamp
  };
}

/**
 * Clear update history for a user
 */
export function clearUpdateHistory(userId: string): void {
  updateHistory.delete(userId);
}

/**
 * Get the most recent update for a user
 */
export function getMostRecentUpdate(userId: string): ProfileUpdateHistoryEntry | undefined {
  const history = getUpdateHistory(userId);
  return history.length > 0 ? history[history.length - 1] : undefined;
}

/**
 * Optimistic update with conflict resolution
 * Handles concurrent updates by checking if the profile has changed since the update was initiated
 */
export interface OptimisticUpdateOptions extends ProfileUpdateOptions {
  expectedVersion?: string; // Version/timestamp of the profile when update was initiated
  conflictResolution?: 'fail' | 'merge' | 'overwrite';
}

/**
 * Apply an optimistic update with conflict detection
 */
export function applyOptimisticUpdate(
  currentProfile: UserProfileExtended,
  updates: Partial<UserProfileExtended>,
  options: OptimisticUpdateOptions = {}
): ProfileUpdateResult {
  const { 
    expectedVersion, 
    conflictResolution = 'fail',
    ...baseOptions 
  } = options;
  
  // If no expected version, proceed with normal update
  if (!expectedVersion) {
    return applyMultipleFieldUpdates(currentProfile, updates, baseOptions);
  }
  
  // Check for conflicts (in production, this would check against database version)
  const mostRecent = getMostRecentUpdate(options.userId || 'anonymous');
  const currentVersion = mostRecent?.timestamp.toISOString() || 'initial';
  
  if (currentVersion !== expectedVersion) {
    // Conflict detected
    switch (conflictResolution) {
      case 'fail':
        return {
          success: false,
          errors: [{
            field: 'version',
            message: 'Profile has been modified by another process. Please refresh and try again.'
          }]
        };
        
      case 'merge':
        // Merge non-conflicting fields
        const conflictingFields = mostRecent 
          ? Object.keys(updates).filter(key => 
              key in mostRecent.newValues && 
              updates[key as keyof UserProfileExtended] !== mostRecent.newValues[key as keyof UserProfileExtended]
            )
          : [];
        
        if (conflictingFields.length > 0) {
          return {
            success: false,
            errors: [{
              field: 'merge',
              message: `Conflicting updates detected for fields: ${conflictingFields.join(', ')}`
            }]
          };
        }
        
        // No conflicts, proceed with update
        return applyMultipleFieldUpdates(currentProfile, updates, baseOptions);
        
      case 'overwrite':
        // Force update regardless of conflicts
        return applyMultipleFieldUpdates(currentProfile, updates, baseOptions);
        
      default:
        return {
          success: false,
          errors: [{
            field: 'conflictResolution',
            message: 'Invalid conflict resolution strategy'
          }]
        };
    }
  }
  
  // No conflict, proceed with update
  return applyMultipleFieldUpdates(currentProfile, updates, baseOptions);
}

/**
 * Batch update multiple profiles (useful for admin operations)
 */
export interface BatchUpdateResult {
  successful: number;
  failed: number;
  results: Map<string, ProfileUpdateResult>;
}

export function batchUpdateProfiles(
  profiles: Map<string, UserProfileExtended>,
  updates: Partial<UserProfileExtended>,
  options: ProfileUpdateOptions = {}
): BatchUpdateResult {
  const results = new Map<string, ProfileUpdateResult>();
  let successful = 0;
  let failed = 0;
  
  for (const [userId, profile] of profiles.entries()) {
    const result = applyMultipleFieldUpdates(profile, updates, {
      ...options,
      userId
    });
    
    results.set(userId, result);
    
    if (result.success) {
      successful++;
    } else {
      failed++;
    }
  }
  
  return {
    successful,
    failed,
    results
  };
}
