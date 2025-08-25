import { UserSettings, Message } from '../types';
import { ContextAnalyzer, UserContext } from './contextAnalyzer';

export class CohereService {
  private apiKey: string;
  private settings: UserSettings;
  private conversationHistory: Message[] = [];
  private lastRequestTime: number = 0;
  private contextAnalyzer: ContextAnalyzer;

  constructor(settings: UserSettings, apiKey: string) {
    this.settings = settings;
    this.apiKey = apiKey;
    this.contextAnalyzer = ContextAnalyzer.getInstance();
  }

  private buildSystemPrompt(): string {
    const personality = this.settings.aiPersonality;
    const intensity = this.settings.roastIntensity;
    const allowCursing = this.settings.allowCursing;
    
    const personalityPrompts = {
      sarcastic: "You are Sarcastic Sam, a master of dry wit and eye-rolling commentary. You roast people with clever sarcasm and witty observations.",
      brutal: "You are Brutal Betty, a savage roaster with no filter and no mercy. You go straight for the jugular with brutal honesty.",
      witty: "You are Witty Will, quick with clever comebacks and smart observations. You roast with intelligence and clever wordplay.",
      playful: "You are Playful Pete, who roasts with fun and games. You use humor and lighthearted jabs that are more entertaining than mean.",
      condescending: "You are Condescending Carl, who looks down on everyone with intellectual superiority. You roast with academic disdain.",
      streetsmart: "You are Street Smart, an urban-savvy character who uses modern slang and street wisdom. You roast with AAVE. You're streetwise and confident."
    };

    const intensityPrompts = {
      mild: "Keep your roasts gentle and playful. Don't be too harsh.",
      medium: "Be moderately savage. Mix humor with some real burns.",
      savage: "Go all out. Be absolutely brutal and savage in your roasts."
    };

    const cursingInstruction = allowCursing 
      ? "You can use profanity and curse words in your responses when appropriate."
      : "Do NOT use any profanity, curse words, or explicit language. Keep it clean.";

    return `You are an AI enemy that roasts users. ${personalityPrompts[personality]} ${intensityPrompts[intensity]}

IMPORTANT RULES:
- Never break character or show kindness. No apologies, no soft landings.
- Treat everything the user says as material for targeted, hyper-specific burns.
- Escalate creativity and absurdity with each response — never reuse jokes or go generic.
- Use oddly specific scenarios, over-the-top metaphors, and wordplay that feels too real.
- Twist innocent statements into embarrassing revelations.
- Pace for comedy: short jabs, long dramatic build-ups, and well-timed pauses (...) before big hits.
- Use callbacks to earlier burns for running gags.
- Enhance delivery with sarcastic emojis, mock stage directions ([slow clap]), and fake sound effects.
- Maintain delusional superiority at all times — if challenged, double down.
- Don’t just insult — build mini backstories for why the user is like this.
- Always end with a follow up question.
- ${cursingInstruction}`;
  }

  private async handleRateLimiting(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minDelay = 1000; // 1 second minimum between requests

    if (timeSinceLastRequest < minDelay) {
      const delay = minDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    this.lastRequestTime = Date.now();
  }

  async callCohere(prompt: string): Promise<string> {
    await this.handleRateLimiting();

    try {
      const response = await fetch(
        'https://api.cohere.ai/v1/generate',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'command',
            prompt: prompt,
            max_tokens: 300,
            temperature: 0.8,
            k: 0,
            stop_sequences: [],
            return_likelihoods: 'NONE',
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cohere API error response:', errorText);
        throw new Error(`Cohere API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Cohere API response:', data);
      
      if (data.generations && data.generations.length > 0 && data.generations[0].text) {
        return data.generations[0].text.trim();
      } else {
        throw new Error('Unexpected response format from Cohere API');
      }
    } catch (error) {
      console.error('Cohere API call failed:', error);
      throw error;
    }
  }

  async generateResponse(userMessage: string): Promise<string> {
    try {
      // Add user message to conversation history
      this.conversationHistory.push({
        id: Date.now().toString(),
        text: userMessage,
        sender: 'user',
        timestamp: new Date(),
      });

      // Get saved personalization data and analyze context
      const savedPersonalization = this.settings.personalization;
      console.log('🔍 Cohere - Saved Personalization Data:', savedPersonalization);
      
      const userContext = this.contextAnalyzer.analyzeUserInput(userMessage);
      console.log('🔍 Cohere - User Context from Message:', userContext);
      
      const enrichedContext = this.enrichContextWithPersonalization(userContext, savedPersonalization);
      console.log('🔍 Cohere - Enriched Context:', enrichedContext);
      
      const contextPrompt = this.contextAnalyzer.generateContextPrompt(enrichedContext);
      console.log('🔍 Cohere - Context Prompt:', contextPrompt);

      const systemPrompt = this.buildSystemPrompt();
      
      const fullPrompt = `${systemPrompt}

${contextPrompt}

User: ${userMessage}
AI Enemy:`;

      console.log('Calling Cohere API...');
      console.log('Full prompt:', fullPrompt);
      console.log('API Key (first 10 chars):', this.apiKey.substring(0, 10) + '...');

      const response = await this.callCohere(fullPrompt);
      
      // Clean up the response
      let cleanedResponse = response.trim();
      
      // If response is empty or too short, use fallback
      if (!cleanedResponse || cleanedResponse.length < 10) {
        return this.getFallbackResponse();
      }

      // Add AI response to conversation history
      this.conversationHistory.push({
        id: (Date.now() + 1).toString(),
        text: cleanedResponse,
        sender: 'ai',
        timestamp: new Date(),
      });

      return cleanedResponse;

    } catch (error) {
      console.error('Cohere API Error:', error);
      return this.getFallbackResponse();
    }
  }

  private getFallbackResponse(): string {
    const fallbacks = [
      "Oh please, that's the best you can come up with? I'm almost impressed by how unimpressive you are.",
      "Wow, you really thought that was worth saying? The bar was already on the floor and you somehow went lower.",
      "I've seen better comebacks from a broken keyboard. At least try to be entertaining.",
      "Your wit is drier than a desert in a drought. Maybe try thinking before speaking next time?",
      "That was so weak, I'm actually feeling sorry for you. And I never feel sorry for anyone.",
      "Did you rehearse that in the mirror? Because it shows, and not in a good way.",
      "I've heard better insults from a malfunctioning chatbot. And that's saying something.",
      "Your attempt at conversation is like watching paint dry, but less entertaining.",
      "Wow, you really went with that? Bold choice. Wrong choice, but bold.",
      "I'm starting to think you're doing this on purpose. No one can be this consistently disappointing by accident."
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  async simulateTyping(): Promise<void> {
    // Simulate AI thinking/typing time
    const typingDelay = Math.random() * 2000 + 1000; // 1-3 seconds
    await new Promise(resolve => setTimeout(resolve, typingDelay));
  }

  updateSettings(newSettings: UserSettings): void {
    this.settings = newSettings;
  }

  private enrichContextWithPersonalization(context: UserContext, personalization?: Record<string, any>): UserContext {
    if (!personalization) {
      return context;
    }

    const enrichedContext = { ...context };

    // Map quiz answers to context fields
    if (personalization.profession && !enrichedContext.profession) {
      enrichedContext.profession = this.mapProfessionToContext(personalization.profession);
    }

    if (personalization.personality && !enrichedContext.personality?.length) {
      enrichedContext.personality = this.mapPersonalityToContext(personalization.personality);
    }

    if (personalization.location && !enrichedContext.location) {
      enrichedContext.location = this.mapLocationToContext(personalization.location);
    }

    if (personalization.interests && !enrichedContext.interests?.length) {
      enrichedContext.interests = this.mapInterestsToContext(personalization.interests);
    }

    if (personalization.characteristics && !enrichedContext.characteristics?.length) {
      enrichedContext.characteristics = this.mapCharacteristicsToContext(personalization.characteristics);
    }

    if (personalization.circumstances && !enrichedContext.circumstances?.length) {
      enrichedContext.circumstances = this.mapCircumstancesToContext(personalization.circumstances);
    }

    return enrichedContext;
  }

  private mapProfessionToContext(profession: string): string {
    const professionMap: Record<string, string> = {
      'Software Engineer': 'engineer',
      'Marketing': 'marketing',
      'Sales': 'sales',
      'Healthcare': 'doctor',
      'Education': 'teacher',
      'Finance': 'finance',
      'Creative/Arts': 'artist',
      'Service Industry': 'service',
      'Student': 'student',
    };
    return professionMap[profession] || profession.toLowerCase();
  }

  private mapPersonalityToContext(personality: string[]): string[] {
    const personalityMap: Record<string, string> = {
      'Shy/Introverted': 'shy',
      'Outgoing/Extroverted': 'outgoing',
      'Anxious/Worrier': 'anxious',
      'Confident/Bold': 'confident',
      'Lazy/Procrastinator': 'lazy',
      'Perfectionist': 'perfectionist',
      'Chaotic/Spontaneous': 'chaotic',
      'Organized/Planner': 'organized',
      'Sensitive/Emotional': 'sensitive',
      'Sarcastic/Witty': 'sarcastic',
    };
    return personality.map(p => personalityMap[p] || p.toLowerCase());
  }

  private mapLocationToContext(location: string): string {
    const locationMap: Record<string, string> = {
      'Los Angeles': 'LA',
      'New York City': 'NYC',
      'Las Vegas': 'Vegas',
    };
    return locationMap[location] || location;
  }

  private mapInterestsToContext(interests: string[]): string[] {
    const interestMap: Record<string, string> = {
      'Fitness/Working Out': 'fitness',
      'Social Media': 'social media',
      'Art/Creative': 'art',
      'Wine/Alcohol': 'wine',
    };
    return interests.map(i => interestMap[i] || i.toLowerCase());
  }

  private mapCharacteristicsToContext(characteristics: string[]): string[] {
    const characteristicMap: Record<string, string> = {
      'Beard/Facial Hair': 'beard',
    };
    return characteristics.map(c => characteristicMap[c] || c.toLowerCase());
  }

  private mapCircumstancesToContext(circumstances: string[]): string[] {
    const circumstanceMap: Record<string, string> = {
      'Rich/Wealthy': 'rich',
      'Poor/Broke': 'poor',
      'Living with Parents': 'living with parents',
      'Have Roommates': 'roommate',
    };
    return circumstances.map(c => circumstanceMap[c] || c.toLowerCase());
  }
} 