import {
  initializeAuth,
  signInAnonymously as fbSignInAnonymously,
  onAuthStateChanged,
  getReactNativePersistence,
  signOut as fbSignOut,
  type Auth,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  type Firestore,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirebaseApp } from '../config/firebase';
import { UserSettings } from '../types';

class AuthService {
  private static instance: AuthService;
  private auth: Auth | null = null;
  private db: Firestore | null = null;
  private currentUser: User | null = null;
  private isInitialized = false;
  private authUnsub: Unsubscribe | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async initialize(): Promise<void> {
    // Guard against multiple initializations
    if (this.isInitialized && this.auth && this.db) {
      console.log('🔄 Firebase Auth already initialized, skipping');
      return;
    }

    try {
      console.log('🔥 Initializing Firebase Auth...');
      const app = getFirebaseApp();
      console.log('✅ Firebase app obtained');

      // CRITICAL: initializeAuth must run exactly once per app lifecycle
      if (!this.auth) {
        console.log('🔐 Initializing Auth with AsyncStorage persistence...');
        this.auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
        console.log('✅ Auth initialized with persistence');
      }

      if (!this.db) {
        this.db = getFirestore(app);
        console.log('✅ Firestore initialized');
      }

      // Debug: Confirm Auth provider is registered
      // @ts-ignore - Private field access for debugging
      const providers = app._container?.providers?.keys?.() || [];
      console.log('🔍 Firebase providers:', [...providers]);

      // Clean up old listener if hot-reloaded
      if (this.authUnsub) {
        this.authUnsub();
      }

      // Set up auth state listener
      this.authUnsub = onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
        console.log('🔄 Auth state changed:', user ? `Signed in: ${user.uid}` : 'Signed out');
      });

      this.isInitialized = true;
      console.log('🎉 Firebase Auth initialization COMPLETE');
    } catch (error: any) {
      console.error('❌ Firebase Auth initialization FAILED:', error);
      console.error('❌ Error details:', error?.message ?? error);
      throw error; // Re-throw to prevent silent failures
    }
  }

  async signInAnonymously(): Promise<User | null> {
    try {
      if (!this.auth) {
        console.error('Auth not initialized');
        return null;
      }

      const cred = await fbSignInAnonymously(this.auth);
      const user = cred.user;

      console.log('Anonymous sign-in successful:', user.uid);
      await this.createOrTouchUserDocument(user.uid);
      return user;
    } catch (error) {
      console.error('Anonymous sign-in failed:', error);
      return null;
    }
  }

  private async createOrTouchUserDocument(userId: string): Promise<void> {
    try {
      if (!this.db) return;

      const userDocRef = doc(this.db, 'users', userId);
      const snap = await getDoc(userDocRef);

      if (!snap.exists()) {
        const defaultSettings: UserSettings = {
          aiPersonality: 'sarcastic',
          roastIntensity: 'medium',
          enableNotifications: true,
          enableSound: true,
        };

        await setDoc(userDocRef, {
          userId,
          settings: defaultSettings,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          premiumFeatures: [],
          analyticsEnabled: true,
        });
        console.log('Created new user document:', userId);
      } else {
        await updateDoc(userDocRef, { lastActive: serverTimestamp() });
      }
    } catch (error) {
      console.error('Failed to create/update user document:', error);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getUserId(): string | null {
    return this.currentUser?.uid ?? null;
  }

  isSignedIn(): boolean {
    return this.currentUser != null;
  }

  async saveUserSettings(settings: UserSettings): Promise<void> {
    try {
      if (!this.db || !this.currentUser) return;
      const userDocRef = doc(this.db, 'users', this.currentUser.uid);
      await updateDoc(userDocRef, {
        settings,
        lastActive: serverTimestamp(),
      });
      console.log('User settings saved');
    } catch (error) {
      console.error('Failed to save user settings:', error);
    }
  }

  async loadUserSettings(): Promise<UserSettings | null> {
    try {
      if (!this.db || !this.currentUser) return null;
      const userDocRef = doc(this.db, 'users', this.currentUser.uid);
      const snap = await getDoc(userDocRef);
      return snap.exists() ? (snap.data()?.settings ?? null) : null;
    } catch (error) {
      console.error('Failed to load user settings:', error);
      return null;
    }
  }

  async unlockPremiumFeature(featureId: string): Promise<void> {
    try {
      if (!this.db || !this.currentUser) return;
      const userDocRef = doc(this.db, 'users', this.currentUser.uid);
      // idempotent + race-safe
      await updateDoc(userDocRef, {
        premiumFeatures: arrayUnion(featureId),
        lastActive: serverTimestamp(),
      });
      console.log('Premium feature unlocked:', featureId);
    } catch (error) {
      console.error('Failed to unlock premium feature:', error);
    }
  }

  async hasPremiumFeature(featureId: string): Promise<boolean> {
    try {
      if (!this.db || !this.currentUser) return false;
      const snap = await getDoc(doc(this.db, 'users', this.currentUser.uid));
      const features: string[] = snap.data()?.premiumFeatures ?? [];
      return features.includes(featureId);
    } catch (error) {
      console.error('Failed to check premium feature:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      if (this.auth) {
        await fbSignOut(this.auth);
        console.log('User signed out');
      }
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }
}

export default AuthService;
