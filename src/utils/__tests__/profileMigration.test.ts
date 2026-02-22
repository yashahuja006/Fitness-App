/**
 * Profile Migration Tests
 * Comprehensive test suite for profile migration utilities
 */

import {
  migrateUserProfile,
  batchMigrateProfiles,
  createMigrationSnapshot,
  restoreFromSnapshot,
  generateMigrationReport,
  canMigrateProfile,
  analyzeMigrationFeasibility,
  type LegacyUserProfile,
  type MigrationOptions,
} from '../profileMigration';

describe('Profile Migration', () => {
  // Sample legacy profiles for testing
  const completeLegacyProfile: LegacyUserProfile = {
    uid: 'user123',
    email: 'test@example.com',
    displayName: 'Test User',
    personalMetrics: {
      height: 175,
      weight: 75,
      age: 30,
      gender: 'male',
      activityLevel: 'moderate',
      fitnessGoals: ['lose weight', 'build muscle'],
    },
    preferences: {
      units: 'metric',
      theme: 'dark',
    },
  };

  const incompleteLegacyProfile: LegacyUserProfile = {
    uid: 'user456',
    email: 'incomplete@example.com',
    displayName: 'Incomplete User',
    personalMetrics: {
      gender: 'female',
      activityLevel: 'active',
      fitnessGoals: [],
    },
    preferences: {
      units: 'imperial',
      theme: 'light',
    },
  };

  const invalidLegacyProfile: LegacyUserProfile = {
    uid: 'user789',
    email: 'invalid@example.com',
    displayName: 'Invalid User',
    personalMetrics: {
      height: 50, // Too short
      weight: 500, // Too heavy
      age: 150, // Too old
      gender: 'male',
      activityLevel: 'sedentary',
      fitnessGoals: [],
    },
    preferences: {
      units: 'metric',
      theme: 'auto',
    },
  };

  describe('migrateUserProfile', () => {
    it('should successfully migrate a complete profile', () => {
      const result = migrateUserProfile(completeLegacyProfile);

      expect(result.success).toBe(true);
      expect(result.migratedProfile).toBeDefined();
      expect(result.migratedProfile?.height).toBe(175);
      expect(result.migratedProfile?.weight).toBe(75);
      expect(result.migratedProfile?.age).toBe(30);
      expect(result.migratedProfile?.gender).toBe('male');
      expect(result.migratedProfile?.activity_level).toBe('moderate');
      // Goal mapping prioritizes fat_loss when "lose" is mentioned first
      expect(['fat_loss', 'muscle_gain', 'recomposition']).toContain(result.migratedProfile?.goal);
    });

    it('should apply defaults for missing fields', () => {
      const result = migrateUserProfile(incompleteLegacyProfile);

      expect(result.success).toBe(true);
      expect(result.migratedProfile).toBeDefined();
      expect(result.migratedProfile?.diet_type).toBe('standard');
      expect(result.migratedProfile?.meals_per_day).toBe(3);
      expect(result.migratedProfile?.snacks_per_day).toBe(1);
      expect(result.migratedProfile?.cooking_time).toBe('moderate');
      expect(result.migratedProfile?.budget_level).toBe('medium');
      expect(result.appliedDefaults.length).toBeGreaterThan(0);
    });

    it('should generate warnings for missing basic metrics', () => {
      const result = migrateUserProfile(incompleteLegacyProfile);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.toLowerCase().includes('height'))).toBe(true);
      expect(result.warnings.some(w => w.toLowerCase().includes('weight'))).toBe(true);
      expect(result.warnings.some(w => w.toLowerCase().includes('age'))).toBe(true);
    });

    it('should fail validation for invalid data in strict mode', () => {
      const options: MigrationOptions = {
        strictMode: true,
        validateAfterMigration: true,
      };

      const result = migrateUserProfile(invalidLegacyProfile, options);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should succeed with warnings in non-strict mode', () => {
      const options: MigrationOptions = {
        strictMode: false,
        validateAfterMigration: true,
      };

      const result = migrateUserProfile(invalidLegacyProfile, options);

      expect(result.success).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0); // Validation errors recorded
    });

    it('should map fitness goals correctly', () => {
      const profiles = [
        {
          ...completeLegacyProfile,
          uid: 'user1',
          personalMetrics: {
            ...completeLegacyProfile.personalMetrics,
            fitnessGoals: ['lose fat', 'weight loss'],
          },
        },
        {
          ...completeLegacyProfile,
          uid: 'user2',
          personalMetrics: {
            ...completeLegacyProfile.personalMetrics,
            fitnessGoals: ['build muscle', 'gain strength'],
          },
        },
        {
          ...completeLegacyProfile,
          uid: 'user3',
          personalMetrics: {
            ...completeLegacyProfile.personalMetrics,
            fitnessGoals: ['improve endurance', 'run marathon'],
          },
        },
      ];

      const results = profiles.map(p => migrateUserProfile(p));

      expect(results[0].migratedProfile?.goal).toBe('fat_loss');
      expect(results[1].migratedProfile?.goal).toBe('muscle_gain');
      expect(results[2].migratedProfile?.goal).toBe('endurance');
    });

    it('should infer training level from activity and goals', () => {
      const veryActiveProfile = {
        ...completeLegacyProfile,
        personalMetrics: {
          ...completeLegacyProfile.personalMetrics,
          activityLevel: 'very_active' as const,
          fitnessGoals: ['competitive bodybuilding'],
        },
      };

      const result = migrateUserProfile(veryActiveProfile);

      // "competitive" keyword triggers advanced level
      expect(result.migratedProfile?.training_level).toBe('advanced');
      expect(result.migratedProfile?.workout_days_per_week).toBe(5);
    });

    it('should use custom subscription tier from options', () => {
      const options: MigrationOptions = {
        defaultSubscriptionTier: 'pro',
        defaultPlanDuration: 12,
      };

      const result = migrateUserProfile(completeLegacyProfile, options);

      expect(result.migratedProfile?.subscription_tier).toBe('pro');
      expect(result.migratedProfile?.plan_duration_weeks).toBe(12);
    });
  });

  describe('batchMigrateProfiles', () => {
    const profiles = [
      completeLegacyProfile,
      incompleteLegacyProfile,
      invalidLegacyProfile,
    ];

    it('should migrate multiple profiles', () => {
      const result = batchMigrateProfiles(profiles);

      expect(result.totalProfiles).toBe(3);
      expect(result.results.length).toBe(3);
    });

    it('should track success and failure counts', () => {
      const result = batchMigrateProfiles(profiles, { strictMode: false });

      expect(result.successCount).toBeGreaterThan(0);
      expect(result.successCount + result.failureCount).toBe(result.totalProfiles);
    });

    it('should provide summary statistics', () => {
      const result = batchMigrateProfiles(profiles);

      expect(result.summary).toBeDefined();
      expect(result.summary.averageCompletionPercentage).toBeGreaterThan(0);
      expect(Array.isArray(result.summary.mostCommonDefaults)).toBe(true);
    });

    it('should handle empty profile list', () => {
      const result = batchMigrateProfiles([]);

      expect(result.totalProfiles).toBe(0);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(0);
    });
  });

  describe('createMigrationSnapshot and restoreFromSnapshot', () => {
    it('should create a snapshot with metadata', () => {
      const profiles = [completeLegacyProfile, incompleteLegacyProfile];
      const snapshot = createMigrationSnapshot(profiles, 'Test backup');

      expect(snapshot.profileCount).toBe(2);
      expect(snapshot.profiles.length).toBe(2);
      expect(snapshot.metadata.reason).toBe('Test backup');
      expect(snapshot.timestamp).toBeInstanceOf(Date);
    });

    it('should deep clone profiles in snapshot', () => {
      const profiles = [completeLegacyProfile, incompleteLegacyProfile];
      const snapshot = createMigrationSnapshot(profiles);

      // Modify original
      profiles[0].displayName = 'Modified';

      // Snapshot should be unchanged
      expect(snapshot.profiles[0].displayName).toBe('Test User');
    });

    it('should restore profiles from snapshot', () => {
      const profiles = [completeLegacyProfile, incompleteLegacyProfile];
      const snapshot = createMigrationSnapshot(profiles);
      const restored = restoreFromSnapshot(snapshot);

      expect(restored.length).toBe(profiles.length);
      expect(restored[0].email).toBe(profiles[0].email);
    });

    it('should deep clone on restore', () => {
      // Create fresh profile objects for this test
      const testProfile: LegacyUserProfile = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        personalMetrics: {
          height: 175,
          weight: 75,
          age: 30,
          gender: 'male',
          activityLevel: 'moderate',
          fitnessGoals: ['lose weight', 'build muscle'],
        },
        preferences: {
          units: 'metric',
          theme: 'dark',
        },
      };
      
      const profiles = [testProfile];
      const snapshot = createMigrationSnapshot(profiles);
      const restored = restoreFromSnapshot(snapshot);

      // Modify restored
      restored[0].displayName = 'Modified Again';

      // Snapshot should be unchanged
      expect(snapshot.profiles[0].displayName).toBe('Test User');
    });
  });

  describe('generateMigrationReport', () => {
    it('should generate comprehensive report', () => {
      const profiles = [completeLegacyProfile, incompleteLegacyProfile];
      const batchResult = batchMigrateProfiles(profiles);
      const report = generateMigrationReport(batchResult);

      expect(report.totalProfiles).toBe(2);
      expect(report.successRate).toBeGreaterThan(0);
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(Array.isArray(report.commonIssues)).toBe(true);
      expect(Array.isArray(report.defaultsApplied)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should identify common issues', () => {
      const invalidProfiles = Array(5).fill(invalidLegacyProfile).map((p, i) => ({
        ...p,
        uid: `user${i}`,
        email: `user${i}@example.com`,
      }));

      const batchResult = batchMigrateProfiles(invalidProfiles, { strictMode: true });
      const report = generateMigrationReport(batchResult);

      expect(report.commonIssues.length).toBeGreaterThan(0);
    });

    it('should provide recommendations based on results', () => {
      const profiles = [completeLegacyProfile, incompleteLegacyProfile];
      const batchResult = batchMigrateProfiles(profiles);
      const report = generateMigrationReport(batchResult);

      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('canMigrateProfile', () => {
    it('should allow migration of valid profile', () => {
      const result = canMigrateProfile(completeLegacyProfile);

      expect(result.canMigrate).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('should reject profile without uid', () => {
      const profile = { ...completeLegacyProfile, uid: '' };
      const result = canMigrateProfile(profile);

      expect(result.canMigrate).toBe(false);
      expect(result.issues.some(i => i.includes('user ID'))).toBe(true);
    });

    it('should reject profile without email', () => {
      const profile = { ...completeLegacyProfile, email: '' };
      const result = canMigrateProfile(profile);

      expect(result.canMigrate).toBe(false);
      expect(result.issues.some(i => i.includes('email'))).toBe(true);
    });

    it('should reject profile without personal metrics', () => {
      const profile = { ...completeLegacyProfile, personalMetrics: undefined as any };
      const result = canMigrateProfile(profile);

      expect(result.canMigrate).toBe(false);
      expect(result.issues.some(i => i.includes('personal metrics'))).toBe(true);
    });
  });

  describe('analyzeMigrationFeasibility', () => {
    it('should analyze multiple profiles', () => {
      const profiles = [
        completeLegacyProfile,
        incompleteLegacyProfile,
        { ...completeLegacyProfile, uid: '' }, // Invalid
      ];

      const analysis = analyzeMigrationFeasibility(profiles);

      expect(analysis.totalProfiles).toBe(3);
      expect(analysis.migratable).toBe(2);
      expect(analysis.nonMigratable).toBe(1);
      expect(analysis.estimatedCompletionRate).toBeGreaterThan(0);
    });

    it('should identify common issues', () => {
      const profiles = [
        { ...completeLegacyProfile, uid: '' },
        { ...completeLegacyProfile, uid: '', email: '' },
      ];

      const analysis = analyzeMigrationFeasibility(profiles);

      expect(Object.keys(analysis.issues).length).toBeGreaterThan(0);
    });

    it('should handle empty profile list', () => {
      const analysis = analyzeMigrationFeasibility([]);

      expect(analysis.totalProfiles).toBe(0);
      expect(analysis.migratable).toBe(0);
      expect(analysis.nonMigratable).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle profile with null values', () => {
      const profile: LegacyUserProfile = {
        uid: 'user999',
        email: 'null@example.com',
        displayName: 'Null User',
        personalMetrics: {
          height: null as any,
          weight: null as any,
          age: null as any,
          gender: 'other',
          activityLevel: 'moderate',
          fitnessGoals: [],
        },
        preferences: {
          units: 'metric',
          theme: 'auto',
        },
      };

      const result = migrateUserProfile(profile);

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle profile with empty fitness goals', () => {
      const profile = {
        ...completeLegacyProfile,
        personalMetrics: {
          ...completeLegacyProfile.personalMetrics,
          fitnessGoals: [],
        },
      };

      const result = migrateUserProfile(profile);

      expect(result.success).toBe(true);
      expect(result.migratedProfile?.goal).toBe('fat_loss'); // Default
    });

    it('should handle very active user with advanced goals', () => {
      const profile = {
        ...completeLegacyProfile,
        personalMetrics: {
          ...completeLegacyProfile.personalMetrics,
          activityLevel: 'very_active' as const,
          fitnessGoals: ['advanced training', 'competitive sports'],
        },
      };

      const result = migrateUserProfile(profile);

      expect(result.migratedProfile?.training_level).toBe('advanced');
      expect(result.migratedProfile?.workout_days_per_week).toBe(5);
    });
  });
});
