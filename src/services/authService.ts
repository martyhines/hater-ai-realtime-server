import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  linkWithCredential,
  EmailAuthProvider,
  User,
  AuthError,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  isAnonymous: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  anonymousId?: string; // For data migration tracking
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  loading: boolean;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    isAuthenticated: false,
    isAnonymous: true,
    loading: true
  };
  private listeners: ((state: AuthState) => void)[] = [];

  private constructor() {
    this.initializeAuth();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize Firebase Auth state listener
   */
  private async initializeAuth(): Promise<void> {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile = await this.getUserProfile(firebaseUser);
        this.authState = {
          user: userProfile,
          isAuthenticated: true,
          isAnonymous: firebaseUser.isAnonymous,
          loading: false
        };

        // Store user ID for data sync
        await AsyncStorage.setItem('userId', firebaseUser.uid);
        await AsyncStorage.setItem('isAnonymous', firebaseUser.isAnonymous.toString());
      } else {
        // No user signed in, create anonymous user
        await this.signInAnonymously();
      }

      this.notifyListeners();
    });
  }

  /**
   * Get current auth state
   */
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.authState));
  }

  /**
   * Sign in anonymously
   */
  async signInAnonymously(): Promise<void> {
    try {
      const result = await signInAnonymously(auth);
      const user = result.user;

      // Generate anonymous user ID for data tracking
      const anonymousId = await this.generateAnonymousId();

      // Create user profile in Firestore
      await this.createUserProfile(user, anonymousId, true);

      console.log('✅ Anonymous sign in successful');
    } catch (error) {
      console.error('❌ Anonymous sign in failed:', error);
      throw error;
    }
  }

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<void> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Update display name if provided
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // Create user profile in Firestore
      await this.createUserProfile(user, undefined, false);

      console.log('✅ Email sign up successful');
    } catch (error) {
      console.error('❌ Email sign up failed:', error);
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Email sign in successful');
    } catch (error) {
      console.error('❌ Email sign in failed:', error);
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Link anonymous account with email/password
   */
  async linkAnonymousAccount(email: string, password: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.isAnonymous) {
        throw new Error('No anonymous user to link');
      }

      // Create email credential
      const credential = EmailAuthProvider.credential(email, password);

      // Link the anonymous account
      const result = await linkWithCredential(currentUser, credential);

      // Update user profile in Firestore
      await this.updateUserProfile(result.user, false);

      console.log('✅ Anonymous account linked successfully');
    } catch (error) {
      console.error('❌ Account linking failed:', error);
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('isAnonymous');
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  }

  /**
   * Migrate anonymous user data to authenticated account
   */
  async migrateAnonymousData(): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.isAnonymous) {
        throw new Error('No authenticated user to migrate data to');
      }

      const anonymousId = await AsyncStorage.getItem('anonymousUserId');
      if (!anonymousId) {
        console.log('No anonymous data to migrate');
        return;
      }

      // Get anonymous user data from Firestore
      const anonymousDocRef = doc(db, 'users', anonymousId);
      const anonymousDoc = await getDoc(anonymousDocRef);

      if (anonymousDoc.exists()) {
        const anonymousData = anonymousDoc.data();

        // Migrate data to authenticated user
        await this.migrateUserData(currentUser.uid, anonymousData);

        // Mark anonymous data as migrated
        await updateDoc(anonymousDocRef, {
          migratedTo: currentUser.uid,
          migratedAt: new Date()
        });

        console.log('✅ Data migration successful');
      }
    } catch (error) {
      console.error('❌ Data migration failed:', error);
      throw error;
    }
  }

  /**
   * Generate unique anonymous user ID
   */
  private async generateAnonymousId(): Promise<string> {
    const existingId = await AsyncStorage.getItem('anonymousUserId');
    if (existingId) {
      return existingId;
    }

    const anonymousId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem('anonymousUserId', anonymousId);
    return anonymousId;
  }

  /**
   * Create user profile in Firestore
   */
  private async createUserProfile(user: User, anonymousId?: string, isAnonymous: boolean = false): Promise<UserProfile> {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || undefined,
      displayName: user.displayName || undefined,
      isAnonymous,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      anonymousId
    };

    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      ...userProfile,
      createdAt: userProfile.createdAt,
      lastLoginAt: userProfile.lastLoginAt
    });

    return userProfile;
  }

  /**
   * Update user profile in Firestore
   */
  private async updateUserProfile(user: User, isAnonymous: boolean = false): Promise<void> {
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
      email: user.email,
      displayName: user.displayName,
      isAnonymous,
      lastLoginAt: new Date()
    });
  }

  /**
   * Get user profile from Firestore
   */
  private async getUserProfile(user: User): Promise<UserProfile> {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid: user.uid,
        email: user.email || undefined,
        displayName: user.displayName || undefined,
        isAnonymous: user.isAnonymous,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastLoginAt: new Date(),
        anonymousId: data.anonymousId
      };
    } else {
      // Create profile if it doesn't exist
      return await this.createUserProfile(user, undefined, user.isAnonymous);
    }
  }

  /**
   * Migrate user data from anonymous to authenticated account
   */
  private async migrateUserData(authenticatedUserId: string, anonymousData: any): Promise<void> {
    const authenticatedDocRef = doc(db, 'users', authenticatedUserId);

    // Update authenticated user with migrated data
    await updateDoc(authenticatedDocRef, {
      migratedFromAnonymous: true,
      migrationDate: new Date(),
      // Merge any existing data with anonymous data
      ...anonymousData
    });
  }

  /**
   * Handle Firebase auth errors with user-friendly messages
   */
  private handleAuthError(error: AuthError): Error {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return new Error('An account with this email already exists. Try signing in instead.');
      case 'auth/weak-password':
        return new Error('Password should be at least 6 characters long.');
      case 'auth/invalid-email':
        return new Error('Please enter a valid email address.');
      case 'auth/user-not-found':
        return new Error('No account found with this email. Please sign up first.');
      case 'auth/wrong-password':
        return new Error('Incorrect password. Please try again.');
      case 'auth/too-many-requests':
        return new Error('Too many failed attempts. Please try again later.');
      default:
        return new Error('Authentication failed. Please try again.');
    }
  }
}

export default AuthService;
