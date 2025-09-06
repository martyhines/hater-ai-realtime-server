import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings } from '../types';

interface LocalUser {
  id: string;
  createdAt: string;
  lastActive: string;
  settings: UserSettings;
  premiumFeatures: string[];
}

class AuthService {
  private static instance: AuthService;
  private currentUser: LocalUser | null = null;
  private isInitialized = false;
  private readonly USER_STORAGE_KEY = '@hater_ai_user';

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔥 Initializing AuthService...');

      // Load existing user from storage or create new one
      const existingUser = await this.loadUserFromStorage();
      if (existingUser) {
        this.currentUser = existingUser;
        console.log('✅ Existing user loaded:', existingUser.id);
      } else {
        this.currentUser = await this.createNewUser();
        console.log('✅ New user created:', this.currentUser.id);
      }

      this.isInitialized = true;
      console.log('🎉 AuthService initialization COMPLETE');
    } catch (error: any) {
      console.error('❌ AuthService initialization FAILED:', error);
      console.error('❌ Error details:', error?.message ?? error);
      throw error;
    }
  }

  private async loadUserFromStorage(): Promise<LocalUser | null> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_STORAGE_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to load user from storage:', error);
      return null;
    }
  }

  private async createNewUser(): Promise<LocalUser> {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newUser: LocalUser = {
      id: userId,
      createdAt: now,
      lastActive: now,
      settings: {
        aiPersonality: 'sarcastic',
        roastIntensity: 'medium',
        cursingAllowed: true,
      },
      premiumFeatures: [],
    };

    await AsyncStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  }

  private async saveUserToStorage(): Promise<void> {
    if (!this.currentUser) return;
    this.currentUser.lastActive = new Date().toISOString();
    await AsyncStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(this.currentUser));
  }

  getCurrentUser(): LocalUser | null {
    return this.currentUser;
  }

  getUserId(): string | null {
    return this.currentUser?.id ?? null;
  }

  isSignedIn(): boolean {
    return this.currentUser != null;
  }

  async saveUserSettings(settings: UserSettings): Promise<void> {
    try {
      if (!this.currentUser) return;
      this.currentUser.settings = settings;
      await this.saveUserToStorage();
      console.log('User settings saved');
    } catch (error) {
      console.error('Failed to save user settings:', error);
    }
  }

  async loadUserSettings(): Promise<UserSettings | null> {
    try {
      return this.currentUser?.settings ?? null;
    } catch (error) {
      console.error('Failed to load user settings:', error);
      return null;
    }
  }

  async unlockPremiumFeature(featureId: string): Promise<void> {
    try {
      if (!this.currentUser) return;
      if (!this.currentUser.premiumFeatures.includes(featureId)) {
        this.currentUser.premiumFeatures.push(featureId);
        await this.saveUserToStorage();
        console.log('Premium feature unlocked:', featureId);
      }
    } catch (error) {
      console.error('Failed to unlock premium feature:', error);
    }
  }

  async hasPremiumFeature(featureId: string): Promise<boolean> {
    try {
      return this.currentUser?.premiumFeatures.includes(featureId) ?? false;
    } catch (error) {
      console.error('Failed to check premium feature:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      // For local storage, just clear the current user
      this.currentUser = null;
      await AsyncStorage.removeItem(this.USER_STORAGE_KEY);
      console.log('User signed out');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }

  // Method to simulate anonymous sign-in (already done in initialize)
  async signInAnonymously(): Promise<LocalUser | null> {
    // Already handled in initialize()
    return this.currentUser;
  }
}

export default AuthService;
