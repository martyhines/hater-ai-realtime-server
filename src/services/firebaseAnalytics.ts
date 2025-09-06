import { ANALYTICS_EVENTS } from '../config/firebase';
import { API_CONFIG } from '../config/api';
import { Platform } from 'react-native';
import AuthService from './authService';

class FirebaseAnalyticsService {
  private static instance: FirebaseAnalyticsService;
  private isInitialized = false;
  private eventQueue: any[] = [];

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
    if (this.isInitialized) return;

    // For React Native, we'll send analytics through the backend
    if (Platform.OS !== 'web') {
      console.log('Firebase Analytics: Using backend proxy for React Native');
      this.isInitialized = true;
      return;
    }

    // For web, we could implement Firebase web SDK later
    console.log('Firebase Analytics: Web implementation not yet configured');
    this.isInitialized = true;
  }

  /**
   * Track app open
   */
  async logAppOpen(): Promise<void> {
    await this.sendAnalyticsEvent('app_open', {});
  }

  /**
   * Send analytics event through backend
   */
  private async sendAnalyticsEvent(eventName: string, parameters: any): Promise<void> {
    try {
      // Get user information
      const authService = AuthService.getInstance();
      const userId = authService.getUserId();
      const isSignedIn = authService.isSignedIn();

      // Enhanced parameters with user info
      const enhancedParams = {
        ...parameters,
        user_id: userId,
        is_authenticated: isSignedIn,
        platform: Platform.OS,
        app_version: '1.0.0'
      };

      // Log to console for debugging
      console.log(`Analytics Event: ${eventName}`, enhancedParams);

      // Send to backend analytics endpoint
      const analyticsUrl = `${API_CONFIG.BACKEND.BASE_URL}/api/analytics`;
      const response = await fetch(analyticsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_CONFIG.REALTIME.APP_AUTH_TOKEN}`,
        },
        body: JSON.stringify({
          event: eventName,
          params: enhancedParams,
          userId: userId,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        console.warn('Analytics backend request failed:', response.status);
      }

    } catch (error) {
      console.warn('Analytics event failed:', error);
    }
  }

  /**
   * Track screen views
   */
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    await this.sendAnalyticsEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenClass || screenName
    });
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
    await this.sendAnalyticsEvent(ANALYTICS_EVENTS.CHAT_MESSAGE_SENT, {
      personality: params.personality,
      message_length: params.messageLength,
      has_emoji: params.hasEmoji,
      is_voice_message: params.isVoiceMessage || false
    });
  }

  /**
   * Track chat limit reached
   */
  async logChatLimitReached(params: {
    chatsUsed: number;
    personality: string;
    showedUpgradePrompt: boolean;
  }): Promise<void> {
    await this.sendAnalyticsEvent(ANALYTICS_EVENTS.CHAT_LIMIT_REACHED, {
      chats_used: params.chatsUsed,
      personality: params.personality,
      showed_upgrade_prompt: params.showedUpgradePrompt
    });
  }

  /**
   * Track personality selection
   */
  async logPersonalitySelected(personality: string, isPremium: boolean): Promise<void> {
    await this.sendAnalyticsEvent(ANALYTICS_EVENTS.PERSONALITY_SELECTED, {
      personality,
      is_premium: isPremium
    });
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
    const eventName = params.featureType === 'feature'
      ? ANALYTICS_EVENTS.PREMIUM_FEATURE_PURCHASED
      : params.featureType === 'personality'
      ? ANALYTICS_EVENTS.PREMIUM_PERSONALITY_PURCHASED
      : ANALYTICS_EVENTS.PREMIUM_PACK_PURCHASED;

    await this.sendAnalyticsEvent(eventName, {
      item_id: params.itemId,
      price: params.price,
      currency: params.currency || 'USD',
      feature_type: params.featureType
    });

    // Also log as purchase event for revenue tracking
    await this.sendAnalyticsEvent('purchase', {
      currency: params.currency || 'USD',
      value: params.price,
      items: [{
        item_id: params.itemId,
        item_name: params.itemId,
        quantity: 1,
        price: params.price
      }]
    });
  }

  /**
   * Track settings changes
   */
  async logSettingsChanged(params: {
    settingType: string;
    oldValue?: any;
    newValue: any;
  }): Promise<void> {
    await this.sendAnalyticsEvent(ANALYTICS_EVENTS.SETTINGS_CHANGED, {
      setting_type: params.settingType,
      old_value: params.oldValue,
      new_value: params.newValue
    });
  }

  /**
   * Track intensity changes
   */
  async logIntensityChanged(intensity: string): Promise<void> {
    await this.sendAnalyticsEvent(ANALYTICS_EVENTS.INTENSITY_CHANGED, {
      intensity
    });
  }

  /**
   * Track voice features usage
   */
  async logVoiceFeatureUsed(feature: 'voice_message' | 'speech_to_text'): Promise<void> {
    const eventName = feature === 'voice_message'
      ? ANALYTICS_EVENTS.VOICE_MESSAGE_SENT
      : ANALYTICS_EVENTS.SPEECH_TO_TEXT_USED;

    await this.sendAnalyticsEvent(eventName, {
      feature_type: feature
    });
  }

  /**
   * Track social features usage
   */
  async logSocialFeatureUsed(feature: 'tweet' | 'tiktok_video'): Promise<void> {
    const eventName = feature === 'tweet'
      ? ANALYTICS_EVENTS.TWEET_GENERATED
      : ANALYTICS_EVENTS.TIKTOK_VIDEO_CREATED;

    await this.sendAnalyticsEvent(eventName, {
      feature_type: feature
    });
  }

  /**
   * Track errors
   */
  async logError(errorType: 'api' | 'network' | 'other', errorMessage: string, context?: any): Promise<void> {
    const eventName = errorType === 'api'
      ? ANALYTICS_EVENTS.API_ERROR
      : errorType === 'network'
      ? ANALYTICS_EVENTS.NETWORK_ERROR
      : 'error';

    await this.sendAnalyticsEvent(eventName, {
      error_message: errorMessage.substring(0, 100), // Limit length
      context: context ? JSON.stringify(context).substring(0, 500) : null
    });
  }

  /**
   * Set user properties for better segmentation
   */
  async setUserProperties(properties: Record<string, any>): Promise<void> {
    await this.sendAnalyticsEvent('set_user_properties', properties);
  }

  /**
   * Reset analytics data (for testing)
   */
  async resetAnalyticsData(): Promise<void> {
    console.log('Analytics data reset requested');
    this.eventQueue = [];
  }
}

export default FirebaseAnalyticsService;
