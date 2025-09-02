import { UserSettings } from '../types';
import { ContextAnalyzer, UserContext } from './contextAnalyzer';
import { BaseAIService } from './baseAIService';

export class TogetherAIService extends BaseAIService {
  private apiKey: string;
  private contextAnalyzer: ContextAnalyzer;

  constructor(settings: UserSettings, apiKey: string) {
    super(settings);
    this.apiKey = apiKey;
    this.contextAnalyzer = ContextAnalyzer.getInstance();
  }

  protected async callAPI(userMessage: string): Promise<string> {
    return this.callTogetherAI(userMessage);
  }

  async callTogetherAI(prompt: string, contextPrompt?: string): Promise<string> {
    await this.handleRateLimiting();

    try {


      const response = await fetch(
        'https://api.together.xyz/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: 'mistralai/Mistral-7B-Instruct-v0.3',
            messages: [
              {
                role: 'system',
                content: this.buildSystemPrompt()
              },
              {
                role: 'user',
                content: `${contextPrompt ? contextPrompt + '\n\n' : ''}${this.buildConversationContext()}\n\nUser: ${prompt}\nAI Enemy:`
              }
            ],
            max_tokens: 300,
            temperature: 0.8,
            top_p: 0.9,
            frequency_penalty: 0.1,
            presence_penalty: 0.1
          }),
        }
      );



      if (response.ok) {
        const data = await response.json();

        
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
          const generatedText = data.choices[0].message.content;

          return generatedText;
        } else {
          console.error('Unexpected Together AI response format:', data);
          throw new Error('Unexpected response format from Together AI API');
        }
      } else {
        const errorText = await response.text();
        console.error('Together AI API error response:', errorText);
        
        if (response.status === 400) {
          throw new Error('Invalid request to Together AI API - check your prompt');
        } else if (response.status === 401) {
          throw new Error('Invalid Together AI API key. Please check your credentials.');
        } else if (response.status === 429) {
          throw new Error('Together AI rate limit exceeded. Please wait a moment and try again.');
        } else if (response.status === 503) {
          throw new Error('Together AI model is currently overloaded. Please try again in a few moments.');
        } else if (response.status === 500) {
          throw new Error('Together AI server error. Please try again later.');
        } else {
          throw new Error(`Together AI API error: ${response.status} - ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Together AI API call failed:', error);
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

      const response = await this.callTogetherAI(userMessage, contextPrompt);
      
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
      console.error('Together AI API Error:', error);
      return this.getFallbackResponse();
    }
  }
} 