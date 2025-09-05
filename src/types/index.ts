export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
}


export interface VoiceSettings {
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
  autoPlay: boolean;
}

export interface SpeechToTextSettings {
  language: string;
  autoSend: boolean;
  continuous: boolean;
  timeout: number;
}

export interface UserSettings {
  roastIntensity: 'mild' | 'medium' | 'savage';
  aiPersonality: 'sarcastic' | 'witty' | 'brutal' | 'playful' | 'streetsmart';
  enableNotifications: boolean;
  enableSound: boolean;
  allowCursing: boolean;
  voiceSettings?: VoiceSettings; // Voice settings for text-to-speech
  speechToTextSettings?: SpeechToTextSettings; // Speech-to-text settings
  // Voice: premium realtime voice toggle and basic monetization field
  realtimeVoiceEnabled?: boolean; // OpenAI Realtime Voice (beta)
  subscriptionTier?: 'free' | 'pro' | 'creator';
}

export interface AIPersonality {
  name: string;
  description: string;
  traits: string[];
  roastStyle: string;
}

export interface ConversationStats {
  totalMessages: number;
  roastCount: number;
  userResponses: number;
  averageResponseTime: number;
} 