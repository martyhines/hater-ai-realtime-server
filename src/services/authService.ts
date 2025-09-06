import {
  signInAnonymously as fbSignInAnonymously,
  onAuthStateChanged,
  signOut as fbSignOut,
  type Auth,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  type Firestore,
} from 'firebase/firestore';
import { auth } from '../config/firebaseAuth';
import { db } from '../config/firebaseDb';
import { UserSettings } from '../types';

class AuthService {
  private static instance: AuthService;
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
    if (this.isInitialized) return;

    try {
      console.log('🔥 Initializing AuthService...');

      // Set up auth state listener
      this.authUnsub = onAuthStateChanged(auth, (user) => {
        this.currentUser = user;
        console.log('🔄 Auth state changed:', user ? `Signed in: ${user.uid}` : 'Signed out');
      });

      this.isInitialized = true;
      console.log('🎉 AuthService initialization COMPLETE');
    } catch (error: any) {
      console.error('❌ AuthService initialization FAILED:', error);
      console.error('❌ Error details:', error?.message ?? error);
      throw error;
    }
  }

  async signInAnonymously(): Promise<User | null> {
    try {
      const cred = await fbSignInAnonymously(auth);
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

      const userDocRef = doc(db, 'users', userId);
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
      if (!this.currentUser) return;
      const userDocRef = doc(db, 'users', this.currentUser.uid);
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
      if (!this.currentUser) return null;
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      const snap = await getDoc(userDocRef);
      return snap.exists() ? (snap.data()?.settings ?? null) : null;
    } catch (error) {
      console.error('Failed to load user settings:', error);
      return null;
    }
  }

  async unlockPremiumFeature(featureId: string): Promise<void> {
    try {
      if (!this.currentUser) return;
      const userDocRef = doc(db, 'users', this.currentUser.uid);
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
      if (!this.currentUser) return false;
      const snap = await getDoc(doc(db, 'users', this.currentUser.uid));
      const features: string[] = snap.data()?.premiumFeatures ?? [];
      return features.includes(featureId);
    } catch (error) {
      console.error('Failed to check premium feature:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      await fbSignOut(auth);
      console.log('User signed out');
    }
    catch (error) {
      console.error('Sign out failed:', error);
    }
  }
}

export default AuthService;
