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

  /**
   * Create a simple colored image as base64 data
   * This is a minimal 100x100 pixel image for sharing
   */
  private createSimpleImageData(style: 'savage' | 'witty' | 'playful'): string {
    // Simple base64 encoded 1x1 pixel PNG in different colors
    // In a real implementation, you'd use a proper image generation library
    switch (style) {
      case 'savage':
        // Dark red pixel
        return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      case 'witty':
        // Blue pixel
        return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/DwAChwGA60e6kgAAAABJRU5ErkJggg==';
      case 'playful':
        // Purple pixel
        return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAIAdgIg8f0AAAAASUVORK5CYII=';
      default:
        // Black pixel
        return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    }
  }

  /**
   * Generate a simple image for Twitter sharing with roast text
   * This creates a basic image programmatically without requiring a view reference
   */
  async generateRoastImage(roastText: string, style: 'savage' | 'witty' | 'playful' = 'savage'): Promise<string> {
    try {
      // Create a temporary file path for the generated image
      const timestamp = Date.now();
      const filename = `roast_${timestamp}.png`;
      const filePath = `${FileSystem.cacheDirectory}${filename}`;

      // For now, we'll create a simple approach by using a data URL
      // In a production app, you'd want to use a proper image generation library
      // or create an off-screen React component and capture it

      // Create a simple base64 encoded image (this is a placeholder)
      // In reality, you'd want to:
      // 1. Create a React component with the roast text styled nicely
      // 2. Render it off-screen
      // 3. Capture it using ViewShot
      // 4. Return the file path

      // For React Native, we'll create a simple colored image using a base64 approach
      // This creates a minimal PNG image that can be shared
      // NOTE: In production, this would be replaced with a proper image generation library
      // that can create styled images with text, similar to the existing captureChatScreenshot method
      const imageData = this.createSimpleImageData(style);
      const dataUrl = `data:image/png;base64,${imageData}`;

      return dataUrl;

    } catch (error) {
      console.error('Failed to generate roast image:', error);
      throw new Error('Failed to generate roast image');
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