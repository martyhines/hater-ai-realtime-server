import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { UserSettings } from './src/types/index';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ApiKeyScreen from './src/screens/ApiKeyScreen';
import CustomModelScreen from './src/screens/CustomModelScreen';
import HowToCustomModelScreen from './src/screens/HowToCustomModelScreen';
import TikTokVideoScreen from './src/screens/TikTokVideoScreen';
import TweetGeneratorScreen from './src/screens/TweetGeneratorScreen';
import ScreenshotScreen from './src/screens/ScreenshotScreen';
import PersonalizationQuizScreen from './src/screens/PersonalizationQuizScreen';
import VoiceSettingsScreen from './src/screens/VoiceSettingsScreen';

export type RootStackParamList = {
  Home: undefined;
  Chat: undefined;
  Settings: undefined;
  ApiKey: undefined;
  CustomModel: undefined;
  HowToCustomModel: undefined;
  TikTokVideo: {
    roastText: string;
    settings: UserSettings;
  };
  TweetGenerator: {
    roastText: string;
    userName?: string;
  };
  Screenshot: {
    roastText: string;
    userName?: string;
    messages?: any[];
  };
  PersonalizationQuiz: undefined;
  VoiceSettings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
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
            name="ApiKey" 
            component={ApiKeyScreen} 
            options={{ title: 'Enable AI' }}
          />
          <Stack.Screen 
            name="CustomModel" 
            component={CustomModelScreen} 
            options={{ title: 'Custom Models' }}
          />
          <Stack.Screen 
            name="HowToCustomModel" 
            component={HowToCustomModelScreen} 
            options={{ title: 'How to Add Custom Models' }}
          />
          <Stack.Screen 
            name="TikTokVideo" 
            component={TikTokVideoScreen} 
            options={{ title: 'Create TikTok Video' }}
          />
          <Stack.Screen 
            name="TweetGenerator" 
            component={TweetGeneratorScreen} 
            options={{ title: 'Generate Tweet Thread' }}
          />
          <Stack.Screen 
            name="Screenshot" 
            component={ScreenshotScreen} 
            options={{ title: 'Screenshot Tweet' }}
          />
          <Stack.Screen 
            name="PersonalizationQuiz" 
            component={PersonalizationQuizScreen} 
            options={{ title: 'Make It Personal' }}
          />
          <Stack.Screen 
            name="VoiceSettings" 
            component={VoiceSettingsScreen} 
            options={{ title: 'Voice Settings' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
