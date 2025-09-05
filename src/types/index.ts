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
  roastIntensity: RoastIntensity;
  aiPersonality: AIPersonalityType;
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

export type AIProvider = 'cohere' | 'openai' | 'gemini';

export type RoastIntensity = 'mild' | 'medium' | 'savage';

export type AIPersonalityType = 'sarcastic' | 'witty' | 'brutal' | 'condescending' | 'streetsmart' | 'newyorker' | 'bronxbambino' | 'britishgentleman' | 'southernbelle' | 'valleygirl' | 'surferdude';

export interface PersonalityInfo {
  name: string;
  emoji: string;
}

export const getPersonalityInfo = (personalityKey: string): PersonalityInfo => {
  const personalities: Record<string, PersonalityInfo> = {
    sarcastic: { name: 'Sarcastic Sam', emoji: '😏' },
    brutal: { name: 'Brutal Betty', emoji: '💀' },
    witty: { name: 'Witty Will', emoji: '🧠' },
    condescending: { name: 'Condescending Bobert', emoji: '🤓' },
    streetsmart: { name: 'Street Smart', emoji: '🔥' },
    newyorker: { name: 'The Posh New Yorker', emoji: '🗽' },
    bronxbambino: { name: 'The Bronx Bambino', emoji: '🏙️' },
    britishgentleman: { name: 'British Gentleman', emoji: '🇬🇧' },
    southernbelle: { name: 'Southern Belle', emoji: '🌹' },
    valleygirl: { name: 'Valley Girl', emoji: '💅' },
    surferdude: { name: 'Surfer Dude', emoji: '🏄‍♂️' },
  };

  return personalities[personalityKey] || personalities.sarcastic;
}; 