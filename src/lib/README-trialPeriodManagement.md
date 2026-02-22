## Trial Period Management System

A comprehensive trial period management system that handles trial tracking, validation, expiration, and conversion to paid subscriptions.

### Overview

The trial period management system provides:

- **Trial Period Tracking**: Track trial start/end dates and duration
- **Status Validation**: Check trial status and access rights
- **Expiration Handling**: Automatically handle trial expiration
- **Conversion Workflows**: Convert trials to paid or free subscriptions
- **Database Integration**: Full Supabase integration for persistence
- **Subscription Integration**: Seamless integration with existing subscription system

### Core Components

#### 1. TrialPeriodManager

Main service for managing trial periods.

```typescript
import { TrialPeriodManager } from './lib/trialPeriodManagement';

// Initialize a new trial
const trial = TrialPeriodManager.initializeTrial('user-123', 14);

// Check trial status
const status = TrialPeriodManager.checkTrialStatus(trial);

// Convert to paid
const { updatedTrialData, conversionData } = 
  TrialPeriodManager.convertTrialToPaid(trial, 'pro', 'manual');

// Extend trial
const extended = TrialPeriodManager.extendTrial(trial, 7);

// Cancel trial
const cancelled = TrialPeriodManager.cancelTrial(trial, 'User requested');
```

#### 2. TrialPeriodService

Database service for Supabase operations.

```typescript
import { createTrialPeriodService } from './lib/supabase/trialPeriodService';

const service = createTrialPeriodService(supabase);

// Create trial in database
const { data, error } = await service.createTrial('user-123', 14);

// Get active trial
const { data: trial } = await service.getActiveTrial('user-123');

// Get trial status
const { data: status } = await service.getTrialStatus('user-123');

// Convert to paid
const { data: result } = await service.convertTrialToPaid('user-123', 'pro');

// Check eligibility
const { data: hadTrial } = await service.hasHadTrialBefore('user-123');
```

#### 3. SubscriptionTrialValidator

Validates subscriptions with trial consideration.

```typescript
import { SubscriptionTrialValidator } from './lib/subscriptionTrialIntegration';

// Validate with trial data
const validation = SubscriptionTrialValidator.validateWithTrial(
  subscription,
  trialData
);

// Check if should prompt upgrade
const { shouldPrompt, reason, urgency } = 
  SubscriptionTrialValidator.shouldPromptUpgrade(subscription, trialData);

// Check feature access
const { hasAccess, reason } = 
  SubscriptionTrialValidator.canAccessFeature(subscription, 'macro_cycling', trialData);
```

#### 4. TrialConversionHandler

Handles conversion workflows.

```typescript
import { TrialConversionHandler } from './lib/trialPeriodManagement';

// Process conversion
const result = await TrialConversionHandler.processConversion(
  trialData,
  'pro',
  paymentVerified
);

// Handle expiry
const expiryResult = TrialConversionHandler.handleTrialExpiry(
  trialData,
  autoConvertToFree
);
```

### Data Models

#### TrialPeriodData

```typescript
interface TrialPeriodData {
  userId: string;
  trialStartDate: Date;
  trialEndDate: Date;
  trialDurationDays: number;
  isActive: boolean;
  hasExpired: boolean;
  hasConverted: boolean;
  convertedAt?: Date;
  convertedToTier?: 'free' | 'pro';
  cancellationDate?: Date;
  cancellationReason?: string;
}
```

#### TrialStatusResult

```typescript
interface TrialStatusResult {
  isInTrial: boolean;
  isExpired: boolean;
  daysRemaining: number;
  daysElapsed: number;
  canAccess: boolean;
  message: string;
  shouldPromptUpgrade: boolean;
}
```

### Database Schema

The system uses a `trial_periods` table in Supabase:

```sql
CREATE TABLE trial_periods (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  trial_duration_days INTEGER,
  is_active BOOLEAN,
  has_expired BOOLEAN,
  has_converted BOOLEAN,
  converted_at TIMESTAMP WITH TIME ZONE,
  converted_to_tier TEXT,
  conversion_reason TEXT,
  cancellation_date TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### Helper Functions

```typescript
// Check if subscription is in trial
isInTrialPeriod(subscription);

// Get days remaining
getTrialDaysRemaining(subscription);

// Check if expiring soon
isTrialExpiringSoon(subscription, thresholdDays);

// Get trial progress percentage
getTrialProgress(trialData);

// Check eligibility
checkTrialEligibility(hasHadTrialBefore, allowMultipleTrials);
```

### Common Use Cases

#### 1. Start a New Trial

```typescript
// Check eligibility
const eligibility = checkTrialEligibility(hasHadTrialBefore);
if (!eligibility.eligible) {
  console.log('Not eligible:', eligibility.reason);
  return;
}

// Create trial
const service = createTrialPeriodService(supabase);
const { data: trial, error } = await service.createTrial(userId, 14);

if (trial) {
  console.log('Trial started:', trial);
}
```

#### 2. Check Trial Status

```typescript
const service = createTrialPeriodService(supabase);
const { data: status } = await service.getTrialStatus(userId);

if (status) {
  console.log('Days remaining:', status.daysRemaining);
  console.log('Should prompt upgrade:', status.shouldPromptUpgrade);
  
  if (status.shouldPromptUpgrade) {
    // Show upgrade prompt to user
    showUpgradePrompt(status.message);
  }
}
```

#### 3. Convert Trial to Paid

```typescript
// Verify payment first
const paymentVerified = await verifyPayment(userId, paymentMethod);

if (paymentVerified) {
  const service = createTrialPeriodService(supabase);
  const { data: result } = await service.convertTrialToPaid(
    userId,
    'pro',
    'manual'
  );
  
  if (result) {
    console.log('Converted to Pro!');
    // Update user's subscription status
    await updateSubscriptionStatus(userId, 'pro', 'active');
  }
}
```

#### 4. Handle Trial Expiration

```typescript
// Run as a scheduled job (e.g., daily cron)
const service = createTrialPeriodService(supabase);

// Get expiring trials
const { data: expiringTrials } = await service.getExpiringTrials(3);

// Send notifications
for (const trial of expiringTrials || []) {
  await sendExpirationWarning(trial.userId, trial.daysRemaining);
}

// Expire old trials
const { data: result } = await service.expireOldTrials();
console.log('Expired', result?.expiredCount, 'trials');
```

#### 5. Display Trial Status in UI

```typescript
import { SubscriptionStatusHelper } from './lib/subscriptionTrialIntegration';

function TrialStatusBadge({ subscription, trialData }) {
  const badge = SubscriptionStatusHelper.getStatusBadge(subscription, trialData);
  const attention = SubscriptionStatusHelper.needsAttention(subscription, trialData);
  
  return (
    <div>
      <span className={`badge badge-${badge.color}`}>
        {badge.icon} {badge.text}
      </span>
      
      {attention.needsAttention && (
        <div className="alert">
          <p>{attention.reason}</p>
          <button>{attention.action}</button>
        </div>
      )}
    </div>
  );
}
```

### Integration with Subscription System

The trial system integrates seamlessly with the existing subscription validation:

```typescript
import { SubscriptionTrialValidator } from './lib/subscriptionTrialIntegration';

// Validate subscription with trial
const validation = SubscriptionTrialValidator.validateWithTrial(
  subscription,
  trialData
);

if (validation.hasAccess) {
  // User can access Pro features
  if (validation.trialInfo?.isInTrial) {
    console.log('Trial user with', validation.trialInfo.daysRemaining, 'days left');
  }
}

// Check feature access
const { hasAccess } = SubscriptionTrialValidator.canAccessFeature(
  subscription,
  'macro_cycling',
  trialData
);
```

### Configuration

Default configuration values:

```typescript
const DEFAULT_TRIAL_DAYS = 14;
const WARNING_THRESHOLD_DAYS = 3;
const GRACE_PERIOD_DAYS = 0;
const MAX_TRIAL_DURATION = 90;
```

### Testing

Comprehensive test suite included:

```bash
npm test -- src/lib/__tests__/trialPeriodManagement.test.ts
```

Test coverage includes:
- Trial initialization
- Status checking
- Conversion workflows
- Expiration handling
- Validation logic
- Helper functions

### Best Practices

1. **Always check eligibility** before creating a trial
2. **Validate payment** before converting to paid tier
3. **Send notifications** when trial is expiring soon
4. **Run scheduled jobs** to expire old trials
5. **Track conversion metrics** for business insights
6. **Handle errors gracefully** in all database operations
7. **Use transactions** for critical operations like conversion

### Error Handling

```typescript
const { data, error } = await service.createTrial(userId, 14);

if (error) {
  if (error.message.includes('already has an active trial')) {
    // Handle duplicate trial
  } else {
    // Handle other errors
    console.error('Failed to create trial:', error);
  }
}
```

### Security Considerations

- Row Level Security (RLS) policies enforce user access
- Users can only access their own trial data
- Admin functions require appropriate permissions
- Payment verification required for paid conversions
- Trial eligibility checked before creation

### Performance

- Indexed queries for fast lookups
- Batch operations for expiring trials
- Efficient date calculations
- Minimal database round trips

### Migration

To add trial period tracking to your database:

```bash
# Run the migration
psql -d your_database -f supabase/migrations/20240102000000_add_trial_period_tracking.sql
```

### Examples

See `src/examples/trialPeriodManagementExample.ts` for comprehensive examples of all features.

### Support

For issues or questions:
1. Check the examples file
2. Review the test suite
3. Consult the API documentation
4. Check integration with subscription system
