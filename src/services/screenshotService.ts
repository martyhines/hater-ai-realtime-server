import { Platform } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

export interface ScreenshotConfig {
  roastText: string;
  userName?: string;
  style: 'savage' | 'witty' | 'playful';
  includeAppLink?: boolean;
  customHashtags?: string[];
  reaction?: string;
  format: 'portrait' | 'landscape';
  theme: 'dark' | 'light';
}



export class ScreenshotService {
  private static instance: ScreenshotService;

  static getInstance(): ScreenshotService {
    if (!ScreenshotService.instance) {
      ScreenshotService.instance = new ScreenshotService();
    }
    return ScreenshotService.instance;
  }

  async captureChatScreenshot(
    viewRef: React.RefObject<any>,
    config: ScreenshotConfig
  ): Promise<string> {
    try {
      console.log('Capturing chat screenshot...');
      
      if (!viewRef.current) {
        throw new Error('View reference is not available');
      }

      const options = {
        format: 'png' as const,
        quality: 0.9,
        result: 'tmpfile' as const,
        width: config.format === 'portrait' ? 1080 : 1920,
        height: config.format === 'portrait' ? 1920 : 1080,
      };

      const screenshotPath = await ViewShot.captureRef(viewRef, options);
      console.log('Screenshot captured:', screenshotPath);

      // For now, just return the screenshot as-is
      // In production, you could add watermarks or branding here
      
      return screenshotPath;
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      throw new Error('Failed to capture screenshot');
    }
  }



  async saveToGallery(screenshotPath: string): Promise<boolean> {
    try {
      console.log('Saving screenshot to gallery:', screenshotPath);
      
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Media library permission denied');
        return false;
      }

      // Check if the file exists and is readable
      const fileInfo = await FileSystem.getInfoAsync(screenshotPath);
      if (!fileInfo.exists) {
        console.log('Screenshot file does not exist:', screenshotPath);
        return false;
      }

      const asset = await MediaLibrary.createAssetAsync(screenshotPath);
      console.log('Screenshot saved to gallery:', asset.uri);
      
      return true;
    } catch (error) {
      console.error('Error saving to gallery:', error);
      return false;
    }
  }

  async shareScreenshot(screenshotPath: string): Promise<boolean> {
    try {
      console.log('Sharing screenshot:', screenshotPath);
      
      // Check if the file exists
      const fileInfo = await FileSystem.getInfoAsync(screenshotPath);
      if (!fileInfo.exists) {
        console.log('Screenshot file does not exist:', screenshotPath);
        return false;
      }
      
      // In a real implementation, this would use expo-sharing
      // For now, we'll just log the action
      console.log('Screenshot ready for sharing:', screenshotPath);
      console.log('File size:', fileInfo.size, 'bytes');
      
      return true;
    } catch (error) {
      console.error('Error sharing screenshot:', error);
      return false;
    }
  }



  getScreenshotStats(screenshotPath: string): {
    fileSize: number;
    dimensions: { width: number; height: number };
    format: string;
  } {
    // In a real implementation, you'd get actual file info
    return {
      fileSize: 1024 * 1024, // 1MB placeholder
      dimensions: { width: 1080, height: 1920 },
      format: 'PNG'
    };
  }
} 