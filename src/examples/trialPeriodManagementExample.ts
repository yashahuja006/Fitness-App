/**
 * Trial Period Management Examples
 * Demonstrates how to use the trial period management system
 */

import { createClient } from '@supabase/supabase-js';
import {
  TrialPeriodManager,
  TrialConversionHandler,
  TrialPeriodValidator,
  TrialPeriodData,
  isInTrialPeriod,
  getTrialDaysRemaining,
  isTrialExpiringSoon,
  getTrialProgress,
} from '../lib/trialPeriodManagement';
import {
  TrialPeriodService,
  createTrialPeriodService,
} from '../lib/supabase/trialPeriodService';
import {
  SubscriptionTrialValidator,
  SubscriptionStatusHelper,
  TrialToSubscriptionConverter,
  checkTrialEligibility,
} from '../lib/subscriptionTrialIntegration';
import { SubscriptionData } from '../lib/subscriptionValidation';

/**
 * Example 1: Initialize a new trial for a user
 */
async function example1_InitializeTrial() {
  console.log('=== Example 1: Initialize Trial ===\n');

  const userId = 'user-123';
  const trialDurationDays = 14;

  // Create trial data
  const trialData = TrialPeriodManager.initializeTrial(
    userId,
    trialDurationDays
  );

  console.log('Trial initialized:');
  console.log('- User ID:', trialData.userId);
  console.log('- Start Date:', trialData.trialStartDate.toLocaleDateString());
  console.log('- End Date:', trialData.trialEndDate.toLocaleDateString());
  console.log('- Duration:', trialData.trialDurationDays, 'days');
  console.log('- Is Active:', trialData.isActive);

  // Save to database (requires Supabase client)
  // const supabase = createClient(url, key);
  // const service = createTrialPeriodService(supabase);
  // const { data, error } = await service.createTrial(userId, trialDurationDays);
}

/**
 * Example 2: Check trial status
 */
async function example2_CheckTrialStatus() {
  console.log('\n=== Example 2: Check Trial Status ===\n');

  // Simulate an active trial
  const activeTrial: TrialPeriodData = {
    userId: 'user-123',
    trialStartDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    trialEndDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
    trialDurationDays: 14,
    isActive: true,
    hasExpired: false,
    hasConverted: false,
  };

  const status = TrialPeriodManager.checkTrialStatus(activeTrial);

  console.log('Trial Status:');
  console.log('- In Trial:', status.isInTrial);
  console.log('- Days Remaining:', status.daysRemaining);
  console.log('- Days Elapsed:', status.daysElapsed);
  console.log('- Can Access:', status.canAccess);
  console.log('- Message:', status.message);
  console.log('- Should Prompt Upgrade:', status.shouldPromptUpgrade);

  // Get progress percentage
  const progress = getTrialProgress(activeTrial);
  console.log('- Progress:', progress.toFixed(1) + '%');
}

/**
 * Example 3: Handle trial expiring soon
 */
async function example3_TrialExpiringSoon() {
  console.log('\n=== Example 3: Trial Expiring Soon ===\n');

  const expiringSoonTrial: TrialPeriodData = {
    userId: 'user-123',
    trialStartDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    trialEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days left
    trialDurationDays: 14,
    isActive: true,
    hasExpired: false,
    hasConverted: false,
  };

  const status = TrialPeriodManager.checkTrialStatus(expiringSoonTrial);

  console.log('Trial Status:');
  console.log('- Days Remaining:', status.daysRemaining);
  console.log('- Should Prompt Upgrade:', status.shouldPromptUpgrade);
  console.log('- Message:', status.message);

  // Get warning message
  const warningMessage = TrialPeriodManager.getTrialWarningMessage(
    status.daysRemaining
  );
  if (warningMessage) {
    console.log('- Warning:', warningMessage);
  }

  // Check if expiring soon
  const subscription: SubscriptionData = {
    tier: 'pro',
    status: 'trial',
    trialEnd: expiringSoonTrial.trialEndDate,
  };

  const isExpiringSoon = isTrialExpiringSoon(subscription, 3);
  console.log('- Is Expiring Soon (3 day threshold):', isExpiringSoon);
}

/**
 * Example 4: Convert trial to paid subscription
 */
async function example4_ConvertTrialToPaid() {
  console.log('\n=== Example 4: Convert Trial to Paid ===\n');

  const trialData: TrialPeriodData = {
    userId: 'user-123',
    trialStartDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    trialEndDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    trialDurationDays: 14,
    isActive: true,
    hasExpired: false,
    hasConverted: false,
  };

  // Simulate payment verification
  const paymentVerified = true;

  // Process conversion
  const result = await TrialConversionHandler.processConversion(
    trialData,
    'pro',
    paymentVerified
  );

  if (result.success) {
    console.log('Conversion successful!');
    console.log('- Converted to:', result.conversionData?.toTier);
    console.log('- Converted at:', result.conversionData?.convertedAt);
    console.log('- Trial duration:', result.conversionData?.trialDuration, 'days');
    console.log('- Conversion reason:', result.conversionData?.conversionReason);
  } else {
    console.log('Conversion failed:', result.error);
  }

  // Using the converter utility
  const converterResult = TrialToSubscriptionConverter.convertToPaid(
    trialData,
    paymentVerified
  );

  if (converterResult.success) {
    console.log('\nNew subscription created:');
    console.log('- Tier:', converterResult.newSubscription?.tier);
    console.log('- Status:', converterResult.newSubscription?.status);
    console.log(
      '- Period End:',
      converterResult.newSubscription?.currentPeriodEnd?.toLocaleDateString()
    );
  }
}

/**
 * Example 5: Handle trial expiration
 */
async function example5_HandleTrialExpiration() {
  console.log('\n=== Example 5: Handle Trial Expiration ===\n');

  const expiredTrial: TrialPeriodData = {
    userId: 'user-123',
    trialStartDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    trialEndDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expired yesterday
    trialDurationDays: 14,
    isActive: true,
    hasExpired: false,
    hasConverted: false,
  };

  // Option 1: Auto-convert to free tier
  const autoConvertResult = TrialConversionHandler.handleTrialExpiry(
    expiredTrial,
    true
  );

  console.log('Auto-convert to free:');
  console.log('- Action:', autoConvertResult.action);
  console.log('- Has Converted:', autoConvertResult.updatedTrialData.hasConverted);
  console.log(
    '- Converted To:',
    autoConvertResult.conversionData?.toTier
  );

  // Option 2: Just expire without conversion
  const expireOnlyResult = TrialConversionHandler.handleTrialExpiry(
    expiredTrial,
    false
  );

  console.log('\nExpire only:');
  console.log('- Action:', expireOnlyResult.action);
  console.log('- Has Expired:', expireOnlyResult.updatedTrialData.hasExpired);
  console.log('- Is Active:', expireOnlyResult.updatedTrialData.isActive);
}

/**
 * Example 6: Extend trial period
 */
async function example6_ExtendTrial() {
  console.log('\n=== Example 6: Extend Trial ===\n');

  const trialData: TrialPeriodData = {
    userId: 'user-123',
    trialStartDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    trialEndDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    trialDurationDays: 14,
    isActive: true,
    hasExpired: false,
    hasConverted: false,
  };

  console.log('Original trial:');
  console.log('- End Date:', trialData.trialEndDate.toLocaleDateString());
  console.log('- Duration:', trialData.trialDurationDays, 'days');

  // Extend by 7 days
  const additionalDays = 7;
  const extendedTrial = TrialPeriodManager.extendTrial(
    trialData,
    additionalDays
  );

  console.log('\nExtended trial:');
  console.log('- New End Date:', extendedTrial.trialEndDate.toLocaleDateString());
  console.log('- New Duration:', extendedTrial.trialDurationDays, 'days');
  console.log('- Additional Days:', additionalDays);
}

/**
 * Example 7: Cancel trial
 */
async function example7_CancelTrial() {
  console.log('\n=== Example 7: Cancel Trial ===\n');

  const trialData: TrialPeriodData = {
    userId: 'user-123',
    trialStartDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    trialEndDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    trialDurationDays: 14,
    isActive: true,
    hasExpired: false,
    hasConverted: false,
  };

  const cancellationReason = 'User requested cancellation';
  const cancelledTrial = TrialPeriodManager.cancelTrial(
    trialData,
    cancellationReason
  );

  console.log('Trial cancelled:');
  console.log('- Is Active:', cancelledTrial.isActive);
  console.log('- Cancellation Date:', cancelledTrial.cancellationDate?.toLocaleDateString());
  console.log('- Reason:', cancelledTrial.cancellationReason);
}

/**
 * Example 8: Check trial eligibility
 */
async function example8_CheckEligibility() {
  console.log('\n=== Example 8: Check Trial Eligibility ===\n');

  // New user - eligible
  const newUserEligibility = checkTrialEligibility(false, false);
  console.log('New user:');
  console.log('- Eligible:', newUserEligibility.eligible);

  // Returning user - not eligible
  const returningUserEligibility = checkTrialEligibility(true, false);
  console.log('\nReturning user:');
  console.log('- Eligible:', returningUserEligibility.eligible);
  console.log('- Reason:', returningUserEligibility.reason);

  // With multiple trials allowed
  const multipleTrialsEligibility = checkTrialEligibility(true, true);
  console.log('\nWith multiple trials allowed:');
  console.log('- Eligible:', multipleTrialsEligibility.eligible);
}

/**
 * Example 9: Validate subscription with trial
 */
async function example9_ValidateWithTrial() {
  console.log('\n=== Example 9: Validate Subscription with Trial ===\n');

  const subscription: SubscriptionData = {
    tier: 'pro',
    status: 'trial',
    trialEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  };

  const trialData: TrialPeriodData = {
    userId: 'user-123',
    trialStartDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    trialEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    trialDurationDays: 14,
    isActive: true,
    hasExpired: false,
    hasConverted: false,
  };

  const validation = SubscriptionTrialValidator.validateWithTrial(
    subscription,
    trialData
  );

  console.log('Validation result:');
  console.log('- Is Valid:', validation.isValid);
  console.log('- Has Access:', validation.hasAccess);
  console.log('- Tier:', validation.tier);
  console.log('- Status:', validation.status);
  console.log('- Message:', validation.message);

  if (validation.trialInfo) {
    console.log('\nTrial info:');
    console.log('- In Trial:', validation.trialInfo.isInTrial);
    console.log('- Days Remaining:', validation.trialInfo.daysRemaining);
    console.log('- Should Prompt Upgrade:', validation.trialInfo.shouldPromptUpgrade);
  }
}

/**
 * Example 10: Get status badge for UI
 */
async function example10_StatusBadge() {
  console.log('\n=== Example 10: Status Badge ===\n');

  const subscription: SubscriptionData = {
    tier: 'pro',
    status: 'trial',
    trialEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  };

  const trialData: TrialPeriodData = {
    userId: 'user-123',
    trialStartDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    trialEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    trialDurationDays: 14,
    isActive: true,
    hasExpired: false,
    hasConverted: false,
  };

  const badge = SubscriptionStatusHelper.getStatusBadge(subscription, trialData);

  console.log('Status badge:');
  console.log('- Text:', badge.text);
  console.log('- Color:', badge.color);
  console.log('- Icon:', badge.icon);

  // Check if needs attention
  const attention = SubscriptionStatusHelper.needsAttention(
    subscription,
    trialData
  );

  if (attention.needsAttention) {
    console.log('\nNeeds attention:');
    console.log('- Reason:', attention.reason);
    console.log('- Action:', attention.action);
  }
}

/**
 * Example 11: Database operations with Supabase
 */
async function example11_DatabaseOperations() {
  console.log('\n=== Example 11: Database Operations ===\n');

  // This example requires actual Supabase credentials
  // Uncomment and configure when ready to use

  /*
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const service = createTrialPeriodService(supabase);

  const userId = 'user-123';

  // Create trial
  const { data: newTrial, error: createError } = await service.createTrial(
    userId,
    14
  );

  if (createError) {
    console.log('Error creating trial:', createError.message);
    return;
  }

  console.log('Trial created:', newTrial);

  // Get active trial
  const { data: activeTrial, error: getError } = await service.getActiveTrial(
    userId
  );

  if (activeTrial) {
    console.log('Active trial found:', activeTrial);

    // Get trial status
    const { data: status } = await service.getTrialStatus(userId);
    console.log('Trial status:', status);

    // Extend trial
    const { data: extended } = await service.extendTrial(userId, 7);
    console.log('Trial extended:', extended);

    // Convert to paid
    const { data: converted } = await service.convertTrialToPaid(
      userId,
      'pro',
      'manual'
    );
    console.log('Trial converted:', converted);
  }

  // Check if user has had trial before
  const { data: hadTrial } = await service.hasHadTrialBefore(userId);
  console.log('Has had trial before:', hadTrial);

  // Get expiring trials (admin function)
  const { data: expiringTrials } = await service.getExpiringTrials(3);
  console.log('Expiring trials:', expiringTrials);

  // Expire old trials (admin function)
  const { data: expireResult } = await service.expireOldTrials();
  console.log('Expired trials count:', expireResult?.expiredCount);
  */

  console.log('Database operations example (commented out - requires Supabase setup)');
}

/**
 * Example 12: Validate trial data
 */
async function example12_ValidateTrialData() {
  console.log('\n=== Example 12: Validate Trial Data ===\n');

  // Valid trial data
  const validTrial: TrialPeriodData = {
    userId: 'user-123',
    trialStartDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    trialEndDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    trialDurationDays: 14,
    isActive: true,
    hasExpired: false,
    hasConverted: false,
  };

  const validResult = TrialPeriodValidator.validateTrialData(validTrial);
  console.log('Valid trial:');
  console.log('- Is Valid:', validResult.isValid);
  console.log('- Errors:', validResult.errors);

  // Invalid trial data (excessive duration)
  const invalidTrial: TrialPeriodData = {
    userId: 'user-123',
    trialStartDate: new Date(),
    trialEndDate: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
    trialDurationDays: 100,
    isActive: true,
    hasExpired: false,
    hasConverted: false,
  };

  const invalidResult = TrialPeriodValidator.validateTrialData(invalidTrial);
  console.log('\nInvalid trial:');
  console.log('- Is Valid:', invalidResult.isValid);
  console.log('- Errors:', invalidResult.errors);
}

/**
 * Run all examples
 */
async function runAllExamples() {
  await example1_InitializeTrial();
  await example2_CheckTrialStatus();
  await example3_TrialExpiringSoon();
  await example4_ConvertTrialToPaid();
  await example5_HandleTrialExpiration();
  await example6_ExtendTrial();
  await example7_CancelTrial();
  await example8_CheckEligibility();
  await example9_ValidateWithTrial();
  await example10_StatusBadge();
  await example11_DatabaseOperations();
  await example12_ValidateTrialData();
}

// Export examples for use in documentation or testing
export {
  example1_InitializeTrial,
  example2_CheckTrialStatus,
  example3_TrialExpiringSoon,
  example4_ConvertTrialToPaid,
  example5_HandleTrialExpiration,
  example6_ExtendTrial,
  example7_CancelTrial,
  example8_CheckEligibility,
  example9_ValidateWithTrial,
  example10_StatusBadge,
  example11_DatabaseOperations,
  example12_ValidateTrialData,
  runAllExamples,
};

// Run examples if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
