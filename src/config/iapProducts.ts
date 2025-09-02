/**
 * IAP Product Configuration
 * 
 * These product IDs must match exactly what you configure in:
 * - App Store Connect (iOS)
 * - Google Play Console (Android)
 * 
 * Product ID Format:
 * - Packs: pack_[pack_name]
 * - Individual Personalities: personality_[personality_id]
 * - Premium Features: [feature_id]
 */

export const IAP_PRODUCTS = {
  // Personality Packs
  PACKS: {
    CULTURAL_REGIONAL: 'pack_cultural_regional',
    PROFESSIONAL_EXPERT: 'pack_professional_expert',
    POP_CULTURE: 'pack_pop_culture',
  },

  // Individual Personalities
  PERSONALITIES: {
    BRITISH_GENTLEMAN: 'personality_british_gentleman',
    SOUTHERN_BELLE: 'personality_southern_belle',
    VALLEY_GIRL: 'personality_valley_girl',
    SURFER_DUDE: 'personality_surfer_dude',
    BRONX_BAMBINO: 'personality_bronx_bambino',
  },

  // Premium Features
  FEATURES: {
    ALLOW_CURSING: 'allow_cursing',
    UNLIMITED_ROASTS: 'unlimited_roasts',
    CUSTOM_PERSONALITIES: 'custom_personalities',
    VOICE_ROASTS: 'voice_roasts',
  },
} as const;

/**
 * Product pricing (for display purposes)
 * Actual pricing is set in App Store Connect/Google Play Console
 */
export const PRODUCT_PRICING = {
  PACK_PRICE: 7.99,
  INDIVIDUAL_PERSONALITY_PRICE: 1.99,
  FEATURE_PRICES: {
    allow_cursing: 2.99,
    unlimited_roasts: 4.99,
    custom_personalities: 3.99,
    voice_roasts: 1.99,
  },
} as const;

/**
 * Get all product IDs as a flat array
 */
export const getAllProductIds = (): string[] => {
  return [
    ...Object.values(IAP_PRODUCTS.PACKS),
    ...Object.values(IAP_PRODUCTS.PERSONALITIES),
    ...Object.values(IAP_PRODUCTS.FEATURES),
  ];
};

/**
 * Get product type based on product ID
 */
export const getProductType = (productId: string): 'nonConsumable' | 'consumable' | 'subscription' => {
  if (productId.startsWith('pack_') || productId.startsWith('personality_')) {
    return 'nonConsumable';
  } else if (productId.startsWith('subscription_')) {
    return 'subscription';
  } else {
    return 'consumable';
  }
};

/**
 * Get display price for a product
 */
export const getProductPrice = (productId: string): number => {
  if (productId.startsWith('pack_')) {
    return PRODUCT_PRICING.PACK_PRICE;
  } else if (productId.startsWith('personality_')) {
    return PRODUCT_PRICING.INDIVIDUAL_PERSONALITY_PRICE;
  } else {
    return PRODUCT_PRICING.FEATURE_PRICES[productId as keyof typeof PRODUCT_PRICING.FEATURE_PRICES] || 0;
  }
};
