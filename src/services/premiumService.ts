import { Alert } from 'react-native';
import { StorageService } from './storageService';
import { IAPService } from './iapService';
import AuthService from './authService';

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  isUnlocked: boolean;
}

export interface PremiumSubscription {
  id: string;
  name: string;
  price: number;
  duration: 'month' | 'year' | 'lifetime';
  features: string[];
  description: string;
  badge?: string;
  popular?: boolean;
}

export interface PersonalityPack {
  id: string;
  name: string;
  description: string;
  price: number;
  personalities: string[];
  icon: string;
  isUnlocked: boolean;
}

export interface IndividualPersonality {
  id: string;
  name: string;
  packId: string;
  price: number;
  isUnlocked: boolean;
}

export class PremiumService {
  private static instance: PremiumService;
  private storage: StorageService;

  private constructor() {
    this.storage = StorageService.getInstance();
  }

  static getInstance(): PremiumService {
    if (!PremiumService.instance) {
      PremiumService.instance = new PremiumService();
    }
    return PremiumService.instance;
  }

  /**
   * Get available premium features
   */
  getPremiumFeatures(): PremiumFeature[] {
    return [
      {
        id: 'allow_cursing',
        name: 'Unleash the Beast',
        description: 'Enable profanity in AI roasts for maximum savagery',
        price: 2.99,
        icon: '🔥',
        isUnlocked: false,
      },
      {
        id: 'chat_pack_20',
        name: '20 Chat Pack',
        description: 'Get 20 additional chats to use anytime',
        price: 3.99,
        icon: '💬',
        isUnlocked: false,
      },
      {
        id: 'chat_pack_50',
        name: '50 Chat Pack',
        description: 'Get 50 additional chats to use anytime',
        price: 6.99,
        icon: '💬',
        isUnlocked: false,
      },
    ];
  }

  /**
   * Get premium subscription plans
   */
  getSubscriptionPlans(): PremiumSubscription[] {
    return [
      {
        id: 'basic_monthly',
        name: 'Basic Premium',
        price: 4.99,
        duration: 'month',
        description: 'Unlock all 16 premium AI personalities from our Cultural, Professional, and Pop Culture packs',
        features: [
          'all_premium_personalities',
          'allow_cursing',
          'priority_support',
          'monthly_insights'
        ],
        badge: 'Most Popular'
      },
      {
        id: 'pro_monthly',
        name: 'Pro Premium',
        price: 9.99,
        duration: 'month',
        description: 'Complete premium experience with unlimited chats and advanced features',
        features: [
          'all_basic_features',
          'advanced_analytics',
          'unlimited_chats'
        ],
        badge: 'Best Value',
        popular: true
      },
      {
        id: 'pro_yearly',
        name: 'Pro Premium (Yearly)',
        price: 99.99,
        duration: 'year',
        description: 'Save 17% with annual Pro subscription and unlimited chats',
        features: [
          'all_basic_features',
          'advanced_analytics',
          'unlimited_chats'
        ],
        badge: 'Save 17%'
      },
      {
        id: 'lifetime',
        name: 'Lifetime Pro',
        price: 199.99,
        duration: 'lifetime',
        description: 'One-time payment, lifetime access with unlimited chats',
        features: [
          'all_basic_features',
          'advanced_analytics',
          'unlimited_chats',
          'lifetime_support'
        ],
        badge: 'Lifetime'
      }
    ];
  }

  /**
   * Check if a specific feature is unlocked
   */
  async isFeatureUnlocked(featureId: string): Promise<boolean> {
    try {
      const unlockedFeatures = await this.storage.getUnlockedFeatures();
      return unlockedFeatures.includes(featureId);
    } catch (error) {
      return false;
    }
  }

  /**
   * Purchase a premium feature
   */
  async purchaseFeature(featureId: string): Promise<boolean> {
    try {
      const feature = this.getPremiumFeatures().find(f => f.id === featureId);
      if (!feature) {
        throw new Error('Feature not found');
      }

      // Show purchase confirmation
      const confirmed = await this.showPurchaseConfirmation(feature);
      if (!confirmed) {
        return false;
      }

      // Use real IAP for payment
      const iapService = IAPService.getInstance();

      // Check if IAP is available
      const isIapAvailable = iapService.isAvailable();

      if (!isIapAvailable) {
        const status = iapService.getAvailabilityStatus();

        // Offer to simulate the purchase for testing
        Alert.alert(
          'IAP Not Available',
          `${status.reason}\n\nWould you like to simulate this purchase for testing purposes?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Simulate',
              onPress: async () => {
                await this.simulatePurchase('feature', featureId);
              }
            }
          ]
        );
        return false;
      }

      // Initialize IAP if needed
      const initialized = await iapService.initialize();
      if (!initialized) {
        Alert.alert('Initialization Failed', 'Unable to initialize payment system. Please try again.');
        return false;
      }

      // Purchase the feature
      const success = await iapService.purchaseProduct(featureId);

      // If purchase was successful and it's a chat pack, credit the chats
      if (success && featureId.startsWith('chat_pack_')) {
        const packSize = featureId === 'chat_pack_20' ? 20 : featureId === 'chat_pack_50' ? 50 : 0;
        if (packSize > 0) {
          const storage = (await import('./storageService')).StorageService.getInstance();
          await (storage as any).addChatPack(packSize);
        }
      }

      return success;
    } catch (error) {
      Alert.alert('Purchase Failed', 'An error occurred during purchase.');
      return false;
    }
  }

  /**
   * Purchase a subscription plan
   */
  async purchaseSubscription(planId: string): Promise<boolean> {
    try {
      const plan = this.getSubscriptionPlans().find(p => p.id === planId);
      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      // Use real IAP for payment (when available)
      const iapService = IAPService.getInstance();

      if (!iapService.isAvailable()) {
        const status = iapService.getAvailabilityStatus();

        // Offer to simulate the purchase for testing
        const confirmed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'IAP Not Available',
            `${status.reason}\n\nWould you like to simulate this subscription for testing purposes?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              {
                text: 'Simulate',
                onPress: () => resolve(true)
              }
            ]
          );
        });

        if (!confirmed) return false;

        // Simulate the subscription purchase
        return await this.simulateSubscription(planId);
      }

      // Initialize IAP if needed
      const initialized = await iapService.initialize();
      if (!initialized) {
        Alert.alert('Initialization Failed', 'Unable to initialize payment system. Please try again.');
        return false;
      }

      // Purchase the subscription
      const productId = `subscription_${planId}`;
      const success = await iapService.purchaseProduct(productId);

      if (success) {
        // Activate the subscription
        await this.activateSubscription(plan);
      }

      return success;
    } catch (error) {
      Alert.alert('Purchase Failed', 'An error occurred during purchase.');
      return false;
    }
  }

  /**
   * Activate a subscription plan
   */
  private async activateSubscription(plan: PremiumSubscription): Promise<void> {
    try {
      // Unlock all features in the plan
      for (const featureId of plan.features) {
        // Handle feature unlocking based on feature type
        if (featureId === 'all_premium_personalities') {
          // Unlock all premium personalities (newyorker, bronxbambino, britishgentleman, southernbelle, valleygirl, surferdude)
          const premiumPersonalities = ['newyorker', 'bronxbambino', 'britishgentleman', 'southernbelle', 'valleygirl', 'surferdude'];

          for (const personalityId of premiumPersonalities) {
            await this.unlockPersonality(personalityId);
          }

          // Also unlock personalities from packs for completeness
          const packPersonalities = this.getPersonalityPacks().flatMap(pack => pack.personalities);

          for (const personalityId of packPersonalities) {
            await this.unlockPersonality(personalityId);
          }
        } else if (featureId === 'all_basic_features') {
          // Unlock basic features
          const basicFeatures = ['allow_cursing', 'priority_support', 'monthly_insights'];
          for (const featureId of basicFeatures) {
            await this.unlockFeature(featureId);
          }
        } else if (featureId === 'advanced_analytics') {
          // Unlock analytics features
          await this.unlockFeature('advanced_analytics');
        } else if (featureId === 'lifetime_support') {
          // Lifetime support (just a feature flag)
          await this.unlockFeature('lifetime_support');
        } else {
          // Regular feature
          await this.unlockFeature(featureId);
        }
      }

      // Set subscription status
      const endDate = plan.duration === 'lifetime' ? null : this.calculateEndDate(plan.duration);
      await this.storage.setSubscriptionStatus({
        planId: plan.id,
        startDate: new Date().toISOString(),
        endDate: endDate,
        isActive: true,
      });

      } catch (error) {
      throw error;
    }
  }

  /**
   * Simulate subscription purchase for testing
   */
  private async simulateSubscription(planId: string): Promise<boolean> {
    try {
      const plan = this.getSubscriptionPlans().find(p => p.id === planId);
      if (!plan) {
        return false;
      }
      // Activate the subscription
      await this.activateSubscription(plan);
      // Check what was actually saved
      const savedPersonalities = await this.storage.getUnlockedPersonalities();

      Alert.alert(
        'Subscription Simulated! 🎉',
        `${plan.name} has been activated! You now have access to all premium features.`,
        [{ text: 'Awesome!' }]
      );

      return true;
    } catch (error) {
      Alert.alert('Simulation Failed', 'Failed to simulate subscription');
      return false;
    }
  }

  /**
   * Show purchase confirmation dialog
   */
  private showPurchaseConfirmation(feature: PremiumFeature): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Purchase Premium Feature',
        `Would you like to purchase "${feature.name}" for $${feature.price}?\n\n${feature.description}`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Purchase', onPress: () => resolve(true) },
        ]
        );
    });
  }

  /**
   * Show subscription confirmation dialog
   */
  private showSubscriptionConfirmation(plan: PremiumSubscription): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Purchase Premium Subscription',
        `Would you like to subscribe to "${plan.name}" for $${plan.price}/${plan.duration}?\n\nFeatures included:\n${plan.features.map(f => `• ${f.replace('_', ' ').toUpperCase()}`).join('\n')}`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Subscribe', onPress: () => resolve(true) },
        ]
        );
    });
  }



  /**
   * Unlock a feature
   */
  private async unlockFeature(featureId: string): Promise<void> {
    try {
      const unlockedFeatures = await this.storage.getUnlockedFeatures();
      if (!unlockedFeatures.includes(featureId)) {
        unlockedFeatures.push(featureId);
        await this.storage.setUnlockedFeatures(unlockedFeatures);

        // Also save to Supabase for authenticated users
        try {
          const authService = AuthService.getInstance();
          if (authService.isSignedIn()) {
            await authService.unlockPremiumFeature(featureId);
          }
        } catch (error) {
          // Don't throw - local storage is still successful
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate subscription end date
   */
  private calculateEndDate(duration: 'month' | 'year'): string {
    const endDate = new Date();
    if (duration === 'month') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    return endDate.toISOString();
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const subscription = await this.storage.getSubscriptionStatus();
      if (!subscription || !subscription.isActive) {
        return false;
      }

      // Check if subscription has expired
      const endDate = new Date(subscription.endDate);
      const now = new Date();
      
      if (endDate < now) {
        // Subscription expired, update status
        await this.storage.setSubscriptionStatus({
          ...subscription,
          isActive: false,
        });
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user's unlocked features
   */
  async getUnlockedFeatures(): Promise<string[]> {
    try {
      return await this.storage.getUnlockedFeatures();
    } catch (error) {
      return [];
    }
  }

  /**
   * Get available personality packs
   */
  getPersonalityPacks(): PersonalityPack[] {
    return [
      {
        id: 'cultural_regional',
        name: 'Cultural/Regional Characters',
        description: 'Experience roasts from around the world with authentic regional personalities',
        price: 7.99,
        personalities: ['britishgentleman', 'southernbelle', 'valleygirl', 'surferdude', 'bronxbambino', 'newyorker'],
        icon: '🌍',
        isUnlocked: false,
      },
      {
        id: 'professional_expert',
        name: 'Professional/Expert Characters',
        description: 'Get roasted by experts in their fields with professional-grade insults',
        price: 7.99,
        personalities: ['grammar_police', 'fitness_coach', 'chef_gordon', 'detective', 'therapist'],
        icon: '💼',
        isUnlocked: false,
      },
      {
        id: 'pop_culture',
        name: 'Pop Culture Characters',
        description: 'Roasts from your favorite pop culture personalities and trends',
        price: 7.99,
        personalities: ['mean_girl', 'tiktok_influencer', 'boomer', 'hipster', 'karen'],
        icon: '📱',
        isUnlocked: false,
      },
    ];
  }

  /**
   * Get individual personality pricing
   */
  getIndividualPersonalityPrice(): number {
    return 1.99;
  }

  /**
   * Purchase a personality pack
   */
  async purchasePersonalityPack(packId: string): Promise<boolean> {
    try {
      const pack = this.getPersonalityPacks().find(p => p.id === packId);
      if (!pack) {
        throw new Error('Personality pack not found');
      }

      // Show purchase confirmation
      const confirmed = await this.showPackPurchaseConfirmation(pack);
      if (!confirmed) {
        return false;
      }

      // Use real IAP for payment
      const iapService = IAPService.getInstance();

      // Check if IAP is available
      if (!iapService.isAvailable()) {
        const status = iapService.getAvailabilityStatus();

        // Offer to simulate the purchase for testing
        Alert.alert(
          'IAP Not Available',
          `${status.reason}\n\nWould you like to simulate this purchase for testing purposes?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Simulate',
              onPress: async () => {
                await this.simulatePurchase('pack', packId);
              }
            }
          ]
        );
        return false;
      }

      // Initialize IAP if needed
      const initialized = await iapService.initialize();
      if (!initialized) {
        Alert.alert('Initialization Failed', 'Unable to initialize payment system. Please try again.');
        return false;
      }

      // Purchase the pack
      const productId = `pack_${packId}`;
      const success = await iapService.purchaseProduct(productId);
      return success;
    } catch (error) {
      Alert.alert('Purchase Failed', 'An error occurred during purchase.');
      return false;
    }
  }

  /**
   * Purchase an individual personality
   */
  async purchaseIndividualPersonality(personalityId: string): Promise<boolean> {
    try {
      const price = this.getIndividualPersonalityPrice();
      
      // Show purchase confirmation
      const confirmed = await this.showIndividualPurchaseConfirmation(personalityId, price);
      if (!confirmed) {
        return false;
      }

      // Use real IAP for payment
      const iapService = IAPService.getInstance();

      // Check if IAP is available
      if (!iapService.isAvailable()) {
        const status = iapService.getAvailabilityStatus();

        // Offer to simulate the purchase for testing
        Alert.alert(
          'IAP Not Available',
          `${status.reason}\n\nWould you like to simulate this purchase for testing purposes?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Simulate',
              onPress: async () => {
                await this.simulatePurchase('personality', personalityId);
              }
            }
          ]
        );
        return false;
      }

      // Initialize IAP if needed
      const initialized = await iapService.initialize();
      if (!initialized) {
        Alert.alert('Initialization Failed', 'Unable to initialize payment system. Please try again.');
        return false;
      }

      // Purchase the personality
      const productId = `personality_${personalityId}`;
      const success = await iapService.purchaseProduct(productId);
      return success;
    } catch (error) {
      Alert.alert('Purchase Failed', 'An error occurred during purchase.');
      return false;
    }
  }

  /**
   * Show pack purchase confirmation dialog
   */
  private showPackPurchaseConfirmation(pack: PersonalityPack): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Purchase Personality Pack',
        `Would you like to purchase "${pack.name}" for $${pack.price}?\n\n${pack.description}\n\nIncludes ${pack.personalities.length} personalities!`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Purchase', onPress: () => resolve(true) },
        ]
        );
    });
  }

  /**
   * Show individual personality purchase confirmation dialog
   */
  private showIndividualPurchaseConfirmation(personalityId: string, price: number): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Purchase Individual Personality',
        `Would you like to purchase this personality for $${price}?\n\nOr save money by buying the full pack for $7.99!`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Purchase', onPress: () => resolve(true) },
        ]
        );
    });
  }

  /**
   * Unlock a personality
   */
  private async unlockPersonality(personalityId: string): Promise<void> {
    try {
      const unlockedPersonalities = await this.storage.getUnlockedPersonalities();

      if (!unlockedPersonalities.includes(personalityId)) {
        unlockedPersonalities.push(personalityId);
        await this.storage.setUnlockedPersonalities(unlockedPersonalities);

        // Also save to Supabase for authenticated users
        try {
          const authService = AuthService.getInstance();
          if (authService.isSignedIn()) {
            await authService.unlockPremiumFeature(`personality_${personalityId}`);
          }
        } catch (error) {
          // Don't throw - local storage is still successful
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a personality is unlocked
   */
  async isPersonalityUnlocked(personalityId: string): Promise<boolean> {
    try {
      const unlockedPersonalities = await this.storage.getUnlockedPersonalities();
      return unlockedPersonalities.includes(personalityId);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user's unlocked personalities
   */
  async getUnlockedPersonalities(): Promise<string[]> {
    try {
      return await this.storage.getUnlockedPersonalities();
    } catch (error) {
      return [];
    }
  }

  /**
   * Reset all IAP ownership (for testing/debugging)
   */
  async resetAllIAPOwnership(): Promise<void> {
    try {
      // Clear all unlocked features
      await this.storage.setUnlockedFeatures([]);

      // Clear all unlocked personalities
      await this.storage.setUnlockedPersonalities([]);

      // Clear subscription status
      await this.storage.setSubscriptionStatus(null);

      } catch (error) {
      throw error;
    }
  }

  /**
   * Simulate IAP purchase for testing (when IAPs are not available)
   */
  async simulatePurchase(itemType: 'feature' | 'pack' | 'personality', itemId: string): Promise<boolean> {
    try {
      const iapService = IAPService.getInstance();

      // If IAPs are available, use real purchase
      if (iapService.isAvailable()) {
        return false; // Don't simulate if real IAPs work
      }

      if (itemType === 'feature') {
        // Unlock the feature using the proper method (saves to both local and Supabase)
        await this.unlockFeature(itemId);
      } else if (itemType === 'pack') {
        // Unlock all personalities in the pack
        const pack = this.getPersonalityPacks().find(p => p.id === itemId);
        if (pack) {
          for (const personalityId of pack.personalities) {
            await this.unlockPersonality(personalityId);
          }
        }
      } else if (itemType === 'personality') {
        // Unlock the personality using the proper method (saves to both local and Supabase)
        await this.unlockPersonality(itemId);
      } else if (itemType === 'feature' && itemId.startsWith('chat_pack_')) {
        // Handle chat pack purchases
        const packSize = itemId === 'chat_pack_20' ? 20 : itemId === 'chat_pack_50' ? 50 : 0;
        if (packSize > 0) {
          const storage = (await import('./storageService')).StorageService.getInstance();
          await (storage as any).addChatPack(packSize);
        }
      }

      Alert.alert('Purchase Simulated', `Successfully simulated purchase of ${itemType}: ${itemId}`);
      return true;
    } catch (error) {
      Alert.alert('Simulation Failed', 'Failed to simulate purchase');
      return false;
    }
  }
}

