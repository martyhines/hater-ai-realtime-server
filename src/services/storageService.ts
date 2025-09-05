import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { UserSettings } from '../types';

// Storage service for managing API keys and settings
// Uses expo-secure-store for API keys (secure) and AsyncStorage for settings (non-sensitive)

export class StorageService {
  private static instance: StorageService;
  private migrationCompleted = false;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Migrate existing API keys from AsyncStorage to SecureStore
  private async migrateApiKeys(): Promise<void> {
    if (this.migrationCompleted) return;

    try {
      // Check if migration is needed by looking for keys in AsyncStorage
      const [openaiKey, cohereKey, geminiKey] = await Promise.all([
        AsyncStorage.getItem('openai_api_key'),
        AsyncStorage.getItem('cohere_api_key'),
        AsyncStorage.getItem('gemini_api_key')
      ]);

      // Migrate OpenAI key if it exists in AsyncStorage
      if (openaiKey) {
        await SecureStore.setItemAsync('openai_api_key', openaiKey);
        await AsyncStorage.removeItem('openai_api_key');

      }

      // Migrate Cohere key if it exists in AsyncStorage
      if (cohereKey) {
        await SecureStore.setItemAsync('cohere_api_key', cohereKey);
        await AsyncStorage.removeItem('cohere_api_key');

      }

      // Migrate Gemini key if it exists in AsyncStorage
      if (geminiKey) {
        await SecureStore.setItemAsync('gemini_api_key', geminiKey);
        await AsyncStorage.removeItem('gemini_api_key');

      }


      this.migrationCompleted = true;
    } catch (error) {
      // Don't throw error - migration failure shouldn't break the app
    }
  }

  // Save OpenAI API key (secure storage)
  async saveOpenAIKey(apiKey: string): Promise<void> {
    try {
      await this.migrateApiKeys(); // Ensure migration runs
      await SecureStore.setItemAsync('openai_api_key', apiKey);

    } catch (error) {
      throw error;
    }
  }


  // Save Cohere API key (secure storage)
  async saveCohereKey(apiKey: string): Promise<void> {
    try {
      await this.migrateApiKeys(); // Ensure migration runs
      await SecureStore.setItemAsync('cohere_api_key', apiKey);

    } catch (error) {
      throw error;
    }
  }

  // Get OpenAI API key (secure storage)
  async getOpenAIKey(): Promise<string | null> {
    try {
      await this.migrateApiKeys(); // Ensure migration runs
      const key = await SecureStore.getItemAsync('openai_api_key');

      return key;
    } catch (error) {
      return null;
    }
  }


  // Get Cohere API key (secure storage)
  async getCohereKey(): Promise<string | null> {
    try {
      await this.migrateApiKeys(); // Ensure migration runs
      const key = await SecureStore.getItemAsync('cohere_api_key');

      return key;
    } catch (error) {
      return null;
    }
  }

  // Delete OpenAI API key
  async deleteOpenAIKey(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('openai_api_key');

    } catch (error) {
      throw error;
    }
  }


  // Delete Cohere API key
  async deleteCohereKey(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('cohere_api_key');

    } catch (error) {
      throw error;
    }
  }

  // Save Gemini API key (secure storage)
  async saveGeminiKey(apiKey: string): Promise<void> {
    try {
      await this.migrateApiKeys(); // Ensure migration runs
      await SecureStore.setItemAsync('gemini_api_key', apiKey);

    } catch (error) {
      throw error;
    }
  }

  // Get Gemini API key (secure storage)
  async getGeminiKey(): Promise<string | null> {
    try {
      await this.migrateApiKeys(); // Ensure migration runs
      const key = await SecureStore.getItemAsync('gemini_api_key');

      return key;
    } catch (error) {
      return null;
    }
  }

  // Delete Gemini API key
  async deleteGeminiKey(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('gemini_api_key');

    } catch (error) {
      throw error;
    }
  }


  // Save voice settings
  async saveVoiceSettings(voiceSettings: any): Promise<void> {
    try {
      const settings = await this.getSettings() || {};
      settings.voiceSettings = voiceSettings;
      await AsyncStorage.setItem('userSettings', JSON.stringify(settings));

    } catch (error) {
      throw error;
    }
  }

  // Get voice settings
  async getVoiceSettings(): Promise<any | null> {
    try {
      const settings = await this.getSettings();
      return settings?.voiceSettings || null;
    } catch (error) {
      return null;
    }
  }

  // Save speech-to-text settings
  async saveSpeechToTextSettings(speechToTextSettings: any): Promise<void> {
    try {
      const settings = await this.getSettings() || {};
      settings.speechToTextSettings = speechToTextSettings;
      await AsyncStorage.setItem('userSettings', JSON.stringify(settings));

    } catch (error) {
      throw error;
    }
  }

  // Get speech-to-text settings
  async getSpeechToTextSettings(): Promise<any | null> {
    try {
      const settings = await this.getSettings();
      return settings?.speechToTextSettings || null;
    } catch (error) {
      return null;
    }
  }

  // Check if any API key exists (for backward compatibility)
  async hasApiKey(): Promise<boolean> {
    try {
      await this.migrateApiKeys(); // Ensure migration runs
      const openaiKey = await this.getOpenAIKey();
      const cohereKey = await this.getCohereKey();
      const geminiKey = await this.getGeminiKey();
      const hasKey = (openaiKey !== null && openaiKey.length > 0) ||
                     (cohereKey !== null && cohereKey.length > 0) ||
                     (geminiKey !== null && geminiKey.length > 0);

      return hasKey;
    } catch (error) {
      return false;
    }
  }

  // Get API key (for backward compatibility - returns first available)
  async getApiKey(): Promise<string | null> {
    try {
      await this.migrateApiKeys(); // Ensure migration runs
      const openaiKey = await this.getOpenAIKey();
      if (openaiKey) return openaiKey;

      const cohereKey = await this.getCohereKey();
      if (cohereKey) return cohereKey;

      const geminiKey = await this.getGeminiKey();
      return geminiKey;
    } catch (error) {
      return null;
    }
  }

  // Save user settings (AsyncStorage - non-sensitive data)
  async saveSettings(settings: any): Promise<void> {
    try {
      await AsyncStorage.setItem('user_settings', JSON.stringify(settings));
    } catch (error) {
      throw error;
    }
  }

  // Get user settings (AsyncStorage - non-sensitive data)
  async getSettings(): Promise<any | null> {
    try {
      const settings = await AsyncStorage.getItem('user_settings');
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      return null;
    }
  }

  // Clear all data (both secure and non-secure)
  async clearAll(): Promise<void> {
    try {
      // Clear secure storage (API keys)
      await SecureStore.deleteItemAsync('openai_api_key');
      await SecureStore.deleteItemAsync('cohere_api_key');
      await SecureStore.deleteItemAsync('gemini_api_key');
      
      // Clear AsyncStorage (settings)
      await AsyncStorage.clear();
    } catch (error) {
      throw error;
    }
  }

  // Clear only API keys (preserve settings)
  async clearApiKeys(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('openai_api_key');
      await SecureStore.deleteItemAsync('cohere_api_key');
      await SecureStore.deleteItemAsync('gemini_api_key');

    } catch (error) {
      throw error;
    }
  }


  // Premium Features (AsyncStorage - non-sensitive data)
  async getUnlockedFeatures(): Promise<string[]> {
    try {
      const features = await AsyncStorage.getItem('unlocked_features');
      return features ? JSON.parse(features) : [];
    } catch (error) {
      return [];
    }
  }

  async setUnlockedFeatures(features: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem('unlocked_features', JSON.stringify(features));

    } catch (error) {
      throw error;
    }
  }

  async getUnlockedPersonalities(): Promise<string[]> {
    try {
      const personalities = await AsyncStorage.getItem('unlocked_personalities');
      return personalities ? JSON.parse(personalities) : [];
    } catch (error) {
      return [];
    }
  }

  async setUnlockedPersonalities(personalities: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem('unlocked_personalities', JSON.stringify(personalities));
    } catch (error) {
      throw error;
    }
  }

  async getSubscriptionStatus(): Promise<any | null> {
    try {
      const status = await AsyncStorage.getItem('subscription_status');
      return status ? JSON.parse(status) : null;
    } catch (error) {
      return null;
    }
  }

  async setSubscriptionStatus(status: any): Promise<void> {
    try {
      await AsyncStorage.setItem('subscription_status', JSON.stringify(status));

    } catch (error) {
      throw error;
    }
  }
} 