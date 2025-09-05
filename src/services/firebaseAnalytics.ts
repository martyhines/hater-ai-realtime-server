import analytics from '@react-native-firebase/analytics';
import { ANALYTICS_EVENTS } from '../config/firebase';

class FirebaseAnalyticsService {
  private static instance: FirebaseAnalyticsService;
  private isInitialized = false;

  private constructor() {}

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

      // Enable analytics collection
      await analytics().setAnalyticsCollectionEnabled(true);

      // Set user properties for better segmentation
      await analytics().setUserProperty('app_version', '1.0.0');
      await analytics().setUserProperty('platform', 'mobile');

      this.isInitialized = true;
      console.log('Firebase Analytics initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Analytics:', error);
    }
  }

  /**
   * Track app open
   */
  async logAppOpen(): Promise<void> {
    try {
      await analytics().logAppOpen();
    } catch (error) {
      console.error('Failed to log app open:', error);
    }
  }

  /**
   * Track screen views
   */
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    try {
      await analytics().logScreenView({
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
      await analytics().logEvent(ANALYTICS_EVENTS.CHAT_MESSAGE_SENT, {
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
      await analytics().logEvent(ANALYTICS_EVENTS.CHAT_LIMIT_REACHED, {
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
      await analytics().logEvent(ANALYTICS_EVENTS.PERSONALITY_SELECTED, {
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
      const eventName = params.featureType === 'feature'
        ? ANALYTICS_EVENTS.PREMIUM_FEATURE_PURCHASED
        : params.featureType === 'personality'
        ? ANALYTICS_EVENTS.PREMIUM_PERSONALITY_PURCHASED
        : ANALYTICS_EVENTS.PREMIUM_PACK_PURCHASED;

      await analytics().logEvent(eventName, {
        item_id: params.itemId,
        price: params.price,
        currency: params.currency || 'USD',
        feature_type: params.featureType
      });

      // Also log as purchase event for revenue tracking
      await analytics().logPurchase({
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
      await analytics().logEvent(ANALYTICS_EVENTS.SETTINGS_CHANGED, {
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
      await analytics().logEvent(ANALYTICS_EVENTS.INTENSITY_CHANGED, {
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
      const eventName = feature === 'voice_message'
        ? ANALYTICS_EVENTS.VOICE_MESSAGE_SENT
        : ANALYTICS_EVENTS.SPEECH_TO_TEXT_USED;

      await analytics().logEvent(eventName, {
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
      const eventName = feature === 'tweet'
        ? ANALYTICS_EVENTS.TWEET_GENERATED
        : ANALYTICS_EVENTS.TIKTOK_VIDEO_CREATED;

      await analytics().logEvent(eventName, {
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
      const eventName = errorType === 'api'
        ? ANALYTICS_EVENTS.API_ERROR
        : errorType === 'network'
        ? ANALYTICS_EVENTS.NETWORK_ERROR
        : 'error';

      await analytics().logEvent(eventName, {
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
      for (const [key, value] of Object.entries(properties)) {
        await analytics().setUserProperty(key, String(value));
      }
    } catch (error) {
      console.error('Failed to set user properties:', error);
    }
  }

  /**
   * Reset analytics data (for testing)
   */
  async resetAnalyticsData(): Promise<void> {
    try {
      await analytics().resetAnalyticsData();
    } catch (error) {
      console.error('Failed to reset analytics data:', error);
    }
  }
}

export default FirebaseAnalyticsService;
