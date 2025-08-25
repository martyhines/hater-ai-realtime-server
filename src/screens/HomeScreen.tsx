import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { UserSettings } from '../types';
import { StorageService } from '../services/storageService';
import { FEATURES } from '../config/features';


type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [settings, setSettings] = useState<UserSettings>({
    roastIntensity: 'medium',
    aiPersonality: 'sarcastic',
    enableNotifications: true,
    enableSound: true,
    allowCursing: false,
  });
  const [isAIEnabled, setIsAIEnabled] = useState(false);

  const handleStartChat = () => {
    navigation.navigate('Chat');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  // Check if AI is enabled on component mount and when screen focuses
  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const storage = StorageService.getInstance();
        
        // Load current settings
        const savedSettings = await Promise.race([
          storage.getSettings(),
          new Promise<any>((resolve) => setTimeout(() => resolve(null), 2000))
        ]);
        
        if (savedSettings) {
          setSettings(savedSettings);
        }
        
        const hasApiKey = await Promise.race([
          storage.hasApiKey(),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000)) // 3 second timeout
        ]);
        setIsAIEnabled(hasApiKey);
      } catch (error) {
        console.error('Error checking AI status:', error);
        setIsAIEnabled(false);
      }
    };

    checkAIStatus();
  }, []);

  // Check AI status when returning to this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const checkAIStatus = async () => {
        try {
          const storage = StorageService.getInstance();
          
          // Load current settings
          const savedSettings = await Promise.race([
            storage.getSettings(),
            new Promise<any>((resolve) => setTimeout(() => resolve(null), 2000))
          ]);
          
          if (savedSettings) {
            setSettings(savedSettings);
          }
          
          // Check API key status
          const hasApiKey = await Promise.race([
            storage.hasApiKey(),
            new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000)) // 3 second timeout
          ]);
          console.log('Home Screen - Has API Key:', hasApiKey);
          setIsAIEnabled(hasApiKey);
        } catch (error) {
          console.error('Error checking AI status on focus:', error);
          setIsAIEnabled(false);
        }
      };
      checkAIStatus();
    });

    return unsubscribe;
  }, [navigation]);

  const getPersonalityInfo = () => {
    const personalities = {
      sarcastic: { name: 'Sarcastic Sam', emoji: '😏' },
      brutal: { name: 'Brutal Betty', emoji: '💀' },
      witty: { name: 'Witty Will', emoji: '🧠' },
      playful: { name: 'Playful Pete', emoji: '🎮' },
      condescending: { name: 'Condescending Carl', emoji: '🤓' },
      streetsmart: { name: 'Street Smart', emoji: '🔥' },
    };
    return personalities[settings.aiPersonality];
  };

  const getIntensityInfo = () => {
    const intensities = {
      mild: { name: 'Mild', color: '#4CAF50' },
      medium: { name: 'Medium', color: '#FF9800' },
      savage: { name: 'Savage', color: '#F44336' },
    };
    return intensities[settings.roastIntensity];
  };

  const personality = getPersonalityInfo();
  const intensity = getIntensityInfo();

  return (
    <LinearGradient
      colors={['#1a1a1a', '#2d2d2d', '#1a1a1a']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Hater AI</Text>
            <Text style={styles.subtitle}>Shade Throwing At Its Finest</Text>
          </View>

          {/* Current Settings Card */}
          <View style={styles.settingsCard}>
            <Text style={styles.cardTitle}>Current Setup</Text>
            
            {/* AI Status Indicator */}
            <View style={styles.settingRow}>
              <Ionicons 
                name={isAIEnabled ? "sparkles" : "code-slash"} 
                size={24} 
                color={isAIEnabled ? "#FFD700" : "#ccc"} 
              />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>AI Mode</Text>
                <Text style={[styles.settingValue, { color: isAIEnabled ? "#FFD700" : "#ccc" }]}>
                  {isAIEnabled ? "Real AI Enabled" : "Template Mode"}
                </Text>
              </View>
            </View>
            
            <View style={styles.settingRow}>
              <Ionicons name="person" size={24} color="#fff" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>AI Personality</Text>
                <Text style={styles.settingValue}>
                  {personality.emoji} {personality.name}
                </Text>
              </View>
            </View>

            <View style={styles.settingRow}>
              <Ionicons name="flame" size={24} color="#fff" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Roast Intensity</Text>
                <Text style={[styles.settingValue, { color: intensity.color }]}>
                  {intensity.name}
                </Text>
              </View>
            </View>

            <View style={styles.settingRow}>
              <Ionicons name="warning" size={24} color="#fff" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Cursing</Text>
                <Text style={[styles.settingValue, { color: settings.allowCursing ? '#FF6B6B' : '#ccc' }]}>
                  {settings.allowCursing ? 'Allowed' : 'Disabled'}
                </Text>
              </View>
            </View>
            <View style={styles.settingRow}>
              <Ionicons name="mic" size={24} color="#fff" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Voice</Text>
                <Text style={[styles.settingValue, { color: settings.voiceSettings?.autoPlay ? '#FF6B6B' : '#ccc' }]}>
                  {settings.voiceSettings?.autoPlay ? 'Auto Play' : 'Tap Mic In Chat To Play'}
                </Text>
              </View>
          </View>
          </View>

          {/* Voice Settings Button */}
          <TouchableOpacity
            style={styles.voiceSettingsButton}
            onPress={() => navigation.navigate('VoiceSettings')}
            activeOpacity={0.7}
          >
            <Ionicons name="mic" size={24} color="#FFD93D" />
            <Text style={styles.voiceSettingsButtonText}>Voice Settings</Text>
          </TouchableOpacity>

          {/* Speech-to-Text Settings Button */}
          <TouchableOpacity
            style={styles.speechToTextSettingsButton}
            onPress={() => navigation.navigate('SpeechToTextSettings')}
            activeOpacity={0.7}
          >
            <Ionicons name="mic-outline" size={24} color="#4ECDC4" />
            <Text style={styles.speechToTextSettingsButtonText}>Speech-to-Text Settings</Text>
          </TouchableOpacity>

          {/* Enable AI Button */}
          {FEATURES.ENABLE_BYOK ? (
          <TouchableOpacity
            style={[styles.enableAiButton, isAIEnabled && styles.enableAiButtonActive]}
            onPress={() => navigation.navigate('ApiKey')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isAIEnabled ? "checkmark-circle" : "sparkles"} 
              size={24} 
              color={isAIEnabled ? "#4CAF50" : "#FFD700"} 
            />
            <Text style={[styles.enableAiButtonText, isAIEnabled && styles.enableAiButtonTextActive]}>
              {isAIEnabled ? "AI Settings" : "Enable Real AI"}
            </Text>
          </TouchableOpacity>
          ) : null}

          {/* Main Action Button */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartChat}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              style={styles.buttonGradient}
            >
              <Ionicons name="chatbubbles" size={32} color="#fff" />
              <Text style={styles.startButtonText}>Start Getting Roasted</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>What to Expect</Text>
            
            <View style={styles.featureItem}>
              <Ionicons name="sparkles" size={20} color="#FFD700" />
              <Text style={styles.featureText}>4 Unique AI Personalities</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="flame" size={20} color="#FF6B6B" />
              <Text style={styles.featureText}>3 Roast Intensity Levels</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="chatbubble" size={20} color="#4ECDC4" />
              <Text style={styles.featureText}>Contextual Responses</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="settings" size={20} color="#A8E6CF" />
              <Text style={styles.featureText}>Customizable Experience</Text>
            </View>
          </View>

          {/* Clear API Key Button (when AI is enabled) */}
          {isAIEnabled && (
            <TouchableOpacity
              style={styles.clearApiButton}
              onPress={async () => {
                const storage = StorageService.getInstance();
                await storage.clearAll();
                setIsAIEnabled(false);
                Alert.alert('Success', 'Switched to template mode!');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash" size={20} color="#FF6B6B" />
              <Text style={styles.clearApiButtonText}>Switch to Template Mode</Text>
            </TouchableOpacity>
          )}

          {/* Personalization Button */}
          <TouchableOpacity
            style={styles.personalizationButton}
            onPress={() => navigation.navigate('PersonalizationQuiz')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-circle" size={24} color="#4ECDC4" />
            <Text style={styles.personalizationButtonText}>Make It Personal</Text>
          </TouchableOpacity>

          {/* Voice Settings Button */}
          <TouchableOpacity
            style={styles.voiceSettingsButton}
            onPress={() => navigation.navigate('VoiceSettings')}
            activeOpacity={0.7}
          >
            <Ionicons name="mic" size={24} color="#FFD93D" />
            <Text style={styles.voiceSettingsButtonText}>Voice Settings</Text>
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleSettings}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={24} color="#fff" />
            <Text style={styles.settingsButtonText}>Settings</Text>
          </TouchableOpacity>


        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  settingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingInfo: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  startButton: {
    marginBottom: 30,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  featuresContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
  },
  enableAiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginBottom: 16,
  },
  enableAiButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  enableAiButtonText: {
    fontSize: 16,
    color: '#FFD700',
    marginLeft: 8,
    fontWeight: '600',
  },
  enableAiButtonTextActive: {
    color: '#4CAF50',
  },
  clearApiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  clearApiButtonText: {
    fontSize: 14,
    color: '#FF6B6B',
    marginLeft: 8,
    fontWeight: '600',
  },
  personalizationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderWidth: 1,
    borderColor: '#4ECDC4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  personalizationButtonText: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  voiceSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 217, 61, 0.1)',
    borderWidth: 1,
    borderColor: '#FFD93D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  voiceSettingsButtonText: {
    color: '#FFD93D',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  speechToTextSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderWidth: 1,
    borderColor: '#4ECDC4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  speechToTextSettingsButtonText: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  settingsButtonText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },

});

export default HomeScreen; 