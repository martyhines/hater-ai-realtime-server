# Hater AI 🤖

**Your AI Enemy Companion** - Get roasted by intelligent AI personalities with premium features, voice integration, and advanced analytics!

## ✨ Features

### 🎭 AI Personalities
- **16+ Premium AI Personalities** including:
  - Sarcastic Sam (Free)
  - Grammar Police, Fitness Coach, Therapist, British Gentleman
  - Bronx Bambino, Valley Girl, Surfer Dude, Mean Girl
  - Professional Expert Pack: CEO, HR Manager, Startup Coach
  - Pop Culture Pack: Movie Critic, Music Snob, Social Media Guru
- **3 Roast Intensity Levels**: Mild, Medium, Savage
- **Context-Aware Roasts**: AI analyzes your messages for personalized burns

### 💰 Monetization & Premium Features
- **In-App Purchases (IAPs)** for premium personalities and chat packs
- **3 Subscription Tiers**: Basic ($9.99/mo), Pro ($99.99/yr), Lifetime ($199.99)
- **Chat Limits**: Free tier with daily limits, premium unlimited
- **Premium Packs**: Personality bundles with savings

### 🎤 Advanced Features
- **Real-Time Voice**: Speech-to-text with voice button and auto-send
- **TikTok Video Generation**: Create shareable roast videos
- **Screenshot Sharing**: Capture and share chat screenshots
- **Global Insights**: Analytics dashboard with usage statistics
- **Streak Tracking**: Daily chat streaks and achievements

### 🤖 AI Integration
- **Multiple AI Providers**: Cohere, Gemini, OpenAI, Together AI
- **Fallback System**: Graceful degradation when services unavailable
- **Context Analysis**: Smart personality and topic detection
- **Conversation History**: Persistent chat memory

## 🚀 Quick Start

### For Users
Download from the **App Store** or **Google Play Store**.

### For Developers

#### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (macOS) or Android Emulator

#### Setup
```bash
# Clone the repository
git clone [your-repo-url]
cd hater-ai-clean

# Install dependencies
npm install

# Start development server
npx expo start

# For iOS
npx expo run:ios

# For Android
npx expo run:android

# For web (limited functionality)
npx expo start --web
```

## 📱 Usage

1. **Launch App**: Choose between free template mode or premium AI
2. **Select Personality**: Choose from 16+ AI personalities (unlock premium ones)
3. **Set Preferences**: Adjust roast intensity and voice settings
4. **Start Chatting**: Get roasted with context-aware responses
5. **Share Content**: Screenshot chats or generate TikTok videos
6. **View Analytics**: Check your roast statistics and insights

## 🏗️ Architecture

### Core Services
- **AI Services**: Modular provider system (Cohere, Gemini, OpenAI)
- **Context Analyzer**: Extracts personality traits, interests, profession from user input
- **Premium Service**: Manages IAPs, subscriptions, and feature unlocks
- **Analytics Service**: Tracks usage, errors, and user behavior
- **Storage Service**: Secure local data management

### Key Technologies
- **React Native + Expo**: Cross-platform mobile development
- **TypeScript**: Type-safe development
- **Supabase**: Backend for analytics and user data
- **RevenueCat**: In-app purchase management
- **React Navigation**: Smooth screen transitions

## 🔧 Configuration

### Environment Variables
```env
# Supabase (for analytics)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# RevenueCat (for IAPs)
REVENUECAT_API_KEY=your_revenuecat_key

# Optional: API Keys for BYOK mode
OPENAI_API_KEY=your_openai_key
COHERE_API_KEY=your_cohere_key
GEMINI_API_KEY=your_gemini_key
```

### Feature Flags
- `ENABLE_BYOK`: Bring Your Own Keys mode
- `ENABLE_REALTIME_VOICE`: Voice features
- `ENABLE_TIKTOK_VIDEO`: Video generation
- `ENABLE_ANALYTICS`: Usage tracking

## 📊 Analytics & Insights

### User Insights
- **Personality Usage**: Track which AI personalities you use most
- **Chat Statistics**: Message counts, session lengths, daily streaks
- **Premium Analytics**: Feature usage and subscription benefits

### Global Insights (Premium)
- **Community Statistics**: Aggregated usage across all users
- **Popular Personalities**: Most-used AI personalities globally
- **Usage Trends**: Peak activity times and popular features

## 🔒 Privacy & Security

- **Local Storage**: All chat data stored locally on device
- **Secure API Keys**: Encrypted local storage for user-provided keys
- **Analytics Opt-in**: Usage tracking with user consent
- **No Personal Data**: No collection of personal information
- **GDPR Compliant**: User data control and deletion options

## 🚀 Deployment

### iOS App Store
```bash
# Build for production
npm run build:ios

# Submit to App Store
npm run submit:ios
```

### Google Play Store
```bash
# Build for production
npm run build:android

# Submit to Play Store
npm run submit:android
```

### EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for both platforms
eas build --platform ios
eas build --platform android
```

## 📈 Version History

### v2.5.0 (Latest)
- Added 16+ premium AI personalities
- Implemented In-App Purchases (IAPs)
- Added real-time voice features
- Global insights and advanced analytics
- TikTok video generation
- Screenshot sharing functionality
- Streak tracking and achievements

### v2.0.0
- Multiple AI provider support (Cohere, Gemini, OpenAI)
- Premium subscription system
- Advanced analytics integration
- Context-aware roast generation
- Voice integration foundation

### v1.5.0
- Template mode improvements
- UI/UX enhancements
- Basic analytics implementation
- Offline functionality improvements

### v1.0.0
- Initial release
- 4 AI personalities
- Template mode
- Dark theme UI
- Basic chat functionality

## 🐛 Troubleshooting

### Common Issues
- **API Key Issues**: Ensure keys are valid and have proper permissions
- **Voice Not Working**: Check microphone permissions in device settings
- **IAP Not Working**: Verify App Store/TestFlight configuration
- **Analytics Not Loading**: Check Supabase connection and permissions

### Debug Mode
```bash
# Enable debug logging
npx expo start --clear
```

## 📞 Support

- **Email**: [Your Support Email]
- **Issues**: [GitHub Issues Link]
- **Documentation**: [Internal Wiki/Docs]

## 📄 License

[Your License Information]

---

**Made with ❤️ for people who love getting roasted by AI** 