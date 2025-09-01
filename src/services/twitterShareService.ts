import { Platform, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Tweet } from './tweetGenerationService';

export interface TwitterShareConfig {
  tweet: Tweet;
  includeAppLink?: boolean;
  appStoreUrl?: string;
}

export class TwitterShareService {
  private static instance: TwitterShareService;

  static getInstance(): TwitterShareService {
    if (!TwitterShareService.instance) {
      TwitterShareService.instance = new TwitterShareService();
    }
    return TwitterShareService.instance;
  }

  /**
   * Share a tweet to Twitter using the Twitter app or web
   */
  async shareToTwitter(config: TwitterShareConfig): Promise<boolean> {
    try {
      const { tweet, includeAppLink = true, appStoreUrl } = config;
      
      // Format the tweet for sharing
      const shareText = this.formatTweetForSharing(tweet, includeAppLink, appStoreUrl);
      
      
      // Try to open Twitter app first, then fall back to web
      const success = await this.openTwitterApp(shareText);
      
      return success;
    } catch (error) {
      console.error('Error sharing to Twitter:', error);
      return false;
    }
  }

  /**
   * Format tweet for sharing with proper Twitter formatting
   */
  private formatTweetForSharing(tweet: Tweet, includeAppLink: boolean, appStoreUrl?: string): string {
    const emojiText = tweet.emojis.join('');
    const hashtagText = tweet.hashtags.map(tag => ` ${tag}`).join('');
    let shareText = `${emojiText} ${tweet.text}${hashtagText}`;
    
    // Add app link if requested
    if (includeAppLink && appStoreUrl) {
      shareText += `\n\n${appStoreUrl}`;
    }
    
    return shareText;
  }

  /**
   * Try to open Twitter app with the tweet
   */
  private async openTwitterApp(text: string): Promise<boolean> {
    try {
      // Encode the text for URL
      const encodedText = encodeURIComponent(text);
      
      // Twitter app URL schemes
      const twitterUrls = [
        `twitter://post?message=${encodedText}`,
        `twitter://compose?text=${encodedText}`,
        `https://twitter.com/intent/tweet?text=${encodedText}`
      ];
      
      // Try each URL scheme
      for (const url of twitterUrls) {
        try {
          const canOpen = await Linking.canOpenURL(url);
          if (canOpen) {
            await Linking.openURL(url);
            return true;
          }
        } catch (error) {
          continue;
        }
      }
      
      // If no Twitter app, try web intent
      try {
        await Linking.openURL(`https://twitter.com/intent/tweet?text=${encodedText}`);
        return true;
      } catch (error) {
        return false;
      }
    } catch (error) {
      console.error('Error opening Twitter app:', error);
      return false;
    }
  }



  /**
   * Copy text to clipboard as fallback
   */
  private async copyToClipboard(text: string): Promise<void> {
    try {
      await Clipboard.setStringAsync(text);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      throw error;
    }
  }

  /**
   * Share a simple roast text to Twitter
   */
  async shareRoastToTwitter(roastText: string, includeAppLink: boolean = true): Promise<boolean> {
    try {
      const shareText = includeAppLink 
        ? `${roastText}\n\n🤖 Get roasted by AI: [App Store Link]`
        : roastText;
      
      return await this.openTwitterApp(shareText);
    } catch (error) {
      console.error('Error sharing roast to Twitter:', error);
      return false;
    }
  }

  /**
   * Check if Twitter app is installed
   */
  async isTwitterInstalled(): Promise<boolean> {
    try {
      const canOpen = await Linking.canOpenURL('twitter://');
      return canOpen;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the best sharing method available
   */
  async getBestSharingMethod(): Promise<'twitter-app' | 'web'> {
    const twitterInstalled = await this.isTwitterInstalled();
    
    if (twitterInstalled) {
      return 'twitter-app';
    } else {
      return 'web';
    }
  }
}
