import { Platform, Linking } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import Share from 'react-native-share';
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
      
      console.log('Sharing to Twitter:', shareText);
      
      // Try to open Twitter app first, then fall back to web
      const success = await this.openTwitterApp(shareText);
      
      if (!success) {
        // Fall back to general sharing
        return await this.shareViaSystem(shareText);
      }
      
      return true;
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
          console.log('Failed to open URL:', url, error);
          continue;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error opening Twitter app:', error);
      return false;
    }
  }

  /**
   * Share via system share sheet
   */
  private async shareViaSystem(text: string): Promise<boolean> {
    try {
      const shareOptions = {
        title: 'Share Roast to Twitter',
        message: text,
        url: 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text),
        social: Share.Social.TWITTER,
      };
      
      await Share.shareSingle(shareOptions);
      return true;
    } catch (error) {
      console.error('Error sharing via system:', error);
      
      // Final fallback - just copy to clipboard
      try {
        await this.copyToClipboard(text);
        return true;
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
        return false;
      }
    }
  }

  /**
   * Copy text to clipboard as fallback
   */
  private async copyToClipboard(text: string): Promise<void> {
    try {
      await Clipboard.setStringAsync(text);
      console.log('Text copied to clipboard:', text);
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
  async getBestSharingMethod(): Promise<'twitter-app' | 'system-share' | 'web'> {
    const twitterInstalled = await this.isTwitterInstalled();
    
    if (twitterInstalled) {
      return 'twitter-app';
    } else if (Platform.OS === 'ios' || Platform.OS === 'android') {
      return 'system-share';
    } else {
      return 'web';
    }
  }
}
