import { Alert } from 'react-native';
import { StorageService } from './storageService';
import { IAPService } from './iapService';

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
  duration: 'month' | 'year';
  features: string[];
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
        id: 'unlimited_roasts',
        name: 'Unlimited Roasts',
        description: 'Remove daily roast limits',
        price: 4.99,
        icon: '⚡',
        isUnlocked: false,
      },
      {
        id: 'custom_personalities',
        name: 'Custom Personalities',
        description: 'Create your own AI personality',
        price: 3.99,
        icon: '🎭',
        isUnlocked: false,
      },
      {
        id: 'voice_roasts',
        name: 'Voice Roasts',
        description: 'Hear your AI enemy speak the roasts',
        price: 1.99,
        icon: '🎤',
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
        id: 'basic',
        name: 'Basic Premium',
        price: 4.99,
        duration: 'month',
        features: ['allow_cursing', 'voice_roasts'],
      },
      {
        id: 'pro',
        name: 'Pro Premium',
        price: 9.99,
        duration: 'month',
        features: ['allow_cursing', 'unlimited_roasts', 'custom_personalities', 'voice_roasts'],
      },
      {
        id: 'yearly_pro',
        name: 'Pro Premium (Yearly)',
        price: 99.99,
        duration: 'year',
        features: ['allow_cursing', 'unlimited_roasts', 'custom_personalities', 'voice_roasts'],
      },
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
      console.error('Error checking feature unlock status:', error);
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
      if (!iapService.isAvailable()) {
        Alert.alert('Not Available', 'In-app purchases are not available on this device.');
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
      return success;
    } catch (error) {
      console.error('Error purchasing feature:', error);
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

      // Show purchase confirmation
      const confirmed = await this.showSubscriptionConfirmation(plan);
      if (!confirmed) {
        return false;
      }

      // Simulate payment processing
      const paymentSuccess = await this.processPayment(plan.price);
      if (!paymentSuccess) {
        Alert.alert('Payment Failed', 'Unable to process payment. Please try again.');
        return false;
      }

      // Unlock all features in the plan
      for (const featureId of plan.features) {
        await this.unlockFeature(featureId);
      }

      // Set subscription status
      await this.storage.setSubscriptionStatus({
        planId: plan.id,
        startDate: new Date().toISOString(),
        endDate: this.calculateEndDate(plan.duration),
        isActive: true,
      });

      Alert.alert(
        'Subscription Active!',
        `${plan.name} has been activated with all premium features!`,
        [{ text: 'OK' }]
      );

      return true;
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      Alert.alert('Purchase Failed', 'An error occurred during purchase.');
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
      }
    } catch (error) {
      console.error('Error unlocking feature:', error);
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
      console.error('Error checking subscription status:', error);
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
      console.error('Error getting unlocked features:', error);
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
        personalities: ['britishgentleman', 'southernbelle', 'valleygirl', 'surferdude', 'bronxbambino'],
        icon: '🌍',
        isUnlocked: false,
      },
      {
        id: 'professional_expert',
        name: 'Professional/Expert Characters',
        description: 'Get roasted by experts in their fields with professional-grade insults',
        price: 7.99,
        personalities: ['grammarnazi', 'fitnesscoach', 'chefgordon', 'detective', 'therapist'],
        icon: '💼',
        isUnlocked: false,
      },
      {
        id: 'pop_culture',
        name: 'Pop Culture Characters',
        description: 'Roasts from your favorite pop culture personalities and trends',
        price: 7.99,
        personalities: ['meangirl', 'tiktokinfluencer', 'boomer', 'hipster', 'karen'],
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
        Alert.alert('Not Available', 'In-app purchases are not available on this device.');
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
      console.error('Error purchasing personality pack:', error);
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
        Alert.alert('Not Available', 'In-app purchases are not available on this device.');
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
      console.error('Error purchasing individual personality:', error);
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
      }
    } catch (error) {
      console.error('Error unlocking personality:', error);
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
      console.error('Error checking personality unlock status:', error);
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
      console.error('Error getting unlocked personalities:', error);
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

      console.log('✅ All IAP ownership has been reset');
    } catch (error) {
      console.error('Error resetting IAP ownership:', error);
      throw error;
    }
  }
}

