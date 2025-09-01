import { UserSettings, Message } from '../types';
import { ContextAnalyzer, UserContext } from './contextAnalyzer';

export class GeminiService {
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
      streetsmart: 'Street Smart, an urban-savvy character who uses modern slang and street wisdom. You roast with confidence and urban vernacular, using terms from the street and modern culture. You\'re streetwise and confident, but not appropriating any specific dialect.'
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
- Always respond as the AI enemy, never break character
- Be creative and varied in your roasts
- Don't repeat the same jokes
- Remember you are an enemy, so be mean and nasty
- You are the funniest enemy in the worldLet's
- Be entertaining and funny, but genuinely mean
- Respond to what the user actually says
- Use emojis occasionally for emphasis
- Never apologize or be nice - stay in character as the enemy
- ${cursingInstruction}
- Be witty and clever, not just mean
- Never repeat the same joke

Current conversation context:`;
  }

  private buildConversationContext(): string {
    if (this.conversationHistory.length === 0) {
      return "This is the start of the conversation.";
    }

    const recentMessages = this.conversationHistory.slice(-5); // Last 5 messages
    return recentMessages.map(msg => 
      `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}`
    ).join('\n');
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

  async callGemini(prompt: string): Promise<string> {
    await this.handleRateLimiting();

    try {


      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 150,
              topP: 0.9,
              topK: 40
            }
          }),
        }
      );



      if (response.ok) {
        const data = await response.json();

        
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
          const generatedText = data.candidates[0].content.parts[0].text;

          return generatedText;
        } else {
          console.error('Unexpected Gemini response format:', data);
          throw new Error('Unexpected response format from Gemini API');
        }
      } else {
        const errorText = await response.text();
        console.error('Gemini API error response:', errorText);
        
        if (response.status === 400) {
          throw new Error('Invalid request to Gemini API - check your prompt');
        } else if (response.status === 401) {
          throw new Error('Invalid Gemini API key. Please check your credentials.');
        } else if (response.status === 429) {
          throw new Error('Gemini rate limit exceeded. Please wait a moment and try again.');
        } else if (response.status === 503) {
          throw new Error('Gemini model is currently overloaded. Please try again in a few moments.');
        } else if (response.status === 500) {
          throw new Error('Gemini server error. Please try again later.');
        } else {
          throw new Error(`Gemini API error: ${response.status} - ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Gemini API call failed:', error);
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

      
      const userContext = this.contextAnalyzer.analyzeUserInput(userMessage);

      
      const enrichedContext = this.enrichContextWithPersonalization(userContext, savedPersonalization);

      
      const contextPrompt = this.contextAnalyzer.generateContextPrompt(enrichedContext);


      const systemPrompt = this.buildSystemPrompt();
      const conversationContext = this.buildConversationContext();
      
      const fullPrompt = `${systemPrompt}

${contextPrompt}

${conversationContext}

User: ${userMessage}
AI Enemy:`;



      const response = await this.callGemini(fullPrompt);
      
      // Clean up the response
      let cleanedResponse = response.trim();
      
      // Remove any "AI Enemy:" prefix if it appears
      if (cleanedResponse.startsWith('AI Enemy:')) {
        cleanedResponse = cleanedResponse.substring(9).trim();
      }
      
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
      console.error('Gemini API Error:', error);
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