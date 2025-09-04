import analytics from '@react-native-firebase/analytics';
import { useAuth } from '../contexts/AuthContext';

export interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private isEnabled = true;
  private userProperties: Record<string, any> = {};

  private constructor() {
    this.initializeAnalytics();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initialize analytics with privacy settings
   */
  private async initializeAnalytics(): Promise<void> {
    try {
      // Check if analytics is enabled (for GDPR compliance)
      const enabled = await this.getAnalyticsEnabled();
      this.isEnabled = enabled;

      if (this.isEnabled) {
        await analytics().setAnalyticsCollectionEnabled(true);
        console.log('✅ Analytics enabled');
      } else {
        await analytics().setAnalyticsCollectionEnabled(false);
        console.log('📊 Analytics disabled for privacy');
      }
    } catch (error) {
      console.error('Error initializing analytics:', error);
    }
  }

  /**
   * Check if analytics is enabled
   */
  private async getAnalyticsEnabled(): Promise<boolean> {
    try {
      // In a real app, you'd check AsyncStorage or user preferences
      // For now, default to enabled
      return true;
    } catch {
      return true;
    }
  }

  /**
   * Enable/disable analytics
   */
  async setAnalyticsEnabled(enabled: boolean): Promise<void> {
    this.isEnabled = enabled;
    await analytics().setAnalyticsCollectionEnabled(enabled);

    if (enabled) {
      // Re-set user properties when re-enabling
      await this.setAllUserProperties();
    }
  }

  /**
   * Track custom event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await analytics().logEvent(event.name, event.parameters);
      console.log(`📊 Event tracked: ${event.name}`, event.parameters);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  /**
   * Set user property
   */
  async setUserProperty(name: string, value: string | number | boolean): Promise<void> {
    if (!this.isEnabled) return;

    try {
      this.userProperties[name] = value;
      await analytics().setUserProperty(name, value.toString());
      console.log(`👤 User property set: ${name} = ${value}`);
    } catch (error) {
      console.error('Error setting user property:', error);
    }
  }

  /**
   * Set multiple user properties at once
   */
  async setAllUserProperties(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      for (const [key, value] of Object.entries(this.userProperties)) {
        await analytics().setUserProperty(key, value.toString());
      }
    } catch (error) {
      console.error('Error setting user properties:', error);
    }
  }

  // ===== APP LIFECYCLE EVENTS =====

  /**
   * Track app open
   */
  async trackAppOpen(): Promise<void> {
    await this.trackEvent({
      name: 'app_open',
      parameters: {
        timestamp: Date.now()
      }
    });
  }

  /**
   * Track screen view
   */
  async trackScreenView(screenName: string, screenClass?: string): Promise<void> {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass || screenName
    });
  }

  // ===== AUTHENTICATION EVENTS =====

  /**
   * Track anonymous user creation
   */
  async trackAnonymousSignup(): Promise<void> {
    await this.trackEvent({
      name: 'sign_up',
      parameters: {
        method: 'anonymous',
        timestamp: Date.now()
      }
    });

    await this.setUserProperty('user_type', 'anonymous');
  }

  /**
   * Track email signup
   */
  async trackEmailSignup(): Promise<void> {
    await this.trackEvent({
      name: 'sign_up',
      parameters: {
        method: 'email',
        timestamp: Date.now()
      }
    });

    await this.setUserProperty('user_type', 'authenticated');
  }

  /**
   * Track account upgrade (anonymous to authenticated)
   */
  async trackAccountUpgrade(): Promise<void> {
    await this.trackEvent({
      name: 'account_upgrade',
      parameters: {
        from: 'anonymous',
        to: 'authenticated',
        timestamp: Date.now()
      }
    });

    await this.setUserProperty('user_type', 'authenticated');
    await this.setUserProperty('upgraded_at', Date.now().toString());
  }

  // ===== ROASTING ACTIVITY EVENTS =====

  /**
   * Track roast request
   */
  async trackRoastRequest(personality: string, intensity: number, messageLength: number): Promise<void> {
    await this.trackEvent({
      name: 'roast_request',
      parameters: {
        personality,
        intensity,
        message_length: messageLength,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Track roast received
   */
  async trackRoastReceived(personality: string, intensity: number, responseLength: number, responseTime: number): Promise<void> {
    await this.trackEvent({
      name: 'roast_received',
      parameters: {
        personality,
        intensity,
        response_length: responseLength,
        response_time: responseTime,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Track personality change
   */
  async trackPersonalityChange(from: string, to: string): Promise<void> {
    await this.trackEvent({
      name: 'personality_change',
      parameters: {
        from_personality: from,
        to_personality: to,
        timestamp: Date.now()
      }
    });

    await this.setUserProperty('current_personality', to);
  }

  /**
   * Track intensity change
   */
  async trackIntensityChange(from: number, to: number): Promise<void> {
    await this.trackEvent({
      name: 'intensity_change',
      parameters: {
        from_intensity: from,
        to_intensity: to,
        timestamp: Date.now()
      }
    });

    await this.setUserProperty('current_intensity', to.toString());
  }

  // ===== STREAK EVENTS =====

  /**
   * Track streak update
   */
  async trackStreakUpdate(currentStreak: number, longestStreak: number, isNewRecord: boolean): Promise<void> {
    await this.trackEvent({
      name: 'streak_update',
      parameters: {
        current_streak: currentStreak,
        longest_streak: longestStreak,
        is_new_record: isNewRecord,
        timestamp: Date.now()
      }
    });

    await this.setUserProperty('current_streak', currentStreak.toString());
    await this.setUserProperty('longest_streak', longestStreak.toString());
  }

  /**
   * Track streak milestone
   */
  async trackStreakMilestone(streakCount: number): Promise<void> {
    await this.trackEvent({
      name: 'streak_milestone',
      parameters: {
        milestone: streakCount,
        timestamp: Date.now()
      }
    });
  }

  // ===== PURCHASE EVENTS =====

  /**
   * Track purchase initiation
   */
  async trackPurchaseInitiated(productId: string, productType: 'feature' | 'personality' | 'pack'): Promise<void> {
    await this.trackEvent({
      name: 'begin_checkout',
      parameters: {
        item_id: productId,
        item_category: productType,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Track successful purchase
   */
  async trackPurchaseCompleted(productId: string, productType: 'feature' | 'personality' | 'pack', price?: number): Promise<void> {
    await this.trackEvent({
      name: 'purchase',
      parameters: {
        transaction_id: `txn_${Date.now()}`,
        item_id: productId,
        item_category: productType,
        value: price,
        currency: 'USD',
        timestamp: Date.now()
      }
    });

    // Update user properties
    if (productType === 'feature') {
      await this.setUserProperty('premium_features', 'true');
    } else if (productType === 'personality') {
      await this.setUserProperty('has_premium_personalities', 'true');
    }
  }

  /**
   * Track purchase failure
   */
  async trackPurchaseFailed(productId: string, reason: string): Promise<void> {
    await this.trackEvent({
      name: 'purchase_failed',
      parameters: {
        item_id: productId,
        failure_reason: reason,
        timestamp: Date.now()
      }
    });
  }

  // ===== ENGAGEMENT EVENTS =====

  /**
   * Track feature usage
   */
  async trackFeatureUsage(feature: string, context?: string): Promise<void> {
    await this.trackEvent({
      name: 'feature_usage',
      parameters: {
        feature_name: feature,
        context: context,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Track time spent in app
   */
  async trackSessionDuration(duration: number): Promise<void> {
    await this.trackEvent({
      name: 'session_duration',
      parameters: {
        duration_seconds: duration,
        timestamp: Date.now()
      }
    });
  }

  // ===== UPGRADE PROMPT EVENTS =====

  /**
   * Track upgrade prompt shown
   */
  async trackUpgradePromptShown(trigger: string, type: 'streak' | 'purchase' | 'sync' | 'backup'): Promise<void> {
    await this.trackEvent({
      name: 'upgrade_prompt_shown',
      parameters: {
        trigger,
        prompt_type: type,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Track upgrade prompt action
   */
  async trackUpgradePromptAction(trigger: string, action: 'upgrade' | 'dismiss'): Promise<void> {
    await this.trackEvent({
      name: 'upgrade_prompt_action',
      parameters: {
        trigger,
        action,
        timestamp: Date.now()
      }
    });
  }

  // ===== ERROR TRACKING =====

  /**
   * Track app errors
   */
  async trackError(error: string, context?: string): Promise<void> {
    await this.trackEvent({
      name: 'app_error',
      parameters: {
        error_message: error,
        context: context,
        timestamp: Date.now()
      }
    });
  }

  // ===== LIFECYCLE METHODS =====

  /**
   * Update user properties when auth state changes
   */
  async updateUserPropertiesForAuth(isAuthenticated: boolean, isAnonymous: boolean): Promise<void> {
    await this.setUserProperty('user_type', isAnonymous ? 'anonymous' : 'authenticated');
    await this.setUserProperty('is_authenticated', (!isAnonymous).toString());
  }
}

export default AnalyticsService;

// ===== HOOKS FOR EASY USAGE =====

export const useAnalytics = () => {
  const analytics = AnalyticsService.getInstance();

  return {
    // Core methods
    trackEvent: (event: AnalyticsEvent) => analytics.trackEvent(event),
    setUserProperty: (name: string, value: any) => analytics.setUserProperty(name, value),

    // Pre-built event trackers
    trackRoastRequest: (personality: string, intensity: number, messageLength: number) =>
      analytics.trackRoastRequest(personality, intensity, messageLength),

    trackRoastReceived: (personality: string, intensity: number, responseLength: number, responseTime: number) =>
      analytics.trackRoastReceived(personality, intensity, responseLength, responseTime),

    trackPersonalityChange: (from: string, to: string) =>
      analytics.trackPersonalityChange(from, to),

    trackStreakUpdate: (current: number, longest: number, isNewRecord: boolean) =>
      analytics.trackStreakUpdate(current, longest, isNewRecord),

    trackPurchaseInitiated: (productId: string, type: 'feature' | 'personality' | 'pack') =>
      analytics.trackPurchaseInitiated(productId, type),

    trackPurchaseCompleted: (productId: string, type: 'feature' | 'personality' | 'pack', price?: number) =>
      analytics.trackPurchaseCompleted(productId, type, price),

    trackUpgradePromptShown: (trigger: string, type: 'streak' | 'purchase' | 'sync' | 'backup') =>
      analytics.trackUpgradePromptShown(trigger, type),

    trackUpgradePromptAction: (trigger: string, action: 'upgrade' | 'dismiss') =>
      analytics.trackUpgradePromptAction(trigger, action),
  };
};
