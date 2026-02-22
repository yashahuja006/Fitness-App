/**
 * Example: Subscription Validation Integration
 * Demonstrates how to use subscription validation in API routes and components
 */

import { Request, Response, Router } from 'express';
import {
  validateSubscriptionStatus,
  requireProSubscription,
  requireCurrentPayment,
  attachSubscriptionWarnings,
  extractSubscriptionFromUser,
  SubscriptionRequest,
} from '../middleware/subscriptionMiddleware';
import {
  SubscriptionValidator,
  SubscriptionStatusChecker,
  SubscriptionData,
} from '../lib/subscriptionValidation';
import {
  ClientSubscriptionValidator,
  SubscriptionHooks,
  PRO_FEATURES,
} from '../utils/clientSubscriptionValidation';

// ============================================================================
// SERVER-SIDE EXAMPLES
// ============================================================================

/**
 * Example 1: Protect Pro-only endpoint
 */
const router = Router();

router.post(
  '/api/transformation/generate',
  // First authenticate the user
  authenticateToken,
  // Then validate Pro subscription
  requireProSubscription,
  // Finally handle the request
  async (req: SubscriptionRequest, res: Response) => {
    try {
      const { userProfile } = req.body;
      
      // Generate Pro plan with all features
      const plan = await generateProPlan(userProfile);
      
      res.json({
        success: true,
        data: { plan },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to generate plan' },
      });
    }
  }
);

/**
 * Example 2: Validate subscription and attach warnings
 */
router.get(
  '/api/user/plan/:planId',
  authenticateToken,
  validateSubscriptionStatus,
  attachSubscriptionWarnings,
  async (req: SubscriptionRequest, res: Response) => {
    try {
      const { planId } = req.params;
      const validation = req.subscriptionValidation;
      
      // Get plan
      const plan = await getPlan(planId);
      
      // Limit plan based on subscription
      const limitedPlan = limitPlanBySubscription(plan, validation);
      
      res.json({
        success: true,
        data: { plan: limitedPlan },
        subscription: {
          tier: validation?.tier,
          status: validation?.status,
          hasAccess: validation?.hasAccess,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to get plan' },
      });
    }
  }
);

/**
 * Example 3: Check payment before processing upgrade
 */
router.post(
  '/api/subscription/upgrade',
  authenticateToken,
  requireCurrentPayment,
  async (req: SubscriptionRequest, res: Response) => {
    try {
      const { tier } = req.body;
      
      // Process upgrade
      const result = await processUpgrade(req.user!.uid, tier);
      
      res.json({
        success: true,
        data: { subscription: result },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to upgrade subscription' },
      });
    }
  }
);

/**
 * Example 4: Manual subscription validation in handler
 */
router.get(
  '/api/features/available',
  authenticateToken,
  async (req: SubscriptionRequest, res: Response) => {
    try {
      // Get user data
      const userData = await getUserData(req.user!.uid);
      
      // Extract subscription
      const subscription = extractSubscriptionFromUser(userData);
      
      // Validate subscription
      const validation = SubscriptionValidator.validateSubscription(subscription);
      
      // Get available features
      const features = ClientSubscriptionValidator.getAvailableFeatures(subscription);
      const locked = ClientSubscriptionValidator.getLockedFeatures(subscription);
      
      res.json({
        success: true,
        data: {
          subscription: {
            tier: validation.tier,
            status: validation.status,
            hasAccess: validation.hasAccess,
          },
          features: {
            available: features,
            locked: locked,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to get features' },
      });
    }
  }
);

/**
 * Example 5: Automatic downgrade check (scheduled job)
 */
async function checkSubscriptionExpiry() {
  const users = await getAllUsersWithProSubscription();
  
  for (const user of users) {
    const subscription = extractSubscriptionFromUser(user);
    const validation = SubscriptionValidator.validateSubscription(subscription);
    
    if (validation.shouldDowngrade) {
      // Downgrade user to free tier
      await downgradeUser(user.uid, {
        previousTier: subscription.tier,
        reason: validation.reason,
        downgradedAt: new Date(),
      });
      
      // Send notification
      await sendDowngradeNotification(user.uid, validation.reason);
      
      console.log(`Downgraded user ${user.uid} from ${subscription.tier} to free`);
    }
  }
}

// ============================================================================
// CLIENT-SIDE EXAMPLES (React/Next.js)
// ============================================================================

/**
 * Example 6: Feature Gate Component
 */
interface FeatureGateProps {
  subscription: SubscriptionData;
  feature: string;
  children: React.ReactNode;
  onUpgrade?: () => void;
}

function FeatureGate({ subscription, feature, children, onUpgrade }: FeatureGateProps) {
  const props = SubscriptionHooks.getFeatureGateProps(
    subscription,
    feature as any
  );
  
  if (props.isLocked) {
    return (
      <div className="locked-feature">
        <div className="lock-icon">🔒</div>
        <p>{props.upgradeMessage}</p>
        <button onClick={onUpgrade}>Upgrade to Pro</button>
      </div>
    );
  }
  
  return <>{children}</>;
}

/**
 * Example 7: Subscription Alert Banner
 */
interface SubscriptionAlertProps {
  subscription: SubscriptionData;
}

function SubscriptionAlert({ subscription }: SubscriptionAlertProps) {
  const alert = SubscriptionHooks.getSubscriptionAlertProps(subscription);
  
  if (!alert) return null;
  
  const severityColors = {
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  };
  
  return (
    <div className={`alert ${severityColors[alert.severity]}`}>
      <p>{alert.message}</p>
      {alert.action && (
        <button className="alert-action">
          {alert.action}
        </button>
      )}
    </div>
  );
}

/**
 * Example 8: Subscription Status Badge
 */
interface StatusBadgeProps {
  subscription: SubscriptionData;
}

function StatusBadge({ subscription }: StatusBadgeProps) {
  const badge = ClientSubscriptionValidator.getStatusBadge(subscription);
  
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500',
  };
  
  return (
    <span className={`badge ${colorClasses[badge.color]}`}>
      {badge.label}
    </span>
  );
}

/**
 * Example 9: Pro Feature with Upgrade Prompt
 */
interface MacroCyclingFeatureProps {
  subscription: SubscriptionData;
}

function MacroCyclingFeature({ subscription }: MacroCyclingFeatureProps) {
  const access = ClientSubscriptionValidator.canAccessProFeature(
    subscription,
    PRO_FEATURES.MACRO_CYCLING
  );
  
  if (!access.hasAccess) {
    return (
      <div className="upgrade-prompt">
        <h3>Macro Cycling</h3>
        <p>{access.upgradeMessage}</p>
        <button onClick={() => window.location.href = '/upgrade'}>
          Upgrade Now
        </button>
      </div>
    );
  }
  
  return (
    <div className="macro-cycling-feature">
      <h3>Macro Cycling</h3>
      {/* Feature content */}
    </div>
  );
}

/**
 * Example 10: Check multiple features
 */
function FeatureList({ subscription }: { subscription: SubscriptionData }) {
  const available = ClientSubscriptionValidator.getAvailableFeatures(subscription);
  const locked = ClientSubscriptionValidator.getLockedFeatures(subscription);
  
  return (
    <div>
      <h3>Available Features</h3>
      <ul>
        {available.map(feature => (
          <li key={feature}>✅ {feature}</li>
        ))}
      </ul>
      
      {locked.length > 0 && (
        <>
          <h3>Locked Features (Upgrade to Pro)</h3>
          <ul>
            {locked.map(feature => (
              <li key={feature}>🔒 {feature}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/**
 * Example 11: Subscription needs attention check
 */
function SubscriptionWarning({ subscription }: { subscription: SubscriptionData }) {
  const attention = ClientSubscriptionValidator.needsAttention(subscription);
  
  if (!attention.needsAttention) return null;
  
  return (
    <div className={`warning-banner ${attention.severity}`}>
      <p>{attention.message}</p>
    </div>
  );
}

/**
 * Example 12: Plan generation with subscription check
 */
async function generatePlanWithSubscriptionCheck(
  userProfile: any,
  subscription: SubscriptionData
) {
  // Validate subscription
  const validation = SubscriptionValidator.validateSubscription(subscription);
  
  if (!validation.hasAccess) {
    throw new Error('No active subscription');
  }
  
  // Check if Pro features are available
  const hasProAccess = SubscriptionStatusChecker.hasProAccess(subscription);
  
  // Generate plan based on tier
  const plan = {
    metabolicAnalysis: generateMetabolicAnalysis(userProfile),
    macroStrategy: generateMacroStrategy(userProfile),
    mealPlan: generateMealPlan(userProfile, hasProAccess ? 7 : 3), // 7-day vs 3-day
    
    // Pro-only features
    macroCycling: hasProAccess ? generateMacroCycling(userProfile) : null,
    groceryOptimization: hasProAccess ? generateGroceryList(userProfile) : null,
    mealPrepStrategy: hasProAccess ? generateMealPrepStrategy(userProfile) : null,
  };
  
  return plan;
}

// ============================================================================
// HELPER FUNCTIONS (Placeholders)
// ============================================================================

async function authenticateToken(req: any, res: any, next: any) {
  // Authentication logic
  next();
}

async function generateProPlan(userProfile: any) {
  return {};
}

async function getPlan(planId: string) {
  return {};
}

function limitPlanBySubscription(plan: any, validation: any) {
  return plan;
}

async function processUpgrade(userId: string, tier: string) {
  return {};
}

async function getUserData(userId: string) {
  return {};
}

async function getAllUsersWithProSubscription() {
  return [];
}

async function downgradeUser(userId: string, data: any) {
  // Downgrade logic
}

async function sendDowngradeNotification(userId: string, reason?: string) {
  // Send notification
}

function generateMetabolicAnalysis(userProfile: any) {
  return {};
}

function generateMacroStrategy(userProfile: any) {
  return {};
}

function generateMealPlan(userProfile: any, days: number) {
  return {};
}

function generateMacroCycling(userProfile: any) {
  return {};
}

function generateGroceryList(userProfile: any) {
  return {};
}

function generateMealPrepStrategy(userProfile: any) {
  return {};
}

export {
  FeatureGate,
  SubscriptionAlert,
  StatusBadge,
  MacroCyclingFeature,
  FeatureList,
  SubscriptionWarning,
  generatePlanWithSubscriptionCheck,
  checkSubscriptionExpiry,
};
