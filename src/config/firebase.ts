// Firebase configuration
export const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Analytics event names
export const ANALYTICS_EVENTS = {
  // Chat events
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  CHAT_LIMIT_REACHED: 'chat_limit_reached',
  CHAT_PERSONALITY_CHANGED: 'chat_personality_changed',

  // App usage
  APP_OPEN: 'app_open',
  APP_CLOSE: 'app_close',
  SCREEN_VIEW: 'screen_view',

  // Premium events
  PREMIUM_FEATURE_PURCHASED: 'premium_feature_purchased',
  PREMIUM_PERSONALITY_PURCHASED: 'premium_personality_purchased',
  PREMIUM_PACK_PURCHASED: 'premium_pack_purchased',

  // Settings
  SETTINGS_CHANGED: 'settings_changed',
  PERSONALITY_SELECTED: 'personality_selected',
  INTENSITY_CHANGED: 'intensity_changed',

  // Voice features
  VOICE_MESSAGE_SENT: 'voice_message_sent',
  SPEECH_TO_TEXT_USED: 'speech_to_text_used',

  // Social features
  TWEET_GENERATED: 'tweet_generated',
  TIKTOK_VIDEO_CREATED: 'tiktok_video_created',

  // Error events
  API_ERROR: 'api_error',
  NETWORK_ERROR: 'network_error'
} as const;
