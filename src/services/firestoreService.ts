import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface FirestoreUserData {
  // Profile
  displayName?: string;
  email?: string;
  createdAt: Date;
  lastLoginAt: Date;

  // Streaks
  currentStreak?: number;
  longestStreak?: number;
  lastActivity?: Date;
  streakHistory?: Array<{
    date: Date;
    count: number;
  }>;

  // Settings
  intensity?: number;
  personality?: string;
  allowCursing?: boolean;
  theme?: string;

  // Purchases
  unlockedFeatures?: string[];
  unlockedPersonalities?: string[];
  transactionHistory?: Array<{
    id: string;
    productId: string;
    purchaseDate: Date;
    amount?: number;
  }>;

  // Conversations (summary for backup)
  conversationsCount?: number;
  lastConversationDate?: Date;
}

class FirestoreService {
  private static instance: FirestoreService;

  private constructor() {}

  static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService();
    }
    return FirestoreService.instance;
  }

  /**
   * Create or update user profile
   */
  async setUserProfile(userId: string, data: Partial<FirestoreUserData>): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId);
      const docData = {
        ...data,
        lastLoginAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await setDoc(userDocRef, docData, { merge: true });
    } catch (error) {
      console.error('Error setting user profile:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<FirestoreUserData | null> {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        return this.convertTimestamps(data);
      }

      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Update user streak data
   */
  async updateStreak(userId: string, streakData: {
    currentStreak: number;
    longestStreak: number;
    lastActivity: Date;
  }): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        lastActivity: Timestamp.fromDate(streakData.lastActivity),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(userId: string, settings: {
    intensity?: number;
    personality?: string;
    allowCursing?: boolean;
    theme?: string;
  }): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        ...settings,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Update user purchases
   */
  async updatePurchases(userId: string, purchases: {
    unlockedFeatures?: string[];
    unlockedPersonalities?: string[];
  }): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        ...purchases,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating purchases:', error);
      throw error;
    }
  }

  /**
   * Add conversation summary
   */
  async addConversationSummary(userId: string, summary: {
    messageCount: number;
    personality: string;
    lastMessageDate: Date;
  }): Promise<void> {
    try {
      const conversationsRef = collection(db, 'users', userId, 'conversations');
      await addDoc(conversationsRef, {
        ...summary,
        lastMessageDate: Timestamp.fromDate(summary.lastMessageDate),
        createdAt: Timestamp.now()
      });

      // Update user profile with conversation count
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      const currentCount = userDoc.data()?.conversationsCount || 0;

      await updateDoc(userDocRef, {
        conversationsCount: currentCount + 1,
        lastConversationDate: Timestamp.fromDate(summary.lastMessageDate),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error adding conversation summary:', error);
      throw error;
    }
  }

  /**
   * Migrate anonymous user data to authenticated account
   */
  async migrateUserData(
    authenticatedUserId: string,
    anonymousData: any
  ): Promise<void> {
    try {
      console.log('Starting data migration...', { authenticatedUserId, anonymousData });

      // Get current authenticated user data
      const currentData = await this.getUserProfile(authenticatedUserId) || {};

      // Merge anonymous data with authenticated data
      const mergedData: Partial<FirestoreUserData> = {
        // Keep authenticated user profile data
        displayName: currentData.displayName,
        email: currentData.email,

        // Take the best values from both
        currentStreak: Math.max(
          currentData.currentStreak || 0,
          anonymousData.currentStreak || 0
        ),
        longestStreak: Math.max(
          currentData.longestStreak || 0,
          anonymousData.longestStreak || 0
        ),

        // Merge settings (authenticated wins conflicts)
        intensity: currentData.intensity ?? anonymousData.intensity,
        personality: currentData.personality ?? anonymousData.personality,
        allowCursing: currentData.allowCursing ?? anonymousData.allowCursing,
        theme: currentData.theme ?? anonymousData.theme,

        // Union of purchases
        unlockedFeatures: [
          ...(currentData.unlockedFeatures || []),
          ...(anonymousData.unlockedFeatures || [])
        ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates

        unlockedPersonalities: [
          ...(currentData.unlockedPersonalities || []),
          ...(anonymousData.unlockedPersonalities || [])
        ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates

        // Merge transaction history
        transactionHistory: [
          ...(currentData.transactionHistory || []),
          ...(anonymousData.transactionHistory || [])
        ],

        // Mark as migrated
        migratedFromAnonymous: true,
        migrationDate: new Date(),
        createdAt: currentData.createdAt || new Date(),
        lastLoginAt: new Date()
      };

      await this.setUserProfile(authenticatedUserId, mergedData);

      console.log('✅ Data migration completed successfully');
    } catch (error) {
      console.error('❌ Data migration failed:', error);
      throw error;
    }
  }

  /**
   * Convert Firestore timestamps to Date objects
   */
  private convertTimestamps(data: any): FirestoreUserData {
    const converted = { ...data };

    // Convert timestamp fields
    const timestampFields = [
      'createdAt', 'lastLoginAt', 'lastActivity',
      'lastConversationDate', 'migrationDate'
    ];

    timestampFields.forEach(field => {
      if (converted[field] && converted[field].toDate) {
        converted[field] = converted[field].toDate();
      }
    });

    // Convert nested timestamps
    if (converted.streakHistory) {
      converted.streakHistory = converted.streakHistory.map((entry: any) => ({
        ...entry,
        date: entry.date?.toDate ? entry.date.toDate() : entry.date
      }));
    }

    if (converted.transactionHistory) {
      converted.transactionHistory = converted.transactionHistory.map((transaction: any) => ({
        ...transaction,
        purchaseDate: transaction.purchaseDate?.toDate
          ? transaction.purchaseDate.toDate()
          : transaction.purchaseDate
      }));
    }

    return converted as FirestoreUserData;
  }

  /**
   * Delete user data (for GDPR compliance)
   */
  async deleteUserData(userId: string): Promise<void> {
    try {
      // Note: In production, this should be implemented with proper
      // Firebase Cloud Functions to handle complete data deletion
      // including subcollections

      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        deleted: true,
        deletedAt: Timestamp.now(),
        // Clear sensitive data
        displayName: '[DELETED]',
        email: '[DELETED]'
      });

      console.log('✅ User data marked for deletion');
    } catch (error) {
      console.error('❌ Error deleting user data:', error);
      throw error;
    }
  }
}

export default FirestoreService;
