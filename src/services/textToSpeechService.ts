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
        gender: (voice as any).gender as 'Male' | 'Female',
      }));
    } catch (error) {
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
        },
        onDone: () => {
          this.isPlaying = false;
          this.currentUtterance = '';
        },
        onStopped: () => {
          this.isPlaying = false;
          this.currentUtterance = '';
        },
        onError: (error) => {
          this.isPlaying = false;
          this.currentUtterance = '';
        },
      });
    } catch (error) {
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
    
    // Start with user's saved settings
    let voiceSettings = { ...settings };
    
    // Apply personality adjustments on top of user settings (small multipliers)
    switch (personality) {
      case 'brutal':
        voiceSettings.rate = Math.min(2.0, voiceSettings.rate * 1.1); // 10% faster
        voiceSettings.pitch = Math.min(2.0, voiceSettings.pitch * 1.05); // 5% higher
        break;
      case 'playful':
        voiceSettings.rate = Math.min(2.0, voiceSettings.rate * 1.15); // 15% faster
        voiceSettings.pitch = Math.min(2.0, voiceSettings.pitch * 1.1); // 10% higher
        break;
      case 'streetsmart':
        voiceSettings.rate = Math.max(0.1, voiceSettings.rate * 0.95); // 5% slower
        voiceSettings.pitch = Math.max(0.5, voiceSettings.pitch * 0.95); // 5% lower
        break;
      case 'savage':
        voiceSettings.rate = Math.min(2.0, voiceSettings.rate * 1.08); // 8% faster
        voiceSettings.pitch = Math.min(2.0, voiceSettings.pitch * 1.03); // 3% higher
        break;
      default:
        // Use user settings as-is
        break;
    }

    await this.speak(roastText, voiceSettings);
  }
}

export default new TextToSpeechService(); 