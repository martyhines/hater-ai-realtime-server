import { UserSettings } from '../types';
import { ContextAnalyzer, UserContext } from './contextAnalyzer';
import { BaseAIService } from './baseAIService';

export class GeminiService extends BaseAIService {
  private apiKey: string;
  private contextAnalyzer: ContextAnalyzer;

  constructor(settings: UserSettings, apiKey: string) {
    super(settings);
    this.apiKey = apiKey;
    this.contextAnalyzer = ContextAnalyzer.getInstance();
  }

  protected async callAPI(userMessage: string): Promise<string> {
    console.log('GeminiService COOKING');
    return this.callGemini(userMessage);
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

      return cleanedResponse;

    } catch (error) {
      console.error('Gemini API Error:', error);
      return this.getFallbackResponse();
    }
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