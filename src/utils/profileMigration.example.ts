/**
 * Profile Migration - Example Usage
 * 
 * This file demonstrates how to use the profile migration utilities
 * in your application code.
 */

import {
  migrateUserProfile,
  batchMigrateProfiles,
  createMigrationSnapshot,
  restoreFromSnapshot,
  generateMigrationReport,
  logMigrationReport,
  canMigrateProfile,
  analyzeMigrationFeasibility,
  type LegacyUserProfile,
  type MigrationOptions,
} from './profileMigration';

// Example 1: Migrate a single user profile
export function exampleSingleMigration() {
  const legacyProfile: LegacyUserProfile = {
    uid: 'user123',
    email: 'john@example.com',
    displayName: 'John Doe',
    personalMetrics: {
      height: 180,
      weight: 80,
      age: 28,
      gender: 'male',
      activityLevel: 'active',
      fitnessGoals: ['build muscle', 'increase strength'],
    },
    preferences: {
      units: 'metric',
      theme: 'dark',
    },
  };

  // Check if profile can be migrated
  const { canMigrate, issues } = canMigrateProfile(legacyProfile);
  
  if (!canMigrate) {
    console.error('Cannot migrate profile:', issues);
    return;
  }

  // Perform migration
  const result = migrateUserProfile(legacyProfile, {
    validateAfterMigration: true,
    strictMode: false,
    defaultSubscriptionTier: 'free',
    logDetails: true,
  });

  if (result.success) {
    console.log('Migration successful!');
    console.log('Migrated profile:', result.migratedProfile);
    console.log('Applied defaults:', result.appliedDefaults);
    
    // Save to database
    // await saveToDatabase(result.userId, result.migratedProfile);
  } else {
    console.error('Migration failed:', result.errors);
  }
}

// Example 2: Batch migrate multiple profiles
export function exampleBatchMigration() {
  const legacyProfiles: LegacyUserProfile[] = [
    {
      uid: 'user1',
      email: 'user1@example.com',
      displayName: 'User One',
      personalMetrics: {
        height: 175,
        weight: 70,
        age: 25,
        gender: 'female',
        activityLevel: 'moderate',
        fitnessGoals: ['lose weight'],
      },
      preferences: { units: 'metric', theme: 'light' },
    },
    {
      uid: 'user2',
      email: 'user2@example.com',
      displayName: 'User Two',
      personalMetrics: {
        height: 185,
        weight: 90,
        age: 35,
        gender: 'male',
        activityLevel: 'very_active',
        fitnessGoals: ['endurance', 'marathon training'],
      },
      preferences: { units: 'imperial', theme: 'dark' },
    },
  ];

  // Analyze feasibility first
  const feasibility = analyzeMigrationFeasibility(legacyProfiles);
  console.log('Migration feasibility:', feasibility);

  // Perform batch migration
  const batchResult = batchMigrateProfiles(legacyProfiles, {
    validateAfterMigration: true,
    strictMode: false,
    logDetails: true,
  });

  // Generate and display report
  const report = generateMigrationReport(batchResult);
  logMigrationReport(report);

  // Save successful migrations
  const successfulMigrations = batchResult.results
    .filter(r => r.success && r.migratedProfile)
    .map(r => ({
      userId: r.userId,
      profile: r.migratedProfile!,
    }));

  console.log(`Successfully migrated ${successfulMigrations.length} profiles`);
  
  // Save to database
  // await saveBatchToDatabase(successfulMigrations);
}

// Example 3: Migration with backup and rollback
export function exampleMigrationWithBackup() {
  const legacyProfiles: LegacyUserProfile[] = [
    // ... your profiles
  ];

  // Step 1: Create backup snapshot
  const snapshot = createMigrationSnapshot(
    legacyProfiles,
    'Pre-migration backup before nutrition engine rollout'
  );
  
  console.log(`Backup created: ${snapshot.profileCount} profiles`);
  
  // Save snapshot to storage
  // await saveSnapshotToStorage(snapshot);

  // Step 2: Perform migration
  const batchResult = batchMigrateProfiles(legacyProfiles);

  // Step 3: If something goes wrong, rollback
  if (batchResult.failureCount > batchResult.successCount) {
    console.error('Too many failures, rolling back...');
    
    const restoredProfiles = restoreFromSnapshot(snapshot);
    console.log(`Restored ${restoredProfiles.length} profiles from backup`);
    
    // Restore to database
    // await restoreToDatabase(restoredProfiles);
    return;
  }

  console.log('Migration completed successfully');
}

// Example 4: Dry run analysis
export function exampleDryRunAnalysis() {
  const legacyProfiles: LegacyUserProfile[] = [
    // ... your profiles
  ];

  // Analyze without making changes
  const feasibility = analyzeMigrationFeasibility(legacyProfiles);
  
  console.log('=== DRY RUN ANALYSIS ===');
  console.log(`Total profiles: ${feasibility.totalProfiles}`);
  console.log(`Migratable: ${feasibility.migratable}`);
  console.log(`Non-migratable: ${feasibility.nonMigratable}`);
  console.log(`Estimated completion: ${feasibility.estimatedCompletionRate}%`);
  
  if (feasibility.nonMigratable > 0) {
    console.log('\nIssues found:');
    Object.entries(feasibility.issues).forEach(([issue, count]) => {
      console.log(`  - ${issue}: ${count} profiles`);
    });
  }

  // Perform test migration without saving
  const batchResult = batchMigrateProfiles(legacyProfiles, {
    validateAfterMigration: true,
    strictMode: false,
  });

  const report = generateMigrationReport(batchResult);
  logMigrationReport(report);
}

// Example 5: Custom migration options
export function exampleCustomMigration() {
  const legacyProfile: LegacyUserProfile = {
    uid: 'premium_user',
    email: 'premium@example.com',
    displayName: 'Premium User',
    personalMetrics: {
      height: 175,
      weight: 75,
      age: 30,
      gender: 'male',
      activityLevel: 'active',
      fitnessGoals: ['advanced training'],
    },
    preferences: { units: 'metric', theme: 'dark' },
  };

  // Custom options for premium users
  const options: MigrationOptions = {
    validateAfterMigration: true,
    strictMode: true, // Ensure premium users have valid data
    defaultSubscriptionTier: 'pro', // Premium users get pro tier
    defaultPlanDuration: 12, // Longer plan duration
    logDetails: true,
  };

  const result = migrateUserProfile(legacyProfile, options);

  if (result.success) {
    console.log('Premium user migrated successfully');
    console.log('Subscription tier:', result.migratedProfile?.subscription_tier);
    console.log('Plan duration:', result.migratedProfile?.plan_duration_weeks);
  }
}

// Example 6: Integration with React component
export function exampleReactIntegration() {
  // This would be used in a React component
  
  /*
  import { useState } from 'react';
  import { migrateUserProfile } from '@/utils/profileMigration';
  
  function ProfileMigrationButton({ legacyProfile }) {
    const [migrating, setMigrating] = useState(false);
    const [result, setResult] = useState(null);
    
    const handleMigrate = async () => {
      setMigrating(true);
      
      try {
        const migrationResult = migrateUserProfile(legacyProfile);
        
        if (migrationResult.success) {
          // Save to database
          await updateUserProfile(migrationResult.userId, migrationResult.migratedProfile);
          setResult({ success: true, message: 'Profile updated successfully!' });
        } else {
          setResult({ success: false, errors: migrationResult.errors });
        }
      } catch (error) {
        setResult({ success: false, errors: [error.message] });
      } finally {
        setMigrating(false);
      }
    };
    
    return (
      <div>
        <button onClick={handleMigrate} disabled={migrating}>
          {migrating ? 'Migrating...' : 'Upgrade Profile'}
        </button>
        {result && (
          <div className={result.success ? 'success' : 'error'}>
            {result.success ? result.message : result.errors.join(', ')}
          </div>
        )}
      </div>
    );
  }
  */
}

// Example 7: API endpoint integration
export function exampleAPIEndpoint() {
  // This would be used in a Next.js API route
  
  /*
  // pages/api/migrate-profile.ts
  import type { NextApiRequest, NextApiResponse } from 'next';
  import { migrateUserProfile } from '@/utils/profileMigration';
  import { getUserProfile, updateUserProfile } from '@/lib/database';
  
  export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
      const { userId } = req.body;
      
      // Fetch legacy profile
      const legacyProfile = await getUserProfile(userId);
      
      if (!legacyProfile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      // Migrate profile
      const result = migrateUserProfile(legacyProfile, {
        validateAfterMigration: true,
        strictMode: false,
      });
      
      if (!result.success) {
        return res.status(400).json({
          error: 'Migration failed',
          details: result.errors,
        });
      }
      
      // Save migrated profile
      await updateUserProfile(userId, result.migratedProfile);
      
      return res.status(200).json({
        success: true,
        profile: result.migratedProfile,
        warnings: result.warnings,
        appliedDefaults: result.appliedDefaults,
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
  */
}
