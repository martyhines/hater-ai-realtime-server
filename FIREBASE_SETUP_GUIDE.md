# Firebase Setup Guide for Optional Authentication

This guide will walk you through setting up Firebase for optional authentication in your Hater AI app.

## Prerequisites

1. A Google account
2. Node.js installed
3. Your React Native/Expo project set up

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "hater-ai-app")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click on the **Sign-in method** tab
3. **Enable Email/Password** authentication:
   - Find "Email/Password" in the provider list
   - Click on it
   - Toggle "Enable" to ON
   - Click "Save"
4. **Enable Anonymous authentication**:
   - Find "Anonymous" in the provider list
   - Click on it
   - Toggle "Enable" to ON
   - Click "Save"

## Step 3: Set Up Firestore Database

1. In your Firebase project, go to **Firestore Database** in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (you can configure security rules later)
4. Select a location for your database
5. Click "Done"

### Firestore Security Rules

After creating the database, update the security rules:

1. Go to **Firestore Database** > **Rules**
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Allow anonymous users to read/write during migration
      allow read, write: if request.auth == null && request.auth.token.firebase.sign_in_provider == 'anonymous';
    }

    // Allow users to read/write their own subcollections
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 4: Get Firebase Configuration

1. In your Firebase project, click the gear icon ⚙️ > **Project settings**
2. Scroll down to "Your apps" section
3. Click "Add app" and select the web icon `</>`
4. Register your app with a nickname (e.g., "Hater AI Web")
5. **Copy the Firebase configuration object** - you'll need this next

## Step 5: Configure Environment Variables

Create a `.env` file in your project root and add your Firebase configuration:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key-here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

Replace the values with your actual Firebase config from Step 4.

## Step 6: Install Dependencies

Add Firebase to your project:

```bash
npm install firebase
# or
yarn add firebase
```

## Step 7: Initialize Firebase in Development (Optional)

For development testing, you can use Firebase emulators:

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Start emulators
firebase emulators:start
```

When using emulators, your `.env` file will automatically connect to the local emulators instead of production Firebase.

## Step 8: Test the Setup

1. Start your app
2. Try creating an anonymous account (should work immediately)
3. Try signing up with email/password
4. Check Firebase Console to see user data being created

## Firebase Project Structure

After setup, your Firebase project should have:

- **Authentication**: Email/Password and Anonymous enabled
- **Firestore Database**: With the security rules above
- **Users collection**: Will be created automatically as users sign up

## Data Structure in Firestore

The app will create documents in this structure:

```
/users/{userId}/
├── profile data (displayName, email, etc.)
├── streak data (currentStreak, longestStreak, etc.)
├── settings (intensity, personality, etc.)
├── purchases (unlockedFeatures, etc.)
└── conversations/ (conversation summaries)
```

## Security Notes

- **Anonymous users** can read/write their own data during the migration process
- **Authenticated users** can only access their own data
- **Data migration** preserves anonymous user data when they create accounts
- **GDPR compliance** features are built-in for data deletion

## Troubleshooting

### Common Issues:

1. **"Firebase: No Firebase App '[DEFAULT]' has been created"**
   - Check that your `.env` variables are loaded correctly
   - Make sure the Firebase config is imported before other Firebase services

2. **"Auth domain not authorized"**
   - Add your app's domain to Firebase Authentication > Authorized domains
   - For Expo development: add `localhost` and your Expo dev URL

3. **"Anonymous auth not working"**
   - Ensure Anonymous authentication is enabled in Firebase Console
   - Check that you're calling `signInAnonymously()` before other auth operations

4. **"Firestore permission denied"**
   - Check your security rules
   - Ensure the user is authenticated before writing data

### Development vs Production:

- **Development**: Uses Firebase emulators if running
- **Production**: Uses your live Firebase project
- **Expo Go**: May have limitations with some Firebase features

## Next Steps

After completing this setup:

1. The app will automatically create anonymous users for new visitors
2. Users can upgrade to full accounts at any time
3. Data migrates seamlessly from anonymous to authenticated accounts
4. All user data is securely stored in Firestore

## Support

If you encounter issues:

1. Check the Firebase Console for error logs
2. Verify your configuration matches the setup guide
3. Test with Firebase emulators first
4. Check the browser console for detailed error messages

Your optional authentication system is now ready! Users can enjoy the app immediately while having the option to create accounts for enhanced features.
