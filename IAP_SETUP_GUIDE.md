# In-App Purchase Setup Guide

This guide will help you configure In-App Purchases (IAPs) for your Hater AI app in both the App Store and Google Play Store.

## 📱 Product IDs

Your app uses the following product IDs that must be configured in both stores:

### Personality Packs ($7.99 each)
- `pack_cultural_regional` - Cultural/Regional Characters Pack
- `pack_professional_expert` - Professional/Expert Characters Pack  
- `pack_pop_culture` - Pop Culture Characters Pack

### Individual Personalities ($1.99 each)
- `personality_british_gentleman` - British Gentleman
- `personality_southern_belle` - Southern Belle
- `personality_valley_girl` - Valley Girl
- `personality_surfer_dude` - Surfer Dude
- `personality_bronx_bambino` - The Bronx Bambino

### Premium Features
- `allow_cursing` - Allow Cursing ($2.99)
- `unlimited_roasts` - Unlimited Roasts ($4.99)
- `custom_personalities` - Custom Personalities ($3.99)
- `voice_roasts` - Voice Roasts ($1.99)

## 🍎 iOS App Store Connect Setup

### 1. Create In-App Purchase Products

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to **Features** → **In-App Purchases**
4. Click **+** to create new products

### 2. Configure Each Product

For each product ID above:

1. **Product Type**: Select "Non-Consumable" (for packs/personalities) or "Consumable" (for features)
2. **Product ID**: Use the exact ID from the list above
3. **Reference Name**: Use a friendly name (e.g., "Cultural Regional Pack")
4. **Price**: Set the price according to the pricing above
5. **Availability**: Set to "Available for Sale"

### 3. Product Information

For each product, add:
- **Display Name**: User-friendly name
- **Description**: What the user gets
- **Review Information**: Screenshots and description for App Review

### 4. Submit for Review

1. Go to **App Store** → **iOS App**
2. Create a new version
3. Add the IAP products to the version
4. Submit for App Review

## 🤖 Google Play Console Setup

### 1. Create In-App Products

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Go to **Monetize** → **Products** → **In-app products**
4. Click **Create product**

### 2. Configure Each Product

For each product ID above:

1. **Product ID**: Use the exact ID from the list above
2. **Name**: User-friendly name
3. **Description**: What the user gets
4. **Price**: Set the price according to the pricing above
5. **Status**: Set to "Active"

### 3. Product Details

For each product, add:
- **Product name**: Display name for users
- **Product description**: Detailed description
- **Price**: Set in your local currency

### 4. Publish

1. Go to **Release** → **Production**
2. Create a new release
3. Include the IAP products
4. Submit for review

## 🔧 Testing

### iOS Testing

1. **Sandbox Testing**:
   - Create sandbox test accounts in App Store Connect
   - Test purchases in the iOS Simulator or device
   - Use sandbox accounts to make test purchases

2. **TestFlight**:
   - Upload your app to TestFlight
   - Test IAPs with internal testers
   - Verify purchases work correctly

### Android Testing

1. **Internal Testing**:
   - Upload your app to Internal Testing track
   - Test purchases with internal testers
   - Use test accounts for purchases

2. **Closed Testing**:
   - Create a closed testing track
   - Add external testers
   - Test IAPs before public release

## ⚠️ Important Notes

### Product ID Consistency
- **CRITICAL**: Product IDs must match exactly between your code and the app stores
- Any mismatch will cause purchases to fail
- Double-check all product IDs before submitting

### Pricing
- Prices are set in the app stores, not in your code
- Your code only references the product IDs
- Prices can be updated in the stores without code changes

### Testing
- Always test IAPs thoroughly before release
- Test both successful and failed purchase scenarios
- Test on both iOS and Android devices

### App Review
- Apple and Google will test your IAPs during review
- Make sure all products work correctly
- Provide clear descriptions of what users get

## 🚀 Launch Checklist

Before launching with IAPs:

- [ ] All product IDs configured in App Store Connect
- [ ] All product IDs configured in Google Play Console
- [ ] Prices set correctly in both stores
- [ ] Products tested in sandbox/internal testing
- [ ] App submitted for review with IAPs
- [ ] IAP functionality tested on real devices
- [ ] Error handling tested for failed purchases
- [ ] Receipt validation working correctly

## 📞 Support

If you encounter issues:

1. **iOS**: Check Apple's [In-App Purchase Programming Guide](https://developer.apple.com/in-app-purchase/)
2. **Android**: Check Google's [Google Play Billing documentation](https://developer.android.com/google/play/billing)
3. **Library**: Check [react-native-iap documentation](https://github.com/dooboolab/react-native-iap)

## 💰 Revenue Tracking

After launch, monitor your IAP revenue in:
- **iOS**: App Store Connect → Sales and Trends
- **Android**: Google Play Console → Revenue reports

Remember: Apple and Google take 30% of IAP revenue, so you'll receive 70% of each purchase.

