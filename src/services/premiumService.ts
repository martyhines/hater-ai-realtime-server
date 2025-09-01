import { Alert } from 'react-native';
import { StorageService } from './storageService';

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

      // Simulate payment processing
      const paymentSuccess = await this.processPayment(feature.price);
      if (!paymentSuccess) {
        Alert.alert('Payment Failed', 'Unable to process payment. Please try again.');
        return false;
      }

      // Unlock the feature
      await this.unlockFeature(featureId);
      
      Alert.alert(
        'Purchase Successful!',
        `${feature.name} has been unlocked!`,
        [{ text: 'OK' }]
      );

      return true;
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
   * Simulate payment processing
   */
  private async processPayment(amount: number): Promise<boolean> {
    // In a real app, this would integrate with Apple Pay, Google Pay, or Stripe
    // For now, we'll simulate a successful payment
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate 95% success rate
        resolve(Math.random() > 0.05);
      }, 1000);
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
}

