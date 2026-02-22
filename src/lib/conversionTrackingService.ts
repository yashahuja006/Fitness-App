/**
 * Conversion Tracking Service
 * Tracks user interactions with upgrade prompts and conversion funnel
 * Supports A/B testing and analytics for subscription optimization
 */

import { FeatureId } from './featureGatingService';

export type ConversionEventType =
  | 'prompt_viewed'
  | 'prompt_clicked'
  | 'upgrade_initiated'
  | 'payment_started'
  | 'payment_completed'
  | 'payment_failed'
  | 'prompt_dismissed';

export type PromptVariant = 'default' | 'benefits' | 'urgency' | 'social_proof';

export interface ConversionEvent {
  id: string;
  userId: string;
  eventType: ConversionEventType;
  timestamp: Date;
  featureId?: FeatureId;
  promptVariant?: PromptVariant;
  promptLocation?: string;
  metadata?: Record<string, any>;
}

export interface ConversionFunnelMetrics {
  promptViews: number;
  promptClicks: number;
  upgradeInitiations: number;
  paymentStarts: number;
  paymentCompletions: number;
  paymentFailures: number;
  promptDismissals: number;
  
  // Conversion rates
  clickThroughRate: number; // clicks / views
  initiationRate: number; // initiations / clicks
  paymentStartRate: number; // payment starts / initiations
  completionRate: number; // completions / payment starts
  overallConversionRate: number; // completions / views
}

export interface FeatureInterestMetrics {
  featureId: FeatureId;
  viewCount: number;
  clickCount: number;
  conversionCount: number;
  conversionRate: number;
}

export interface PromptPerformanceMetrics {
  variant: PromptVariant;
  viewCount: number;
  clickCount: number;
  conversionCount: number;
  clickThroughRate: number;
  conversionRate: number;
}

/**
 * Conversion Tracking Service
 * Provides methods to track and analyze subscription conversion events
 */
export class ConversionTrackingService {
  private static events: ConversionEvent[] = [];
  private static currentVariant: PromptVariant = 'default';

  /**
   * Track a conversion event
   */
  static trackEvent(
    userId: string,
    eventType: ConversionEventType,
    options?: {
      featureId?: FeatureId;
      promptVariant?: PromptVariant;
      promptLocation?: string;
      metadata?: Record<string, any>;
    }
  ): ConversionEvent {
    const event: ConversionEvent = {
      id: this.generateEventId(),
      userId,
      eventType,
      timestamp: new Date(),
      featureId: options?.featureId,
      promptVariant: options?.promptVariant || this.currentVariant,
      promptLocation: options?.promptLocation,
      metadata: options?.metadata
    };

    this.events.push(event);
    
    // In production, send to analytics service
    this.sendToAnalytics(event);
    
    return event;
  }

  /**
   * Track when a user views an upgrade prompt
   */
  static trackPromptView(
    userId: string,
    featureId: FeatureId,
    location: string,
    variant?: PromptVariant
  ): void {
    this.trackEvent(userId, 'prompt_viewed', {
      featureId,
      promptLocation: location,
      promptVariant: variant
    });
  }

  /**
   * Track when a user clicks an upgrade prompt
   */
  static trackPromptClick(
    userId: string,
    featureId: FeatureId,
    location: string,
    variant?: PromptVariant
  ): void {
    this.trackEvent(userId, 'prompt_clicked', {
      featureId,
      promptLocation: location,
      promptVariant: variant
    });
  }

  /**
   * Track when a user dismisses an upgrade prompt
   */
  static trackPromptDismiss(
    userId: string,
    featureId: FeatureId,
    location: string
  ): void {
    this.trackEvent(userId, 'prompt_dismissed', {
      featureId,
      promptLocation: location
    });
  }

  /**
   * Track when a user initiates the upgrade process
   */
  static trackUpgradeInitiation(userId: string, source?: string): void {
    this.trackEvent(userId, 'upgrade_initiated', {
      metadata: { source }
    });
  }

  /**
   * Track when payment process starts
   */
  static trackPaymentStart(userId: string, plan?: string): void {
    this.trackEvent(userId, 'payment_started', {
      metadata: { plan }
    });
  }

  /**
   * Track successful payment completion
   */
  static trackPaymentComplete(userId: string, plan: string, amount: number): void {
    this.trackEvent(userId, 'payment_completed', {
      metadata: { plan, amount }
    });
  }

  /**
   * Track payment failure
   */
  static trackPaymentFailure(userId: string, reason: string): void {
    this.trackEvent(userId, 'payment_failed', {
      metadata: { reason }
    });
  }

  /**
   * Get conversion funnel metrics for a user
   */
  static getUserFunnelMetrics(userId: string): ConversionFunnelMetrics {
    const userEvents = this.events.filter(e => e.userId === userId);
    
    const promptViews = userEvents.filter(e => e.eventType === 'prompt_viewed').length;
    const promptClicks = userEvents.filter(e => e.eventType === 'prompt_clicked').length;
    const upgradeInitiations = userEvents.filter(e => e.eventType === 'upgrade_initiated').length;
    const paymentStarts = userEvents.filter(e => e.eventType === 'payment_started').length;
    const paymentCompletions = userEvents.filter(e => e.eventType === 'payment_completed').length;
    const paymentFailures = userEvents.filter(e => e.eventType === 'payment_failed').length;
    const promptDismissals = userEvents.filter(e => e.eventType === 'prompt_dismissed').length;

    return {
      promptViews,
      promptClicks,
      upgradeInitiations,
      paymentStarts,
      paymentCompletions,
      paymentFailures,
      promptDismissals,
      clickThroughRate: promptViews > 0 ? promptClicks / promptViews : 0,
      initiationRate: promptClicks > 0 ? upgradeInitiations / promptClicks : 0,
      paymentStartRate: upgradeInitiations > 0 ? paymentStarts / upgradeInitiations : 0,
      completionRate: paymentStarts > 0 ? paymentCompletions / paymentStarts : 0,
      overallConversionRate: promptViews > 0 ? paymentCompletions / promptViews : 0
    };
  }

  /**
   * Get overall conversion funnel metrics
   */
  static getOverallFunnelMetrics(): ConversionFunnelMetrics {
    const promptViews = this.events.filter(e => e.eventType === 'prompt_viewed').length;
    const promptClicks = this.events.filter(e => e.eventType === 'prompt_clicked').length;
    const upgradeInitiations = this.events.filter(e => e.eventType === 'upgrade_initiated').length;
    const paymentStarts = this.events.filter(e => e.eventType === 'payment_started').length;
    const paymentCompletions = this.events.filter(e => e.eventType === 'payment_completed').length;
    const paymentFailures = this.events.filter(e => e.eventType === 'payment_failed').length;
    const promptDismissals = this.events.filter(e => e.eventType === 'prompt_dismissed').length;

    return {
      promptViews,
      promptClicks,
      upgradeInitiations,
      paymentStarts,
      paymentCompletions,
      paymentFailures,
      promptDismissals,
      clickThroughRate: promptViews > 0 ? promptClicks / promptViews : 0,
      initiationRate: promptClicks > 0 ? upgradeInitiations / promptClicks : 0,
      paymentStartRate: upgradeInitiations > 0 ? paymentStarts / upgradeInitiations : 0,
      completionRate: paymentStarts > 0 ? paymentCompletions / paymentStarts : 0,
      overallConversionRate: promptViews > 0 ? paymentCompletions / promptViews : 0
    };
  }

  /**
   * Get feature interest metrics (which features drive conversions)
   */
  static getFeatureInterestMetrics(): FeatureInterestMetrics[] {
    const featureMap = new Map<FeatureId, {
      views: number;
      clicks: number;
      conversions: number;
    }>();

    // Track users who converted and their feature interactions
    const convertedUsers = new Set(
      this.events
        .filter(e => e.eventType === 'payment_completed')
        .map(e => e.userId)
    );

    // Aggregate events by feature
    this.events.forEach(event => {
      if (!event.featureId) return;

      const current = featureMap.get(event.featureId) || { views: 0, clicks: 0, conversions: 0 };

      if (event.eventType === 'prompt_viewed') {
        current.views++;
        // Count as conversion if this user eventually converted
        if (convertedUsers.has(event.userId)) {
          current.conversions++;
        }
      } else if (event.eventType === 'prompt_clicked') {
        current.clicks++;
      }

      featureMap.set(event.featureId, current);
    });

    // Convert to metrics array
    return Array.from(featureMap.entries()).map(([featureId, data]) => ({
      featureId,
      viewCount: data.views,
      clickCount: data.clicks,
      conversionCount: data.conversions,
      conversionRate: data.views > 0 ? data.conversions / data.views : 0
    }));
  }

  /**
   * Get prompt performance metrics for A/B testing
   */
  static getPromptPerformanceMetrics(): PromptPerformanceMetrics[] {
    const variantMap = new Map<PromptVariant, {
      views: number;
      clicks: number;
      conversions: number;
    }>();

    // Aggregate events by variant
    this.events.forEach(event => {
      if (!event.promptVariant) return;

      const current = variantMap.get(event.promptVariant) || { views: 0, clicks: 0, conversions: 0 };

      if (event.eventType === 'prompt_viewed') {
        current.views++;
      } else if (event.eventType === 'prompt_clicked') {
        current.clicks++;
      } else if (event.eventType === 'payment_completed') {
        current.conversions++;
      }

      variantMap.set(event.promptVariant, current);
    });

    // Convert to metrics array
    return Array.from(variantMap.entries()).map(([variant, data]) => ({
      variant,
      viewCount: data.views,
      clickCount: data.clicks,
      conversionCount: data.conversions,
      clickThroughRate: data.views > 0 ? data.clicks / data.views : 0,
      conversionRate: data.views > 0 ? data.conversions / data.views : 0
    }));
  }

  /**
   * Set the current A/B test variant
   */
  static setPromptVariant(variant: PromptVariant): void {
    this.currentVariant = variant;
  }

  /**
   * Get the current A/B test variant
   */
  static getCurrentVariant(): PromptVariant {
    return this.currentVariant;
  }

  /**
   * Get events for a specific user
   */
  static getUserEvents(userId: string): ConversionEvent[] {
    return this.events.filter(e => e.userId === userId);
  }

  /**
   * Get events within a date range
   */
  static getEventsByDateRange(startDate: Date, endDate: Date): ConversionEvent[] {
    return this.events.filter(e => 
      e.timestamp >= startDate && e.timestamp <= endDate
    );
  }

  /**
   * Clear all events (for testing)
   */
  static clearEvents(): void {
    this.events = [];
  }

  /**
   * Generate a unique event ID
   */
  private static generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send event to analytics service (placeholder for production implementation)
   */
  private static sendToAnalytics(event: ConversionEvent): void {
    // In production, integrate with analytics services like:
    // - Google Analytics
    // - Mixpanel
    // - Amplitude
    // - Custom analytics backend
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      // Google Analytics example
      (window as any).gtag('event', event.eventType, {
        event_category: 'conversion',
        event_label: event.featureId,
        value: event.promptVariant
      });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Conversion Tracking]', event);
    }
  }
}

/**
 * Helper function to track prompt view (convenience wrapper)
 */
export function trackPromptView(
  userId: string,
  featureId: FeatureId,
  location: string
): void {
  ConversionTrackingService.trackPromptView(userId, featureId, location);
}

/**
 * Helper function to track prompt click (convenience wrapper)
 */
export function trackPromptClick(
  userId: string,
  featureId: FeatureId,
  location: string
): void {
  ConversionTrackingService.trackPromptClick(userId, featureId, location);
}
