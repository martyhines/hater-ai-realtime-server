import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { UserSettings } from '../types';
import { StorageService } from '../services/storageService';
import { FEATURES } from '../config/features';
import { PremiumService } from '../services/premiumService';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

interface Props {
  navigation: SettingsScreenNavigationProp;
}

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [settings, setSettings] = useState<UserSettings>({
    roastIntensity: 'medium',
    aiPersonality: 'sarcastic',
    enableNotifications: true,
    enableSound: true,
    allowCursing: false,
  });
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [unlockedFeatures, setUnlockedFeatures] = useState<string[]>([]);
  const [isPremiumLoading, setIsPremiumLoading] = useState(false);

  const personalities = [
    {
      id: 'sarcastic',
      name: 'Sarcastic Sam',
      emoji: '😏',
      description: 'Master of dry wit and eye-rolling commentary',
      traits: ['Sarcastic', 'Witty', 'Dry Humor'],
    },
    {
      id: 'brutal',
      name: 'Brutal Betty',
      emoji: '💀',
      description: 'No filter, no mercy, pure savage energy',
      traits: ['Brutal', 'Direct', 'Unfiltered'],
    },
    {
      id: 'witty',
      name: 'Witty Will',
      emoji: '🧠',
      description: 'Quick with clever comebacks and smart observations',
      traits: ['Witty', 'Intelligent', 'Clever'],
    },
    {
      id: 'condescending',
      name: 'Condescending Carl',
      emoji: '🤓',
      description: 'Looks down on you with intellectual superiority',
      traits: ['Condescending', 'Intellectual', 'Superior'],
    },
    {
      id: 'streetsmart',
      name: 'Street Smart',
      emoji: '🔥',
      description: 'Urban savvy with street wisdom and modern slang',
      traits: ['Streetwise', 'Confident', 'Urban'],
    },
  ];

  const intensities = [
    {
      id: 'mild',
      name: 'Mild',
      emoji: '😊',
      description: 'Gentle roasts that barely scratch the surface',
      color: '#4CAF50',
    },
    {
      id: 'medium',
      name: 'Medium',
      emoji: '😏',
      description: 'Balanced roasts with some bite',
      color: '#FF9800',
    },
    {
      id: 'savage',
      name: 'Savage',
      emoji: '💀',
      description: 'Brutal roasts that hit deep',
      color: '#F44336',
    },
  ];

  const updatePersonality = async (personality: string) => {
    const newSettings = { ...settings, aiPersonality: personality as any };
    setSettings(newSettings);
    
    // Save to persistent storage
    const storage = StorageService.getInstance();
    await storage.saveSettings(newSettings);
  };

  const updateIntensity = async (intensity: string) => {
    const newSettings = { ...settings, roastIntensity: intensity as any };
    setSettings(newSettings);
    
    // Save to persistent storage
    const storage = StorageService.getInstance();
    await storage.saveSettings(newSettings);
  };

  const toggleNotifications = async () => {
    const newSettings = { ...settings, enableNotifications: !settings.enableNotifications };
    setSettings(newSettings);
    
    // Save to persistent storage
    const storage = StorageService.getInstance();
    await storage.saveSettings(newSettings);
  };

  const toggleSound = async () => {
    const newSettings = { ...settings, enableSound: !settings.enableSound };
    setSettings(newSettings);
    
    // Save to persistent storage
    const storage = StorageService.getInstance();
    await storage.saveSettings(newSettings);
  };

  const toggleCursing = async () => {
    // Check if cursing feature is unlocked
    if (!unlockedFeatures.includes('allow_cursing')) {
      // Show premium purchase dialog
      setIsPremiumLoading(true);
      try {
        const premiumService = PremiumService.getInstance();
        const success = await premiumService.purchaseFeature('allow_cursing');
        if (success) {
          // Reload unlocked features
          const features = await premiumService.getUnlockedFeatures();
          setUnlockedFeatures(features);
          
          // Enable cursing in settings
          const newSettings = { ...settings, allowCursing: true };
          setSettings(newSettings);
          const storage = StorageService.getInstance();
          await storage.saveSettings(newSettings);
        }
      } catch (error) {
        console.error('Error purchasing cursing feature:', error);
      } finally {
        setIsPremiumLoading(false);
      }
      return;
    }

    // If already unlocked, just toggle
    const newSettings = { ...settings, allowCursing: !settings.allowCursing };
    setSettings(newSettings);
    
    // Save to persistent storage
    const storage = StorageService.getInstance();
    await storage.saveSettings(newSettings);
  };

  const handlePremiumFeaturePress = async (featureId: string) => {
    if (unlockedFeatures.includes(featureId)) {
      // Feature already unlocked, show info
      Alert.alert('Feature Unlocked', 'This premium feature is already unlocked!');
      return;
    }

    setIsPremiumLoading(true);
    try {
      const premiumService = PremiumService.getInstance();
      const success = await premiumService.purchaseFeature(featureId);
      if (success) {
        // Reload unlocked features
        const features = await premiumService.getUnlockedFeatures();
        setUnlockedFeatures(features);
      }
    } catch (error) {
      console.error('Error purchasing premium feature:', error);
    } finally {
      setIsPremiumLoading(false);
    }
  };

  // Load saved settings and check AI status on mount
  useEffect(() => {
    const loadSettingsAndCheckAI = async () => {
      const storage = StorageService.getInstance();
      
      // Load saved settings
      const savedSettings = await storage.getSettings();
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...savedSettings }));
      }
      
      // Check AI status
      const hasApiKey = await storage.hasApiKey();
      setIsAIEnabled(hasApiKey);
    };

    loadSettingsAndCheckAI();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const checkAIStatus = async () => {
        try {
          const storage = StorageService.getInstance();
          
          // Check AI availability based on BYOK setting
          let isAIAvailable = false;
          
          if (FEATURES.ENABLE_BYOK) {
            // BYOK enabled - check for user API keys
            const hasApiKey = await storage.hasApiKey();
            isAIAvailable = hasApiKey;
          } else {
            // BYOK disabled - server-powered AI should be available
            isAIAvailable = true;
          }
          
          setIsAIEnabled(isAIAvailable);
        } catch (error) {
          console.error('Error checking AI status in settings:', error);
          setIsAIEnabled(false);
        }
      };

      const loadPremiumFeatures = async () => {
        try {
          const premiumService = PremiumService.getInstance();
          const features = await premiumService.getUnlockedFeatures();
          setUnlockedFeatures(features);
        } catch (error) {
          console.error('Error loading premium features:', error);
        }
      };

      checkAIStatus();
      loadPremiumFeatures();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* AI Personality Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your AI Enemy</Text>
          <Text style={styles.sectionSubtitle}>Pick the personality that will roast you</Text>
          
          {personalities.map((personality) => (
            <TouchableOpacity
              key={personality.id}
              style={[
                styles.personalityCard,
                settings.aiPersonality === personality.id && styles.selectedCard
              ]}
              onPress={() => updatePersonality(personality.id)}
            >
              <View style={styles.personalityHeader}>
                <Text style={styles.personalityEmoji}>{personality.emoji}</Text>
                <View style={styles.personalityInfo}>
                  <Text style={styles.personalityName}>{personality.name}</Text>
                  <Text style={styles.personalityDescription}>{personality.description}</Text>
                </View>
                {settings.aiPersonality === personality.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                )}
              </View>
              <View style={styles.traitsContainer}>
                {personality.traits.map((trait, index) => (
                  <View key={index} style={styles.traitTag}>
                    <Text style={styles.traitText}>{trait}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Roast Intensity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Roast Intensity</Text>
          <Text style={styles.sectionSubtitle}>How hard should your AI enemy go?</Text>
          
          {intensities.map((intensity) => (
            <TouchableOpacity
              key={intensity.id}
              style={[
                styles.intensityCard,
                settings.roastIntensity === intensity.id && styles.selectedCard
              ]}
              onPress={() => updateIntensity(intensity.id)}
            >
              <View style={styles.intensityHeader}>
                <Text style={styles.intensityEmoji}>{intensity.emoji}</Text>
                <View style={styles.intensityInfo}>
                  <Text style={[styles.intensityName, { color: intensity.color }]}>
                    {intensity.name}
                  </Text>
                  <Text style={styles.intensityDescription}>{intensity.description}</Text>
                </View>
                {settings.roastIntensity === intensity.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Ionicons name="notifications" size={24} color="#fff" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>Push Notifications</Text>
                <Text style={styles.preferenceDescription}>
                  Get notified when your AI enemy misses you
                </Text>
              </View>
            </View>
            <Switch
              value={settings.enableNotifications}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#444', true: '#4CAF50' }}
              thumbColor={settings.enableNotifications ? '#fff' : '#ccc'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Ionicons name="volume-high" size={24} color="#fff" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>Sound Effects</Text>
                <Text style={styles.preferenceDescription}>
                  Play sounds for messages and interactions
                </Text>
              </View>
            </View>
            <Switch
              value={settings.enableSound}
              onValueChange={toggleSound}
              trackColor={{ false: '#444', true: '#4CAF50' }}
              thumbColor={settings.enableSound ? '#fff' : '#ccc'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Ionicons name="warning" size={24} color="#fff" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>
                  Allow Cursing
                  {!unlockedFeatures.includes('allow_cursing') && (
                    <Text style={styles.premiumBadge}> 🔥 PREMIUM</Text>
                  )}
                </Text>
                <Text style={styles.preferenceDescription}>
                  {unlockedFeatures.includes('allow_cursing') 
                    ? 'Let the AI use profanity in responses'
                    : 'Unlock profanity for maximum savagery ($2.99)'
                  }
                </Text>
              </View>
            </View>
            {isPremiumLoading ? (
              <ActivityIndicator size="small" color="#FF6B6B" />
            ) : (
              <Switch
                value={settings.allowCursing}
                onValueChange={toggleCursing}
                trackColor={{ false: '#444', true: '#FF6B6B' }}
                thumbColor={settings.allowCursing ? '#fff' : '#ccc'}
                disabled={!unlockedFeatures.includes('allow_cursing')}
              />
            )}
          </View>

          <TouchableOpacity
            style={styles.preferenceItem}
            onPress={() => navigation.navigate('VoiceSettings')}
          >
            <View style={styles.preferenceInfo}>
              <Ionicons name="mic" size={24} color="#FFD93D" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>Voice Settings</Text>
                <Text style={styles.preferenceDescription}>
                  Configure Siri voice for AI roasts
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.preferenceItem}
            onPress={() => navigation.navigate('SpeechToTextSettings')}
          >
            <View style={styles.preferenceInfo}>
              <Ionicons name="mic-outline" size={24} color="#4ECDC4" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>Speech-to-Text Settings</Text>
                <Text style={styles.preferenceDescription}>
                  Configure voice recognition for hands-free chatting
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Premium Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Premium Features</Text>
          <Text style={styles.sectionSubtitle}>Unlock the full potential of your AI enemy</Text>
          
          {PremiumService.getInstance().getPremiumFeatures().map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={[
                styles.premiumFeatureCard,
                unlockedFeatures.includes(feature.id) && styles.unlockedFeatureCard
              ]}
              onPress={() => handlePremiumFeaturePress(feature.id)}
            >
              <View style={styles.premiumFeatureHeader}>
                <Text style={styles.premiumFeatureEmoji}>{feature.icon}</Text>
                <View style={styles.premiumFeatureInfo}>
                  <Text style={styles.premiumFeatureName}>
                    {feature.name}
                    {unlockedFeatures.includes(feature.id) && (
                      <Text style={styles.unlockedBadge}> ✓ UNLOCKED</Text>
                    )}
                  </Text>
                  <Text style={styles.premiumFeatureDescription}>{feature.description}</Text>
                </View>
                <View style={styles.premiumFeaturePrice}>
                  {unlockedFeatures.includes(feature.id) ? (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  ) : (
                    <Text style={styles.priceText}>${feature.price}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Clear API Key Button */}
        {isAIEnabled && (
          <TouchableOpacity
            style={styles.clearApiButton}
            onPress={async () => {
              const storage = StorageService.getInstance();
              await storage.clearAll();
              setIsAIEnabled(false);
              Alert.alert('Success', 'API key cleared. AI service disabled.');
            }}
          >
            <Ionicons name="trash" size={20} color="#FF6B6B" />
            <Text style={styles.clearApiButtonText}>Clear API Key (Disable AI)</Text>
          </TouchableOpacity>
        )}

        {/* Current Settings Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Current Setup</Text>
          
          {/* AI Status */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>AI Mode:</Text>
            <View style={styles.aiStatusRow}>
              <Ionicons 
                name={isAIEnabled ? "sparkles" : "code-slash"} 
                size={16} 
                color={isAIEnabled ? "#FFD700" : "#ccc"} 
              />
              <Text style={[styles.summaryValue, { color: isAIEnabled ? "#FFD700" : "#ccc" }]}>
                {isAIEnabled ? "Real AI" : "AI Service Unavailable"}
              </Text>
            </View>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>AI Personality:</Text>
            <Text style={styles.summaryValue}>
              {personalities.find(p => p.id === settings.aiPersonality)?.name}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Roast Intensity:</Text>
            <Text style={styles.summaryValue}>
              {intensities.find(i => i.id === settings.roastIntensity)?.name}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cursing:</Text>
            <Text style={[styles.summaryValue, { color: settings.allowCursing ? '#FF6B6B' : '#ccc' }]}>
              {settings.allowCursing ? 'Allowed' : 'Disabled'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 20,
  },
  personalityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  intensityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  personalityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  personalityEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  personalityInfo: {
    flex: 1,
  },
  personalityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  personalityDescription: {
    fontSize: 14,
    color: '#ccc',
  },
  traitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  traitTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  traitText: {
    fontSize: 12,
    color: '#fff',
  },
  intensityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intensityEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  intensityInfo: {
    flex: 1,
  },
  intensityName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  intensityDescription: {
    fontSize: 14,
    color: '#ccc',
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceText: {
    marginLeft: 12,
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#ccc',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#ccc',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  aiStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearApiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  clearApiButtonText: {
    fontSize: 14,
    color: '#FF6B6B',
    marginLeft: 8,
    fontWeight: '600',
  },
  premiumBadge: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  premiumFeatureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  unlockedFeatureCard: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  premiumFeatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumFeatureEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  premiumFeatureInfo: {
    flex: 1,
  },
  premiumFeatureName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  premiumFeatureDescription: {
    fontSize: 14,
    color: '#ccc',
  },
  premiumFeaturePrice: {
    alignItems: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  unlockedBadge: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

export default SettingsScreen; 