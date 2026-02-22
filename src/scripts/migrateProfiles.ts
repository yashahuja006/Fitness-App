/**
 * Profile Migration Script
 * Run this script to migrate existing user profiles to UserProfileExtended format
 * 
 * Usage:
 *   npm run migrate:profiles [options]
 * 
 * Options:
 *   --dry-run: Analyze migration without making changes
 *   --strict: Fail on any validation errors
 *   --backup: Create backup before migration
 *   --verbose: Show detailed logs
 */

import {
  migrateUserProfile,
  batchMigrateProfiles,
  createMigrationSnapshot,
  generateMigrationReport,
  logMigrationReport,
  analyzeMigrationFeasibility,
  type LegacyUserProfile,
  type MigrationOptions,
  type MigrationSnapshot,
} from '../utils/profileMigration';

/**
 * Configuration for migration script
 */
interface MigrationConfig {
  dryRun: boolean;
  strict: boolean;
  createBackup: boolean;
  verbose: boolean;
  defaultSubscriptionTier: 'free' | 'pro';
  defaultPlanDuration: number;
}

/**
 * Parse command line arguments
 */
function parseArgs(): MigrationConfig {
  const args = process.argv.slice(2);
  
  return {
    dryRun: args.includes('--dry-run'),
    strict: args.includes('--strict'),
    createBackup: args.includes('--backup'),
    verbose: args.includes('--verbose'),
    defaultSubscriptionTier: 'free',
    defaultPlanDuration: 8,
  };
}

/**
 * Fetch legacy profiles from your data source
 * TODO: Implement based on your actual data storage (Firebase, Supabase, etc.)
 */
async function fetchLegacyProfiles(): Promise<LegacyUserProfile[]> {
  // Example implementation - replace with actual data fetching
  console.log('Fetching legacy profiles from database...');
  
  // For local storage (development)
  if (typeof window !== 'undefined' && window.localStorage) {
    const usersData = localStorage.getItem('fitness-app-users');
    if (usersData) {
      const users = JSON.parse(usersData);
      return Object.entries(users).map(([email, data]: [string, any]) => ({
        uid: data.user.uid,
        email: data.user.email,
        displayName: data.user.displayName || '',
        photoURL: data.user.photoURL,
        personalMetrics: data.profile?.personalMetrics || {
          gender: 'other',
          activityLevel: 'moderate',
          fitnessGoals: [],
        },
        preferences: data.profile?.preferences || {
          units: 'metric',
          theme: 'system',
        },
      }));
    }
  }

  // For Firebase/Supabase - implement your actual data fetching here
  // Example:
  // const { data, error } = await supabase
  //   .from('user_profiles')
  //   .select('*');
  // return data || [];

  console.warn('No profiles found. Implement fetchLegacyProfiles() for your data source.');
  return [];
}

/**
 * Save migrated profiles to your data source
 * TODO: Implement based on your actual data storage
 */
async function saveMigratedProfiles(
  results: Array<{ userId: string; profile: any }>
): Promise<void> {
  console.log(`Saving ${results.length} migrated profiles...`);
  
  // Example implementation - replace with actual data saving
  // For Supabase:
  // const { error } = await supabase
  //   .from('user_profiles_extended')
  //   .upsert(results.map(r => ({ user_id: r.userId, ...r.profile })));
  
  // For Firebase:
  // const batch = firestore.batch();
  // results.forEach(r => {
  //   const ref = firestore.collection('user_profiles_extended').doc(r.userId);
  //   batch.set(ref, r.profile);
  // });
  // await batch.commit();

  console.log('Migrated profiles saved successfully.');
}

/**
 * Save migration snapshot for rollback
 */
async function saveSnapshot(snapshot: MigrationSnapshot): Promise<void> {
  const filename = `migration-snapshot-${snapshot.timestamp.toISOString().replace(/:/g, '-')}.json`;
  console.log(`Saving migration snapshot to ${filename}...`);
  
  // In a real implementation, save to file system or cloud storage
  // For Node.js:
  // const fs = require('fs');
  // fs.writeFileSync(filename, JSON.stringify(snapshot, null, 2));
  
  console.log('Snapshot saved successfully.');
}

/**
 * Main migration function
 */
async function runMigration(): Promise<void> {
  const config = parseArgs();

  console.log('\n========================================');
  console.log('PROFILE MIGRATION SCRIPT');
  console.log('========================================');
  console.log(`Mode: ${config.dryRun ? 'DRY RUN (no changes)' : 'LIVE MIGRATION'}`);
  console.log(`Strict mode: ${config.strict ? 'ON' : 'OFF'}`);
  console.log(`Backup: ${config.createBackup ? 'YES' : 'NO'}`);
  console.log(`Verbose: ${config.verbose ? 'YES' : 'NO'}`);
  console.log('========================================\n');

  try {
    // Step 1: Fetch legacy profiles
    const legacyProfiles = await fetchLegacyProfiles();
    
    if (legacyProfiles.length === 0) {
      console.log('No profiles found to migrate.');
      return;
    }

    console.log(`Found ${legacyProfiles.length} profiles to migrate.\n`);

    // Step 2: Analyze migration feasibility
    console.log('Analyzing migration feasibility...');
    const feasibility = analyzeMigrationFeasibility(legacyProfiles);
    
    console.log(`Migratable: ${feasibility.migratable}`);
    console.log(`Non-migratable: ${feasibility.nonMigratable}`);
    console.log(`Estimated completion rate: ${feasibility.estimatedCompletionRate}%`);
    
    if (feasibility.nonMigratable > 0) {
      console.log('\nIssues found:');
      Object.entries(feasibility.issues).forEach(([issue, count]) => {
        console.log(`  - ${issue}: ${count} profiles`);
      });
    }
    console.log('');

    if (config.dryRun) {
      console.log('DRY RUN MODE - No changes will be made.\n');
      
      // Run migration without saving
      const migrationOptions: MigrationOptions = {
        validateAfterMigration: true,
        strictMode: config.strict,
        defaultSubscriptionTier: config.defaultSubscriptionTier,
        defaultPlanDuration: config.defaultPlanDuration,
        logDetails: config.verbose,
      };

      const batchResult = batchMigrateProfiles(legacyProfiles, migrationOptions);
      const report = generateMigrationReport(batchResult);
      logMigrationReport(report);

      console.log('DRY RUN COMPLETE - No changes were made.');
      return;
    }

    // Step 3: Create backup if requested
    if (config.createBackup) {
      console.log('Creating backup snapshot...');
      const snapshot = createMigrationSnapshot(
        legacyProfiles,
        'Pre-migration backup'
      );
      await saveSnapshot(snapshot);
      console.log('Backup created successfully.\n');
    }

    // Step 4: Perform migration
    console.log('Starting migration...');
    const migrationOptions: MigrationOptions = {
      validateAfterMigration: true,
      strictMode: config.strict,
      defaultSubscriptionTier: config.defaultSubscriptionTier,
      defaultPlanDuration: config.defaultPlanDuration,
      logDetails: config.verbose,
    };

    const batchResult = batchMigrateProfiles(legacyProfiles, migrationOptions);

    // Step 5: Save successful migrations
    const successfulMigrations = batchResult.results
      .filter(r => r.success && r.migratedProfile)
      .map(r => ({
        userId: r.userId,
        profile: r.migratedProfile!,
      }));

    if (successfulMigrations.length > 0) {
      await saveMigratedProfiles(successfulMigrations);
    }

    // Step 6: Generate and display report
    const report = generateMigrationReport(batchResult);
    logMigrationReport(report);

    // Step 7: Handle failures
    if (batchResult.failureCount > 0) {
      console.log('\nFailed migrations:');
      batchResult.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.email} (${r.userId})`);
          r.errors.forEach(err => console.log(`    Error: ${err}`));
        });
    }

    console.log('\nMIGRATION COMPLETE');
    
  } catch (error) {
    console.error('\nMIGRATION FAILED:');
    console.error(error);
    process.exit(1);
  }
}

// Run migration if executed directly
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runMigration };
