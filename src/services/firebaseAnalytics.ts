import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent, setUserProperties, Analytics } from 'firebase/analytics';
import { ANALYTICS_EVENTS, firebaseConfig } from '../config/firebase';
import { Platform } from 'react-native';

class FirebaseAnalyticsService {
  private static instance: FirebaseAnalyticsService;
  private analytics: Analytics | null = null;
  private isInitialized = false;

  private constructor() {}

  /**
   * Check if analytics is available (only on web)
   */
  private isAnalyticsAvailable(): boolean {
    return Platform.OS === 'web' && this.analytics !== null;
  }

  static getInstance(): FirebaseAnalyticsService {
    if (!FirebaseAnalyticsService.instance) {
      FirebaseAnalyticsService.instance = new FirebaseAnalyticsService();
    }
    return FirebaseAnalyticsService.instance;
  }

  /**
   * Initialize Firebase Analytics
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Check if we're in React Native (not web)
      if (Platform.OS !== 'web') {
        console.log('Firebase Analytics: Skipping initialization on React Native (DOM not available)');
        this.isInitialized = true; // Mark as initialized to prevent retries
        return;
      }

      // Initialize Firebase app
      const app = initializeApp(firebaseConfig);

      // Initialize Analytics (this will fail in RN due to DOM access)
      this.analytics = getAnalytics(app);

      // Set user properties for better segmentation
      if (this.analytics) {
        await setUserProperties(this.analytics, {
          app_version: '1.0.0',
          platform: 'web' // Changed from 'mobile' since this only works on web
        });
      }

      this.isInitialized = true;
      console.log('Firebase Analytics initialized successfully');
    } catch (error) {
      console.warn('Firebase Analytics initialization failed (expected in React Native):', error.message);
      this.isInitialized = true; // Prevent retry attempts
    }
  }

  /**
   * Track app open
   */
  async logAppOpen(): Promise<void> {
    try {
      // Skip analytics in React Native
      if (Platform.OS !== 'web') return;

      if (this.analytics) {
        await logEvent(this.analytics, 'app_open');
      }
    } catch (error) {
      console.error('Failed to log app open:', error);
    }
  }

  /**
   * Track screen views
   */
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    try {
      if (!this.isAnalyticsAvailable()) return;

      await logEvent(this.analytics!, 'screen_view', {
        screen_name: screenName,
        screen_class: screenClass || screenName
      });
    } catch (error) {
      console.error('Failed to log screen view:', error);
    }
  }

  /**
   * Track chat message sent
   */
  async logChatMessage(params: {
    personality: string;
    messageLength: number;
    hasEmoji: boolean;
    isVoiceMessage?: boolean;
  }): Promise<void> {
    try {
      if (!this.isAnalyticsAvailable()) return;

      await logEvent(this.analytics!, ANALYTICS_EVENTS.CHAT_MESSAGE_SENT, {
        personality: params.personality,
        message_length: params.messageLength,
        has_emoji: params.hasEmoji,
        is_voice_message: params.isVoiceMessage || false
      });
    } catch (error) {
      console.error('Failed to log chat message:', error);
    }
  }

  /**
   * Track chat limit reached
   */
  async logChatLimitReached(params: {
    chatsUsed: number;
    personality: string;
    showedUpgradePrompt: boolean;
  }): Promise<void> {
    try {
      if (!this.isAnalyticsAvailable()) return;

      await logEvent(this.analytics!, ANALYTICS_EVENTS.CHAT_LIMIT_REACHED, {
        chats_used: params.chatsUsed,
        personality: params.personality,
        showed_upgrade_prompt: params.showedUpgradePrompt
      });
    } catch (error) {
      console.error('Failed to log chat limit reached:', error);
    }
  }

  /**
   * Track personality selection
   */
  async logPersonalitySelected(personality: string, isPremium: boolean): Promise<void> {
    try {
      if (!this.isAnalyticsAvailable()) return;

      await logEvent(this.analytics!, ANALYTICS_EVENTS.PERSONALITY_SELECTED, {
        personality,
        is_premium: isPremium
      });
    } catch (error) {
      console.error('Failed to log personality selection:', error);
    }
  }

  /**
   * Track premium purchases
   */
  async logPremiumPurchase(params: {
    featureType: 'feature' | 'personality' | 'pack';
    itemId: string;
    price: number;
    currency?: string;
  }): Promise<void> {
    try {
      if (!this.isAnalyticsAvailable()) return;

      const eventName = params.featureType === 'feature'
        ? ANALYTICS_EVENTS.PREMIUM_FEATURE_PURCHASED
        : params.featureType === 'personality'
        ? ANALYTICS_EVENTS.PREMIUM_PERSONALITY_PURCHASED
        : ANALYTICS_EVENTS.PREMIUM_PACK_PURCHASED;

      await logEvent(this.analytics!, eventName, {
        item_id: params.itemId,
        price: params.price,
        currency: params.currency || 'USD',
        feature_type: params.featureType
      });

      // Also log as purchase event for revenue tracking
      await logEvent(this.analytics!, 'purchase', {
        currency: params.currency || 'USD',
        value: params.price,
        items: [{
          item_id: params.itemId,
          item_name: params.itemId,
          quantity: 1,
          price: params.price
        }]
      });
    } catch (error) {
      console.error('Failed to log premium purchase:', error);
    }
  }

  /**
   * Track settings changes
   */
  async logSettingsChanged(params: {
    settingType: string;
    oldValue?: any;
    newValue: any;
  }): Promise<void> {
    try {
      if (!this.isAnalyticsAvailable()) return;

      await logEvent(this.analytics!, ANALYTICS_EVENTS.SETTINGS_CHANGED, {
        setting_type: params.settingType,
        old_value: params.oldValue,
        new_value: params.newValue
      });
    } catch (error) {
      console.error('Failed to log settings change:', error);
    }
  }

  /**
   * Track intensity changes
   */
  async logIntensityChanged(intensity: string): Promise<void> {
    try {
      if (!this.isAnalyticsAvailable()) return;

      await logEvent(this.analytics!, ANALYTICS_EVENTS.INTENSITY_CHANGED, {
        intensity
      });
    } catch (error) {
      console.error('Failed to log intensity change:', error);
    }
  }

  /**
   * Track voice features usage
   */
  async logVoiceFeatureUsed(feature: 'voice_message' | 'speech_to_text'): Promise<void> {
    try {
      if (!this.isAnalyticsAvailable()) return;

      const eventName = feature === 'voice_message'
        ? ANALYTICS_EVENTS.VOICE_MESSAGE_SENT
        : ANALYTICS_EVENTS.SPEECH_TO_TEXT_USED;

      await logEvent(this.analytics!, eventName, {
        feature_type: feature
      });
    } catch (error) {
      console.error('Failed to log voice feature usage:', error);
    }
  }

  /**
   * Track social features usage
   */
  async logSocialFeatureUsed(feature: 'tweet' | 'tiktok_video'): Promise<void> {
    try {
      if (!this.isAnalyticsAvailable()) return;

      const eventName = feature === 'tweet'
        ? ANALYTICS_EVENTS.TWEET_GENERATED
        : ANALYTICS_EVENTS.TIKTOK_VIDEO_CREATED;

      await logEvent(this.analytics!, eventName, {
        feature_type: feature
      });
    } catch (error) {
      console.error('Failed to log social feature usage:', error);
    }
  }

  /**
   * Track errors
   */
  async logError(errorType: 'api' | 'network' | 'other', errorMessage: string, context?: any): Promise<void> {
    try {
      if (!this.isAnalyticsAvailable()) return;

      const eventName = errorType === 'api'
        ? ANALYTICS_EVENTS.API_ERROR
        : errorType === 'network'
        ? ANALYTICS_EVENTS.NETWORK_ERROR
        : 'error';

      await logEvent(this.analytics!, eventName, {
        error_message: errorMessage.substring(0, 100), // Limit length
        context: context ? JSON.stringify(context).substring(0, 500) : null
      });
    } catch (error) {
      console.error('Failed to log error:', error);
    }
  }

  /**
   * Set user properties for better segmentation
   */
  async setUserProperties(properties: Record<string, any>): Promise<void> {
    try {
      if (!this.isAnalyticsAvailable()) return;

      await setUserProperties(this.analytics!, properties);
    } catch (error) {
      console.error('Failed to set user properties:', error);
    }
  }

  /**
   * Reset analytics data (for testing)
   */
  async resetAnalyticsData(): Promise<void> {
    try {
      // Firebase JS SDK doesn't have a direct reset method like RN Firebase
      // This is mainly for testing purposes
      if (Platform.OS === 'web') {
        console.log('Analytics data reset requested (no-op in web SDK)');
      }
    } catch (error) {
      console.error('Failed to reset analytics data:', error);
    }
  }
}

export default FirebaseAnalyticsService;
