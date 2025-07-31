import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { UserSettings, CustomModel } from '../types';

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
      const [openaiKey, huggingfaceKey, cohereKey, geminiKey, togetherAIKey] = await Promise.all([
        AsyncStorage.getItem('openai_api_key'),
        AsyncStorage.getItem('huggingface_api_key'),
        AsyncStorage.getItem('cohere_api_key'),
        AsyncStorage.getItem('gemini_api_key'),
        AsyncStorage.getItem('together_ai_api_key')
      ]);

      // Migrate OpenAI key if it exists in AsyncStorage
      if (openaiKey) {
        await SecureStore.setItemAsync('openai_api_key', openaiKey);
        await AsyncStorage.removeItem('openai_api_key');
        console.log('Migrated OpenAI API key to SecureStore');
      }

      // Migrate Hugging Face key if it exists in AsyncStorage
      if (huggingfaceKey) {
        await SecureStore.setItemAsync('huggingface_api_key', huggingfaceKey);
        await AsyncStorage.removeItem('huggingface_api_key');
        console.log('Migrated Hugging Face API key to SecureStore');
      }

      // Migrate Cohere key if it exists in AsyncStorage
      if (cohereKey) {
        await SecureStore.setItemAsync('cohere_api_key', cohereKey);
        await AsyncStorage.removeItem('cohere_api_key');
        console.log('Migrated Cohere API key to SecureStore');
      }

      // Migrate Gemini key if it exists in AsyncStorage
      if (geminiKey) {
        await SecureStore.setItemAsync('gemini_api_key', geminiKey);
        await AsyncStorage.removeItem('gemini_api_key');
        console.log('Migrated Gemini API key to SecureStore');
      }

      // Migrate Together AI key if it exists in AsyncStorage
      if (togetherAIKey) {
        await SecureStore.setItemAsync('together_ai_api_key', togetherAIKey);
        await AsyncStorage.removeItem('together_ai_api_key');
        console.log('Migrated Together AI API key to SecureStore');
      }

      this.migrationCompleted = true;
    } catch (error) {
      console.error('Error during API key migration:', error);
      // Don't throw error - migration failure shouldn't break the app
    }
  }

  // Save OpenAI API key (secure storage)
  async saveOpenAIKey(apiKey: string): Promise<void> {
    try {
      await this.migrateApiKeys(); // Ensure migration runs
      await SecureStore.setItemAsync('openai_api_key', apiKey);
      console.log('OpenAI API key saved to SecureStore');
    } catch (error) {
      console.error('Error saving OpenAI API key:', error);
      throw error;
    }
  }

  // Save Hugging Face API key (secure storage)
  async saveHuggingFaceKey(apiKey: string): Promise<void> {
    try {
      await this.migrateApiKeys(); // Ensure migration runs
      await SecureStore.setItemAsync('huggingface_api_key', apiKey);
      console.log('Hugging Face API key saved to SecureStore');
    } catch (error) {
      console.error('Error saving Hugging Face API key:', error);
      throw error;
    }
  }

  // Save Cohere API key (secure storage)
  async saveCohereKey(apiKey: string): Promise<void> {
    try {
      await this.migrateApiKeys(); // Ensure migration runs
      await SecureStore.setItemAsync('cohere_api_key', apiKey);
      console.log('Cohere API key saved to SecureStore');
    } catch (error) {
      console.error('Error saving Cohere API key:', error);
      throw error;
    }
  }

  // Get OpenAI API key (secure storage)
  async getOpenAIKey(): Promise<string | null> {
    try {
      await this.migrateApiKeys(); // Ensure migration runs
      const key = await SecureStore.getItemAsync('openai_api_key');
      console.log('OpenAI API key retrieved from SecureStore:', key ? 'Present' : 'Null');
      return key;
    } catch (error) {
      console.error('Error getting OpenAI API key:', error);
      return null;
    }
  }

  // Get Hugging Face API key (secure storage)
  async getHuggingFaceKey(): Promise<string | null> {
    try {
      await this.migrateApiKeys(); // Ensure migration runs
      const key = await SecureStore.getItemAsync('huggingface_api_key');
      console.log('Hugging Face API key retrieved from SecureStore:', key ? 'Present' : 'Null');
      return key;
    } catch (error) {
      console.error('Error getting Hugging Face API key:', error);
      return null;
    }
  }

  // Get Cohere API key (secure storage)
  async getCohereKey(): Promise<string | null> {
    try {
      await this.migrateApiKeys(); // Ensure migration runs
      const key = await SecureStore.getItemAsync('cohere_api_key');
      console.log('Cohere API key retrieved from SecureStore:', key ? 'Present' : 'Null');
      return key;
    } catch (error) {
      console.error('Error getting Cohere API key:', error);
      return null;
    }
  }

  // Delete OpenAI API key
  async deleteOpenAIKey(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('openai_api_key');
      console.log('OpenAI API key deleted from SecureStore');
    } catch (error) {
      console.error('Error deleting OpenAI API key:', error);
      throw error;
    }
  }

  // Delete Hugging Face API key
  async deleteHuggingFaceKey(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('huggingface_api_key');
      console.log('Hugging Face API key deleted from SecureStore');
    } catch (error) {
      console.error('Error deleting Hugging Face API key:', error);
      throw error;
    }
  }

  // Delete Cohere API key
  async deleteCohereKey(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('cohere_api_key');
      console.log('Cohere API key deleted from SecureStore');
    } catch (error) {
      console.error('Error deleting Cohere API key:', error);
      throw error;
    }
  }

  // Save Gemini API key (secure storage)
  async saveGeminiKey(apiKey: string): Promise<void> {
    try {
      await this.migrateApiKeys(); // Ensure migration runs
      await SecureStore.setItemAsync('gemini_api_key', apiKey);
      console.log('Gemini API key saved to SecureStore');
    } catch (error) {
      console.error('Error saving Gemini API key:', error);
      throw error;
    }
  }

  // Get Gemini API key (secure storage)
  async getGeminiKey(): Promise<string | null> {
    try {
      await this.migrateApiKeys(); // Ensure migration runs
      const key = await SecureStore.getItemAsync('gemini_api_key');
      console.log('Gemini API key retrieved from SecureStore:', key ? 'Present' : 'Null');
      return key;
    } catch (error) {
      console.error('Error getting Gemini API key:', error);
      return null;
    }
  }

  // Delete Gemini API key
  async deleteGeminiKey(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('gemini_api_key');
      console.log('Gemini API key deleted from SecureStore');
    } catch (error) {
      console.error('Error deleting Gemini API key:', error);
      throw error;
    }
  }

  // Save Together AI API key (secure storage)
  async saveTogetherAIKey(apiKey: string): Promise<void> {
    try {
      await this.migrateApiKeys(); // Ensure migration runs
      await SecureStore.setItemAsync('together_ai_api_key', apiKey);
      console.log('Together AI API key saved to SecureStore');
    } catch (error) {
      console.error('Error saving Together AI API key:', error);
      throw error;
    }
  }

  // Get Together AI API key (secure storage)
  async getTogetherAIKey(): Promise<string | null> {
    try {
      await this.migrateApiKeys(); // Ensure migration runs
      const key = await SecureStore.getItemAsync('together_ai_api_key');
      console.log('Together AI API key retrieved from SecureStore:', key ? 'Present' : 'Null');
      return key;
    } catch (error) {
      console.error('Error getting Together AI API key:', error);
      return null;
    }
  }

  // Delete Together AI API key (secure storage)
  async deleteTogetherAIKey(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('together_ai_api_key');
      console.log('Together AI API key deleted from SecureStore');
    } catch (error) {
      console.error('Error deleting Together AI API key:', error);
      throw error;
    }
  }

  // Save voice settings
  async saveVoiceSettings(voiceSettings: any): Promise<void> {
    try {
      const settings = await this.getSettings() || {};
      settings.voiceSettings = voiceSettings;
      await AsyncStorage.setItem('userSettings', JSON.stringify(settings));
      console.log('Voice settings saved');
    } catch (error) {
      console.error('Error saving voice settings:', error);
      throw error;
    }
  }

  // Get voice settings
  async getVoiceSettings(): Promise<any | null> {
    try {
      const settings = await this.getSettings();
      return settings?.voiceSettings || null;
    } catch (error) {
      console.error('Error getting voice settings:', error);
      return null;
    }
  }

  // Save speech-to-text settings
  async saveSpeechToTextSettings(speechToTextSettings: any): Promise<void> {
    try {
      const settings = await this.getSettings() || {};
      settings.speechToTextSettings = speechToTextSettings;
      await AsyncStorage.setItem('userSettings', JSON.stringify(settings));
      console.log('Speech-to-text settings saved');
    } catch (error) {
      console.error('Error saving speech-to-text settings:', error);
      throw error;
    }
  }

  // Get speech-to-text settings
  async getSpeechToTextSettings(): Promise<any | null> {
    try {
      const settings = await this.getSettings();
      return settings?.speechToTextSettings || null;
    } catch (error) {
      console.error('Error getting speech-to-text settings:', error);
      return null;
    }
  }

  // Check if any API key exists (for backward compatibility)
  async hasApiKey(): Promise<boolean> {
    try {
      await this.migrateApiKeys(); // Ensure migration runs
      const openaiKey = await this.getOpenAIKey();
      const huggingfaceKey = await this.getHuggingFaceKey();
      const cohereKey = await this.getCohereKey();
      const geminiKey = await this.getGeminiKey();
      const togetherAIKey = await this.getTogetherAIKey();
      const hasKey = (openaiKey !== null && openaiKey.length > 0) || 
                     (huggingfaceKey !== null && huggingfaceKey.length > 0) ||
                     (cohereKey !== null && cohereKey.length > 0) ||
                     (geminiKey !== null && geminiKey.length > 0) ||
                     (togetherAIKey !== null && togetherAIKey.length > 0);
      console.log('Has API key check:', hasKey);
      return hasKey;
    } catch (error) {
      console.error('Error checking API key:', error);
      return false;
    }
  }

  // Get API key (for backward compatibility - returns first available)
  async getApiKey(): Promise<string | null> {
    try {
      await this.migrateApiKeys(); // Ensure migration runs
      const openaiKey = await this.getOpenAIKey();
      if (openaiKey) return openaiKey;
      
      const huggingfaceKey = await this.getHuggingFaceKey();
      if (huggingfaceKey) return huggingfaceKey;
      
      const cohereKey = await this.getCohereKey();
      if (cohereKey) return cohereKey;
      
      const geminiKey = await this.getGeminiKey();
      if (geminiKey) return geminiKey;
      
      const togetherAIKey = await this.getTogetherAIKey();
      return togetherAIKey;
    } catch (error) {
      console.error('Error getting API key:', error);
      return null;
    }
  }

  // Save user settings (AsyncStorage - non-sensitive data)
  async saveSettings(settings: any): Promise<void> {
    try {
      await AsyncStorage.setItem('user_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  // Get user settings (AsyncStorage - non-sensitive data)
  async getSettings(): Promise<any | null> {
    try {
      const settings = await AsyncStorage.getItem('user_settings');
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error getting settings:', error);
      return null;
    }
  }

  // Clear all data (both secure and non-secure)
  async clearAll(): Promise<void> {
    try {
      // Clear secure storage (API keys)
      await SecureStore.deleteItemAsync('openai_api_key');
      await SecureStore.deleteItemAsync('huggingface_api_key');
      await SecureStore.deleteItemAsync('cohere_api_key');
      await SecureStore.deleteItemAsync('gemini_api_key');
      await SecureStore.deleteItemAsync('together_ai_api_key');
      
      // Clear AsyncStorage (settings)
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  // Clear only API keys (preserve settings)
  async clearApiKeys(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('openai_api_key');
      await SecureStore.deleteItemAsync('huggingface_api_key');
      await SecureStore.deleteItemAsync('cohere_api_key');
      await SecureStore.deleteItemAsync('gemini_api_key');
      await SecureStore.deleteItemAsync('together_ai_api_key');
      console.log('API keys cleared from SecureStore');
    } catch (error) {
      console.error('Error clearing API keys:', error);
      throw error;
    }
  }

  // Custom Models (AsyncStorage - non-sensitive data)
  async saveCustomModel(model: CustomModel): Promise<void> {
    try {
      const settings = await this.getSettings() || {};
      const customModels = settings.customModels || [];
      
      // Update existing model or add new one
      const existingIndex = customModels.findIndex((m: CustomModel) => m.id === model.id);
      if (existingIndex >= 0) {
        customModels[existingIndex] = model;
      } else {
        customModels.push(model);
      }
      
      await this.saveSettings({
        ...settings,
        customModels
      });
      console.log('Custom model saved:', model.name);
    } catch (error) {
      console.error('Error saving custom model:', error);
      throw error;
    }
  }

  async getCustomModels(): Promise<CustomModel[]> {
    try {
      const settings = await this.getSettings();
      return settings?.customModels || [];
    } catch (error) {
      console.error('Error getting custom models:', error);
      return [];
    }
  }

  async deleteCustomModel(modelId: string): Promise<void> {
    try {
      const settings = await this.getSettings() || {};
      const customModels = settings.customModels || [];
      const filteredModels = customModels.filter((m: CustomModel) => m.id !== modelId);
      
      await this.saveSettings({
        ...settings,
        customModels: filteredModels
      });
      console.log('Custom model deleted:', modelId);
    } catch (error) {
      console.error('Error deleting custom model:', error);
      throw error;
    }
  }
} 