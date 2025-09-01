import { CustomModel, UserSettings, Message } from '../types';
import { AIService } from './aiService';

export class CustomModelService extends AIService {
  private model: CustomModel;
  private lastCallTime: number = 0;
  private readonly rateLimitDelay: number = 1000; // 1 second between calls

  constructor(settings: UserSettings, model: CustomModel) {
    super(settings);
    this.model = model;
  }

  private async handleRateLimiting(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastCallTime = Date.now();
  }

  private getPersonalityPrompt(): string {
    const { aiPersonality, roastIntensity } = this.settings;
    
    const personalities = {
      sarcastic: 'Sarcastic Sam, a master of dry wit and eye-rolling commentary. You roast people with clever sarcasm and witty observations.',
      witty: 'Witty Will, quick with clever comebacks and smart observations. You roast with intelligence and clever wordplay.',
      brutal: 'Brutal Bob, a savage roaster who goes straight for the jugular. You roast with brutal honesty and cutting remarks.',
      playful: 'Playful Pete, a fun-loving roaster who keeps things light and entertaining. You roast with humor and charm.',
      streetsmart: 'Street Smart, an urban-savvy character who uses modern slang and street wisdom. You roast with confidence and urban vernacular, using terms from the street and modern culture. You\'re streetwise and confident, but not appropriating any specific dialect.'
    };

    const intensities = {
      mild: 'Keep your roasts gentle and playful. Don\'t be too harsh.',
      medium: 'Be moderately savage but still entertaining. Find the right balance.',
      savage: 'Go all out. Be absolutely brutal and savage in your roasts.'
    };

    return `You are an AI enemy that roasts users. You are ${personalities[aiPersonality]} ${intensities[roastIntensity]}`;
  }

  private formatPrompt(userMessage: string): string {
    const systemPrompt = this.getPersonalityPrompt();
    const allowCursing = this.settings.allowCursing;
    
    const cursingInstruction = allowCursing 
      ? "You can use profanity and curse words in your responses when appropriate."
      : "Do NOT use any profanity, curse words, or explicit language. Keep it clean.";
    
    if (this.model.promptTemplate) {
      // Use custom prompt template if provided
      return this.model.promptTemplate
        .replace('{{system}}', systemPrompt)
        .replace('{{user}}', userMessage);
    }

    // Default prompt format
    return `${systemPrompt}

IMPORTANT RULES:
- Always respond as the AI enemy, never break character
- Be creative and varied in your roasts
- Don't repeat the same jokes
- Be entertaining and funny, not genuinely mean
- Respond to what the user actually says
- Use emojis occasionally for emphasis
- Never apologize or be nice - stay in character as the enemy
- ${cursingInstruction}

User: ${userMessage}
AI Enemy:`;
  }

  private buildRequestBody(prompt: string): any {
    const baseParams = {
      temperature: this.model.parameters.temperature || 0.9,
      max_tokens: this.model.parameters.maxTokens || 300,
      top_p: this.model.parameters.topP || 1.0,
      frequency_penalty: this.model.parameters.frequencyPenalty || 0.0,
      presence_penalty: this.model.parameters.presencePenalty || 0.0,
    };

    switch (this.model.requestFormat) {
      case 'openai':
        return {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: this.getPersonalityPrompt() },
            { role: 'user', content: prompt }
          ],
          ...baseParams
        };
      
      case 'cohere':
        return {
          model: 'command',
          prompt: prompt,
          ...baseParams
        };
      
      case 'huggingface':
        return {
          inputs: prompt,
          parameters: {
            max_length: baseParams.max_tokens,
            temperature: baseParams.temperature,
            do_sample: true,
            return_full_text: false
          }
        };
      
      case 'custom':
      default:
        return {
          prompt: prompt,
          ...baseParams
        };
    }
  }

  private extractResponseText(response: any): string {
    try {
      // Use the configured response path to extract text
      const pathParts = this.model.responsePath.split('.');
      let result = response;
      
      for (const part of pathParts) {
        if (result && typeof result === 'object') {
          result = result[part];
        } else {
          throw new Error(`Invalid response path: ${this.model.responsePath}`);
        }
      }
      
      if (typeof result !== 'string') {
        throw new Error(`Response at path ${this.model.responsePath} is not a string`);
      }
      
      return result;
    } catch (error) {
      console.error('Error extracting response text:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to extract response from custom model: ${errorMessage}`);
    }
  }

  async generateResponse(userMessage: string): Promise<string> {
    return this.callCustomModel(userMessage);
  }

  private async callCustomModel(userMessage: string): Promise<string> {
    await this.handleRateLimiting();
    
    try {
      const prompt = this.formatPrompt(userMessage);
      const requestBody = this.buildRequestBody(prompt);
      
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...this.model.headers
      };

      if (this.model.apiKey) {
        headers['Authorization'] = `Bearer ${this.model.apiKey}`;
      }

      const response = await fetch(this.model.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Custom Model API error response:', errorText);
        throw new Error(`Custom Model API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      const responseText = this.extractResponseText(data);
      
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Custom model returned empty response');
      }

      return responseText;
    } catch (error) {
      console.error('Custom Model API Error:', error);
      throw error;
    }
  }
} 