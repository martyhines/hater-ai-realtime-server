import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { StorageService } from './storageService';

export interface VoiceSettings {
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
  autoPlay: boolean;
}

export interface VoiceOption {
  identifier: string;
  name: string;
  language: string;
  quality: 'Enhanced' | 'Default';
  gender?: 'Male' | 'Female';
}

export class TextToSpeechService {
  private storage: StorageService;
  private isPlaying: boolean = false;
  private currentUtterance: string = '';

  constructor() {
    this.storage = StorageService.getInstance();
  }

  /**
   * Get available voices for the platform
   */
  async getAvailableVoices(): Promise<VoiceOption[]> {
    if (Platform.OS !== 'ios') {
      // For Android, return default voices
      return [
        { identifier: 'en-US', name: 'US English', language: 'en-US', quality: 'Default' },
        { identifier: 'en-GB', name: 'British English', language: 'en-GB', quality: 'Default' },
      ];
    }

    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices.map(voice => ({
        identifier: voice.identifier,
        name: voice.name,
        language: voice.language,
        quality: voice.quality as 'Enhanced' | 'Default',
        gender: voice.gender as 'Male' | 'Female',
      }));
    } catch (error) {
      console.log('Error getting available voices:', error);
      return this.getDefaultVoices();
    }
  }

  /**
   * Get default voices as fallback
   */
  private getDefaultVoices(): VoiceOption[] {
    return [
      { identifier: 'com.apple.ttsbundle.Samantha-compact', name: 'Samantha', language: 'en-US', quality: 'Enhanced', gender: 'Female' },
      { identifier: 'com.apple.ttsbundle.Alex-compact', name: 'Alex', language: 'en-US', quality: 'Enhanced', gender: 'Male' },
      { identifier: 'com.apple.ttsbundle.Daniel-compact', name: 'Daniel', language: 'en-GB', quality: 'Enhanced', gender: 'Male' },
      { identifier: 'com.apple.ttsbundle.Victoria-compact', name: 'Victoria', language: 'en-GB', quality: 'Enhanced', gender: 'Female' },
    ];
  }

  /**
   * Get current voice settings
   */
  async getVoiceSettings(): Promise<VoiceSettings> {
    try {
      const settings = await this.storage.getSettings();
      return settings?.voiceSettings || this.getDefaultVoiceSettings();
    } catch (error) {
      console.log('Error getting voice settings:', error);
      return this.getDefaultVoiceSettings();
    }
  }

  /**
   * Save voice settings
   */
  async saveVoiceSettings(settings: VoiceSettings): Promise<void> {
    try {
      const currentSettings = await this.storage.getSettings();
      await this.storage.saveSettings({
        ...currentSettings,
        voiceSettings: settings,
      });
    } catch (error) {
      console.log('Error saving voice settings:', error);
    }
  }

  /**
   * Get default voice settings
   */
  private getDefaultVoiceSettings(): VoiceSettings {
    return {
      voice: 'com.apple.ttsbundle.Samantha-compact',
      rate: 0.5,
      pitch: 1.0,
      volume: 1.0,
      autoPlay: false,
    };
  }

  /**
   * Speak text with current settings
   */
  async speak(text: string, options?: Partial<VoiceSettings>): Promise<void> {
    if (this.isPlaying) {
      await this.stop();
    }

    try {
      const settings = await this.getVoiceSettings();
      const finalSettings = { ...settings, ...options };

      this.currentUtterance = text;
      this.isPlaying = true;

      await Speech.speak(text, {
        voice: finalSettings.voice,
        rate: finalSettings.rate,
        pitch: finalSettings.pitch,
        volume: finalSettings.volume,
        language: 'en-US',
        onStart: () => {
          console.log('🎤 TTS Started speaking');
        },
        onDone: () => {
          console.log('🎤 TTS Finished speaking');
          this.isPlaying = false;
          this.currentUtterance = '';
        },
        onStopped: () => {
          console.log('🎤 TTS Stopped speaking');
          this.isPlaying = false;
          this.currentUtterance = '';
        },
        onError: (error) => {
          console.log('🎤 TTS Error:', error);
          this.isPlaying = false;
          this.currentUtterance = '';
        },
      });
    } catch (error) {
      console.log('Error speaking text:', error);
      this.isPlaying = false;
      this.currentUtterance = '';
    }
  }

  /**
   * Stop current speech
   */
  async stop(): Promise<void> {
    if (this.isPlaying) {
      await Speech.stop();
      this.isPlaying = false;
      this.currentUtterance = '';
    }
  }

  /**
   * Check if currently speaking
   */
  isCurrentlySpeaking(): boolean {
    return this.isPlaying;
  }

  /**
   * Get current utterance
   */
  getCurrentUtterance(): string {
    return this.currentUtterance;
  }

  /**
   * Test a voice with sample text
   */
  async testVoice(voiceIdentifier: string, sampleText: string = "Hello, I'm your AI enemy. Ready to roast you!"): Promise<void> {
    await this.speak(sampleText, { voice: voiceIdentifier });
  }

  /**
   * Speak AI roast with personality-appropriate voice
   */
  async speakRoast(roastText: string, personality: string = 'brutal'): Promise<void> {
    const settings = await this.getVoiceSettings();
    
    // Adjust voice settings based on personality
    let voiceSettings = { ...settings };
    
    switch (personality) {
      case 'brutal':
        voiceSettings.rate = 0.6; // Slightly faster for intensity
        voiceSettings.pitch = 1.1; // Slightly higher pitch
        break;
      case 'playful':
        voiceSettings.rate = 0.7; // Faster for energy
        voiceSettings.pitch = 1.2; // Higher pitch for playfulness
        break;
      case 'streetsmart':
        voiceSettings.rate = 0.5; // Slower, more deliberate
        voiceSettings.pitch = 0.9; // Lower pitch for attitude
        break;
      case 'savage':
        voiceSettings.rate = 0.55; // Medium-fast for impact
        voiceSettings.pitch = 1.05; // Slightly elevated
        break;
      default:
        // Use default settings
        break;
    }

    await this.speak(roastText, voiceSettings);
  }
}

export default new TextToSpeechService(); 