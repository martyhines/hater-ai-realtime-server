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
      console.log('IAP connection initialized:', result);

      // Set up purchase listeners
      this.setupPurchaseListeners();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
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
        console.log('Purchase successful:', purchase);
        
        try {
          // Finish the transaction
          await finishTransaction({ purchase, isConsumable: false });
          
          // Handle the successful purchase
          await this.handleSuccessfulPurchase(purchase);
        } catch (error) {
          console.error('Error finishing transaction:', error);
        }
      }
    );

    // Listen for purchase errors
    this.purchaseErrorSubscription = purchaseErrorListener(
      (error: PurchaseError) => {
        console.error('Purchase error:', error);
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
      console.error('Error getting products:', error);
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

      console.log('Attempting to purchase:', productId);
      
      // Request the purchase
      const purchase = await requestPurchase({ sku: productId });
      console.log('Purchase requested:', purchase);

      return true;
    } catch (error) {
      console.error('Error purchasing product:', error);
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
      console.log('Handling successful purchase for:', productId);

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
      console.error('Error handling successful purchase:', error);
    }
  }

  /**
   * Handle purchase errors
   */
  private handlePurchaseError(error: PurchaseError): void {
    console.error('Purchase error:', error);
    
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
      console.error('Error unlocking personality:', error);
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
      console.error('Error unlocking feature:', error);
    }
  }



  /**
   * Check if IAP is available on this device
   */
  isAvailable(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
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
      console.error('Error cleaning up IAP:', error);
    }
  }
}
