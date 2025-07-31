export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
}

export interface CustomModel {
  id: string;
  name: string;
  endpoint: string;
  apiKey?: string;
  headers?: Record<string, string>;
  requestFormat: 'openai' | 'cohere' | 'huggingface' | 'custom';
  responsePath: string; // JSON path to extract response text
  parameters: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
  promptTemplate?: string; // Custom prompt formatting
}

export interface UserSettings {
  roastIntensity: 'mild' | 'medium' | 'savage';
  aiPersonality: 'sarcastic' | 'witty' | 'brutal' | 'playful' | 'streetsmart';
  enableNotifications: boolean;
  enableSound: boolean;
  allowCursing: boolean;
  customModels?: CustomModel[]; // Add custom models to settings
  personalization?: Record<string, any>; // Personalization quiz data
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