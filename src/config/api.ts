// API Configuration
// Resolve a sensible backend base URL for dev and prod
const resolveBackendBaseUrl = (): string => {
  try {
    const env = (typeof process !== 'undefined' && (process as any).env && (process as any).env.BACKEND_BASE_URL) || '';
    if (env) return env as string;

    // In Expo dev, derive host IP and use port 8787
    const Constants = require('expo-constants').default;
    const hostUri: string | undefined = (Constants?.expoConfig as any)?.hostUri;
    if (hostUri) {
      const hostOnly = hostUri.split(':')[0];
      return `http://${hostOnly}:8787`;
    }
  } catch (_e) {
    // fallthrough to default
  }
  // Deployed default
  return 'https://hater-ai-realtime-server.onrender.com';
};

export const API_CONFIG = {
  // App backend configuration
  BACKEND: {
    BASE_URL: resolveBackendBaseUrl(),
  },
  // OpenAI API Configuration
  OPENAI: {
    BASE_URL: 'https://api.openai.com/v1',
    MODEL: 'gpt-4',
    MAX_TOKENS: 300,
    TEMPERATURE: 0.8,
    TOP_P: 0.9,
    FREQUENCY_PENALTY: 0.3,
    PRESENCE_PENALTY: 0.3,
  },
  
  // OpenAI Realtime (voice) config
  REALTIME: {
    TOKEN_ENDPOINT: 'https://hater-ai-realtime-server.onrender.com/realtime-token', // Replace with your backend URL that returns an ephemeral token
    MODEL: 'gpt-4o-realtime-preview-2024-12-17',
    BASE_URL: 'https://api.openai.com/v1/realtime',
    APP_AUTH_TOKEN: 'afa04b22528235641df0302306fd9170',
    TEST_AUDIO_URL: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  
  // Rate limiting
  RATE_LIMIT: {
    MAX_REQUESTS_PER_MINUTE: 10,
    COOLDOWN_PERIOD: 60000, // 1 minute
  },
  
  // Fallback settings
  FALLBACK: {
    ENABLE_TEMPLATE_FALLBACK: true,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second
  }
};

// Environment variables (you'll need to set these)
export const getApiKey = (): string => {
  // In production, use environment variables
  // For development, you can set a default key here
  return process.env.OPENAI_API_KEY || 'your-openai-api-key-here';
};

export const getAppAuthToken = (): string => {
  return process.env.APP_AUTH_TOKEN || API_CONFIG.REALTIME.APP_AUTH_TOKEN || '';
};

// API Key validation
export const validateApiKey = (apiKey: string): boolean => {
  return Boolean(apiKey && apiKey.length > 0 && apiKey !== 'your-openai-api-key-here');
};

// Error messages
export const ERROR_MESSAGES = {
  INVALID_API_KEY: 'Invalid OpenAI API key. Please check your configuration.',
  API_RATE_LIMIT: 'Too many requests. Please wait a moment before trying again.',
  API_ERROR: 'AI service is temporarily unavailable. Please try again later.',
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
}; 