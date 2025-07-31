import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { Audio } from 'expo-av';

export interface SpeechToTextSettings {
  language: string;
  autoSend: boolean;
  continuous: boolean;
  timeout: number;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
}

class SpeechToTextService {
  private static instance: SpeechToTextService;
  private isRecording: boolean = false;
  private recordingTimeout: NodeJS.Timeout | null = null;
  private lastResult: TranscriptionResult | null = null;
  private settings: SpeechToTextSettings = {
    language: 'en-US',
    autoSend: true,
    continuous: false,
    timeout: 5000, // 5 seconds
  };

  private constructor() {
    this.initializeVoice();
  }

  public static getInstance(): SpeechToTextService {
    if (!SpeechToTextService.instance) {
      SpeechToTextService.instance = new SpeechToTextService();
    }
    return SpeechToTextService.instance;
  }

  private initializeVoice(): void {
    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
    Voice.onSpeechPartialResults = this.onSpeechPartialResults.bind(this);
  }

  public async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      return false;
    }
  }

  public async startRecording(
    onTranscriptionUpdate?: (result: TranscriptionResult) => void,
    onError?: (error: string) => void
  ): Promise<boolean> {
    try {
      if (this.isRecording) {
        return false;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        onError?.('Microphone permission denied');
        return false;
      }

      this.isRecording = true;
      
      // Start voice recognition
      await Voice.start(this.settings.language);
      
      // Set timeout for auto-stop
      if (this.settings.timeout > 0) {
        this.recordingTimeout = setTimeout(() => {
          this.stopRecording();
        }, this.settings.timeout);
      }

      console.log('🎤 Started speech recognition');
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      this.isRecording = false;
      onError?.(error instanceof Error ? error.message : 'Failed to start recording');
      return false;
    }
  }

  public async stopRecording(): Promise<string | null> {
    try {
      if (!this.isRecording) {
        return null;
      }

      this.isRecording = false;
      
      // Clear timeout
      if (this.recordingTimeout) {
        clearTimeout(this.recordingTimeout);
        this.recordingTimeout = null;
      }

      // Stop voice recognition
      await Voice.stop();
      
      console.log('🎤 Stopped speech recognition');
      return null; // Results will come through onSpeechResults
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      this.isRecording = false;
      return null;
    }
  }

  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  public updateSettings(newSettings: Partial<SpeechToTextSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  public getSettings(): SpeechToTextSettings {
    return { ...this.settings };
  }

  public getLastResult(): TranscriptionResult | null {
    return this.lastResult;
  }

  private onSpeechStart(): void {
    console.log('🎤 Speech recognition started');
  }

  private onSpeechEnd(): void {
    console.log('🎤 Speech recognition ended');
    this.isRecording = false;
  }

  private onSpeechResults(event: SpeechResultsEvent): void {
    if (event.value && event.value.length > 0) {
      const text = event.value[0];
      const confidence = event.confidence?.[0] || 0.8;
      
      console.log('🎤 Speech results:', text, 'confidence:', confidence);
      
      // Store the result for retrieval
      this.lastResult = {
        text,
        confidence,
        isFinal: true,
      };
    }
  }

  private onSpeechPartialResults(event: SpeechResultsEvent): void {
    if (event.value && event.value.length > 0) {
      const text = event.value[0];
      console.log('🎤 Partial results:', text);
      
      // Store partial result for real-time updates
      this.lastResult = {
        text,
        confidence: 0.5,
        isFinal: false,
      };
    }
  }

  private onSpeechError(event: SpeechErrorEvent): void {
    console.error('🎤 Speech recognition error:', event.error);
    this.isRecording = false;
  }

  public destroy(): void {
    Voice.destroy().then(Voice.removeAllListeners);
  }
}

export default SpeechToTextService; 