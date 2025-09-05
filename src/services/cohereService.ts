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
        throw new Error(`Cohere API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

      
      if (data.generations && data.generations.length > 0 && data.generations[0].text) {
        return data.generations[0].text.trim();
      } else {
        throw new Error('Unexpected response format from Cohere API');
      }
    } catch (error) {
      throw error;
    }
  }

  async generateResponse(userMessage: string): Promise<string> {
    try {
      // Analyze context from user message
      const userContext = this.contextAnalyzer.analyzeUserInput(userMessage);
      const contextPrompt = this.contextAnalyzer.generateContextPrompt(userContext);

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
      return this.getFallbackResponse();
    }
  }

}
