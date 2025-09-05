import * as FileSystem from 'expo-file-system';

export interface AudioTrack {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  genre: 'dramatic' | 'funny' | 'savage' | 'upbeat' | 'mysterious';
  filePath?: string;
}

export class AudioService {
  private static instance: AudioService;
  private audioCache: Map<string, string> = new Map();

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  getAvailableTracks(): AudioTrack[] {
    return [
      {
        id: 'dramatic_1',
        name: 'Dramatic Tension',
        description: 'Builds suspense for the roast reveal',
        duration: 10,
        genre: 'dramatic'
      },
      {
        id: 'funny_1',
        name: 'Comedy Beat',
        description: 'Light and playful background',
        duration: 10,
        genre: 'funny'
      },
      {
        id: 'savage_1',
        name: 'Savage Mode',
        description: 'Intense and aggressive beat',
        duration: 10,
        genre: 'savage'
      },
      {
        id: 'upbeat_1',
        name: 'Upbeat Energy',
        description: 'High energy and exciting',
        duration: 10,
        genre: 'upbeat'
      },
      {
        id: 'mysterious_1',
        name: 'Mysterious Vibes',
        description: 'Dark and mysterious atmosphere',
        duration: 10,
        genre: 'mysterious'
      }
    ];
  }

  getTracksByGenre(genre: string): AudioTrack[] {
    return this.getAvailableTracks().filter(track => track.genre === genre);
  }

  getTracksByDuration(duration: number): AudioTrack[] {
    return this.getAvailableTracks().filter(track => track.duration >= duration);
  }

  async generateAudioTrack(trackId: string): Promise<string> {
    try {
      
      // Create audio file path
      const fileName = `audio_${trackId}_${Date.now()}.mp3`;
      const audioPath = `${FileSystem.documentDirectory}${fileName}`;
      
      // For now, we'll create a placeholder audio file
      // In a real implementation, this would generate actual audio
      await this.createPlaceholderAudio(audioPath, trackId);
      
      // Cache the audio
      this.audioCache.set(trackId, audioPath);
      
      return audioPath;
      
    } catch (error) {
      throw new Error('Failed to generate audio track');
    }
  }

  private async createPlaceholderAudio(audioPath: string, trackId: string): Promise<void> {
    try {
      const track = this.getAvailableTracks().find(t => t.id === trackId);
      
      const audioData = {
        trackId,
        trackName: track?.name || 'Unknown Track',
        duration: track?.duration || 10,
        genre: track?.genre || 'unknown',
        format: 'mp3',
        sampleRate: 44100,
        bitrate: 128,
        channels: 2,
        generatedAt: new Date().toISOString(),
        instructions: [
          '1. Use a music generation library (Tone.js, Web Audio API, etc.)',
          '2. Create audio based on the genre and duration',
          '3. Export as MP3 file',
          '4. Ensure it loops seamlessly for video background'
        ]
      };
      
      // Save audio metadata as placeholder
      await FileSystem.writeAsStringAsync(audioPath, JSON.stringify(audioData, null, 2));
      
    } catch (error) {
      throw error;
    }
  }

  async addAudioToVideo(videoPath: string, audioPath: string, outputPath: string): Promise<string> {
    try {
      
      // In a real implementation, this would use FFmpeg to combine video and audio
      // For now, we'll create a combined file metadata
      
      const combinedData = {
        videoPath,
        audioPath,
        outputPath,
        combinedAt: new Date().toISOString(),
        instructions: [
          '1. Use FFmpeg command: ffmpeg -i video.mp4 -i audio.mp3 -c:v copy -c:a aac -shortest output.mp4',
          '2. Ensure audio syncs with video timing',
          '3. Maintain video quality while adding audio',
          '4. Export final MP4 file'
        ]
      };
      
      await FileSystem.writeAsStringAsync(outputPath, JSON.stringify(combinedData, null, 2));
      
      return outputPath;
      
    } catch (error) {
      throw error;
    }
  }

  async createCustomAudio(
    genre: string, 
    duration: number, 
    intensity: 'low' | 'medium' | 'high'
  ): Promise<string> {
    try {
      
      const fileName = `custom_audio_${genre}_${intensity}_${Date.now()}.mp3`;
      const audioPath = `${FileSystem.documentDirectory}${fileName}`;
      
      const customAudioData = {
        genre,
        duration,
        intensity,
        generatedAt: new Date().toISOString(),
        parameters: {
          tempo: this.getTempoForGenre(genre, intensity),
          key: this.getKeyForGenre(genre),
          instruments: this.getInstrumentsForGenre(genre),
          effects: this.getEffectsForIntensity(intensity)
        }
      };
      
      await FileSystem.writeAsStringAsync(audioPath, JSON.stringify(customAudioData, null, 2));
      
      return audioPath;
      
    } catch (error) {
      throw error;
    }
  }

  private getTempoForGenre(genre: string, intensity: string): number {
    const baseTempos: { [key: string]: number } = {
      dramatic: 80,
      funny: 120,
      savage: 140,
      upbeat: 130,
      mysterious: 70
    };
    
    const intensityMultipliers: { [key: string]: number } = {
      low: 0.8,
      medium: 1.0,
      high: 1.2
    };
    
    return Math.round((baseTempos[genre] || 100) * (intensityMultipliers[intensity] || 1.0));
  }

  private getKeyForGenre(genre: string): string {
    const keys: { [key: string]: string } = {
      dramatic: 'C minor',
      funny: 'C major',
      savage: 'D minor',
      upbeat: 'G major',
      mysterious: 'A minor'
    };
    
    return keys[genre] || 'C major';
  }

  private getInstrumentsForGenre(genre: string): string[] {
    const instruments: { [key: string]: string[] } = {
      dramatic: ['strings', 'piano', 'drums'],
      funny: ['synth', 'bass', 'drums'],
      savage: ['electric guitar', 'bass', 'drums'],
      upbeat: ['synth', 'bass', 'drums', 'piano'],
      mysterious: ['strings', 'piano', 'ambient']
    };
    
    return instruments[genre] || ['piano', 'drums'];
  }

  private getEffectsForIntensity(intensity: string): string[] {
    const effects: { [key: string]: string[] } = {
      low: ['reverb', 'delay'],
      medium: ['reverb', 'delay', 'compression'],
      high: ['reverb', 'delay', 'compression', 'distortion']
    };
    
    return effects[intensity] || ['reverb'];
  }

  getCachedAudio(trackId: string): string | undefined {
    return this.audioCache.get(trackId);
  }

  clearCache(): void {
    this.audioCache.clear();
  }
} 