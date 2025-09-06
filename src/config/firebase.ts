// Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyAsd-WurrDB4G5Z_RXRtgYBVWlAk6vfT5g",
  authDomain: "hater-ai.firebaseapp.com",
  projectId: "hater-ai",
  storageBucket: "hater-ai.firebasestorage.app",
  messagingSenderId: "317634354253",
  appId: "1:317634354253:ios:931ae0f0efe653ec4f1004"
};

// Centralized Firebase app instance - PURE, no Auth touches
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';

export const getFirebaseApp = (): FirebaseApp => {
  // Use getApp() if exists, otherwise initializeApp()
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
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
