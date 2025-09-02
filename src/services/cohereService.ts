import { UserSettings } from '../types';
import { ContextAnalyzer, UserContext } from './contextAnalyzer';
import { BaseAIService } from './baseAIService';

export class CohereService extends BaseAIService {
  private apiKey: string;
  private contextAnalyzer: ContextAnalyzer;

  constructor(settings: UserSettings, apiKey: string) {
    super(settings);
    this.apiKey = apiKey;
    this.contextAnalyzer = ContextAnalyzer.getInstance();
  }

  protected async callAPI(userMessage: string): Promise<string> {
    return this.callCohere(userMessage);
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
      // Get saved personalization data and analyze context
      const savedPersonalization = this.settings.personalization;
      const userContext = this.contextAnalyzer.analyzeUserInput(userMessage);
      const enrichedContext = this.enrichContextWithPersonalization(userContext, savedPersonalization);
      const contextPrompt = this.contextAnalyzer.generateContextPrompt(enrichedContext);

      const systemPrompt = this.buildSystemPrompt();
      
      const fullPrompt = `${systemPrompt}

${contextPrompt}

User: ${userMessage}
AI Enemy:`;

      const response = await this.callCohere(fullPrompt);
      
      // Clean up the response
      let cleanedResponse = response.trim();
      
      // If response is empty or too short, use fallback
      if (!cleanedResponse || cleanedResponse.length < 10) {
        return this.getFallbackResponse();
      }

      return cleanedResponse;

    } catch (error) {
      console.error('Cohere API Error:', error);
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