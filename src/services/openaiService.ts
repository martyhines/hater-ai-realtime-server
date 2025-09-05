import { UserSettings } from '../types';
import { API_CONFIG, getAppAuthToken } from '../config/api';
import { BaseAIService } from './baseAIService';

export class OpenAIService extends BaseAIService {
  private apiKey: string;

  constructor(settings: UserSettings, apiKey: string) {
    super(settings);
    this.apiKey = apiKey;
  }

  protected async callAPI(userMessage: string): Promise<string> {
    return this.callOpenAI(userMessage);
  }

  private async callOpenAI(userMessage: string): Promise<string> {
    const systemPrompt = this.buildSystemPrompt();
    const conversationContext = this.buildConversationContext();

    // Add the current user message to the context
    conversationContext.push({
      role: 'user',
      content: userMessage
    });

    // Debug: Log the conversation context to see if there are duplicates
    try {
      const backendUrl = `${API_CONFIG.BACKEND?.BASE_URL || ''}/v1/chat`;
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAppAuthToken()}`,
        },
        body: JSON.stringify({
          // Hint value only; server chooses actual provider (Gemini → Cohere → OpenAI)
          model: 'server-ai-chain',
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
        let errorText = 'Unknown error';
        try {
          errorText = await response.text();
        } catch (parseError) {
          // If we can't parse the error response, use status text
          errorText = response.statusText || `HTTP ${response.status}`;
        }
        throw new Error(`Backend AI error: ${response.status} - ${errorText}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Failed to parse AI response as JSON');
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from AI service');
      }

      if (!data.choices || !Array.isArray(data.choices) || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response structure from AI service');
      }

      // Store the AI service info for the UI
      if (data.ai_service) {
        this.lastAIService = data.ai_service;
      }

      return data.choices[0].message.content.trim();
    } catch (error) {
      // Log error for debugging but don't expose sensitive details
      console.error('OpenAI service error:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }


} 