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
    // Cultural/Regional Pack
    BRITISH_GENTLEMAN: 'personality_british_gentleman',
    SOUTHERN_BELLE: 'personality_southern_belle',
    VALLEY_GIRL: 'personality_valley_girl',
    SURFER_DUDE: 'personality_surfer_dude',
    BRONX_BAMBINO: 'personality_bronx_bambino',
    NEW_YORKER: 'personality_new_yorker',

    // Professional/Expert Pack
    GRAMMAR_POLICE: 'personality_grammar_police',
    FITNESS_COACH: 'personality_fitness_coach',
    CHEF_GORDON: 'personality_chef_gordon',
    DETECTIVE: 'personality_detective',
    THERAPIST: 'personality_therapist',

    // Pop Culture Pack
    MEAN_GIRL: 'personality_mean_girl',
    TIKTOK_INFLUENCER: 'personality_tiktok_influencer',
    BOOMER: 'personality_boomer',
    HIPSTER: 'personality_hipster',
    KAREN: 'personality_karen',
  },

  // Premium Features
  FEATURES: {
    ALLOW_CURSING: 'allow_cursing',
  },

  // Chat Packs (Consumable)
  CHAT_PACKS: {
    CHAT_PACK_20: 'chat_pack_20',
    CHAT_PACK_50: 'chat_pack_50',
  },

  // Subscription Plans
  SUBSCRIPTIONS: {
    BASIC_MONTHLY: 'subscription_basic_monthly',
    PRO_MONTHLY: 'subscription_pro_monthly',
    PRO_YEARLY: 'subscription_pro_yearly',
    LIFETIME: 'subscription_lifetime',
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
  },

  CHAT_PACK_PRICES: {
    chat_pack_20: 3.99,
    chat_pack_50: 6.99,
  },
  SUBSCRIPTION_PRICES: {
    basic_monthly: 4.99,
    pro_monthly: 9.99,
    pro_yearly: 99.99,
    lifetime: 199.99,
  },
} as const;

/**
 * Get all product IDs as a flat array
 */
export const getAllProductIds = (): string[] => {
  const packs = Object.values(IAP_PRODUCTS.PACKS);
  const personalities = Object.values(IAP_PRODUCTS.PERSONALITIES);
  const features = Object.values(IAP_PRODUCTS.FEATURES);
  const chatPacks = Object.values(IAP_PRODUCTS.CHAT_PACKS);
  const subscriptions = Object.values(IAP_PRODUCTS.SUBSCRIPTIONS);

  const allIds = [
    ...packs,
    ...personalities,
    ...features,
    ...chatPacks,
    ...subscriptions,
  ];

  return allIds;
};

/**
 * Get product type based on product ID
 */
export const getProductType = (productId: string): 'nonConsumable' | 'consumable' | 'subscription' => {
  if (productId.startsWith('pack_') || productId.startsWith('personality_')) {
    return 'nonConsumable';
  } else if (productId.startsWith('chat_pack_')) {
    return 'consumable';
  } else if (productId.startsWith('subscription_')) {
    return 'subscription';
  } else {
    return 'nonConsumable'; // Default to nonConsumable for features
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
  } else if (productId.startsWith('chat_pack_')) {
    return PRODUCT_PRICING.CHAT_PACK_PRICES[productId as keyof typeof PRODUCT_PRICING.CHAT_PACK_PRICES] || 0;
  } else if (productId.startsWith('subscription_')) {
    // Extract the plan ID from the product ID
    const planId = productId.replace('subscription_', '').replace('_monthly', '_monthly').replace('_yearly', '_yearly').replace('_lifetime', '_lifetime');
    return PRODUCT_PRICING.SUBSCRIPTION_PRICES[planId as keyof typeof PRODUCT_PRICING.SUBSCRIPTION_PRICES] || 0;
  } else {
    return PRODUCT_PRICING.FEATURE_PRICES[productId as keyof typeof PRODUCT_PRICING.FEATURE_PRICES] || 0;
  }
};

