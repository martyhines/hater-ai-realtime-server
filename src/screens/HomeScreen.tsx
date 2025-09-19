import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { UserSettings, getPersonalityInfo } from '../types';
import { StorageService } from '../services/storageService';
import { StreakService } from '../services/streakService';
import { PremiumService } from '../services/premiumService';
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
  const [streak, setStreak] = useState(0);

  const handleStartChat = () => {
    navigation.navigate('Chat');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handlePremium = () => {
    navigation.navigate('Settings', { initialTab: 'premium' });
  };

  const handleNavigateToPersonalitySettings = () => {
    navigation.navigate('Settings', { initialTab: 'personalities' });
  };

  const handleInsights = () => {
    navigation.navigate('Insights');
  };

  const handleGlobalInsights = () => {
    navigation.navigate('Insights', { global: true });
  };

  const handleNavigateToIntensitySettings = () => {
    navigation.navigate('Settings', { initialTab: 'intensity' });
  };

  const handleNavigateToCursingSettings = () => {
    navigation.navigate('Settings', { initialTab: 'premium' });
  };

  const handleNavigateToVoiceSettings = () => {
    navigation.navigate('VoiceSettings');
  };

  // Check if AI is enabled on component mount and when screen focuses
  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const storage = StorageService.getInstance();

        // Update streak when user opens the app
        const streakService = StreakService.getInstance();
        const currentStreak = await streakService.updateStreak();
        setStreak(currentStreak);

        // Load current settings
        const savedSettings = await Promise.race([
          storage.getSettings(),
          new Promise<any>((resolve) => setTimeout(() => resolve(null), 2000))
        ]);

        if (savedSettings) {
          setSettings(savedSettings);
        }

        // Check AI availability based on BYOK setting
        let isAIAvailable = false;

        if (FEATURES.ENABLE_BYOK) {
          // BYOK enabled - check for user API keys
          const hasApiKey = await Promise.race([
            storage.hasApiKey(),
            new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000))
          ]);
          isAIAvailable = hasApiKey;
        } else {
          // BYOK disabled - server-powered AI should be available
          isAIAvailable = true;
        }

        setIsAIEnabled(isAIAvailable);
      } catch (error) {
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

          // Check AI availability based on BYOK setting
          let isAIAvailable = false;

          if (FEATURES.ENABLE_BYOK) {
            // BYOK enabled - check for user API keys
            const hasApiKey = await Promise.race([
              storage.hasApiKey(),
              new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000))
            ]);
            isAIAvailable = hasApiKey;
          } else {
            // BYOK disabled - server-powered AI should be available
            isAIAvailable = true;
          }

          setIsAIEnabled(isAIAvailable);
        } catch (error) {
          setIsAIEnabled(false);
        }
      };
      checkAIStatus();
    });

    return unsubscribe;
  }, [navigation]);


  const getIntensityInfo = () => {
    const intensities = {
      mild: { name: 'Mild', color: '#4CAF50' },
      medium: { name: 'Medium', color: '#FF9800' },
      savage: { name: 'Savage', color: '#F44336' },
    };
    const key = (settings.roastIntensity as keyof typeof intensities) || 'medium';
    return intensities[key] || intensities.medium;
  };

  const personality = getPersonalityInfo(settings.aiPersonality);
  const intensity = getIntensityInfo();

  return (
    <LinearGradient
      colors={['#1a1a1a', '#2d2d2d', '#1a1a1a']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          {/* <View style={styles.header}>
            <Image
              source={require('../../assets/images/roasterBase.png')}
              style={styles.headerImage}
              resizeMode="contain"
            /> */}
            {/* <Text style={styles.title}>Hater AI</Text>
            <Text style={styles.subtitle}>Shade Throwing At Its Finest</Text> */}
          {/* </View> */}
          {/* Main Action Button */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartChat}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF0000', '#FF8E53']}
              style={styles.buttonGradient}
            >
              <Ionicons name="chatbubbles" size={32} color="#fff" />
              <Text style={styles.startButtonText}>Start Chatting</Text>
            </LinearGradient>
          </TouchableOpacity>
          {/* Settings and Premium Buttons Row */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={handleSettings}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={24} color="#fff" />
              <Text style={styles.settingsButtonText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.premiumButton}
              onPress={handlePremium}
              activeOpacity={0.7}
            >
              <Ionicons name="diamond" size={24} color="#FFD700" />
              <Text style={styles.premiumButtonText}>Premium</Text>
            </TouchableOpacity>
          </View>

          {/* Insights Button */}
          <TouchableOpacity
            style={styles.insightsButton}
            onPress={handleInsights}
            activeOpacity={0.7}
          >
            <Ionicons name="analytics" size={24} color="#fff" />
            <Text style={styles.insightsButtonText}>Your Insights</Text>
          </TouchableOpacity>

          {/* Global Insights Button */}
          <TouchableOpacity
            style={styles.globalInsightsButton}
            onPress={handleGlobalInsights}
            activeOpacity={0.7}
          >
            <Ionicons name="earth" size={24} color="#FFD700" />
            <Ionicons name="lock-closed" size={12} color="#FFD700" style={styles.lockIcon} />
            <Text style={styles.globalInsightsButtonText}>Global Insights</Text>
          </TouchableOpacity>

          {/* Voice Settings Button */}
          {/* <TouchableOpacity
            style={styles.voiceSettingsButton}
            onPress={() => navigation.navigate('VoiceSettings')}
            activeOpacity={0.7}
          >
            <Ionicons name="mic" size={24} color="#FFD93D" />
            <Text style={styles.voiceSettingsButtonText}>Voice Settings</Text>
          </TouchableOpacity> */}

          {/* Current Settings Card */}
          <View style={styles.settingsCard}>
            <View style={styles.cardBackground}>
              <Image
                source={require('../../assets/images/roasterBase.png')}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.cardForeground}>
              {/* <Text style={styles.cardTitle}>Current Setup</Text> */}
            
            {/* Streak Counter */}
            {streak > 0 && (
              <View style={styles.settingRow}>
                <Ionicons name="flame" size={24} color="#FF6B6B" />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Daily Streak</Text>
                  <Text style={[styles.settingValue, { color: '#FF6B6B' }]}>
                    🔥 {streak} {streak === 1 ? 'day' : 'days'}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleNavigateToPersonalitySettings}
              activeOpacity={0.7}
            >
              <Ionicons name="person" size={24} color="#fff" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>AI Personality</Text>
                <Text style={styles.settingValue}>
                  {personality.emoji} {personality.name}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleNavigateToIntensitySettings}
              activeOpacity={0.7}
            >
              <Ionicons name="flame" size={24} color="#fff" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Roast Intensity</Text>
                <Text style={[styles.settingValue, { color: intensity.color }]}>
                  {intensity.name}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleNavigateToCursingSettings}
              activeOpacity={0.7}
            >
              <Ionicons name="warning" size={24} color="#fff" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Cursing</Text>
                <Text style={[styles.settingValue, { color: settings.allowCursing ? '#FF6B6B' : '#ccc' }]}>
                  {settings.allowCursing ? 'Allowed' : 'Disabled'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleNavigateToVoiceSettings}
              activeOpacity={0.7}
            >
              <Ionicons name="mic" size={24} color="#fff" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Voice</Text>
                <Text style={[styles.settingValue, { color: settings.voiceSettings?.autoPlay ? '#FF6B6B' : '#ccc' }]}>
                  {settings.voiceSettings?.autoPlay ? 'Auto Play' : 'Tap Mic In Chat To Play'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            </View>
          </View>

          {/* Voice Settings Button */}
          {/* <TouchableOpacity
            style={styles.voiceSettingsButton}
            onPress={() => navigation.navigate('VoiceSettings')}
            activeOpacity={0.7}
          >
            <Ionicons name="mic" size={24} color="#FFD93D" />
            <Text style={styles.voiceSettingsButtonText}>Voice Settings</Text>
          </TouchableOpacity> */}

          {/* Speech-to-Text Settings Button */}
          {/* <TouchableOpacity
            style={styles.speechToTextSettingsButton}
            onPress={() => navigation.navigate('SpeechToTextSettings')}
            activeOpacity={0.7}
          >
            <Ionicons name="mic-outline" size={24} color="#4ECDC4" />
            <Text style={styles.speechToTextSettingsButtonText}>Speech-to-Text Settings</Text>
          </TouchableOpacity> */}

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
                {isAIEnabled ? "AI Settings" : "Enable AI Enabled"}
              </Text>
            </TouchableOpacity>
          ) : null}



          {/* Features */}
          {/* <View style={styles.featuresContainer}>
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
          </View> */}

          {/* Clear API Key Button (only when using BYOK) */}
          {FEATURES.ENABLE_BYOK && isAIEnabled && (
            <TouchableOpacity
              style={styles.clearApiButton}
              onPress={async () => {
                const storage = StorageService.getInstance();
                await storage.clearAll();
                setIsAIEnabled(false);
                Alert.alert('Success', 'AI service disabled!');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash" size={20} color="#FF6B6B" />
              <Text style={styles.clearApiButtonText}>Disable AI Service</Text>
            </TouchableOpacity>
          )}

          {/* Debug: Reset IAP Ownership */}
          <TouchableOpacity
            style={styles.debugButton}
            onPress={async () => {
              Alert.alert(
                'Reset IAP Ownership',
                'This will remove all purchased features and personalities for testing purposes. Continue?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        const premiumService = PremiumService.getInstance();
                        await premiumService.resetAllIAPOwnership();
                        Alert.alert('Success', 'All IAP ownership has been reset!');
                      } catch (error) {
                        Alert.alert('Error', 'Failed to reset IAP ownership');
                      }
                    }
                  }
                ]
              );
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="bug" size={16} color="#666" />
            <Text style={styles.debugButtonText}>Reset IAPs (Debug)</Text>
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
  headerImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  settingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  cardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    opacity: 0.05, // Very subtle for readability
  },
  cardForeground: {
    position: 'relative',
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
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
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
    marginBottom: 12,
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
    marginTop: 12,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  settingsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  premiumButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  settingsButtonText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  premiumButtonText: {
    fontSize: 16,
    color: '#FFD700',
    marginLeft: 8,
    fontWeight: '600',
  },
  insightsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(76, 175, 80, 0.2)', // Green tint for analytics
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  insightsButtonText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  globalInsightsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)', // Golden tint for premium
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  globalInsightsButtonText: {
    fontSize: 16,
    color: '#FFD700',
    marginLeft: 8,
    fontWeight: '600',
  },
  lockIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(102, 102, 102, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(102, 102, 102, 0.3)',
  },
  debugButtonText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },

});

export default HomeScreen; 