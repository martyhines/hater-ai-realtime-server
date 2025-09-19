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
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        } else if (session?.user) {
        this.currentUser = session.user;
        } else {
        // Automatically sign in anonymously for new users
        await this.signInAnonymously();
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
        this.currentUser = session?.user || null;
      });

      this.isInitialized = true;
      } catch (error: any) {
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
      // Check if already signed in
      if (this.currentUser) {
        return this.currentUser;
      }

      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        return null;
      }

      if (data.user) {
        this.currentUser = data.user;
        return data.user;
      }

      return null;
    } catch (error) {
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
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        } else {
        }
    } catch (error) {
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
        return null;
      }

      return data?.settings || null;
    } catch (error) {
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
        }, {
          onConflict: 'user_id,feature_id'
        });

      if (error) {
        } else {
        }
    } catch (error) {
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
        return false;
      }

      return !!data;
    } catch (error) {
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        } else {
        }
    } catch (error) {
      }
  }
}

export default AuthService;
