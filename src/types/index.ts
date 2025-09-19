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

export type AIPersonalityType = 'sarcastic' | 'witty' | 'brutal' | 'condescending' | 'streetsmart' | 'newyorker' | 'bronxbambino' | 'britishgentleman' | 'southernbelle' | 'valleygirl' | 'surferdude' | 'grammar_police' | 'fitness_coach' | 'chef_gordon' | 'detective' | 'therapist' | 'mean_girl' | 'tiktok_influencer' | 'boomer' | 'hipster' | 'karen';

export interface PersonalityInfo {
  name: string;
  emoji: string;
}

export interface EventData {
  personality?: string;
  messageLength?: number;
  hasEmoji?: boolean;
  isVoice?: boolean;
  responseTimeMs?: number;
  responseLength?: number;
  errorType?: string;
  errorMessage?: string;
  [key: string]: any; // Allow additional properties for flexibility
}

export const getPersonalityInfo = (personalityKey: string): PersonalityInfo => {
  // Updated personalities mapping with all new personalities
  const personalities: Record<string, PersonalityInfo> = {
    // Original personalities
    sarcastic: { name: 'Sarcastic Sam', emoji: '😏' },
    brutal: { name: 'Brutal Betty', emoji: '💀' },
    witty: { name: 'Witty Will', emoji: '🧠' },
    condescending: { name: 'Condescending Carl', emoji: '🤓' },
    streetsmart: { name: 'Street Smart', emoji: '🔥' },
    newyorker: { name: 'The Posh New Yorker', emoji: '🗽' },
    bronxbambino: { name: 'The Bronx Bambino', emoji: '🏙️' },
    britishgentleman: { name: 'British Gentleman', emoji: '🇬🇧' },
    southernbelle: { name: 'Southern Belle', emoji: '🌹' },
    valleygirl: { name: 'Valley Girl', emoji: '💅' },
    surferdude: { name: 'Surfer Dude', emoji: '🏄‍♂️' },

    // Professional/Expert personalities
    grammar_police: { name: 'Grammar Police', emoji: '📝' },
    fitness_coach: { name: 'Fitness Coach', emoji: '💪' },
    chef_gordon: { name: 'Chef Gordon', emoji: '👨‍🍳' },
    detective: { name: 'Detective', emoji: '🕵️‍♂️' },
    therapist: { name: 'Therapist', emoji: '🛋️' },

    // Pop Culture personalities
    mean_girl: { name: 'Mean Girl', emoji: '👑' },
    tiktok_influencer: { name: 'TikTok Influencer', emoji: '📱' },
    boomer: { name: 'Boomer', emoji: '👴' },
    hipster: { name: 'Hipster', emoji: '🕶️' },
    karen: { name: 'Karen', emoji: '📢' },
  };

  return personalities[personalityKey] || personalities.sarcastic;
};
