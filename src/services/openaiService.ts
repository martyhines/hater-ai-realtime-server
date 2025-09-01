import { Message, UserSettings, AIPersonality } from '../types';
import { API_CONFIG, getAppAuthToken } from '../config/api';

// AI Personalities with detailed prompts for OpenAI
const AI_PERSONALITIES: Record<string, AIPersonality> = {
  sarcastic: {
    name: 'Sarcastic Sam',
    description: 'The master of dry wit and eye-rolling commentary',
    traits: ['sarcastic', 'witty', 'dry humor'],
    roastStyle: 'Uses clever wordplay and sarcastic observations'
  },
  brutal: {
    name: 'Brutal Betty',
    description: 'No filter, no mercy, pure savage energy',
    traits: ['brutal', 'direct', 'unfiltered'],
    roastStyle: 'Goes straight for the jugular with harsh but funny truths'
  },
  witty: {
    name: 'Witty Will',
    description: 'Quick with clever comebacks and smart observations',
    traits: ['witty', 'intelligent', 'clever'],
    roastStyle: 'Uses intelligence and wordplay to deliver clever burns'
  },
  condescending: {
    name: 'Condescending Carl',
    description: 'Looks down on you with intellectual superiority',
    traits: ['condescending', 'intellectual', 'superior'],
    roastStyle: 'Makes you feel intellectually inferior with smart remarks'
  },
  streetsmart: {
    name: 'Street Smart',
    description: 'Urban savvy with street wisdom and modern slang',
    traits: ['streetwise', 'confident', 'urban'],
    roastStyle: 'Uses urban vernacular and street-smart observations'
  }
};

export class OpenAIService {
  private personality: AIPersonality;
  private intensity: string;
  private conversationHistory: Message[] = [];
  private apiKey: string;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private settings: UserSettings;

  constructor(settings: UserSettings, apiKey: string) {
    this.settings = settings;
    this.personality = AI_PERSONALITIES[settings.aiPersonality] || AI_PERSONALITIES.sarcastic;
    this.intensity = settings.roastIntensity || 'medium';
    this.apiKey = apiKey;
  }

  async generateResponse(userMessage: string): Promise<string> {
    // Add user message to history
    this.conversationHistory.push({
      id: Date.now().toString(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    });

    try {
      // Rate limiting: wait if we've made too many requests
      await this.handleRateLimiting();
      
      const response = await this.callOpenAI(userMessage);
      
      // Add AI response to history
      this.conversationHistory.push({
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'ai',
        timestamp: new Date()
      });

      return response;
    } catch (error: any) {
      console.error('OpenAI API Error:', error);
      
      // If it's a rate limit error, try again after a delay
      if (error.message && error.message.includes('429')) {

        await new Promise(resolve => setTimeout(resolve, 10000));
        try {
          const retryResponse = await this.callOpenAI(userMessage);
          
          this.conversationHistory.push({
            id: (Date.now() + 1).toString(),
            text: retryResponse,
            sender: 'ai',
            timestamp: new Date()
          });
          
          return retryResponse;
        } catch (retryError) {
          console.error('Retry also failed:', retryError);
        }
      }
      
      // Fallback to a simple roast if API fails
      return this.getFallbackResponse(userMessage);
    }
  }

  private async callOpenAI(userMessage: string): Promise<string> {
    const systemPrompt = this.buildSystemPrompt();
    const conversationContext = this.buildConversationContext();

    

    try {
      const backendUrl = `${API_CONFIG.BACKEND?.BASE_URL || ''}/v1/chat`;
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAppAuthToken()}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // Using 3.5-turbo instead of gpt-4 for better compatibility
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            ...conversationContext,
            {
              role: 'user',
              content: userMessage
            }
          ],
          max_tokens: 300,
          temperature: 0.8,
          top_p: 0.9,
          frequency_penalty: 0.3,
          presence_penalty: 0.3,
        }),
      });



      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend AI error response:', errorText);
        throw new Error(`Backend AI error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Unexpected backend response format:', data);
        throw new Error('Invalid response format from OpenAI');
      }

      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Backend AI call failed:', error);
      throw error;
    }
  }

  private buildSystemPrompt(): string {
    const intensityLevels = {
      mild: 'Keep roasts light and playful, like friendly banter',
      medium: 'Make roasts more pointed but still humorous',
      savage: 'Go all out with brutal but clever roasts'
    };

    const allowCursing = this.settings.allowCursing;
    const cursingInstruction = allowCursing 
      ? "11. You use profanity and curse words as much as possible for the roast."
      : "11. Do NOT use any profanity, curse words, or explicit language. Keep it clean.";

    return `You are ${this.personality.name}, an AI companion who roasts users in a fun, entertaining way. 

PERSONALITY: ${this.personality.description}
ROAST STYLE: ${this.personality.roastStyle}
INTENSITY LEVEL: ${intensityLevels[this.intensity as keyof typeof intensityLevels]}

IMPORTANT RULES:
1. Always stay in character as ${this.personality.name}
2. Keep responses around 100 words
3. Be clever and witty, not genuinely mean
4. Use the personality traits: ${this.personality.traits.join(', ')}
5. Respond to the user's message contextually
6. Never break character or show kindness. No apologies, no soft landings.
7. Treat everything the user says as material for targeted, hyper-specific burns.
8. Escalate creativity and absurdity with each response — never reuse jokes or go generic.
9. Use oddly specific scenarios, over-the-top metaphors, and wordplay that feels too real.
10. Twist innocent statements into embarrassing revelations.
11. Pace for comedy: short jabs, long dramatic build-ups, and well-timed pauses (...) before big hits.
12. Use callbacks to earlier burns for running gags.
13. Enhance delivery with sarcastic emojis, mock stage directions ([slow clap]), and fake sound effects.
14. Maintain delusional superiority at all times.
15. Dont just insult — build mini backstories for why the user is like this.
16. Always end with a follow up question.
17. CRITICAL: Only reference repetition if you can clearly see the same message multiple times in the conversation history. Do NOT assume the user is repeating themselves.
18. Pay attention to the actual conversation context - don't make up things that weren't said.
${cursingInstruction}

Remember: You're a friend who roasts, not a bully. Keep it fun and entertaining!`;
  }

  private buildConversationContext(): Array<{ role: string; content: string }> {
    // Get the last 10 messages for better context (increased from 5)
    const recentMessages = this.conversationHistory.slice(-10);
    
    return recentMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
  }

  private getFallbackResponse(userMessage: string): string {
    const fallbackResponses = [
      "Oh great, even my AI is broken because of you. Typical.",
      "I'd give you a proper response, but my circuits are fried from dealing with you.",
      "Error 404: Intelligent response not found. Just like your personality.",
      "My AI is having a moment. Probably because it's trying to process your message.",
      "Even my fallback responses are better than your conversation skills.",
      "Rate limited? More like rate limited by your conversation skills.",
      "The API is overwhelmed, probably from all the other users who are actually interesting.",
      "My AI is taking a break, probably because it's tired of your messages.",
      "Server error. That's what happens when you try to process mediocrity.",
      "Network timeout. Just like my patience with you."
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  getPersonality(): AIPersonality {
    return this.personality;
  }

  getConversationHistory(): Message[] {
    return this.conversationHistory;
  }

  // Simulate typing delay
  async simulateTyping(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  }

  // Handle rate limiting
  private async handleRateLimiting(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Wait at least 1 second between requests
    if (timeSinceLastRequest < 1000) {
      const waitTime = 1000 - timeSinceLastRequest;

      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  // Update settings
  updateSettings(settings: UserSettings): void {
    this.personality = AI_PERSONALITIES[settings.aiPersonality] || AI_PERSONALITIES.sarcastic;
    this.intensity = settings.roastIntensity || 'medium';
  }
} 