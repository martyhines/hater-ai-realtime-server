import * as FileSystem from 'expo-file-system';

export interface CompressionSettings {
  quality: 'low' | 'medium' | 'high';
  resolution: '720p' | '1080p' | '4K';
  bitrate: number;
  fps: number;
  format: 'mp4' | 'mov' | 'avi';
}

export class VideoCompressionService {
  private static instance: VideoCompressionService;

  static getInstance(): VideoCompressionService {
    if (!VideoCompressionService.instance) {
      VideoCompressionService.instance = new VideoCompressionService();
    }
    return VideoCompressionService.instance;
  }

  async compressVideo(
    inputPath: string, 
    settings: CompressionSettings = this.getDefaultSettings()
  ): Promise<string> {
    try {
      
      // Generate output path
      const fileName = `compressed_${Date.now()}.${settings.format}`;
      const outputPath = `${FileSystem.documentDirectory}${fileName}`;
      
      // For now, we'll create a compressed video metadata
      // In a real implementation, this would use FFmpeg to compress
      await this.createCompressedVideo(inputPath, outputPath, settings);
      
      return outputPath;
      
    } catch (error) {
      console.error('Error compressing video:', error);
      throw new Error('Failed to compress video');
    }
  }

  private getDefaultSettings(): CompressionSettings {
    return {
      quality: 'medium',
      resolution: '1080p',
      bitrate: 2000000, // 2 Mbps
      fps: 30,
      format: 'mp4'
    };
  }

  private async createCompressedVideo(
    inputPath: string, 
    outputPath: string, 
    settings: CompressionSettings
  ): Promise<void> {
    try {
      const compressionData = {
        inputPath,
        outputPath,
        settings,
        compressedAt: new Date().toISOString(),
        compressionInfo: {
          originalSize: await this.getFileSize(inputPath),
          estimatedCompressedSize: this.estimateCompressedSize(settings),
          compressionRatio: this.calculateCompressionRatio(settings),
          qualityScore: this.getQualityScore(settings)
        },
        ffmpegCommand: this.generateFFmpegCommand(inputPath, outputPath, settings),
        instructions: [
          '1. Use FFmpeg to compress video with specified settings',
          '2. Maintain aspect ratio and quality',
          '3. Optimize for social media platforms',
          '4. Ensure compatibility with mobile devices'
        ]
      };
      
      await FileSystem.writeAsStringAsync(outputPath, JSON.stringify(compressionData, null, 2));
      
    } catch (error) {
      console.error('Error creating compressed video:', error);
      throw error;
    }
  }

  private async getFileSize(filePath: string): Promise<number> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return fileInfo.size || 0;
    } catch (error) {
      console.error('Error getting file size:', error);
      return 0;
    }
  }

  private estimateCompressedSize(settings: CompressionSettings): number {
    const baseSize = 50 * 1024 * 1024; // 50MB base size
    const qualityMultiplier = this.getQualityMultiplier(settings.quality);
    const resolutionMultiplier = this.getResolutionMultiplier(settings.resolution);
    
    return Math.round(baseSize * qualityMultiplier * resolutionMultiplier);
  }

  private getQualityMultiplier(quality: string): number {
    switch (quality) {
      case 'low': return 0.3;
      case 'medium': return 0.6;
      case 'high': return 1.0;
      default: return 0.6;
    }
  }

  private getResolutionMultiplier(resolution: string): number {
    switch (resolution) {
      case '720p': return 0.5;
      case '1080p': return 1.0;
      case '4K': return 2.0;
      default: return 1.0;
    }
  }

  private calculateCompressionRatio(settings: CompressionSettings): number {
    const qualityMultiplier = this.getQualityMultiplier(settings.quality);
    return Math.round((1 - qualityMultiplier) * 100);
  }

  private getQualityScore(settings: CompressionSettings): number {
    const qualityScore = this.getQualityMultiplier(settings.quality) * 100;
    const resolutionScore = this.getResolutionMultiplier(settings.resolution) * 50;
    return Math.round((qualityScore + resolutionScore) / 2);
  }

  private generateFFmpegCommand(
    inputPath: string, 
    outputPath: string, 
    settings: CompressionSettings
  ): string {
    const resolution = this.getResolutionDimensions(settings.resolution);
    const bitrate = settings.bitrate;
    const fps = settings.fps;
    
    return `ffmpeg -i "${inputPath}" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -vf "scale=${resolution}" -r ${fps} -b:v ${bitrate} "${outputPath}"`;
  }

  private getResolutionDimensions(resolution: string): string {
    switch (resolution) {
      case '720p': return '1280:720';
      case '1080p': return '1920:1080';
      case '4K': return '3840:2160';
      default: return '1920:1080';
    }
  }

  async optimizeForSocialMedia(videoPath: string, platform: 'tiktok' | 'instagram' | 'youtube'): Promise<string> {
    try {
      
      const platformSettings = this.getPlatformSettings(platform);
      const optimizedPath = await this.compressVideo(videoPath, platformSettings);
      
      // Add platform-specific optimizations
      await this.addPlatformOptimizations(optimizedPath, platform);
      
      return optimizedPath;
      
    } catch (error) {
      console.error('Error optimizing for social media:', error);
      throw error;
    }
  }

  private getPlatformSettings(platform: string): CompressionSettings {
    switch (platform) {
      case 'tiktok':
        return {
          quality: 'high',
          resolution: '1080p',
          bitrate: 2500000, // 2.5 Mbps
          fps: 30,
          format: 'mp4'
        };
      case 'instagram':
        return {
          quality: 'medium',
          resolution: '1080p',
          bitrate: 2000000, // 2 Mbps
          fps: 30,
          format: 'mp4'
        };
      case 'youtube':
        return {
          quality: 'high',
          resolution: '1080p',
          bitrate: 8000000, // 8 Mbps
          fps: 30,
          format: 'mp4'
        };
      default:
        return this.getDefaultSettings();
    }
  }

  private async addPlatformOptimizations(videoPath: string, platform: string): Promise<void> {
    try {
      const optimizationData = {
        platform,
        optimizedAt: new Date().toISOString(),
        optimizations: this.getPlatformOptimizations(platform)
      };
      
      const optimizationPath = videoPath.replace('.mp4', '_optimizations.json');
      await FileSystem.writeAsStringAsync(optimizationPath, JSON.stringify(optimizationData, null, 2));
      
    } catch (error) {
      console.error('Error adding platform optimizations:', error);
    }
  }

  private getPlatformOptimizations(platform: string): string[] {
    switch (platform) {
      case 'tiktok':
        return [
          'Vertical aspect ratio (9:16)',
          'High quality for mobile viewing',
          'Optimized for short-form content',
          'Fast loading times'
        ];
      case 'instagram':
        return [
          'Square or vertical aspect ratio',
          'Medium quality for feed posts',
          'Optimized for mobile scrolling',
          'Efficient compression'
        ];
      case 'youtube':
        return [
          'High quality for desktop viewing',
          'Optimized for longer content',
          'Multiple resolution options',
          'Professional quality'
        ];
      default:
        return ['Standard optimizations'];
    }
  }

  async addWatermark(videoPath: string, watermarkText: string = 'Hater AI'): Promise<string> {
    try {
      
      const watermarkedPath = videoPath.replace('.mp4', '_watermarked.mp4');
      
      const watermarkData = {
        originalPath: videoPath,
        watermarkedPath,
        watermarkText,
        addedAt: new Date().toISOString(),
        ffmpegCommand: `ffmpeg -i "${videoPath}" -vf "drawtext=text='${watermarkText}':fontcolor=white:fontsize=24:x=10:y=10" "${watermarkedPath}"`,
        instructions: [
          '1. Use FFmpeg drawtext filter to add watermark',
          '2. Position watermark in bottom-right corner',
          '3. Use semi-transparent white text',
          '4. Ensure watermark is visible but not intrusive'
        ]
      };
      
      await FileSystem.writeAsStringAsync(watermarkedPath, JSON.stringify(watermarkData, null, 2));
      
      return watermarkedPath;
      
    } catch (error) {
      console.error('Error adding watermark:', error);
      return videoPath;
    }
  }

  async getVideoInfo(videoPath: string): Promise<any> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(videoPath);
      return {
        exists: fileInfo.exists,
        size: fileInfo.size,
        uri: fileInfo.uri,
        path: videoPath,
        compressionInfo: {
          isCompressed: videoPath.includes('compressed'),
          estimatedQuality: this.estimateVideoQuality(fileInfo.size || 0)
        }
      };
    } catch (error) {
      console.error('Error getting video info:', error);
      return null;
    }
  }

  private estimateVideoQuality(fileSize: number): string {
    const sizeMB = fileSize / (1024 * 1024);
    
    if (sizeMB < 5) return 'Low';
    if (sizeMB < 20) return 'Medium';
    if (sizeMB < 50) return 'High';
    return 'Very High';
  }
} 