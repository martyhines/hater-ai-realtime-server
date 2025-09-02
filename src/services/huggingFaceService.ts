import { UserSettings } from '../types';
import { BaseAIService } from './baseAIService';

export class HuggingFaceService extends BaseAIService {
  private apiKey: string;

  constructor(settings: UserSettings, apiKey: string) {
    super(settings);
    this.apiKey = apiKey;
  }

  protected async callAPI(userMessage: string): Promise<string> {
    return this.callHuggingFace(userMessage);
  }

  private getTroubleshootingInfo(): string {
    return `
Hugging Face API Troubleshooting:
1. Check your API key at https://huggingface.co/settings/tokens
2. Ensure you have a valid API key (starts with 'hf_')
3. Free tier has rate limits - try again in a few minutes
4. Some models may be temporarily unavailable
5. Check your internet connection
6. Verify your Hugging Face account is active
    `.trim();
  }

  private async testApiKey(): Promise<boolean> {
    try {

      
      const response = await fetch(
        'https://api-inference.huggingface.co/models/gpt2',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: 'test',
            parameters: {
              max_length: 10,
              return_full_text: false
            }
          }),
        }
      );


      
      if (response.status === 401) {
        console.error('Invalid Hugging Face API key');
        return false;
      } else if (response.status === 429) {
        console.error('Rate limit exceeded during API key test');
        return false;
      } else if (response.status === 200) {

        return true;
      } else {

        return true; // Assume valid if not explicitly invalid
      }
    } catch (error) {
      console.error('Error testing API key:', error);
      return false;
    }
  }

  async callHuggingFace(prompt: string): Promise<string> {
    await this.handleRateLimiting();

    try {
      // Try multiple models in order of preference
      const models = [
        'microsoft/DialoGPT-medium',  // Conversational model
        'gpt2',                      // Fallback text generation model
        'distilgpt2'                 // Smaller, faster fallback
      ];

      for (const model of models) {
        try {


          
          const response = await fetch(
            `https://api-inference.huggingface.co/models/${model}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                inputs: prompt,
                parameters: {
                  max_length: 100,
                  temperature: 0.8,
                  do_sample: true,
                  return_full_text: false,
                  pad_token_id: 50256, // GPT-2 pad token
                  eos_token_id: 50256  // GPT-2 end token
                }
              }),
            }
          );


          if (response.ok) {
            const data = await response.json();
            
            if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
              let generatedText = data[0].generated_text;
              
              // Clean up the response
              generatedText = generatedText.replace(prompt, '').trim();
              
              // Remove any incomplete sentences at the end
              const sentences = generatedText.split(/[.!?]/);
              if (sentences.length > 1) {
                generatedText = sentences.slice(0, -1).join('.') + '.';
              }
              
              if (generatedText.length > 10) {
                return generatedText;
              }
            } else if (typeof data === 'string') {
              let responseText = data.replace(prompt, '').trim();
              if (responseText.length > 10) {
                return responseText;
              }
            }
            
            continue;
          } else {
            const errorText = await response.text();
            console.error(`Hugging Face API error for ${model}:`, response.status, errorText);
            
            if (response.status === 404) {
              continue;
            } else if (response.status === 503) {
              continue;
            } else if (response.status === 401) {
              console.error(`Authentication failed for ${model}. Check your API key.`);
              throw new Error('Invalid Hugging Face API key. Please check your credentials.');
            } else if (response.status === 429) {
              console.error(`Rate limit exceeded for ${model}.`);
              throw new Error('Hugging Face rate limit exceeded. Please wait a moment and try again.');
            } else if (response.status === 500) {
              continue;
            }
          }
        } catch (modelError) {
          console.error(`Error with model ${model}:`, modelError);
          continue;
        }
      }
      
      // If all models fail, throw error for fallback
      console.error('All Hugging Face models failed. Troubleshooting info:');
      console.error(this.getTroubleshootingInfo());
      throw new Error('All Hugging Face models are currently unavailable. This could be due to model loading, rate limits, or temporary service issues.');
      
    } catch (error) {
      console.error('All Hugging Face API calls failed:', error);
      console.error('Troubleshooting info:');
      console.error(this.getTroubleshootingInfo());
      throw error;
    }
  }

  async generateResponse(userMessage: string): Promise<string> {
    try {
      // Test API key first
      const isApiKeyValid = await this.testApiKey();
      if (!isApiKeyValid) {
        console.error('Invalid Hugging Face API key, using fallback');
        return this.getFallbackResponse();
      }

      // Create a more focused prompt for text generation models
      const roastPrompts = [
        `User says: "${userMessage}"\n\nAI roasts them:`,
        `Human: ${userMessage}\n\nAI enemy responds with a savage roast:`,
        `User message: ${userMessage}\n\nGenerate a witty, sarcastic response:`,
        `Person says: "${userMessage}"\n\nRoast them with clever insults:`,
        `User: ${userMessage}\n\nAI responds with brutal honesty:`
      ];
      
      const fullPrompt = roastPrompts[Math.floor(Math.random() * roastPrompts.length)];

      const response = await this.callHuggingFace(fullPrompt);
      
      // Clean up the response
      let cleanedResponse = response.trim();
      
      // Remove any prefixes that might have been generated
      const prefixes = ['AI roasts them:', 'AI enemy responds:', 'Generate a witty, sarcastic response:', 'Roast them with clever insults:', 'AI responds with brutal honesty:'];
      for (const prefix of prefixes) {
        if (cleanedResponse.startsWith(prefix)) {
          cleanedResponse = cleanedResponse.substring(prefix.length).trim();
        }
      }
      
      // If response is empty or too short, use fallback
      if (!cleanedResponse || cleanedResponse.length < 10) {
        return this.getFallbackResponse();
      }

      return cleanedResponse;

    } catch (error) {
      console.error('Hugging Face API Error:', error);
      return this.getFallbackResponse();
    }
  }
} 