import { Platform, Share } from 'react-native';
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
      
      if (!viewRef.current) {
        throw new Error('View reference is not available');
      }

      // Capture at the view's natural size so the image bounds match the
      // content (textbox) plus any padding applied to that wrapper.
      const options = {
        format: 'png' as const,
        quality: 0.9,
        result: 'tmpfile' as const,
      };

      const screenshotPath = await ViewShot.captureRef(viewRef, options);

      // For now, just return the screenshot as-is
      // In production, you could add watermarks or branding here
      
      return screenshotPath;
    } catch (error) {
      throw new Error('Failed to capture screenshot');
    }
  }



  async saveToGallery(screenshotPath: string): Promise<boolean> {
    try {
      
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        return false;
      }

      // Check if the file exists and is readable
      const fileInfo = await FileSystem.getInfoAsync(screenshotPath);
      if (!fileInfo.exists) {
        return false;
      }

      const asset = await MediaLibrary.createAssetAsync(screenshotPath);
      
      return true;
    } catch (error) {
      return false;
    }
  }

  async shareScreenshot(screenshotPath: string, caption?: string): Promise<boolean> {
    try {
      
      // Check if the file exists
      const fileInfo = await FileSystem.getInfoAsync(screenshotPath);
      if (!fileInfo.exists) {
        return false;
      }

      // Use React Native Share to open the system share sheet with image + text
      await Share.share({
        url: screenshotPath,
        message: caption || '',
        title: 'Share your Hater AI roast',
      });


      return true;
    } catch (error) {
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