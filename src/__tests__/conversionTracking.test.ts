/**
 * Tests for Conversion Tracking Service
 */

import { ConversionTrackingService } from '@/lib/conversionTrackingService';

describe('ConversionTrackingService', () => {
  beforeEach(() => {
    // Clear events before each test
    ConversionTrackingService.clearEvents();
  });

  describe('Event Tracking', () => {
    test('should track prompt view event', () => {
      ConversionTrackingService.trackPromptView('user1', 'macro_cycling', 'dashboard');
      
      const events = ConversionTrackingService.getUserEvents('user1');
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('prompt_viewed');
      expect(events[0].featureId).toBe('macro_cycling');
      expect(events[0].promptLocation).toBe('dashboard');
    });

    test('should track prompt click event', () => {
      ConversionTrackingService.trackPromptClick('user1', 'macro_cycling', 'dashboard');
      
      const events = ConversionTrackingService.getUserEvents('user1');
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('prompt_clicked');
    });

    test('should track prompt dismiss event', () => {
      ConversionTrackingService.trackPromptDismiss('user1', 'macro_cycling', 'dashboard');
      
      const events = ConversionTrackingService.getUserEvents('user1');
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('prompt_dismissed');
    });

    test('should track upgrade initiation', () => {
      ConversionTrackingService.trackUpgradeInitiation('user1', 'dashboard');
      
      const events = ConversionTrackingService.getUserEvents('user1');
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('upgrade_initiated');
    });

    test('should track payment start', () => {
      ConversionTrackingService.trackPaymentStart('user1', 'pro-monthly');
      
      const events = ConversionTrackingService.getUserEvents('user1');
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('payment_started');
      expect(events[0].metadata?.plan).toBe('pro-monthly');
    });

    test('should track payment completion', () => {
      ConversionTrackingService.trackPaymentComplete('user1', 'pro-monthly', 29.99);
      
      const events = ConversionTrackingService.getUserEvents('user1');
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('payment_completed');
      expect(events[0].metadata?.amount).toBe(29.99);
    });

    test('should track payment failure', () => {
      ConversionTrackingService.trackPaymentFailure('user1', 'card_declined');
      
      const events = ConversionTrackingService.getUserEvents('user1');
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('payment_failed');
      expect(events[0].metadata?.reason).toBe('card_declined');
    });
  });

  describe('Conversion Funnel Metrics', () => {
    test('should calculate user funnel metrics correctly', () => {
      const userId = 'user1';
      
      // Simulate complete funnel
      ConversionTrackingService.trackPromptView(userId, 'macro_cycling', 'dashboard');
      ConversionTrackingService.trackPromptView(userId, 'grocery_optimization', 'meal-plan');
      ConversionTrackingService.trackPromptClick(userId, 'macro_cycling', 'dashboard');
      ConversionTrackingService.trackUpgradeInitiation(userId, 'dashboard');
      ConversionTrackingService.trackPaymentStart(userId, 'pro-monthly');
      ConversionTrackingService.trackPaymentComplete(userId, 'pro-monthly', 29.99);
      
      const metrics = ConversionTrackingService.getUserFunnelMetrics(userId);
      
      expect(metrics.promptViews).toBe(2);
      expect(metrics.promptClicks).toBe(1);
      expect(metrics.upgradeInitiations).toBe(1);
      expect(metrics.paymentStarts).toBe(1);
      expect(metrics.paymentCompletions).toBe(1);
      expect(metrics.clickThroughRate).toBe(0.5); // 1 click / 2 views
      expect(metrics.overallConversionRate).toBe(0.5); // 1 completion / 2 views
    });

    test('should calculate overall funnel metrics correctly', () => {
      // User 1: Complete conversion
      ConversionTrackingService.trackPromptView('user1', 'macro_cycling', 'dashboard');
      ConversionTrackingService.trackPromptClick('user1', 'macro_cycling', 'dashboard');
      ConversionTrackingService.trackUpgradeInitiation('user1', 'dashboard');
      ConversionTrackingService.trackPaymentStart('user1', 'pro-monthly');
      ConversionTrackingService.trackPaymentComplete('user1', 'pro-monthly', 29.99);
      
      // User 2: Dropped at click
      ConversionTrackingService.trackPromptView('user2', 'grocery_optimization', 'meal-plan');
      
      const metrics = ConversionTrackingService.getOverallFunnelMetrics();
      
      expect(metrics.promptViews).toBe(2);
      expect(metrics.promptClicks).toBe(1);
      expect(metrics.paymentCompletions).toBe(1);
      expect(metrics.overallConversionRate).toBe(0.5); // 1 completion / 2 views
    });

    test('should handle empty funnel metrics', () => {
      const metrics = ConversionTrackingService.getUserFunnelMetrics('nonexistent-user');
      
      expect(metrics.promptViews).toBe(0);
      expect(metrics.promptClicks).toBe(0);
      expect(metrics.clickThroughRate).toBe(0);
      expect(metrics.overallConversionRate).toBe(0);
    });
  });

  describe('Feature Interest Metrics', () => {
    test('should calculate feature interest metrics', () => {
      ConversionTrackingService.trackPromptView('user1', 'macro_cycling', 'dashboard');
      ConversionTrackingService.trackPromptView('user2', 'macro_cycling', 'meal-plan');
      ConversionTrackingService.trackPromptClick('user1', 'macro_cycling', 'dashboard');
      ConversionTrackingService.trackPaymentComplete('user1', 'pro-monthly', 29.99);
      
      ConversionTrackingService.trackPromptView('user3', 'grocery_optimization', 'grocery-list');
      
      const metrics = ConversionTrackingService.getFeatureInterestMetrics();
      
      const macroCyclingMetric = metrics.find(m => m.featureId === 'macro_cycling');
      expect(macroCyclingMetric).toBeDefined();
      expect(macroCyclingMetric?.viewCount).toBe(2);
      expect(macroCyclingMetric?.clickCount).toBe(1);
      expect(macroCyclingMetric?.conversionCount).toBe(1);
      expect(macroCyclingMetric?.conversionRate).toBe(0.5); // 1 conversion / 2 views
      
      const groceryMetric = metrics.find(m => m.featureId === 'grocery_optimization');
      expect(groceryMetric).toBeDefined();
      expect(groceryMetric?.viewCount).toBe(1);
      expect(groceryMetric?.conversionRate).toBe(0);
    });
  });

  describe('Prompt Performance Metrics', () => {
    test('should calculate prompt variant performance', () => {
      ConversionTrackingService.setPromptVariant('benefits');
      ConversionTrackingService.trackPromptView('user1', 'macro_cycling', 'dashboard', 'benefits');
      ConversionTrackingService.trackPromptView('user2', 'macro_cycling', 'dashboard', 'benefits');
      ConversionTrackingService.trackPromptClick('user1', 'macro_cycling', 'dashboard', 'benefits');
      ConversionTrackingService.trackPaymentComplete('user1', 'pro-monthly', 29.99);
      
      ConversionTrackingService.setPromptVariant('default');
      ConversionTrackingService.trackPromptView('user3', 'macro_cycling', 'dashboard', 'default');
      
      const metrics = ConversionTrackingService.getPromptPerformanceMetrics();
      
      const benefitsMetric = metrics.find(m => m.variant === 'benefits');
      expect(benefitsMetric).toBeDefined();
      expect(benefitsMetric?.viewCount).toBe(2);
      expect(benefitsMetric?.clickCount).toBe(1);
      expect(benefitsMetric?.clickThroughRate).toBe(0.5);
      
      const defaultMetric = metrics.find(m => m.variant === 'default');
      expect(defaultMetric).toBeDefined();
      expect(defaultMetric?.viewCount).toBe(1);
      expect(defaultMetric?.clickThroughRate).toBe(0);
    });
  });

  describe('A/B Testing', () => {
    test('should set and get current variant', () => {
      ConversionTrackingService.setPromptVariant('benefits');
      expect(ConversionTrackingService.getCurrentVariant()).toBe('benefits');
      
      ConversionTrackingService.setPromptVariant('urgency');
      expect(ConversionTrackingService.getCurrentVariant()).toBe('urgency');
    });

    test('should use current variant for events', () => {
      ConversionTrackingService.setPromptVariant('social_proof');
      ConversionTrackingService.trackPromptView('user1', 'macro_cycling', 'dashboard');
      
      const events = ConversionTrackingService.getUserEvents('user1');
      expect(events[0].promptVariant).toBe('social_proof');
    });
  });

  describe('Event Filtering', () => {
    test('should get events by date range', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      ConversionTrackingService.trackPromptView('user1', 'macro_cycling', 'dashboard');
      
      const events = ConversionTrackingService.getEventsByDateRange(yesterday, tomorrow);
      expect(events).toHaveLength(1);
      
      const noEvents = ConversionTrackingService.getEventsByDateRange(yesterday, yesterday);
      expect(noEvents).toHaveLength(0);
    });

    test('should get events for specific user', () => {
      ConversionTrackingService.trackPromptView('user1', 'macro_cycling', 'dashboard');
      ConversionTrackingService.trackPromptView('user2', 'grocery_optimization', 'meal-plan');
      
      const user1Events = ConversionTrackingService.getUserEvents('user1');
      expect(user1Events).toHaveLength(1);
      expect(user1Events[0].userId).toBe('user1');
      
      const user2Events = ConversionTrackingService.getUserEvents('user2');
      expect(user2Events).toHaveLength(1);
      expect(user2Events[0].userId).toBe('user2');
    });
  });

  describe('Complete Conversion Flow', () => {
    test('should track complete successful conversion', () => {
      const userId = 'user1';
      
      // User sees prompt
      ConversionTrackingService.trackPromptView(userId, 'macro_cycling', 'dashboard');
      
      // User clicks prompt
      ConversionTrackingService.trackPromptClick(userId, 'macro_cycling', 'dashboard');
      
      // User initiates upgrade
      ConversionTrackingService.trackUpgradeInitiation(userId, 'dashboard');
      
      // User starts payment
      ConversionTrackingService.trackPaymentStart(userId, 'pro-monthly');
      
      // Payment completes
      ConversionTrackingService.trackPaymentComplete(userId, 'pro-monthly', 29.99);
      
      const metrics = ConversionTrackingService.getUserFunnelMetrics(userId);
      
      expect(metrics.promptViews).toBe(1);
      expect(metrics.promptClicks).toBe(1);
      expect(metrics.upgradeInitiations).toBe(1);
      expect(metrics.paymentStarts).toBe(1);
      expect(metrics.paymentCompletions).toBe(1);
      expect(metrics.overallConversionRate).toBe(1); // Perfect conversion
    });

    test('should track failed conversion', () => {
      const userId = 'user1';
      
      ConversionTrackingService.trackPromptView(userId, 'macro_cycling', 'dashboard');
      ConversionTrackingService.trackPromptClick(userId, 'macro_cycling', 'dashboard');
      ConversionTrackingService.trackUpgradeInitiation(userId, 'dashboard');
      ConversionTrackingService.trackPaymentStart(userId, 'pro-monthly');
      ConversionTrackingService.trackPaymentFailure(userId, 'card_declined');
      
      const metrics = ConversionTrackingService.getUserFunnelMetrics(userId);
      
      expect(metrics.paymentFailures).toBe(1);
      expect(metrics.paymentCompletions).toBe(0);
      expect(metrics.overallConversionRate).toBe(0);
    });

    test('should track dismissed prompt', () => {
      const userId = 'user1';
      
      ConversionTrackingService.trackPromptView(userId, 'macro_cycling', 'dashboard');
      ConversionTrackingService.trackPromptDismiss(userId, 'macro_cycling', 'dashboard');
      
      const metrics = ConversionTrackingService.getUserFunnelMetrics(userId);
      
      expect(metrics.promptViews).toBe(1);
      expect(metrics.promptDismissals).toBe(1);
      expect(metrics.promptClicks).toBe(0);
    });
  });

  describe('Conversion Rate Calculations', () => {
    test('should calculate >15% conversion rate target', () => {
      // Simulate 100 users viewing prompts, 20 converting (20% conversion)
      for (let i = 1; i <= 100; i++) {
        ConversionTrackingService.trackPromptView(`user${i}`, 'macro_cycling', 'dashboard');
        
        if (i <= 20) {
          ConversionTrackingService.trackPromptClick(`user${i}`, 'macro_cycling', 'dashboard');
          ConversionTrackingService.trackUpgradeInitiation(`user${i}`, 'dashboard');
          ConversionTrackingService.trackPaymentStart(`user${i}`, 'pro-monthly');
          ConversionTrackingService.trackPaymentComplete(`user${i}`, 'pro-monthly', 29.99);
        }
      }
      
      const metrics = ConversionTrackingService.getOverallFunnelMetrics();
      
      expect(metrics.promptViews).toBe(100);
      expect(metrics.paymentCompletions).toBe(20);
      expect(metrics.overallConversionRate).toBe(0.2); // 20%
      expect(metrics.overallConversionRate).toBeGreaterThan(0.15); // Meets >15% target
    });
  });
});
