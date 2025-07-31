import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

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
  private webSpeechRecognition: any = null;
  private isWebFallback: boolean = false;

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
    // Check if we're in Expo Go and need to use web fallback
    if (Platform.OS === 'web' || this.isExpoGo()) {
      this.initializeWebSpeechRecognition();
      return;
    }

    try {
      Voice.onSpeechStart = this.onSpeechStart.bind(this);
      Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
      Voice.onSpeechResults = this.onSpeechResults.bind(this);
      Voice.onSpeechError = this.onSpeechError.bind(this);
      Voice.onSpeechPartialResults = this.onSpeechPartialResults.bind(this);
    } catch (error) {
      console.log('Native voice module not available, using web fallback');
      this.initializeWebSpeechRecognition();
    }
  }

  private isExpoGo(): boolean {
    // Check if we're running in Expo Go
    return typeof global !== 'undefined' && (global as any).__EXPO_GO__;
  }

  private initializeWebSpeechRecognition(): void {
    this.isWebFallback = true;
    
    // Check if Web Speech API is available
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      this.webSpeechRecognition = new (window as any).webkitSpeechRecognition();
      this.webSpeechRecognition.continuous = false;
      this.webSpeechRecognition.interimResults = true;
      this.webSpeechRecognition.lang = this.settings.language;
      
      this.webSpeechRecognition.onstart = this.onSpeechStart.bind(this);
      this.webSpeechRecognition.onend = this.onSpeechEnd.bind(this);
      this.webSpeechRecognition.onresult = this.onWebSpeechResult.bind(this);
      this.webSpeechRecognition.onerror = this.onWebSpeechError.bind(this);
    } else {
      console.warn('Web Speech API not available, using mock implementation');
      this.webSpeechRecognition = null;
    }
  }

  public async requestPermissions(): Promise<boolean> {
    try {
      if (this.isWebFallback) {
        // Web doesn't need explicit permissions
        return true;
      }
      
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
      
      if (this.isWebFallback) {
        if (this.webSpeechRecognition) {
          this.webSpeechRecognition.start();
        } else {
          onError?.('Speech recognition not available');
          this.isRecording = false;
          return false;
        }
      } else {
        // Start voice recognition
        await Voice.start(this.settings.language);
      }
      
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

      if (this.isWebFallback) {
        if (this.webSpeechRecognition) {
          this.webSpeechRecognition.stop();
        }
      } else {
        // Stop voice recognition
        await Voice.stop();
      }
      
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
    
    // Update web speech recognition settings
    if (this.isWebFallback && this.webSpeechRecognition) {
      this.webSpeechRecognition.lang = this.settings.language;
      this.webSpeechRecognition.continuous = this.settings.continuous;
    }
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
      const confidence = (event as any).confidence?.[0] || 0.8;
      
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

  // Web Speech API handlers
  private onWebSpeechResult(event: any): void {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      console.log('🎤 Web speech results:', finalTranscript);
      this.lastResult = {
        text: finalTranscript,
        confidence: 0.8,
        isFinal: true,
      };
    } else if (interimTranscript) {
      console.log('🎤 Web partial results:', interimTranscript);
      this.lastResult = {
        text: interimTranscript,
        confidence: 0.5,
        isFinal: false,
      };
    }
  }

  private onWebSpeechError(event: any): void {
    console.error('🎤 Web speech recognition error:', event.error);
    this.isRecording = false;
  }

  public destroy(): void {
    if (this.isWebFallback) {
      if (this.webSpeechRecognition) {
        this.webSpeechRecognition.abort();
      }
    } else {
      Voice.destroy().then(Voice.removeAllListeners);
    }
  }
}

export default SpeechToTextService; 