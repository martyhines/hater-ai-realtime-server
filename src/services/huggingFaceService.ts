import { UserSettings, Message } from '../types';

export class HuggingFaceService {
  private apiKey: string;
  private settings: UserSettings;
  private conversationHistory: Message[] = [];
  private lastRequestTime: number = 0;

  constructor(settings: UserSettings, apiKey: string) {
    this.settings = settings;
    this.apiKey = apiKey;
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
- Be entertaining and funny, not genuinely mean
- Respond to what the user actually says
- Use emojis occasionally for emphasis
- Never apologize or be nice - stay in character as the enemy
- ${cursingInstruction}

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
      console.log('Testing Hugging Face API key validity...');
      
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

      console.log('API key test response status:', response.status);
      
      if (response.status === 401) {
        console.error('Invalid Hugging Face API key');
        return false;
      } else if (response.status === 429) {
        console.error('Rate limit exceeded during API key test');
        return false;
      } else if (response.status === 200) {
        console.log('Hugging Face API key is valid');
        return true;
      } else {
        console.log('API key test inconclusive, status:', response.status);
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
          console.log(`Trying Hugging Face model: ${model}`);
          console.log(`API Key length: ${this.apiKey.length}`);
          console.log(`API Key starts with: ${this.apiKey.substring(0, 10)}...`);
          
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

          console.log(`Response status for ${model}:`, response.status);
          console.log(`Response headers for ${model}:`, Object.fromEntries(response.headers.entries()));

          if (response.ok) {
            const data = await response.json();
            console.log(`Hugging Face API response from ${model}:`, data);
            
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
                console.log(`Successfully generated response from ${model}:`, generatedText);
                return generatedText;
              }
            } else if (typeof data === 'string') {
              let responseText = data.replace(prompt, '').trim();
              if (responseText.length > 10) {
                console.log(`Successfully generated response from ${model}:`, responseText);
                return responseText;
              }
            }
            
            console.log(`Model ${model} returned insufficient response, trying next model...`);
            continue;
          } else {
            const errorText = await response.text();
            console.error(`Hugging Face API error for ${model}:`, response.status, errorText);
            
            if (response.status === 404) {
              console.log(`Model ${model} not available, trying next model...`);
              continue;
            } else if (response.status === 503) {
              console.log(`Model ${model} is loading, trying next model...`);
              continue;
            } else if (response.status === 401) {
              console.error(`Authentication failed for ${model}. Check your API key.`);
              throw new Error('Invalid Hugging Face API key. Please check your credentials.');
            } else if (response.status === 429) {
              console.error(`Rate limit exceeded for ${model}.`);
              throw new Error('Hugging Face rate limit exceeded. Please wait a moment and try again.');
            } else if (response.status === 500) {
              console.log(`Server error for ${model}, trying next model...`);
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

      // Add user message to conversation history
      this.conversationHistory.push({
        id: Date.now().toString(),
        text: userMessage,
        sender: 'user',
        timestamp: new Date(),
      });

      const systemPrompt = this.buildSystemPrompt();
      const conversationContext = this.buildConversationContext();
      
      // Create a more focused prompt for text generation models
      const roastPrompts = [
        `User says: "${userMessage}"\n\nAI roasts them:`,
        `Human: ${userMessage}\n\nAI enemy responds with a savage roast:`,
        `User message: ${userMessage}\n\nGenerate a witty, sarcastic response:`,
        `Person says: "${userMessage}"\n\nRoast them with clever insults:`,
        `User: ${userMessage}\n\nAI responds with brutal honesty:`
      ];
      
      const fullPrompt = roastPrompts[Math.floor(Math.random() * roastPrompts.length)];

      console.log('Calling Hugging Face API...');
      console.log('Full prompt:', fullPrompt);
      console.log('API Key (first 10 chars):', this.apiKey.substring(0, 10) + '...');

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

      // Add AI response to conversation history
      this.conversationHistory.push({
        id: (Date.now() + 1).toString(),
        text: cleanedResponse,
        sender: 'ai',
        timestamp: new Date(),
      });

      return cleanedResponse;

    } catch (error) {
      console.error('Hugging Face API Error:', error);
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
} 