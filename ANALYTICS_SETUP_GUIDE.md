# Firebase Analytics Setup Guide

This guide will help you set up comprehensive analytics tracking for your Hater AI app.

## Overview

Firebase Analytics provides:
- **User behavior tracking** (roast requests, personality usage, streaks)
- **Conversion funnel analysis** (anonymous → authenticated → premium)
- **Revenue tracking** (IAP purchases and subscriptions)
- **Performance monitoring** (app crashes, load times)
- **A/B testing** capabilities for future feature testing

## Step 1: Install Dependencies

```bash
# Install Firebase Analytics
npm install @react-native-firebase/analytics

# For iOS (run in ios/ directory)
cd ios && pod install && cd ..

# For Android, update android/build.gradle if needed
```

## Step 2: Configure Firebase Analytics

### iOS Configuration

1. **Add to Podfile** (if not already present):
```ruby
# ios/Podfile
pod 'Firebase/Analytics'
```

2. **Enable Analytics in AppDelegate**:
```objc
// ios/YourApp/AppDelegate.m
#import <Firebase/Firebase.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  [FIRApp configure];
  return YES;
}
```

### Android Configuration

1. **Update build.gradle**:
```gradle
// android/app/build.gradle
dependencies {
  // ... other dependencies
  implementation 'com.google.firebase:firebase-analytics:21.2.0'
}
```

2. **Enable Analytics in MainApplication**:
```java
// android/app/src/main/java/com/yourapp/MainApplication.java
import com.google.firebase.analytics.FirebaseAnalytics;

@Override
public void onCreate() {
  super.onCreate();
  FirebaseAnalytics.getInstance(this);
}
```

## Step 3: Initialize Analytics Service

```typescript
// In your App.tsx or main component
import AnalyticsService from './src/services/analyticsService';

const App = () => {
  useEffect(() => {
    // Initialize analytics
    const analytics = AnalyticsService.getInstance();

    // Track app open
    analytics.trackAppOpen();

    // Track screen views
    analytics.trackScreenView('Home');
  }, []);

  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  );
};
```

## Step 4: Implement Tracking Throughout App

### Authentication Tracking

```typescript
// In AuthContext or AuthService
const analytics = AnalyticsService.getInstance();

if (isAnonymous) {
  await analytics.trackAnonymousSignup();
} else {
  await analytics.trackEmailSignup();
}

// When user upgrades from anonymous to authenticated
await analytics.trackAccountUpgrade();
```

### Roast Activity Tracking

```typescript
// In ChatScreen or AI Service
const analytics = useAnalytics();

// When user sends a message
analytics.trackRoastRequest(
  personality,
  intensity,
  userMessage.length
);

// When AI responds
analytics.trackRoastReceived(
  personality,
  intensity,
  response.length,
  responseTime
);
```

### Streak Tracking

```typescript
// In StreakService
const analytics = AnalyticsService.getInstance();

// When streak updates
await analytics.trackStreakUpdate(
  currentStreak,
  longestStreak,
  isNewRecord
);

// Milestone achievements
if (currentStreak === 7) {
  await analytics.trackStreakMilestone(7);
}
```

### Purchase Tracking

```typescript
// In PremiumService
const analytics = useAnalytics();

// When user starts purchase
analytics.trackPurchaseInitiated(productId, 'personality');

// When purchase completes
analytics.trackPurchaseCompleted(productId, 'personality', price);
```

## Step 5: Set Up User Properties

```typescript
// In AuthContext when user state changes
const analytics = AnalyticsService.getInstance();

await analytics.setUserProperty('user_type', isAnonymous ? 'anonymous' : 'authenticated');
await analytics.setUserProperty('current_personality', personality);
await analytics.setUserProperty('current_intensity', intensity.toString());
await analytics.setUserProperty('has_premium_features', hasPremium.toString());
```

## Step 6: Create Privacy Controls

### GDPR Compliance Component

```typescript
// src/components/PrivacySettings.tsx
import React from 'react';
import { View, Text, Switch, Alert } from 'react-native';
import AnalyticsService from '../services/analyticsService';

const PrivacySettings = () => {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  const handleAnalyticsToggle = async (enabled: boolean) => {
    const analytics = AnalyticsService.getInstance();

    Alert.alert(
      'Privacy Settings',
      enabled
        ? 'Enable analytics to help us improve your experience?'
        : 'Disable analytics tracking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: enabled ? 'Enable' : 'Disable',
          onPress: async () => {
            await analytics.setAnalyticsEnabled(enabled);
            setAnalyticsEnabled(enabled);
          }
        }
      ]
    );
  };

  return (
    <View>
      <Text>Analytics Tracking</Text>
      <Text style={{ fontSize: 12, color: '#666' }}>
        Help us improve by sharing anonymous usage data
      </Text>
      <Switch
        value={analyticsEnabled}
        onValueChange={handleAnalyticsToggle}
      />
    </View>
  );
};
```

## Step 7: Firebase Console Configuration

### Enable Analytics in Firebase Console

1. Go to **Firebase Console** > **Analytics**
2. Enable Google Analytics for your project
3. Configure data sharing settings
4. Set up conversion events:
   - `sign_up` (user creates account)
   - `purchase` (successful IAP)
   - `account_upgrade` (anonymous → authenticated)

### Custom Audiences for Targeting

Create audiences based on:
- **User Type**: Anonymous vs Authenticated
- **Engagement**: High vs Low streak users
- **Premium Status**: Free vs Premium users
- **Personality Preference**: Popular personality choices

## Step 8: Key Metrics to Monitor

### User Acquisition
- **App Installs**: Total downloads
- **Sign-up Rate**: % of users who create accounts
- **Upgrade Rate**: % of anonymous users who upgrade

### User Engagement
- **Daily Active Users (DAU)**
- **Session Duration**: Average time spent in app
- **Roast Requests**: Number of AI interactions
- **Streak Retention**: % of users maintaining streaks

### Business Metrics
- **IAP Conversion Rate**: % of users who make purchases
- **Average Revenue Per User (ARPU)**
- **Popular Personalities**: Which personalities are most used
- **Feature Usage**: Which premium features are popular

### Technical Metrics
- **App Crashes**: Crash-free user rate
- **Load Times**: AI response times
- **Error Rates**: Failed requests vs successful

## Step 9: A/B Testing Setup

Once you have analytics data, set up A/B tests for:

### Personality Recommendations
- Test different default personalities
- Compare engagement rates

### Upgrade Prompt Timing
- Test when to show upgrade prompts
- Compare conversion rates

### Pricing Strategies
- Test different IAP pricing
- Compare purchase rates

## Step 10: Privacy & Compliance

### GDPR Compliance Checklist
- ✅ **User Consent**: Clear opt-in/opt-out for analytics
- ✅ **Data Minimization**: Only collect necessary data
- ✅ **Data Retention**: Automatic data deletion policies
- ✅ **User Rights**: Data export/deletion capabilities
- ✅ **Privacy Policy**: Updated to include analytics

### Privacy Policy Updates

Add to your privacy policy:
```
Analytics & Performance
We use Firebase Analytics to understand how users interact with our app.
This helps us improve features and user experience.

You can opt-out of analytics tracking at any time in Settings > Privacy.
Anonymous usage data is collected to improve our services.
```

## Step 11: Advanced Analytics Features

### Custom Dashboards

Create custom dashboards for:
- **Real-time Analytics**: Live user activity
- **Cohort Analysis**: User retention over time
- **Funnel Analysis**: Conversion from anonymous → premium
- **Revenue Analytics**: IAP performance tracking

### Integration with BigQuery

Export analytics data to BigQuery for:
- Advanced SQL queries
- Custom reporting
- Integration with other business intelligence tools

## Step 12: Monitoring & Alerts

Set up alerts for:
- **App Crashes**: Immediate notification of crash spikes
- **Revenue Changes**: Significant changes in IAP revenue
- **User Drop-off**: Sudden decreases in engagement
- **Performance Issues**: Slow loading times or high error rates

## Benefits You'll Get

### Immediate Insights
- **User Behavior**: What features are most used
- **Engagement Patterns**: When users are most active
- **Conversion Funnels**: Where users drop off

### Business Intelligence
- **Revenue Optimization**: Which features drive purchases
- **User Segmentation**: Target high-value users
- **Product Development**: Data-driven feature decisions

### Performance Monitoring
- **App Stability**: Crash rates and error tracking
- **User Experience**: Load times and responsiveness
- **Technical Issues**: Early detection of problems

## Getting Started

1. **Install dependencies** and configure platforms
2. **Initialize analytics** in your app
3. **Add tracking** to key user interactions
4. **Set up user properties** for segmentation
5. **Create privacy controls** for GDPR compliance
6. **Monitor key metrics** in Firebase Console

## Sample Analytics Events

Here's what your app will track:

```typescript
// User actions
'app_open', 'screen_view', 'sign_up', 'account_upgrade'

// Roasting activity
'roast_request', 'roast_received', 'personality_change', 'intensity_change'

// Engagement
'streak_update', 'streak_milestone', 'feature_usage'

// Monetization
'begin_checkout', 'purchase', 'purchase_failed'

// Prompts & UX
'upgrade_prompt_shown', 'upgrade_prompt_action'

// Errors
'app_error'
```

This comprehensive analytics setup will give you deep insights into user behavior, help optimize your app's monetization, and guide future development decisions.
