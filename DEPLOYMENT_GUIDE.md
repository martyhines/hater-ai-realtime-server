# Deployment Guide for Hater AI

## Prerequisites

1. **Expo Account**: Sign up at [expo.dev](https://expo.dev)
2. **EAS CLI**: `npm install -g @expo/eas-cli`
3. **App Store Connect Account** (for iOS)
4. **Google Play Console Account** (for Android)

## Step 1: Initial Setup

### Install Dependencies
```bash
npm install
```

### Login to Expo
```bash
eas login
```

### Configure EAS
```bash
eas build:configure
```

## Step 2: Update Configuration

### Update app.json
- Replace `"your-project-id-here"` with your actual Expo project ID
- Update bundle identifiers if needed
- Verify app name and version

### Update Legal Documents
- Edit `PRIVACY_POLICY.md` with your contact information
- Edit `TERMS_OF_SERVICE.md` with your contact information
- Update `README.md` with your repository links

## Step 3: Build for Production

### Clean and Build
```bash
# Remove console.log statements and build
npm run build:android
npm run build:ios
```

### Alternative: Build Preview First
```bash
# Test with preview build
npm run build:preview
```

## Step 4: Submit to App Stores

### iOS (App Store)
1. **App Store Connect Setup**:
   - Create app in App Store Connect
   - Add app information, screenshots, description
   - Set up privacy policy and terms of service URLs

2. **Submit Build**:
   ```bash
   npm run submit:ios
   ```

### Android (Google Play)
1. **Google Play Console Setup**:
   - Create app in Google Play Console
   - Add app information, screenshots, description
   - Set up privacy policy and terms of service

2. **Submit Build**:
   ```bash
   npm run submit:android
   ```

## Step 5: App Store Optimization

### Screenshots
- iPhone 6.7" (1290 x 2796)
- iPhone 5.5" (1242 x 2208)
- iPad (2048 x 2732)
- Android phone (1080 x 1920)
- Android tablet (1920 x 1200)

### App Description
```
Hater AI - Your AI Enemy Companion 🤖

Get roasted by intelligent AI personalities! Choose from 4 unique characters:

😏 Sarcastic Sam - Master of dry wit
💀 Brutal Betty - No filter, pure savage
🧠 Witty Will - Clever comebacks
🤓 Condescending Carl - Intellectual superiority

Features:
• 4 AI Personalities
• 3 Roast Intensity Levels
• Works Offline (Template Mode)
• AI Enabled Integration (Optional)
• Beautiful Dark UI

Perfect for entertainment and humor! All responses are AI-generated and meant for fun.

Download now and meet your AI enemy! 🔥
```

### Keywords
```
hater,ai,roast,comedy,humor,entertainment,sarcasm,insults,funny,chat,personality
```

## Step 6: Post-Launch

### Monitor Performance
- Track app store reviews
- Monitor crash reports
- Analyze user engagement

### Marketing
- Social media promotion
- Influencer outreach
- Press releases

### Support
- Set up customer support system
- Create FAQ documentation
- Monitor user feedback

## Troubleshooting

### Build Issues
```bash
# Clear cache
expo r -c

# Reset EAS
eas build:configure --clear-cache
```

### Submission Issues
- Verify app store metadata
- Check for policy violations
- Ensure all required fields are completed

## Next Steps

1. **Analytics**: Set up Firebase Analytics
2. **Crash Reporting**: Implement crash reporting
3. **User Feedback**: Add in-app feedback system
4. **Updates**: Plan feature updates and improvements 