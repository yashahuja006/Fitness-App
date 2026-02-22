/**
 * AI Performance Nutrition & Training Engine - Profile Migration
 * Utilities to migrate existing UserProfile to UserProfileExtended format
 */

import { UserProfileExtended } from '@/types/nutrition';
import { validateUserProfile } from './profileValidation';

/**
 * Legacy user profile structure (from existing system)
 */
export interface LegacyUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  personalMetrics: {
    height?: number;
    weight?: number;
    age?: number;
    gender: 'male' | 'female' | 'other';
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    fitnessGoals: string[];
  };
  preferences: {
    units: 'metric' | 'imperial';
    theme: 'light' | 'dark' | 'auto';
    notifications?: any;
    privacy?: any;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Migration result for a single profile
 */
export interface MigrationResult {
  success: boolean;
  userId: string;
  email: string;
  migratedProfile?: UserProfileExtended;
  errors: string[];
  warnings: string[];
  appliedDefaults: string[];
}

/**
 * Batch migration result
 */
export interface BatchMigrationResult {
  totalProfiles: number;
  successCount: number;
  failureCount: number;
  results: MigrationResult[];
  summary: {
    mostCommonErrors: string[];
    mostCommonDefaults: string[];
    averageCompletionPercentage: number;
  };
}

/**
 * Migration options
 */
export interface MigrationOptions {
  validateAfterMigration?: boolean;
  strictMode?: boolean; // If true, fail on any validation error
  defaultSubscriptionTier?: 'free' | 'pro';
  defaultPlanDuration?: number;
  logDetails?: boolean;
}

/**
 * Default values for missing fields
 */
const MIGRATION_DEFAULTS = {
  body_fat_percentage: undefined, // Optional field
  diet_type: 'standard' as const,
  meals_per_day: 3 as const,
  snacks_per_day: 1 as const,
  cooking_time: 'moderate' as const,
  cuisine_preference: ['international'],
  budget_level: 'medium' as const,
  training_level: 'beginner' as const,
  workout_days_per_week: 3,
  subscription_tier: 'free' as const,
  plan_duration_weeks: 8,
};

/**
 * Map legacy fitness goals to new goal format
 */
function mapFitnessGoals(goals: string[]): UserProfileExtended['goal'] {
  const goalString = goals.join(' ').toLowerCase();
  
  if (goalString.includes('lose') || goalString.includes('fat') || goalString.includes('weight loss')) {
    return 'fat_loss';
  }
  if (goalString.includes('muscle') || goalString.includes('gain') || goalString.includes('bulk')) {
    return 'muscle_gain';
  }
  if (goalString.includes('endurance') || goalString.includes('cardio') || goalString.includes('stamina')) {
    return 'endurance';
  }
  if (goalString.includes('recomp') || goalString.includes('tone')) {
    return 'recomposition';
  }
  
  // Default to fat_loss if unclear
  return 'fat_loss';
}

/**
 * Infer training level from activity level and goals
 */
function inferTrainingLevel(
  activityLevel: string,
  goals: string[]
): UserProfileExtended['training_level'] {
  const goalString = goals.join(' ').toLowerCase();
  
  // If goals mention advanced terms, assume intermediate
  if (goalString.includes('advanced') || goalString.includes('competitive')) {
    return 'advanced';
  }
  
  // Very active people are likely at least intermediate
  if (activityLevel === 'very_active') {
    return 'intermediate';
  }
  
  // Active people might be intermediate
  if (activityLevel === 'active' && goals.length > 0) {
    return 'intermediate';
  }
  
  // Default to beginner
  return 'beginner';
}

/**
 * Infer workout days from activity level
 */
function inferWorkoutDays(activityLevel: string): number {
  switch (activityLevel) {
    case 'very_active':
      return 5;
    case 'active':
      return 4;
    case 'moderate':
      return 3;
    case 'light':
      return 2;
    case 'sedentary':
    default:
      return 2;
  }
}

/**
 * Migrate a single user profile from legacy format to UserProfileExtended
 */
export function migrateUserProfile(
  legacyProfile: LegacyUserProfile,
  options: MigrationOptions = {}
): MigrationResult {
  const {
    validateAfterMigration = true,
    strictMode = false,
    defaultSubscriptionTier = 'free',
    defaultPlanDuration = 8,
    logDetails = false,
  } = options;

  const errors: string[] = [];
  const warnings: string[] = [];
  const appliedDefaults: string[] = [];

  try {
    // Validate required legacy fields
    if (!legacyProfile.personalMetrics) {
      errors.push('Missing personalMetrics in legacy profile');
      return {
        success: false,
        userId: legacyProfile.uid,
        email: legacyProfile.email,
        errors,
        warnings,
        appliedDefaults,
      };
    }

    const { personalMetrics } = legacyProfile;

    // Build the migrated profile
    const migratedProfile: UserProfileExtended = {
      // Basic metrics - required fields
      height: personalMetrics.height || 0,
      weight: personalMetrics.weight || 0,
      age: personalMetrics.age || 0,
      gender: personalMetrics.gender,
      body_fat_percentage: MIGRATION_DEFAULTS.body_fat_percentage,

      // Activity & Goals
      activity_level: personalMetrics.activityLevel,
      goal: mapFitnessGoals(personalMetrics.fitnessGoals || []),

      // Preferences - apply defaults
      diet_type: MIGRATION_DEFAULTS.diet_type,
      meals_per_day: MIGRATION_DEFAULTS.meals_per_day,
      snacks_per_day: MIGRATION_DEFAULTS.snacks_per_day,
      cooking_time: MIGRATION_DEFAULTS.cooking_time,
      cuisine_preference: MIGRATION_DEFAULTS.cuisine_preference,
      budget_level: MIGRATION_DEFAULTS.budget_level,

      // Training - infer from existing data
      training_level: inferTrainingLevel(
        personalMetrics.activityLevel,
        personalMetrics.fitnessGoals || []
      ),
      workout_days_per_week: inferWorkoutDays(personalMetrics.activityLevel),

      // Subscription
      subscription_tier: defaultSubscriptionTier,
      plan_duration_weeks: defaultPlanDuration,
    };

    // Track which fields got defaults
    if (!personalMetrics.height || personalMetrics.height === 0) {
      warnings.push('Height was missing or zero, set to 0 (requires user input)');
      appliedDefaults.push('height');
    }
    if (!personalMetrics.weight || personalMetrics.weight === 0) {
      warnings.push('Weight was missing or zero, set to 0 (requires user input)');
      appliedDefaults.push('weight');
    }
    if (!personalMetrics.age || personalMetrics.age === 0) {
      warnings.push('Age was missing or zero, set to 0 (requires user input)');
      appliedDefaults.push('age');
    }

    appliedDefaults.push(
      'diet_type',
      'meals_per_day',
      'snacks_per_day',
      'cooking_time',
      'cuisine_preference',
      'budget_level',
      'subscription_tier',
      'plan_duration_weeks'
    );

    // Validate the migrated profile
    if (validateAfterMigration) {
      const validationResult = validateUserProfile(migratedProfile);
      
      if (!validationResult.isValid) {
        errors.push(...validationResult.errors);
        
        if (strictMode) {
          return {
            success: false,
            userId: legacyProfile.uid,
            email: legacyProfile.email,
            errors,
            warnings,
            appliedDefaults,
          };
        }
      }
    }

    if (logDetails) {
      console.log(`[Migration] Successfully migrated profile for ${legacyProfile.email}`);
      console.log(`[Migration] Applied ${appliedDefaults.length} defaults`);
      if (warnings.length > 0) {
        console.log(`[Migration] Warnings: ${warnings.join(', ')}`);
      }
    }

    return {
      success: true,
      userId: legacyProfile.uid,
      email: legacyProfile.email,
      migratedProfile,
      errors,
      warnings,
      appliedDefaults,
    };
  } catch (error) {
    errors.push(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      userId: legacyProfile.uid,
      email: legacyProfile.email,
      errors,
      warnings,
      appliedDefaults,
    };
  }
}

/**
 * Migrate multiple user profiles in batch
 */
export function batchMigrateProfiles(
  legacyProfiles: LegacyUserProfile[],
  options: MigrationOptions = {}
): BatchMigrationResult {
  const results: MigrationResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Track common patterns
  const errorCounts: Record<string, number> = {};
  const defaultCounts: Record<string, number> = {};
  let totalCompletionPercentage = 0;

  for (const legacyProfile of legacyProfiles) {
    const result = migrateUserProfile(legacyProfile, options);
    results.push(result);

    if (result.success) {
      successCount++;
      
      // Calculate completion percentage (fields with real data vs defaults)
      const totalFields = 17; // Total fields in UserProfileExtended
      const defaultedFields = result.appliedDefaults.length;
      const completionPercentage = ((totalFields - defaultedFields) / totalFields) * 100;
      totalCompletionPercentage += completionPercentage;
    } else {
      failureCount++;
    }

    // Track error patterns
    for (const error of result.errors) {
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    }

    // Track default patterns
    for (const defaultField of result.appliedDefaults) {
      defaultCounts[defaultField] = (defaultCounts[defaultField] || 0) + 1;
    }
  }

  // Calculate summary statistics
  const mostCommonErrors = Object.entries(errorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([error]) => error);

  const mostCommonDefaults = Object.entries(defaultCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([field]) => field);

  const averageCompletionPercentage = successCount > 0 
    ? totalCompletionPercentage / successCount 
    : 0;

  return {
    totalProfiles: legacyProfiles.length,
    successCount,
    failureCount,
    results,
    summary: {
      mostCommonErrors,
      mostCommonDefaults,
      averageCompletionPercentage: Math.round(averageCompletionPercentage),
    },
  };
}

/**
 * Create a rollback snapshot of profiles before migration
 */
export interface MigrationSnapshot {
  timestamp: Date;
  profileCount: number;
  profiles: LegacyUserProfile[];
  metadata: {
    version: string;
    reason: string;
  };
}

/**
 * Create a snapshot for rollback capability
 */
export function createMigrationSnapshot(
  profiles: LegacyUserProfile[],
  reason: string = 'Pre-migration backup'
): MigrationSnapshot {
  return {
    timestamp: new Date(),
    profileCount: profiles.length,
    profiles: JSON.parse(JSON.stringify(profiles)), // Deep clone
    metadata: {
      version: '1.0.0',
      reason,
    },
  };
}

/**
 * Restore profiles from a snapshot
 */
export function restoreFromSnapshot(
  snapshot: MigrationSnapshot
): LegacyUserProfile[] {
  return JSON.parse(JSON.stringify(snapshot.profiles)); // Deep clone
}

/**
 * Generate a migration report
 */
export interface MigrationReport {
  timestamp: Date;
  totalProfiles: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  averageCompletionPercentage: number;
  commonIssues: {
    error: string;
    count: number;
    affectedUsers: string[];
  }[];
  defaultsApplied: {
    field: string;
    count: number;
    percentage: number;
  }[];
  recommendations: string[];
}

/**
 * Generate a detailed migration report
 */
export function generateMigrationReport(
  batchResult: BatchMigrationResult
): MigrationReport {
  const { totalProfiles, successCount, failureCount, results, summary } = batchResult;

  // Analyze common issues
  const issueMap: Record<string, { count: number; users: string[] }> = {};
  for (const result of results) {
    for (const error of result.errors) {
      if (!issueMap[error]) {
        issueMap[error] = { count: 0, users: [] };
      }
      issueMap[error].count++;
      issueMap[error].users.push(result.email);
    }
  }

  const commonIssues = Object.entries(issueMap)
    .map(([error, data]) => ({
      error,
      count: data.count,
      affectedUsers: data.users.slice(0, 5), // Limit to first 5
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Analyze defaults applied
  const defaultMap: Record<string, number> = {};
  for (const result of results) {
    for (const field of result.appliedDefaults) {
      defaultMap[field] = (defaultMap[field] || 0) + 1;
    }
  }

  const defaultsApplied = Object.entries(defaultMap)
    .map(([field, count]) => ({
      field,
      count,
      percentage: Math.round((count / totalProfiles) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (failureCount > 0) {
    recommendations.push(
      `${failureCount} profiles failed migration. Review error logs and fix data issues.`
    );
  }

  const missingBasicMetrics = defaultsApplied.find(
    d => ['height', 'weight', 'age'].includes(d.field) && d.percentage > 10
  );
  if (missingBasicMetrics) {
    recommendations.push(
      'Many profiles are missing basic metrics (height, weight, age). Prompt users to complete their profiles.'
    );
  }

  if (summary.averageCompletionPercentage < 50) {
    recommendations.push(
      'Average profile completion is low. Consider implementing a profile completion wizard.'
    );
  }

  if (defaultsApplied.find(d => d.field === 'diet_type' && d.percentage > 80)) {
    recommendations.push(
      'Most users have default diet type. Consider adding a diet preference survey.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('Migration completed successfully with no major issues.');
  }

  return {
    timestamp: new Date(),
    totalProfiles,
    successCount,
    failureCount,
    successRate: Math.round((successCount / totalProfiles) * 100),
    averageCompletionPercentage: summary.averageCompletionPercentage,
    commonIssues,
    defaultsApplied,
    recommendations,
  };
}

/**
 * Log migration results to console
 */
export function logMigrationReport(report: MigrationReport): void {
  console.log('\n========================================');
  console.log('PROFILE MIGRATION REPORT');
  console.log('========================================');
  console.log(`Timestamp: ${report.timestamp.toISOString()}`);
  console.log(`Total Profiles: ${report.totalProfiles}`);
  console.log(`Success: ${report.successCount} (${report.successRate}%)`);
  console.log(`Failures: ${report.failureCount}`);
  console.log(`Average Completion: ${report.averageCompletionPercentage}%`);
  
  if (report.commonIssues.length > 0) {
    console.log('\nCommon Issues:');
    report.commonIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue.error} (${issue.count} profiles)`);
      console.log(`     Affected: ${issue.affectedUsers.join(', ')}`);
    });
  }

  if (report.defaultsApplied.length > 0) {
    console.log('\nDefaults Applied:');
    report.defaultsApplied.slice(0, 5).forEach((def, index) => {
      console.log(`  ${index + 1}. ${def.field}: ${def.count} profiles (${def.percentage}%)`);
    });
  }

  if (report.recommendations.length > 0) {
    console.log('\nRecommendations:');
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }

  console.log('========================================\n');
}

/**
 * Validate that a profile can be safely migrated
 */
export function canMigrateProfile(legacyProfile: LegacyUserProfile): {
  canMigrate: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!legacyProfile.uid) {
    issues.push('Missing user ID');
  }

  if (!legacyProfile.email) {
    issues.push('Missing email');
  }

  if (!legacyProfile.personalMetrics) {
    issues.push('Missing personal metrics');
  } else {
    if (!legacyProfile.personalMetrics.gender) {
      issues.push('Missing gender');
    }
    if (!legacyProfile.personalMetrics.activityLevel) {
      issues.push('Missing activity level');
    }
  }

  return {
    canMigrate: issues.length === 0,
    issues,
  };
}

/**
 * Get migration statistics without performing migration
 */
export function analyzeMigrationFeasibility(
  legacyProfiles: LegacyUserProfile[]
): {
  totalProfiles: number;
  migratable: number;
  nonMigratable: number;
  issues: Record<string, number>;
  estimatedCompletionRate: number;
} {
  let migratable = 0;
  let nonMigratable = 0;
  const issueCount: Record<string, number> = {};
  let totalFieldsWithData = 0;

  for (const profile of legacyProfiles) {
    const { canMigrate, issues } = canMigrateProfile(profile);
    
    if (canMigrate) {
      migratable++;
      
      // Count fields with actual data
      let fieldsWithData = 0;
      if (profile.personalMetrics?.height) fieldsWithData++;
      if (profile.personalMetrics?.weight) fieldsWithData++;
      if (profile.personalMetrics?.age) fieldsWithData++;
      if (profile.personalMetrics?.gender) fieldsWithData++;
      if (profile.personalMetrics?.activityLevel) fieldsWithData++;
      if (profile.personalMetrics?.fitnessGoals?.length) fieldsWithData++;
      
      totalFieldsWithData += fieldsWithData;
    } else {
      nonMigratable++;
      for (const issue of issues) {
        issueCount[issue] = (issueCount[issue] || 0) + 1;
      }
    }
  }

  const estimatedCompletionRate = migratable > 0
    ? Math.round((totalFieldsWithData / (migratable * 17)) * 100)
    : 0;

  return {
    totalProfiles: legacyProfiles.length,
    migratable,
    nonMigratable,
    issues: issueCount,
    estimatedCompletionRate,
  };
}
