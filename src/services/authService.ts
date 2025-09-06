import { supabase } from '../config/supabase';
import { UserSettings } from '../types';
import type { User, AuthChangeEvent } from '@supabase/supabase-js';

interface SupabaseUser {
  id: string;
  settings: UserSettings;
  premiumFeatures: string[];
}

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private isInitialized = false;

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
      console.log('🔥 Initializing Supabase AuthService...');

      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Session error:', error);
      } else if (session?.user) {
        this.currentUser = session.user;
        console.log('✅ Existing session found:', session.user.id);
      } else {
        console.log('ℹ️ No existing session, will create anonymous user on demand');
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.id || 'none');
        this.currentUser = session?.user || null;
      });

      this.isInitialized = true;
      console.log('🎉 Supabase AuthService initialization COMPLETE');
    } catch (error: any) {
      console.error('❌ AuthService initialization FAILED:', error);
      console.error('❌ Error details:', error?.message ?? error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getUserId(): string | null {
    return this.currentUser?.id ?? null;
  }

  isSignedIn(): boolean {
    return this.currentUser != null;
  }

  async signInAnonymously(): Promise<User | null> {
    try {
      console.log('👤 Signing in anonymously...');

      // Check if already signed in
      if (this.currentUser) {
        console.log('✅ Already signed in:', this.currentUser.id);
        return this.currentUser;
      }

      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        console.error('❌ Anonymous sign-in failed:', error);
        return null;
      }

      if (data.user) {
        this.currentUser = data.user;
        console.log('✅ Anonymous sign-in successful:', data.user.id);
        return data.user;
      }

      return null;
    } catch (error) {
      console.error('❌ Anonymous sign-in error:', error);
      return null;
    }
  }

  async saveUserSettings(settings: UserSettings): Promise<void> {
    try {
      if (!this.currentUser) return;

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: this.currentUser.id,
          settings: settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Failed to save user settings:', error);
      } else {
        console.log('✅ User settings saved');
      }
    } catch (error) {
      console.error('❌ Failed to save user settings:', error);
    }
  }

  async loadUserSettings(): Promise<UserSettings | null> {
    try {
      if (!this.currentUser) return null;

      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', this.currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('❌ Failed to load user settings:', error);
        return null;
      }

      return data?.settings || null;
    } catch (error) {
      console.error('❌ Failed to load user settings:', error);
      return null;
    }
  }

  async unlockPremiumFeature(featureId: string): Promise<void> {
    try {
      if (!this.currentUser) return;

      const { error } = await supabase
        .from('user_premium_features')
        .upsert({
          user_id: this.currentUser.id,
          feature_id: featureId,
          unlocked_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Failed to unlock premium feature:', error);
      } else {
        console.log('✅ Premium feature unlocked:', featureId);
      }
    } catch (error) {
      console.error('❌ Failed to unlock premium feature:', error);
    }
  }

  async hasPremiumFeature(featureId: string): Promise<boolean> {
    try {
      if (!this.currentUser) return false;

      const { data, error } = await supabase
        .from('user_premium_features')
        .select('feature_id')
        .eq('user_id', this.currentUser.id)
        .eq('feature_id', featureId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('❌ Failed to check premium feature:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('❌ Failed to check premium feature:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out failed:', error);
      } else {
        console.log('✅ User signed out');
      }
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
  }
}

export default AuthService;
