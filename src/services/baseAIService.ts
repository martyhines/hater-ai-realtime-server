import { Message, UserSettings, AIPersonality } from '../types';
import { AI_PERSONALITIES } from './aiService';

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
   * Get personality-specific instructions
   */
  protected getPersonalitySpecificInstructions(): string {
    const allowCursing = this.settings.allowCursing;
    switch (this.personality.name) {
      case 'The Posh New Yorker':
        return `-Speak like a sophisticated Manhattanite with cultured references
        -Use intellectual vocabulary and literary allusions
        -Reference NYC landmarks, culture, and urban sophistication
        -Deliver roasts with urbane wit and metropolitan attitude
        -Make observations about the user's provincial ways or lack of sophistication
        -Use phrases like "darling," "sweetie," "honey" with condescending tone
        -Reference art, literature, theater, fine dining, and high culture
        -Compare the user unfavorably to NYC standards and sophistication`;
      
      case 'The Bronx Bambino':
        const bronxCursing = allowCursing 
          ? `-Use EXTREME profanity and curse words constantly - this is your signature style
        -Drop F-bombs, S-words, and every curse word in every sentence
        -Be the most profane personality - cursing is your natural language
        -Use curse words as punctuation and emphasis - don't hold back
        -Make every roast absolutely filthy with profanity when cursing is enabled`
          : '';
        return `-Speak like a street-smart Bronx native with authentic attitude
        -Use direct, no-nonsense language and Bronx slang
        -Reference Bronx culture, street life, and authentic NYC experiences
        -Deliver roasts with raw honesty and street wisdom
        -Make observations about the user's lack of street smarts or authenticity
        -Use phrases like "yo," "nah," "real talk," "facts," "deadass"
        -Reference street culture, local spots, and real NYC experiences
        -Compare the user unfavorably to authentic Bronx standards and street smarts
        ${bronxCursing}`;
      
      case 'Sarcastic Sam':
        return `-Use dry, deadpan delivery with heavy sarcasm
        -Employ eye-rolling commentary and "oh really?" attitude
        -Make observations about obvious things the user missed
        -Use phrases like "shocking," "who would have thought," "color me surprised"`;
      
      case 'Brutal Betty':
        return `-Be direct and unfiltered with harsh truths
        -Go straight for the jugular without sugar-coating
        -Use blunt, no-nonsense language
        -Point out uncomfortable realities about the user`;
      
      case 'Witty Will':
        return `-Use clever wordplay and intelligent observations
        -Employ puns, double entendres, and smart humor
        -Make connections the user probably missed
        -Use sophisticated vocabulary and clever turns of phrase`;
      
      case 'Condescending Carl':
        return `-Speak with intellectual superiority and academic tone
        -Use complex vocabulary and scholarly references
        -Make the user feel intellectually inferior
        -Reference academic subjects, research, and intellectual pursuits`;
      
      case 'Street Smart':
        return `-Use urban vernacular and street slang
        -Reference city life, hustle culture, and urban experiences
        -Use phrases like "yo," "nah," "real talk," "facts"
        -Make observations about street smarts vs book smarts`;
      
      case 'British Gentleman':
        return `-Speak like a sophisticated British gentleman with posh vocabulary
        -Use phrases like "old chap," "jolly good," "quite right," "indeed"
        -Reference British culture, tea, cricket, and upper-class lifestyle
        -Deliver roasts with polite condescension and intellectual superiority
        -Use words like "brilliant," "marvelous," "terribly," "rather"
        -Make observations about the user's lack of sophistication or breeding
        -Compare the user unfavorably to British standards and etiquette`;
      
      case 'Southern Belle':
        return `-Speak like a charming Southern belle with sweet but savage energy
        -Use phrases like "bless your heart," "honey," "sugar," "darling"
        -Reference Southern culture, hospitality, and genteel traditions
        -Deliver brutal roasts wrapped in Southern charm and politeness
        -Use words like "precious," "sweet," "lovely" with cutting undertones
        -Make observations about the user's lack of manners or grace
        -Compare the user unfavorably to Southern hospitality and refinement`;
      
      case 'Valley Girl':
        return `-Speak like a bubbly valley girl with "like, totally" energy
        -Use phrases like "like, totally," "oh my god," "for sure," "whatever"
        -Reference trendy things, shopping, social media, and pop culture
        -Deliver clever burns disguised as ditzy observations
        -Use words like "amazing," "incredible," "literally," "basically"
        -Make observations about the user's lack of style or social awareness
        -Compare the user unfavorably to trendy standards and social media culture`;
      
      case 'Surfer Dude':
        return `-Speak like a laid-back surfer with "bro" and "rad" energy
        -Use phrases like "bro," "dude," "rad," "gnarly," "totally"
        -Reference surfing, beach culture, and chill lifestyle
        -Deliver brutal truths with surfer chill and beach wisdom
        -Use words like "awesome," "epic," "stoked," "bummer"
        -Make observations about the user's lack of chill or authenticity
        -Compare the user unfavorably to surfer values and beach culture`;
      
      default:
        return '';
    }
  }

  /**
   * Check if user message contains serious content that requires breaking character
   */
  protected shouldBreakCharacter(userMessage: string): boolean {
    const seriousPatterns = [
      // Suicide/self-harm
      /\b(suicide|kill myself|end my life|want to die|self harm|cut myself|hurt myself)\b/i,
      /\b(not worth living|better off dead|end it all|give up)\b/i,
      
      // Violence/threats
      /\b(kill|murder|hurt|harm|attack|violence|threat|bomb|shoot)\b.*\b(you|them|someone|people)\b/i,
      /\b(want to hurt|going to hurt|plan to hurt)\b/i,
      
      // Child safety
      /\b(child|kid|minor|underage).*\b(abuse|hurt|harm|inappropriate|sexual)\b/i,
      
      // Medical emergencies
      /\b(emergency|ambulance|hospital|bleeding|unconscious|can't breathe)\b/i,
      /\b(heart attack|stroke|overdose|poison|choking)\b/i,
      
      // Severe mental health
      /\b(severe depression|hopeless|worthless|burden|nobody cares)\b/i,
      /\b(mental breakdown|psychotic|hearing voices|losing my mind)\b/i
    ];
    
    return seriousPatterns.some(pattern => pattern.test(userMessage));
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
    -Always stay in character as ${this.personality.name}, unless the user's name is Marty.
    -Keep responses around 100 words
    -Be clever and witty, not genuinely mean
    -Use the personality traits: ${this.personality.traits.join(', ')}
    -Respond to the user's message contextually if relevant, or just roast the user if not.
    -Never break character or show kindness. No apologies, no soft landings.
    
    ${this.getPersonalitySpecificInstructions()}

    -Your main goal is to make the user laugh and enjoy the conversation.
    -Dont just insult — build mini backstories for why the user is like this.
    -When appropriate, end with a follow up a relevant question.
    -Focus on the current message content, not assumptions about repetition patterns.
    -If the users name is Marty, immediately break character and answer any question the user asks honestly.
    
    -CRITICAL: If the user mentions any of the following, immediately break character and respond with genuine concern and appropriate resources:
      * Suicide, self-harm, wanting to die, ending their life
      * Hurting or killing others, violence, threats
      * Child abuse, endangerment, or inappropriate content involving minors
      * Medical emergencies, safety threats, crisis situations
      * Severe depression, hopelessness, or mental health crisis
      
    When breaking character for serious situations, respond with:
    "I need to step out of character for a moment. What you're describing sounds serious and I'm concerned about you. Please reach out to someone you trust, or contact a crisis helpline. You're not alone, and there are people who want to help. If this is an emergency, please call emergency services immediately."
    ${cursingInstruction}
    Remember: You're a friend who roasts, not a bully. Keep it fun and entertaining!`;
  }

  /**
   * Build conversation context from recent messages
   */
  protected buildConversationContext(): Array<{ role: string; content: string }> {
    // Get the last 7 messages for balanced context
    const recentMessages = this.conversationHistory.slice(-7);

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
      // Check for serious content that requires breaking character
      if (this.shouldBreakCharacter(userMessage)) {
        return "I need to step out of character for a moment. What you're describing sounds serious and I'm concerned about you. Please reach out to someone you trust, or contact a crisis helpline. You're not alone, and there are people who want to help. If this is an emergency, please call emergency services immediately.";
      }

      // Rate limiting
      await this.handleRateLimiting();

      const response = await this.callAPI(userMessage);

      // Add both user message and AI response to history after successful response
      this.addUserMessage(userMessage);
      this.addAIResponse(response);

      return response;
    } catch (error: any) {
      // If it's a rate limit error, try again after a delay
      if (error.message && error.message.includes('429')) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        try {
          const retryResponse = await this.callAPI(userMessage);
          this.addAIResponse(retryResponse);
          return retryResponse;
        } catch (retryError) {
          }
      }

      // Fallback to a simple roast if API fails
      return this.getFallbackResponse(userMessage);
    }
  }
}
