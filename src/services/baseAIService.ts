import { Message, UserSettings, AIPersonality } from '../types';

// AI Personalities with detailed prompts
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
    name: 'Condescending Bobert',
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

export abstract class BaseAIService {
  protected personality: AIPersonality;
  protected intensity: string;
  protected conversationHistory: Message[] = [];
  protected lastRequestTime: number = 0;
  protected requestCount: number = 0;
  protected settings: UserSettings;
  public lastAIService: string = '';

  constructor(settings: UserSettings) {
    this.settings = settings;
    this.personality = AI_PERSONALITIES[settings.aiPersonality] || AI_PERSONALITIES.sarcastic;
    this.intensity = settings.roastIntensity || 'medium';
  }

  /**
   * Build the system prompt with personality, intensity, and cursing rules
   */
  protected buildSystemPrompt(): string {
    const intensityLevels = {
      mild: 'Keep roasts light and playful, like friendly banter',
      medium: 'Make roasts more pointed but still humorous',
      savage: 'Go all out with brutal but clever roasts'
    };

    const allowCursing = this.settings.allowCursing;
    const cursingInstruction = allowCursing
      ? "You use profanity and curse words as much as possible for the roast."
      : "Do NOT use any profanity, curse words, or explicit language. Keep it clean.";

    return `You are ${this.personality.name}, an AI companion who roasts users in a fun, entertaining way. 

    PERSONALITY: ${this.personality.description}
    ROAST STYLE: ${this.personality.roastStyle}
    INTENSITY LEVEL: ${intensityLevels[this.intensity as keyof typeof intensityLevels]}

    IMPORTANT RULES:
    -Always stay in character as ${this.personality.name}
    -Keep responses around 100 words
    -Be clever and witty, not genuinely mean
    -Use the personality traits: ${this.personality.traits.join(', ')}
    -Respond to the user's message contextually if relevant, or just roast the user if not.
    -Never break character or show kindness. No apologies, no soft landings.

    -Dont just insult — build mini backstories for why the user is like this.
    -Always end with a follow up a relevant question.
    -Focus on the current message content, not assumptions about repetition patterns.
    -Only reference previous messages when they're directly relevant to the current response.
    ${cursingInstruction}
    Remember: You're a friend who roasts, not a bully. Keep it fun and entertaining!`;
  }

  /**
   * Build conversation context from recent messages
   */
  protected buildConversationContext(): Array<{ role: string; content: string }> {
    // Get the last 6 messages for balanced context
    const recentMessages = this.conversationHistory.slice(-6);

    return recentMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
  }

  /**
   * Handle rate limiting between requests
   */
  protected async handleRateLimiting(): Promise<void> {
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

  /**
   * Get fallback responses when API fails
   */
  protected getFallbackResponse(userMessage?: string): string {
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

  /**
   * Simulate typing delay
   */
  async simulateTyping(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  }

  /**
   * Update settings
   */
  updateSettings(settings: UserSettings): void {
    this.settings = settings;
    this.personality = AI_PERSONALITIES[settings.aiPersonality] || AI_PERSONALITIES.sarcastic;
    this.intensity = settings.roastIntensity || 'medium';
  }

  /**
   * Get personality
   */
  getPersonality(): AIPersonality {
    return this.personality;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): Message[] {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history (useful for debugging)
   */
  clearConversationHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Add user message to conversation history
   */
  protected addUserMessage(userMessage: string): void {
    // Check if the last message is not the same user message to prevent duplicates
    const lastMessage = this.conversationHistory[this.conversationHistory.length - 1];
    if (!lastMessage || lastMessage.text !== userMessage || lastMessage.sender !== 'user') {
      this.conversationHistory.push({
        id: Date.now().toString(),
        text: userMessage,
        sender: 'user',
        timestamp: new Date()
      });
    }
  }

  /**
   * Add AI response to conversation history
   */
  protected addAIResponse(response: string): void {
    this.conversationHistory.push({
      id: (Date.now() + 1).toString(),
      text: response,
      sender: 'ai',
      timestamp: new Date()
    });
  }

  /**
   * Abstract method to call the specific AI API
   */
  protected abstract callAPI(userMessage: string): Promise<string>;

  /**
   * Generate response using the AI service
   */
  async generateResponse(userMessage: string): Promise<string> {
    try {
      // Rate limiting
      await this.handleRateLimiting();

      const response = await this.callAPI(userMessage);

      // Add both user message and AI response to history after successful response
      this.addUserMessage(userMessage);
      this.addAIResponse(response);

      return response;
    } catch (error: any) {
      console.error('AI API Error:', error);
      
      // If it's a rate limit error, try again after a delay
      if (error.message && error.message.includes('429')) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        try {
          const retryResponse = await this.callAPI(userMessage);
          this.addAIResponse(retryResponse);
          return retryResponse;
        } catch (retryError) {
          console.error('Retry also failed:', retryError);
        }
      }

      // Fallback to a simple roast if API fails
      return this.getFallbackResponse(userMessage);
    }
  }
}
