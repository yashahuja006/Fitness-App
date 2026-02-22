# Profile Update Workflows

Comprehensive profile update system with validation, history tracking, rollback capability, and concurrent update handling.

## Features

- ✅ **Single field updates** - Update one field at a time
- ✅ **Multiple field updates** - Update multiple fields in one operation
- ✅ **Validation** - Automatic validation before applying updates
- ✅ **Update history** - Track all profile changes over time
- ✅ **Rollback capability** - Undo changes to previous states
- ✅ **Concurrent update handling** - Detect and resolve conflicts
- ✅ **Batch updates** - Update multiple user profiles at once
- ✅ **Optimistic updates** - Handle updates with conflict detection

## Installation

The profile update workflows are part of the AI Nutrition Engine utilities:

```typescript
import {
  applySingleFieldUpdate,
  applyMultipleFieldUpdates,
  getUpdateHistory,
  rollbackToUpdate,
  applyOptimisticUpdate,
  batchUpdateProfiles
} from '@/utils/profileUpdateWorkflow';
```

## Basic Usage

### Single Field Update

Update a single field with automatic validation:

```typescript
const result = applySingleFieldUpdate(
  profile,
  'weight',
  77,
  { 
    userId: 'user123',
    validateBeforeApply: true,
    trackHistory: true
  }
);

if (result.success) {
  console.log('Updated profile:', result.updatedProfile);
} else {
  console.error('Validation errors:', result.errors);
}
```

### Multiple Field Update

Update multiple fields at once:

```typescript
const result = applyMultipleFieldUpdates(
  profile,
  {
    weight: 77,
    body_fat_percentage: 14,
    workout_days_per_week: 5
  },
  { userId: 'user123' }
);
```

## Advanced Features

### Update History

Track all changes to a user's profile:

```typescript
// Get full history
const history = getUpdateHistory('user123');

// Get most recent update
const mostRecent = getMostRecentUpdate('user123');

// Get specific update by ID
const update = getUpdateById('user123', 'update_123');
```

### Rollback

Undo changes to a previous state:

```typescript
const rollbackResult = rollbackToUpdate(
  currentProfile,
  'user123',
  updateId
);

if (rollbackResult.success) {
  console.log('Rolled back to:', rollbackResult.updatedProfile);
}
```

### Optimistic Updates

Handle concurrent updates with conflict detection:

```typescript
const result = applyOptimisticUpdate(
  profile,
  { weight: 77 },
  {
    userId: 'user123',
    expectedVersion: currentVersion,
    conflictResolution: 'fail' // or 'merge' or 'overwrite'
  }
);
```

**Conflict Resolution Strategies:**

- `fail` - Reject update if profile was modified (default)
- `merge` - Merge non-conflicting changes
- `overwrite` - Force update regardless of conflicts

### Batch Updates

Update multiple user profiles at once:

```typescript
const profiles = new Map([
  ['user1', profile1],
  ['user2', profile2],
  ['user3', profile3]
]);

const result = batchUpdateProfiles(
  profiles,
  { subscription_tier: 'pro' }
);

console.log(`Success: ${result.successful}, Failed: ${result.failed}`);
```

## API Reference

### applySingleFieldUpdate

Update a single field with validation and history tracking.

```typescript
function applySingleFieldUpdate(
  profile: UserProfileExtended,
  field: keyof UserProfileExtended,
  value: unknown,
  options?: ProfileUpdateOptions
): ProfileUpdateResult
```

**Options:**
- `validateBeforeApply` (default: true) - Validate before applying
- `trackHistory` (default: true) - Track in update history
- `userId` - User identifier for history tracking

### applyMultipleFieldUpdates

Update multiple fields at once.

```typescript
function applyMultipleFieldUpdates(
  profile: UserProfileExtended,
  updates: Partial<UserProfileExtended>,
  options?: ProfileUpdateOptions
): ProfileUpdateResult
```

### rollbackToUpdate

Rollback to a previous profile state.

```typescript
function rollbackToUpdate(
  currentProfile: UserProfileExtended,
  userId: string,
  updateId: string
): ProfileUpdateResult
```

### applyOptimisticUpdate

Apply update with conflict detection.

```typescript
function applyOptimisticUpdate(
  currentProfile: UserProfileExtended,
  updates: Partial<UserProfileExtended>,
  options?: OptimisticUpdateOptions
): ProfileUpdateResult
```

**Additional Options:**
- `expectedVersion` - Expected version/timestamp for conflict detection
- `conflictResolution` - Strategy for handling conflicts ('fail' | 'merge' | 'overwrite')

### batchUpdateProfiles

Update multiple user profiles.

```typescript
function batchUpdateProfiles(
  profiles: Map<string, UserProfileExtended>,
  updates: Partial<UserProfileExtended>,
  options?: ProfileUpdateOptions
): BatchUpdateResult
```

## Types

### ProfileUpdateResult

```typescript
interface ProfileUpdateResult {
  success: boolean;
  updatedProfile?: UserProfileExtended;
  errors?: ValidationError[];
  updateId?: string;
  timestamp?: Date;
}
```

### ProfileUpdateHistoryEntry

```typescript
interface ProfileUpdateHistoryEntry {
  updateId: string;
  timestamp: Date;
  updates: ProfileUpdate[];
  previousValues: Partial<UserProfileExtended>;
  newValues: Partial<UserProfileExtended>;
  userId?: string;
}
```

## Validation

All updates are validated by default using the profile validation system:

- **Height**: 100-250 cm
- **Weight**: 30-300 kg
- **Age**: 13-100 years
- **Body Fat**: 3-50% (optional)
- **Workout Days**: 1-7 days per week
- **Plan Duration**: 1-52 weeks

Validation can be disabled by setting `validateBeforeApply: false`.

## Error Handling

```typescript
const result = applySingleFieldUpdate(profile, 'weight', 77);

if (!result.success) {
  result.errors?.forEach(error => {
    console.error(`${error.field}: ${error.message}`);
  });
}
```

## Best Practices

1. **Always validate in production** - Keep `validateBeforeApply: true`
2. **Track history for user-facing updates** - Enables undo functionality
3. **Use optimistic updates for real-time sync** - Better UX with conflict detection
4. **Handle errors gracefully** - Show user-friendly messages
5. **Clear history periodically** - Prevent memory issues in long-running apps

## Integration Examples

### React Hook

```typescript
function useProfileUpdate(userId: string) {
  const [profile, setProfile] = useState<UserProfileExtended>();
  
  const updateField = useCallback((field: keyof UserProfileExtended, value: unknown) => {
    if (!profile) return;
    
    const result = applySingleFieldUpdate(profile, field, value, { userId });
    
    if (result.success) {
      setProfile(result.updatedProfile);
      toast.success('Profile updated!');
    } else {
      toast.error(result.errors?.[0]?.message || 'Update failed');
    }
  }, [profile, userId]);
  
  return { profile, updateField };
}
```

### API Endpoint

```typescript
// POST /api/profile/update
export async function POST(req: Request) {
  const { userId, updates } = await req.json();
  
  // Get current profile from database
  const currentProfile = await getProfileFromDB(userId);
  
  // Apply updates
  const result = applyMultipleFieldUpdates(currentProfile, updates, { userId });
  
  if (result.success) {
    // Save to database
    await saveProfileToDB(userId, result.updatedProfile);
    
    return Response.json({ success: true, profile: result.updatedProfile });
  } else {
    return Response.json({ success: false, errors: result.errors }, { status: 400 });
  }
}
```

## Testing

Comprehensive test suite included:

```bash
npm test -- profileUpdateWorkflow.test.ts
```

Tests cover:
- Single and multiple field updates
- Validation scenarios
- History tracking
- Rollback functionality
- Concurrent update handling
- Batch operations
- Edge cases

## Performance Considerations

- **In-memory history** - Current implementation uses in-memory storage
- **Production use** - Replace with database storage for persistence
- **History cleanup** - Implement periodic cleanup for old entries
- **Batch operations** - Use for bulk updates to improve performance

## Future Enhancements

- [ ] Database persistence for update history
- [ ] Automatic history cleanup/archival
- [ ] Conflict resolution UI components
- [ ] Real-time sync with WebSockets
- [ ] Audit logging for compliance
- [ ] Profile versioning system

## License

Part of the AI Performance Nutrition & Training Engine.
