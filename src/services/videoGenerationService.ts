import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { VideoSegment, TikTokVideoConfig } from './tikTokVideoService';

export interface VideoFrame {
  timestamp: number;
  text: string;
  style: {
    fontSize: number;
    color: string;
    backgroundColor: string;
    position: 'top' | 'center' | 'bottom';
  };
  animation: string;
}

export class VideoGenerationService {
  private static instance: VideoGenerationService;
  private videoCache: Map<string, string> = new Map();

  static getInstance(): VideoGenerationService {
    if (!VideoGenerationService.instance) {
      VideoGenerationService.instance = new VideoGenerationService();
    }
    return VideoGenerationService.instance;
  }

  async generateVideo(config: TikTokVideoConfig): Promise<string> {
    try {
      
      // Create video frames from segments
      const frames = this.createVideoFrames(config);
      
      // Generate video file path
      const fileName = `roast_video_${Date.now()}.mp4`;
      const videoPath = `${FileSystem.documentDirectory}${fileName}`;
      
      // Generate actual video file
      await this.renderVideoFrames(frames, videoPath, config);
      
      // Cache the video
      this.videoCache.set(config.roastText, videoPath);
      
      return videoPath;
      
    } catch (error) {
      console.error('Error generating real video:', error);
      throw new Error('Failed to generate video');
    }
  }

  createVideoFrames(config: TikTokVideoConfig): VideoFrame[] {
    const frames: VideoFrame[] = [];
    let currentTime = 0;
    const fps = 30; // 30 frames per second
    
    // Hook segment (0-2 seconds)
    for (let i = 0; i < 2 * fps; i++) {
      frames.push({
        timestamp: currentTime + (i / fps),
        text: 'AI is about to roast me...',
        style: {
          fontSize: 24,
          color: '#FFFFFF',
          backgroundColor: 'rgba(0,0,0,0.7)',
          position: 'center'
        },
        animation: 'fade'
      });
    }
    currentTime += 2;
    
    // Build-up segment (2-4 seconds)
    for (let i = 0; i < 2 * fps; i++) {
      frames.push({
        timestamp: currentTime + (i / fps),
        text: config.userName ? `Let's see what AI thinks about ${config.userName}...` : 'Let\'s see what AI thinks...',
        style: {
          fontSize: 20,
          color: '#FFFFFF',
          backgroundColor: 'rgba(0,0,0,0.7)',
          position: 'center'
        },
        animation: 'slide'
      });
    }
    currentTime += 2;
    
    // Main roast segment (4-8 seconds) with typewriter effect
    const roastWords = config.roastText.split(' ');
    const wordsPerSecond = roastWords.length / 4; // 4 seconds for the roast
    
    for (let i = 0; i < 4 * fps; i++) {
      const currentSecond = i / fps;
      const wordsToShow = Math.floor(currentSecond * wordsPerSecond);
      const displayText = roastWords.slice(0, wordsToShow).join(' ');
      
      frames.push({
        timestamp: currentTime + (i / fps),
        text: displayText,
        style: {
          fontSize: 22,
          color: this.getThemeColor(config.theme),
          backgroundColor: 'rgba(0,0,0,0.8)',
          position: 'center'
        },
        animation: 'typewriter'
      });
    }
    currentTime += 4;
    
    // Reaction segment (if enabled)
    if (config.includeReaction) {
      for (let i = 0; i < 2 * fps; i++) {
        frames.push({
          timestamp: currentTime + (i / fps),
          text: '😱 AI just violated me!',
          style: {
            fontSize: 28,
            color: '#FF6B6B',
            backgroundColor: 'rgba(255,107,107,0.2)',
            position: 'bottom'
          },
          animation: 'bounce'
        });
      }
      currentTime += 2;
    }
    
    // Call-to-action segment
    for (let i = 0; i < 2 * fps; i++) {
      frames.push({
        timestamp: currentTime + (i / fps),
        text: 'Try it yourself! 👇',
        style: {
          fontSize: 20,
          color: '#4ECDC4',
          backgroundColor: 'rgba(78,205,196,0.2)',
          position: 'bottom'
        },
        animation: 'fade'
      });
    }
    
    return frames;
  }

  private getThemeColor(theme?: string): string {
    switch (theme) {
      case 'savage':
        return '#FF6B6B';
      case 'witty':
        return '#4ECDC4';
      case 'playful':
        return '#FFE66D';
      case 'brutal':
        return '#FF4757';
      default:
        return '#FFFFFF';
    }
  }

  private async renderVideoFrames(frames: VideoFrame[], outputPath: string, config: TikTokVideoConfig): Promise<void> {
    try {
      
      // For now, we'll create a video file using a different approach
      // Since direct video rendering is complex, we'll use a canvas-based approach
      
      // Create a video metadata file that describes the video
      const videoMetadata = {
        frames: frames.length,
        duration: frames[frames.length - 1]?.timestamp || 10,
        fps: 30,
        resolution: '1080x1920',
        format: 'mp4',
        config: config,
        frameData: frames.map(frame => ({
          timestamp: frame.timestamp,
          text: frame.text,
          style: frame.style,
          animation: frame.animation
        }))
      };
      
      // Save the metadata as a JSON file for now
      // In a real implementation, this would be converted to actual video frames
      const metadataPath = outputPath.replace('.mp4', '_metadata.json');
      await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify(videoMetadata, null, 2));
      
      // Create a placeholder video file
      // This is where you'd integrate with a real video processing library
      await this.createPlaceholderVideo(outputPath, videoMetadata);
      
      
    } catch (error) {
      console.error('Error rendering video frames:', error);
      throw error;
    }
  }

  private async createPlaceholderVideo(outputPath: string, metadata: any): Promise<void> {
    try {
      // For now, we'll create a simple text file that represents our video
      // In a real implementation, this would be actual video data
      
      const videoContent = `# TikTok Roast Video
Generated: ${new Date().toISOString()}
Duration: ${metadata.duration}s
Frames: ${metadata.frames}
FPS: ${metadata.fps}
Resolution: ${metadata.resolution}

## Video Content:
${metadata.frameData.map((frame: any, index: number) => 
  `${index + 1}. [${frame.timestamp.toFixed(2)}s] ${frame.text}`
).join('\n')}

## Instructions for Real Video Generation:
1. Use a video processing library like FFmpeg
2. Render each frame as an image with text overlay
3. Combine frames into MP4 video
4. Add background music and effects

This is a placeholder file. Replace with actual video processing.
`;
      
      await FileSystem.writeAsStringAsync(outputPath, videoContent);
      
    } catch (error) {
      console.error('Error creating placeholder video:', error);
      throw error;
    }
  }

  async generateVideoWithFFmpeg(config: TikTokVideoConfig): Promise<string> {
    // This would be the real implementation using FFmpeg or similar
    // For now, we'll use our placeholder approach
    return this.generateVideo(config);
  }

  async addBackgroundMusic(videoPath: string, musicPath?: string): Promise<string> {
    try {
      
      // In a real implementation, this would use FFmpeg to add audio
      // For now, we'll just return the original path
      
      if (musicPath) {
      }
      
      return videoPath;
    } catch (error) {
      console.error('Error adding background music:', error);
      return videoPath;
    }
  }

  async compressVideo(videoPath: string, quality: 'low' | 'medium' | 'high' = 'medium'): Promise<string> {
    try {
      
      // In a real implementation, this would use FFmpeg to compress
      // For now, we'll just return the original path
      
      return videoPath;
    } catch (error) {
      console.error('Error compressing video:', error);
      return videoPath;
    }
  }

  async addWatermark(videoPath: string, watermarkText: string = 'Hater AI'): Promise<string> {
    try {
      
      // In a real implementation, this would add a watermark overlay
      // For now, we'll just return the original path
      
      return videoPath;
    } catch (error) {
      console.error('Error adding watermark:', error);
      return videoPath;
    }
  }

  getCachedVideo(roastText: string): string | undefined {
    return this.videoCache.get(roastText);
  }

  clearCache(): void {
    this.videoCache.clear();
  }

  async getVideoInfo(videoPath: string): Promise<any> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(videoPath);
      return {
        exists: fileInfo.exists,
        size: fileInfo.size,
        uri: fileInfo.uri,
        path: videoPath
      };
    } catch (error) {
      console.error('Error getting video info:', error);
      return null;
    }
  }
} 