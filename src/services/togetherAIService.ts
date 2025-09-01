import { UserSettings } from '../types';
import { AIService } from './aiService';

export class TogetherAIService extends AIService {
  private apiKey: string;
  private lastRequestTime: number = 0;

  constructor(settings: UserSettings, apiKey: string) {
    super(settings);
    this.apiKey = apiKey;
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
- Be entertaining and funny, but genuinely mean
- Respond to what the user actually says
- Use emojis occasionally for emphasis
- Never apologize or be nice - stay in character as the enemy
- ${cursingInstruction}
- Keep responses concise and punchy (under 100 words)
- Be witty and clever, not just mean

Current conversation context:`;
  }

  private buildConversationContext(): string {
    const conversationHistory = this.getConversationHistory();
    if (conversationHistory.length === 0) {
      return "This is the start of the conversation.";
    }

    const recentMessages = conversationHistory.slice(-5); // Last 5 messages
    return recentMessages.map(msg => 
      `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}`
    ).join('\n');
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
      
      // If response is empty or too short, use fallback with context
      if (!cleanedResponse || cleanedResponse.length < 10) {
        return this.getRoastResponse(enrichedContext);
      }

      return cleanedResponse;

    } catch (error) {
      console.error('Together AI API Error:', error);
      return this.getRoastResponse();
    }
  }
} 