import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseApp } from '../config/firebase';
import { UserSettings } from '../types';

class AuthService {
  private static instance: AuthService;
  private auth: Auth | null = null;
  private db: any = null;
  private currentUser: User | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize Firebase Auth and Firestore
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Use centralized Firebase app
      const app = getFirebaseApp();

      // Get auth and firestore instances
      this.auth = getAuth(app);
      this.db = getFirestore(app);

      // Listen for auth state changes
      onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
        console.log('Auth state changed:', user ? 'Signed in' : 'Signed out');
      });

      this.isInitialized = true;
      console.log('Firebase Auth initialized successfully');
    } catch (error) {
      console.error('Firebase Auth initialization failed:', error);
      console.error('Error details:', error.message);
    }
  }

  /**
   * Sign in anonymously
   */
  async signInAnonymously(): Promise<any | null> {
    try {
      if (!this.auth) {
        console.error('Auth not initialized');
        return null;
      }

      const userCredential = await signInAnonymously(this.auth);
      const user = userCredential.user;

      console.log('Anonymous sign-in successful:', user.uid);

      // Create user document in Firestore
      await this.createUserDocument(user.uid);

      return user;
    } catch (error) {
      console.error('Anonymous sign-in failed:', error);
      return null;
    }
  }

  /**
   * Create user document in Firestore
   */
  private async createUserDocument(userId: string): Promise<void> {
    try {
      if (!this.db) return;

      const userDocRef = doc(this.db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create new user document with defaults
        const defaultSettings: UserSettings = {
          aiPersonality: 'sarcastic',
          roastIntensity: 'medium',
          enableNotifications: true,
          enableSound: true,
        };

        await setDoc(userDocRef, {
          userId,
          settings: defaultSettings,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          premiumFeatures: [],
          analyticsEnabled: true
        });

        console.log('Created new user document:', userId);
      } else {
        // Update last active
        await updateDoc(userDocRef, {
          lastActive: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to create user document:', error);
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get user ID
   */
  getUserId(): string | null {
    return this.currentUser?.uid || null;
  }

  /**
   * Check if user is signed in
   */
  isSignedIn(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Save user settings to Firestore
   */
  async saveUserSettings(settings: UserSettings): Promise<void> {
    try {
      if (!this.db || !this.currentUser) return;

      const userDocRef = doc(this.db, 'users', this.currentUser.uid);
      await updateDoc(userDocRef, {
        settings,
        lastActive: new Date().toISOString()
      });

      console.log('User settings saved');
    } catch (error) {
      console.error('Failed to save user settings:', error);
    }
  }

  /**
   * Load user settings from Firestore
   */
  async loadUserSettings(): Promise<UserSettings | null> {
    try {
      if (!this.db || !this.currentUser) return null;

      const userDocRef = doc(this.db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        return data?.settings || null;
      }

      return null;
    } catch (error) {
      console.error('Failed to load user settings:', error);
      return null;
    }
  }

  /**
   * Unlock premium feature for user
   */
  async unlockPremiumFeature(featureId: string): Promise<void> {
    try {
      if (!this.db || !this.currentUser) return;

      const userDocRef = doc(this.db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        const premiumFeatures = data?.premiumFeatures || [];

        if (!premiumFeatures.includes(featureId)) {
          premiumFeatures.push(featureId);

          await updateDoc(userDocRef, {
            premiumFeatures,
            lastActive: new Date().toISOString()
          });

          console.log('Premium feature unlocked:', featureId);
        }
      }
    } catch (error) {
      console.error('Failed to unlock premium feature:', error);
    }
  }

  /**
   * Check if user has premium feature
   */
  async hasPremiumFeature(featureId: string): Promise<boolean> {
    try {
      if (!this.db || !this.currentUser) return false;

      const userDocRef = doc(this.db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        const premiumFeatures = data?.premiumFeatures || [];
        return premiumFeatures.includes(featureId);
      }

      return false;
    } catch (error) {
      console.error('Failed to check premium feature:', error);
      return false;
    }
  }

  /**
   * Sign out (for future use)
   */
  async signOut(): Promise<void> {
    try {
      if (this.auth) {
        await firebase.auth().signOut();
        console.log('User signed out');
      }
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }
}

export default AuthService;
