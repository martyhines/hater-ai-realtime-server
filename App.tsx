// 🔥 CRITICAL: Import Supabase FIRST before anything else
import './src/config/supabase';

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator, AppState } from 'react-native';
import { UserSettings } from './src/types/index';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthService from './src/services/authService';
import { AnalyticsService } from './src/services/analyticsService';

import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ApiKeyScreen from './src/screens/ApiKeyScreen';
import HowToCustomModelScreen from './src/screens/HowToCustomModelScreen';
import TikTokVideoScreen from './src/screens/TikTokVideoScreen';
import { FEATURES } from './src/config/features';
// import TweetGeneratorScreen from './src/screens/TweetGeneratorScreen';
import ScreenshotScreen from './src/screens/ScreenshotScreen';
import VoiceSettingsScreen from './src/screens/VoiceSettingsScreen';
import SpeechToTextSettingsScreen from './src/screens/SpeechToTextSettingsScreen';
import InsightsScreen from './src/screens/InsightsScreen';

export type RootStackParamList = {
  Home: undefined;
  Chat: undefined;
  Settings: { scrollTo?: string; initialTab?: 'personalities' | 'intensity' | 'preferences' | 'premium' } | undefined;
  Insights: undefined;
  ApiKey: undefined;
  HowToCustomModel: undefined;
  TikTokVideo: {
    roastText: string;
    settings: UserSettings;
  };
  // TweetGenerator: {
  //   roastText: string;
  //   userName?: string;
  // };
  Screenshot: {
    roastText: string;
    userName?: string;
    userPrompt?: string;
    isForSharing?: boolean;
  };
  VoiceSettings: undefined;
  SpeechToTextSettings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  // Initialize services on app start
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('🚀 Initializing services...');

        // Initialize Auth Service first
        const authService = AuthService.getInstance();
        await authService.initialize();

        // Then initialize Analytics (depends on Auth)
        await AnalyticsService.initialize();

        console.log('✅ All services initialized');
      } catch (error) {
        console.error('❌ Failed to initialize services:', error);
      }
    };

    initializeServices();
  }, []);

  // Handle app state changes for session management
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      console.log('📱 App state changed:', nextAppState);

      if (nextAppState === 'active') {
        // App came to foreground - start new session
        console.log('🎯 Starting new session...');
        await AnalyticsService.startSession();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App went to background - end current session
        console.log('🛑 Ending current session...');
        await AnalyticsService.endSession();
      }
    };

    // Use the correct AppState API for React Native
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Manual session testing (remove in production)
    if (__DEV__) {
      // Add to global for testing
      (global as any).testEndSession = async () => {
        console.log('🧪 Manual session end triggered');
        await AnalyticsService.endSession();
      };

      (global as any).testStartSession = async () => {
        console.log('🧪 Manual session start triggered');
        await AnalyticsService.startSession();
      };
    }

    // Also handle app close/unmount
    const handleAppClose = async () => {
      console.log('🚪 App closing, ending session...');
      await AnalyticsService.endSession();
    };

    // Listen for beforeunload if available (web)
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('beforeunload', handleAppClose);
    }

    return () => {
      subscription?.remove();
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('beforeunload', handleAppClose);
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1a1a1a',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Hater AI' }}
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen} 
            options={{ title: 'Your AI Enemy' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
          <Stack.Screen
            name="Insights"
            component={InsightsScreen}
            options={{ title: 'Your Insights' }}
          />
          <Stack.Screen
            name="ApiKey"
            component={ApiKeyScreen}
            options={{ title: 'Enable AI' }}
          />
          <Stack.Screen 
            name="HowToCustomModel" 
            component={HowToCustomModelScreen} 
            options={{ title: 'How to Add Custom Models' }}
          />
          {FEATURES.ENABLE_TIKTOK_VIDEO ? (
            <Stack.Screen 
              name="TikTokVideo" 
              component={TikTokVideoScreen} 
              options={{ title: 'Create TikTok Video' }}
            />
          ) : null}
          {/* <Stack.Screen 
            name="TweetGenerator" 
            component={TweetGeneratorScreen} 
            options={{ title: 'Generate Tweet Thread' }}
          /> */}
          <Stack.Screen 
            name="Screenshot" 
            component={ScreenshotScreen} 
            options={{ title: 'Share' }}
          />
          <Stack.Screen 
            name="VoiceSettings" 
            component={VoiceSettingsScreen} 
            options={{ title: 'Voice Settings' }}
          />
          <Stack.Screen 
            name="SpeechToTextSettings" 
            component={SpeechToTextSettingsScreen} 
            options={{ title: 'Speech-to-Text Settings' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
