import { Platform } from 'react-native';

export interface Tweet {
  text: string;
  emojis: string[];
  hashtags: string[];
  characterCount: number;
  style: 'savage' | 'witty' | 'playful';
}

export interface TweetGenerationConfig {
  roastText: string;
  userName?: string;
  style: 'savage' | 'witty' | 'playful';
  includeAppLink?: boolean;
  customHashtags?: string[];
}

export class TweetGenerationService {
  private static instance: TweetGenerationService;

  static getInstance(): TweetGenerationService {
    if (!TweetGenerationService.instance) {
      TweetGenerationService.instance = new TweetGenerationService();
    }
    return TweetGenerationService.instance;
  }

  async generateTweet(config: TweetGenerationConfig): Promise<Tweet> {
    try {
      console.log('Generating tweet for roast:', config.roastText);
      
      // Create the main tweet content
      const tweetText = this.createTweetText(config);
      
      // Add emojis
      const emojis = this.getEmojisForStyle(config.style);
      
      // Add hashtags
      const hashtags = this.generateHashtags(config.style, config.customHashtags);
      
      // Calculate character count
      const characterCount = tweetText.length + emojis.join('').length + hashtags.map(tag => ` ${tag}`).join('').length;
      
      const tweet: Tweet = {
        text: tweetText,
        emojis,
        hashtags,
        characterCount,
        style: config.style
      };
      
      console.log('Tweet generated successfully');
      return tweet;
      
    } catch (error) {
      console.error('Error generating tweet:', error);
      throw new Error('Failed to generate tweet');
    }
  }

  private createTweetText(config: TweetGenerationConfig): string {
    const { roastText, userName, style, includeAppLink } = config;
    
    // Create hook based on style
    const hooks = {
      savage: ['AI just roasted me:', 'AI went SAVAGE on me:', 'AI just violated me:'],
      witty: ['AI just outsmarted me:', 'AI hit me with some wit:', 'AI just roasted me with pure cleverness:'],
      playful: ['AI just played me:', 'AI turned my life into a comedy:', 'AI just roasted me playfully:']
    };
    
    const hook = this.getRandomHook(style);
    const reaction = this.getRandomReaction(style);
    
    // Create call to action
    const cta = includeAppLink ? 'Try it yourself!' : 'Download Hater AI to get roasted!';
    
    // Combine everything into a single tweet
    let tweetText = `${hook} "${roastText}" ${reaction} ${cta}`;
    
    // Truncate if too long (leave room for emojis and hashtags)
    const maxLength = 200; // Leave room for emojis and hashtags
    if (tweetText.length > maxLength) {
      tweetText = tweetText.substring(0, maxLength - 3) + '...';
    }
    
    return tweetText;
  }

  private getRandomHook(style: string): string {
    const hooks = {
      savage: ['AI just roasted me:', 'AI went SAVAGE on me:', 'AI just violated me:'],
      witty: ['AI just outsmarted me:', 'AI hit me with some wit:', 'AI just roasted me with pure cleverness:'],
      playful: ['AI just played me:', 'AI turned my life into a comedy:', 'AI just roasted me playfully:']
    };
    
    const styleHooks = hooks[style as keyof typeof hooks] || hooks.savage;
    return styleHooks[Math.floor(Math.random() * styleHooks.length)];
  }

  private getRandomReaction(style: string): string {
    const reactions = {
      savage: ['😭 I\'m crying but also laughing...', '💀 I\'m dead but somehow still typing...', '😱 I\'m shook but also impressed...'],
      witty: ['😏 Touché, AI. Touché.', '🧠 Well played, AI. Well played.', '💡 I see what you did there, AI.'],
      playful: ['😄 AI really went there!', '🎪 AI turned my life into a comedy!', '🎮 AI played me like a fiddle!']
    };
    
    const styleReactions = reactions[style as keyof typeof reactions] || reactions.savage;
    return styleReactions[Math.floor(Math.random() * styleReactions.length)];
  }

  private getEmojisForStyle(style: string): string[] {
    const styleEmojis = {
      savage: ['🔥', '⚡', '💀', '😱'],
      witty: ['🧠', '💡', '🎯', '😏'],
      playful: ['🎪', '🎮', '🎨', '😄']
    };
    
    const emojis = styleEmojis[style as keyof typeof styleEmojis] || styleEmojis.savage;
    return [emojis[Math.floor(Math.random() * emojis.length)]];
  }

  private generateHashtags(style: string, customHashtags?: string[]): string[] {
    const baseHashtags = ['#AIRoast', '#AIHumor'];
    const styleHashtags = {
      savage: ['#Savage', '#Roasted'],
      witty: ['#Witty', '#Clever'],
      playful: ['#Funny', '#Comedy']
    };
    
    const hashtags = [
      ...baseHashtags,
      ...(styleHashtags[style as keyof typeof styleHashtags] || []),
      ...(customHashtags || [])
    ];
    
    // Limit to 3 hashtags total for single tweet
    return hashtags.slice(0, 3);
  }

  async generateTweetVariations(config: TweetGenerationConfig): Promise<Tweet[]> {
    const variations: Tweet[] = [];
    
    // Generate variations for each style
    const styles: ('savage' | 'witty' | 'playful')[] = ['savage', 'witty', 'playful'];
    
    for (const style of styles) {
      const variationConfig = { ...config, style };
      const tweet = await this.generateTweet(variationConfig);
      variations.push(tweet);
    }
    
    return variations;
  }

  formatTweetForDisplay(tweet: Tweet): string {
    const emojiText = tweet.emojis.join('');
    const hashtagText = tweet.hashtags.map(tag => ` ${tag}`).join('');
    return `${emojiText} ${tweet.text}${hashtagText}`;
  }

  validateTweet(tweet: Tweet): boolean {
    return tweet.characterCount <= 280;
  }

  getTweetStats(tweet: Tweet): {
    characterCount: number;
    hashtagCount: number;
    emojiCount: number;
    isValid: boolean;
  } {
    return {
      characterCount: tweet.characterCount,
      hashtagCount: tweet.hashtags.length,
      emojiCount: tweet.emojis.length,
      isValid: this.validateTweet(tweet)
    };
  }
} 