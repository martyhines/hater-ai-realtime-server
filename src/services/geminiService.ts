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
          throw new Error('Unexpected response format from Gemini API');
        }
      } else {
        const errorText = await response.text();
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
      throw error;
    }
  }

  async generateResponse(userMessage: string): Promise<string> {
    try {
      // Analyze context from user message
      const userContext = this.contextAnalyzer.analyzeUserInput(userMessage);
      const contextPrompt = this.contextAnalyzer.generateContextPrompt(userContext);

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
      return this.getFallbackResponse();
    }
  }

}
