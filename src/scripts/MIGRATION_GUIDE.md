# Profile Migration Guide

This guide explains how to migrate existing user profiles to the new `UserProfileExtended` format required by the AI Performance Nutrition & Training Engine.

## Overview

The migration process converts legacy `UserProfile` objects (with basic metrics) to the comprehensive `UserProfileExtended` format that includes nutrition preferences, training details, and subscription information.

## What Gets Migrated

### Existing Fields (Direct Mapping)
- `height` → `height`
- `weight` → `weight`
- `age` → `age`
- `gender` → `gender`
- `activityLevel` → `activity_level`
- `fitnessGoals` → `goal` (mapped intelligently)

### New Fields (Defaults Applied)
- `body_fat_percentage` → `undefined` (optional)
- `diet_type` → `'standard'`
- `meals_per_day` → `3`
- `snacks_per_day` → `1`
- `cooking_time` → `'moderate'`
- `cuisine_preference` → `['international']`
- `budget_level` → `'medium'`
- `training_level` → Inferred from activity level
- `workout_days_per_week` → Inferred from activity level
- `subscription_tier` → `'free'` (configurable)
- `plan_duration_weeks` → `8` (configurable)

## Migration Modes

### 1. Dry Run (Recommended First)
Analyzes migration without making changes:

```bash
npm run migrate:profiles -- --dry-run
```

This will:
- Analyze all profiles
- Show what would be migrated
- Display warnings and errors
- Generate a detailed report
- **Make no changes to data**

### 2. Live Migration with Backup
Performs actual migration with backup:

```bash
npm run migrate:profiles -- --backup
```

This will:
- Create a backup snapshot
- Migrate all profiles
- Save migrated data
- Generate a report

### 3. Strict Mode
Fails migration if any validation errors occur:

```bash
npm run migrate:profiles -- --strict --backup
```

Use this when you want to ensure all migrated profiles are 100% valid.

### 4. Verbose Mode
Shows detailed logs for each profile:

```bash
npm run migrate:profiles -- --verbose --backup
```

## Command Line Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Analyze without making changes |
| `--strict` | Fail on any validation errors |
| `--backup` | Create backup before migration |
| `--verbose` | Show detailed logs |

You can combine options:
```bash
npm run migrate:profiles -- --dry-run --verbose
```

## Migration Process

### Step 1: Analyze Feasibility
```bash
npm run migrate:profiles -- --dry-run
```

Review the output:
- How many profiles can be migrated?
- What issues exist?
- What's the estimated completion rate?

### Step 2: Fix Critical Issues
If the dry run shows non-migratable profiles, fix them first:
- Ensure all profiles have `uid` and `email`
- Ensure `personalMetrics` exists
- Ensure `gender` and `activityLevel` are set

### Step 3: Run Migration with Backup
```bash
npm run migrate:profiles -- --backup
```

### Step 4: Review Report
The migration will generate a detailed report showing:
- Success/failure counts
- Common issues
- Applied defaults
- Recommendations

### Step 5: Handle Failures
If any profiles failed:
1. Review the error messages
2. Fix the underlying data issues
3. Re-run migration for failed profiles

## Fitness Goal Mapping

The migration intelligently maps legacy fitness goals to the new goal types:

| Legacy Goals | New Goal |
|--------------|----------|
| "lose weight", "fat loss", "cut" | `fat_loss` |
| "build muscle", "gain", "bulk" | `muscle_gain` |
| "endurance", "cardio", "stamina" | `endurance` |
| "recomp", "tone", "both" | `recomposition` |
| Multiple conflicting goals | `recomposition` |
| No goals specified | `fat_loss` (default) |

## Training Level Inference

Training level is inferred from activity level and goals:

| Activity Level | Goals | Training Level |
|----------------|-------|----------------|
| `very_active` | Any | `intermediate` |
| `active` | Has goals | `intermediate` |
| `moderate` | Any | `beginner` |
| `light` | Any | `beginner` |
| `sedentary` | Any | `beginner` |

If goals mention "advanced" or "competitive", level is set to `advanced`.

## Workout Days Inference

Workout days per week are inferred from activity level:

| Activity Level | Workout Days |
|----------------|--------------|
| `very_active` | 5 |
| `active` | 4 |
| `moderate` | 3 |
| `light` | 2 |
| `sedentary` | 2 |

## Rollback Procedure

If you need to rollback after migration:

1. Locate the backup snapshot file:
   ```
   migration-snapshot-YYYY-MM-DDTHH-MM-SS.json
   ```

2. Use the restore function in your code:
   ```typescript
   import { restoreFromSnapshot } from '@/utils/profileMigration';
   
   const snapshot = JSON.parse(fs.readFileSync('snapshot-file.json', 'utf8'));
   const restoredProfiles = restoreFromSnapshot(snapshot);
   
   // Save restored profiles back to database
   ```

## Validation Rules

After migration, profiles are validated against these rules:

### Physical Metrics
- Height: 100-250 cm
- Weight: 30-300 kg
- Age: 13-100 years
- Body fat: 3-50% (if provided)

### Activity & Goals
- Activity level: Must be valid enum value
- Goal: Must be valid enum value

### Preferences
- Diet type: Must be valid enum value
- Meals per day: 3-6
- Snacks per day: 0-3
- Cooking time: Must be valid enum value
- Budget level: Must be valid enum value

### Training
- Training level: Must be valid enum value
- Workout days: 1-7

### Subscription
- Tier: 'free' or 'pro'
- Duration: 1-52 weeks

## Common Issues and Solutions

### Issue: "Height was missing or zero"
**Solution:** Profile will migrate but user must update height before generating plans.

### Issue: "Missing personal metrics"
**Solution:** Profile cannot be migrated. Fix source data and retry.

### Issue: "Height must be between 100-250 cm"
**Solution:** In non-strict mode, profile migrates with warning. In strict mode, migration fails.

### Issue: "Many profiles missing basic metrics"
**Solution:** Implement a profile completion wizard to prompt users for missing data.

## Post-Migration Tasks

After successful migration:

1. **Notify Users**: Inform users about new features and ask them to complete their profiles
2. **Profile Completion**: Implement UI to guide users through completing missing fields
3. **Monitor Completion**: Track profile completion rates
4. **Gradual Rollout**: Consider enabling new features gradually based on profile completion

## Customizing Defaults

To customize default values, modify the `MIGRATION_DEFAULTS` in `src/utils/profileMigration.ts`:

```typescript
const MIGRATION_DEFAULTS = {
  diet_type: 'standard', // Change to your preferred default
  meals_per_day: 3,
  snacks_per_day: 1,
  cooking_time: 'moderate',
  cuisine_preference: ['international'],
  budget_level: 'medium',
  training_level: 'beginner',
  workout_days_per_week: 3,
  subscription_tier: 'free',
  plan_duration_weeks: 8,
};
```

## Testing Migration

Before running on production data:

1. **Run Unit Tests**:
   ```bash
   npm test profileMigration
   ```

2. **Test with Sample Data**:
   Create a small test dataset and run migration in dry-run mode

3. **Validate Results**:
   Manually review a sample of migrated profiles

4. **Test Rollback**:
   Ensure you can restore from backup

## Support

If you encounter issues during migration:

1. Check the migration report for specific errors
2. Review the verbose logs (`--verbose` flag)
3. Ensure your data source implementation is correct
4. Check that all required fields exist in legacy profiles

## Example Migration Report

```
========================================
PROFILE MIGRATION REPORT
========================================
Timestamp: 2024-01-15T10:30:00.000Z
Total Profiles: 1000
Success: 980 (98%)
Failures: 20
Average Completion: 65%

Common Issues:
  1. Height must be between 100-250 cm (15 profiles)
  2. Weight must be between 30-300 kg (5 profiles)

Defaults Applied:
  1. diet_type: 980 profiles (98%)
  2. meals_per_day: 980 profiles (98%)
  3. cooking_time: 980 profiles (98%)
  4. budget_level: 980 profiles (98%)
  5. subscription_tier: 980 profiles (98%)

Recommendations:
  1. 20 profiles failed migration. Review error logs and fix data issues.
  2. Many profiles are missing basic metrics. Prompt users to complete profiles.
  3. Most users have default diet type. Consider adding a diet preference survey.
========================================
```

## Next Steps

After migration is complete:

1. ✅ Verify all profiles migrated successfully
2. ✅ Test the new nutrition engine with migrated profiles
3. ✅ Implement profile completion UI
4. ✅ Monitor user engagement with new features
5. ✅ Collect feedback and iterate
