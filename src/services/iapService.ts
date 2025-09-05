import { Alert, Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type Product,
  type Purchase,
  type PurchaseError,
} from 'react-native-iap';
import { getAllProductIds, getProductType } from '../config/iapProducts';

export interface IAPProduct {
  productId: string;
  price: string;
  currency: string;
  title: string;
  description: string;
  type: 'nonConsumable' | 'consumable' | 'subscription';
}

export interface IAPPurchase {
  productId: string;
  transactionId: string;
  transactionDate: number;
  transactionReceipt: string;
}

export class IAPService {
  private static instance: IAPService;
  private isInitialized = false;
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;



  private constructor() {}

  static getInstance(): IAPService {
    if (!IAPService.instance) {
      IAPService.instance = new IAPService();
    }
    return IAPService.instance;
  }

  /**
   * Initialize the IAP connection
   */
  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        return true;
      }

      // Initialize connection
      const result = await initConnection();
      // Set up purchase listeners
      this.setupPurchaseListeners();

      this.isInitialized = true;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Set up purchase update and error listeners
   */
  private setupPurchaseListeners(): void {
    // Listen for successful purchases
    this.purchaseUpdateSubscription = purchaseUpdatedListener(
      async (purchase: Purchase) => {
        try {
          // Finish the transaction
          await finishTransaction({ purchase, isConsumable: false });
          
          // Handle the successful purchase
          await this.handleSuccessfulPurchase(purchase);
        } catch (error) {
          }
      }
    );
    // Listen for purchase errors
    this.purchaseErrorSubscription = purchaseErrorListener(
      (error: PurchaseError) => {
        this.handlePurchaseError(error);
      }
    );
  }

  /**
   * Get available products from the store
   */
  async getAvailableProducts(): Promise<IAPProduct[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const productIds = getAllProductIds();
      const products = await getProducts({ skus: productIds });

      return products.map((product: Product) => ({
        productId: product.productId,
        price: product.price,
        currency: product.currency,
        title: product.title,
        description: product.description,
        type: getProductType(product.productId),
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Purchase a product
   */
  async purchaseProduct(productId: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Request the purchase
      const purchase = await requestPurchase({ sku: productId });
      return true;
    } catch (error) {
      this.handlePurchaseError(error as PurchaseError);
      return false;
    }
  }

  /**
   * Handle successful purchase
   */
  private async handleSuccessfulPurchase(purchase: Purchase): Promise<void> {
    try {
      const productId = purchase.productId;
      // Determine what was purchased and unlock the appropriate content
      if (productId.startsWith('pack_')) {
        await this.unlockPersonalityPack(productId);
      } else if (productId.startsWith('personality_')) {
        await this.unlockIndividualPersonality(productId);
      } else {
        await this.unlockPremiumFeature(productId);
      }

      // Show success message
      Alert.alert(
        'Purchase Successful!',
        'Your purchase has been completed successfully.',
        [{ text: 'OK' }]
        );
    } catch (error) {
      }
  }

  /**
   * Handle purchase errors
   */
  private handlePurchaseError(error: PurchaseError): void {
    let errorMessage = 'Purchase failed. Please try again.';
    
    if (error.code === 'E_USER_CANCELLED') {
      errorMessage = 'Purchase was cancelled.';
    } else if (error.code === 'E_ITEM_UNAVAILABLE') {
      errorMessage = 'This item is not available for purchase.';
    } else if (error.code === 'E_NETWORK_ERROR') {
      errorMessage = 'Network error. Please check your connection.';
    }

    Alert.alert('Purchase Failed', errorMessage);
  }

  /**
   * Unlock personality pack
   */
  private async unlockPersonalityPack(packId: string): Promise<void> {
    // Import here to avoid circular dependencies
    const { PremiumService } = await import('./premiumService');
    const premiumService = PremiumService.getInstance();
    
    // Get the pack definition
    const packs = premiumService.getPersonalityPacks();
    const pack = packs.find(p => p.id === packId.replace('pack_', ''));
    
    if (pack) {
      // Unlock all personalities in the pack
      for (const personalityId of pack.personalities) {
        await this.unlockPersonality(personalityId);
      }
    }
  }

  /**
   * Unlock individual personality
   */
  private async unlockIndividualPersonality(productId: string): Promise<void> {
    const personalityId = productId.replace('personality_', '');
    await this.unlockPersonality(personalityId);
  }

  /**
   * Unlock premium feature
   */
  private async unlockPremiumFeature(featureId: string): Promise<void> {
    // Import here to avoid circular dependencies
    const { PremiumService } = await import('./premiumService');
    const premiumService = PremiumService.getInstance();
    
    // Unlock the feature using existing method
    await this.unlockFeature(featureId);
  }

  /**
   * Unlock a personality
   */
  private async unlockPersonality(personalityId: string): Promise<void> {
    try {
      const { StorageService } = await import('./storageService');
      const storage = StorageService.getInstance();
      
      const unlockedPersonalities = await storage.getUnlockedPersonalities();
      if (!unlockedPersonalities.includes(personalityId)) {
        unlockedPersonalities.push(personalityId);
        await storage.setUnlockedPersonalities(unlockedPersonalities);
      }
    } catch (error) {
      }
  }

  /**
   * Unlock a feature
   */
  private async unlockFeature(featureId: string): Promise<void> {
    try {
      const { StorageService } = await import('./storageService');
      const storage = StorageService.getInstance();
      
      const unlockedFeatures = await storage.getUnlockedFeatures();
      if (!unlockedFeatures.includes(featureId)) {
        unlockedFeatures.push(featureId);
        await storage.setUnlockedFeatures(unlockedFeatures);
      }
    } catch (error) {
      }
  }



  /**
   * Check if IAP is available on this device
   */
  isAvailable(): boolean {
    // Basic platform check
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return false;
    }

    // iOS Simulator doesn't support IAPs
    if (Platform.OS === 'ios' && __DEV__) {
      // In development, we can try to detect if we're in simulator
      // This is a simple heuristic - in production this would be more robust
      return false; // Assume simulator for now
    }

    return true;
  }

  /**
   * Get detailed IAP availability status
   */
  getAvailabilityStatus(): { available: boolean; reason?: string } {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return { available: false, reason: 'IAPs are only available on iOS and Android devices' };
    }

    if (Platform.OS === 'ios' && __DEV__) {
      return { available: false, reason: 'IAPs are not available in iOS Simulator. Test on physical device or use TestFlight.' };
    }

    if (Platform.OS === 'android' && __DEV__) {
      return { available: false, reason: 'IAPs may not work properly in development mode. Consider using internal testing.' };
    }

    return { available: true };
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }

      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }

      await endConnection();
      this.isInitialized = false;
    } catch (error) {
      }
  }
}
