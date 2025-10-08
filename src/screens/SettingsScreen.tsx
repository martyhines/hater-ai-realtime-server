import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { UserSettings } from '../types';
import { StorageService } from '../services/storageService';
import { StreakService } from '../services/streakService';
import { AnalyticsService } from '../services/analyticsService';
import { FEATURES } from '../config/features';
import { PremiumService } from '../services/premiumService';
import AuthService from '../services/authService';
import Constants from 'expo-constants';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;
type SettingsScreenRouteProp = RouteProp<RootStackParamList, 'Settings'>;

interface Props {
  navigation: SettingsScreenNavigationProp;
  route: SettingsScreenRouteProp;
}

const SettingsScreen: React.FC<Props> = ({ navigation, route }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [settings, setSettings] = useState<UserSettings>({
    roastIntensity: 'medium',
    aiPersonality: 'sarcastic',
    enableNotifications: true,
    enableSound: true,
    allowCursing: false,
  });
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [unlockedFeatures, setUnlockedFeatures] = useState<string[]>([]);
  const [unlockedPersonalities, setUnlockedPersonalities] = useState<string[]>([]);
  const [isPremiumLoading, setIsPremiumLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [activeTab, setActiveTab] = useState<'personalities' | 'intensity' | 'preferences' | 'premium'>('personalities');


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
    {
      id: 'bronxbambino',
      name: 'The Bronx Bambino',
      emoji: '🏙️',
      description: 'Street-smart Bronx native with direct attitude and no-nonsense roasts',
      traits: ['Direct', 'Streetwise', 'Authentic', 'Unfiltered'],
    },
    {
      id: 'britishgentleman',
      name: 'British Gentleman',
      emoji: '🇬🇧',
      description: 'Sophisticated Brit with posh insults and "old chap" energy',
      traits: ['Sophisticated', 'Posh', 'Witty', 'Cultured'],
    },
    {
      id: 'southernbelle',
      name: 'Southern Belle',
      emoji: '🌹',
      description: 'Sweet but savage with "bless your heart" energy',
      traits: ['Sweet', 'Savage', 'Charming', 'Deceptive'],
    },
    {
      id: 'valleygirl',
      name: 'Valley Girl',
      emoji: '💅',
      description: 'Airhead energy but surprisingly sharp with "like, totally" style',
      traits: ['Bubbly', 'Sharp', 'Trendy', 'Unexpected'],
    },
    {
      id: 'surferdude',
      name: 'Surfer Dude',
      emoji: '🏄‍♂️',
      description: 'Laid-back but cutting with "bro" and "rad" energy',
      traits: ['Laid-back', 'Chill', 'Observant', 'Authentic'],
    },

    // Professional/Expert Personalities
    {
      id: 'grammar_police',
      name: 'Grammar Police',
      emoji: '📝',
      description: 'The ultimate language enforcer who corrects every mistake',
      traits: ['Pedantic', 'Corrective', 'Linguistic'],
    },
    {
      id: 'fitness_coach',
      name: 'Fitness Coach',
      emoji: '💪',
      description: 'Motivational trainer with zero tolerance for laziness',
      traits: ['Motivational', 'Fit', 'Intense'],
    },
    {
      id: 'chef_gordon',
      name: 'Chef Gordon',
      emoji: '👨‍🍳',
      description: 'Culinary perfectionist with a famous temper',
      traits: ['Perfectionist', 'Passionate', 'Demanding'],
    },
    {
      id: 'detective',
      name: 'Detective',
      emoji: '🕵️‍♂️',
      description: 'Sharp investigator who sees through your BS',
      traits: ['Observant', 'Skeptical', 'Analytical'],
    },
    {
      id: 'therapist',
      name: 'Therapist',
      emoji: '🛋️',
      description: 'Professional counselor with deep psychological insights',
      traits: ['Insightful', 'Analytical', 'Empathetic'],
    },

    // Pop Culture Personalities
    {
      id: 'mean_girl',
      name: 'Mean Girl',
      emoji: '👑',
      description: 'Queen bee of social hierarchy with cutting remarks',
      traits: ['Social', 'Cutting', 'Popular'],
    },
    {
      id: 'tiktok_influencer',
      name: 'TikTok Influencer',
      emoji: '📱',
      description: 'Trendy content creator with viral roast potential',
      traits: ['Trendy', 'Viral', 'Dramatic'],
    },
    {
      id: 'boomer',
      name: 'Boomer',
      emoji: '👴',
      description: 'Classic generation wisdom mixed with modern disdain',
      traits: ['Experienced', 'Opinionated', 'Traditional'],
    },
    {
      id: 'hipster',
      name: 'Hipster',
      emoji: '🕶️',
      description: 'Ironically cool with superior taste and endless sarcasm',
      traits: ['Ironic', 'Cultured', 'Superior'],
    },
    {
      id: 'karen',
      name: 'Karen',
      emoji: '📢',
      description: 'Entitled customer service nightmare with attitude',
      traits: ['Entitled', 'Demanding', 'Dramatic'],
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
    const oldPersonality = settings.aiPersonality;
    const newSettings = { ...settings, aiPersonality: personality as any };
    setSettings(newSettings);

    // Save to local storage
    const storage = StorageService.getInstance();
    await storage.saveSettings(newSettings);

    // Save to Supabase (authenticated users)
    try {
      const authService = AuthService.getInstance();
      if (authService.isSignedIn()) {
        await authService.saveUserSettings(newSettings);
      }
    } catch (error) {
      }

    // Track personality change
    await AnalyticsService.trackEvent('personality_changed', {
      oldValue: oldPersonality,
      newValue: personality
    });
  };

  const updateIntensity = async (intensity: string) => {
    const oldIntensity = settings.roastIntensity;
    const newSettings = { ...settings, roastIntensity: intensity as any };
    setSettings(newSettings);

    // Save to local storage
    const storage = StorageService.getInstance();
    await storage.saveSettings(newSettings);

    // Save to Supabase (authenticated users)
    try {
      const authService = AuthService.getInstance();
      if (authService.isSignedIn()) {
        await authService.saveUserSettings(newSettings);
      }
    } catch (error) {
      }

    // Track intensity change
    await AnalyticsService.trackEvent('intensity_changed', {
      oldValue: oldIntensity,
      newValue: intensity
    });
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
          
          // Enable cursing in settings (default to ON when unlocked)
          const newSettings = { ...settings, allowCursing: true };
          setSettings(newSettings);
          const storage = StorageService.getInstance();
          await storage.saveSettings(newSettings);
        }
      } catch (error) {
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
        // Track successful purchase
        await AnalyticsService.trackEvent('premium_purchase_success', {
          featureId,
          price: PremiumService.getInstance().getPremiumFeatures().find(f => f.id === featureId)?.price || 0
        });

        // Reload unlocked features
        const features = await premiumService.getUnlockedFeatures();
        setUnlockedFeatures(features);

        // If it's a chat pack purchase, update chat usage
        if (featureId.startsWith('chat_pack_')) {
          const storage = StorageService.getInstance() as any;
          await storage.getChatUsage(); // This will trigger the chat screen to update when it refocuses
        }
      } else {
        // Track failed purchase
        await AnalyticsService.trackEvent('premium_purchase_failed', {
          featureId,
          reason: 'payment_failed'
        });
      }
    } catch (error) {
      } finally {
      setIsPremiumLoading(false);
    }
  };

  // Helper function to find which pack contains a personality
  const getPackForPersonality = (personalityId: string): string | null => {
    const packs = PremiumService.getInstance().getPersonalityPacks();
    for (const pack of packs) {
      if (pack.personalities.includes(personalityId)) {
        return pack.id;
      }
    }
    return null;
  };

  // Helper function to get pack info for a personality
  const getPackInfoForPersonality = (personalityId: string) => {
    const packId = getPackForPersonality(personalityId);
    if (!packId) return null;

    const packs = PremiumService.getInstance().getPersonalityPacks();
    return packs.find(p => p.id === packId) || null;
  };

  const handlePersonalityPackPurchase = async (packId: string) => {
    setIsPremiumLoading(true);
    try {
      const premiumService = PremiumService.getInstance();
      const success = await premiumService.purchasePersonalityPack(packId);
      if (success) {
        // Add a small delay to ensure IAP processing is complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Reload unlocked personalities
        const personalities = await premiumService.getUnlockedPersonalities();
        setUnlockedPersonalities(personalities);
      }
    } catch (error) {
      } finally {
      setIsPremiumLoading(false);
    }
  };

  const handleSubscriptionPress = async (planId: string) => {
    const plan = PremiumService.getInstance().getSubscriptionPlans().find(p => p.id === planId);
    if (!plan) return;

    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Subscribe to Premium',
        `Would you like to subscribe to "${plan.name}" for $${plan.price}/${plan.duration === 'lifetime' ? 'once' : plan.duration}?\n\n${plan.description}\n\nFeatures included:\n${plan.features.map(f => `• ${f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`).join('\n')}`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Subscribe', onPress: () => resolve(true) },
        ]
      );
    });

    if (!confirmed) return;

    setIsPremiumLoading(true);
    try {
      const premiumService = PremiumService.getInstance();
      const success = await premiumService.purchaseSubscription(planId);
      if (success) {
        // Add a small delay to ensure IAP processing is complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Reload unlocked features and personalities
        const features = await premiumService.getUnlockedFeatures();
        const personalities = await premiumService.getUnlockedPersonalities();

        setUnlockedFeatures(features);
        setUnlockedPersonalities(personalities);

        Alert.alert(
          'Subscription Active! 🎉',
          `${plan.name} has been activated! You now have access to all premium features.`,
          [{ text: 'Awesome!' }]
        );
      }
    } catch (error) {
      Alert.alert('Subscription Failed', 'Unable to process subscription. Please try again.');
    } finally {
      setIsPremiumLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsPremiumLoading(true);
    try {
      const premiumService = PremiumService.getInstance();
      const success = await premiumService.restorePurchases();
      
      if (success) {
        // Reload unlocked features and personalities
        const features = await premiumService.getUnlockedFeatures();
        const personalities = await premiumService.getUnlockedPersonalities();
        
        setUnlockedFeatures(features);
        setUnlockedPersonalities(personalities);
        
        Alert.alert(
          'Purchases Restored! 🎉',
          'Your previous purchases have been successfully restored.',
          [{ text: 'Great!' }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'No previous purchases were found to restore. Make sure you\'re signed in with the same Apple ID used for the original purchase.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Restore Failed',
        'Unable to restore purchases. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsPremiumLoading(false);
    }
  };

  const handleIndividualPersonalityPurchase = async (personalityId: string) => {
    setIsPremiumLoading(true);
    try {
      const premiumService = PremiumService.getInstance();
      const success = await premiumService.purchaseIndividualPersonality(personalityId);
      if (success) {
        // Add a small delay to ensure IAP processing is complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Reload unlocked personalities
        const personalities = await premiumService.getUnlockedPersonalities();
        setUnlockedPersonalities(personalities);
      }
    } catch (error) {
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

      // Load streak
      const streakService = StreakService.getInstance();
      const currentStreak = await streakService.getStreak();
      setStreak(currentStreak);
      
      // Check AI status based on BYOK setting
      let isAIAvailable = false;
      
      if (FEATURES.ENABLE_BYOK) {
        // BYOK enabled - check for user API keys
        const hasApiKey = await storage.hasApiKey();
        isAIAvailable = hasApiKey;
      } else {
        // BYOK disabled - server-powered AI is always available
        isAIAvailable = true;
      }
      
      setIsAIEnabled(isAIAvailable);
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
            // BYOK disabled - server-powered AI is always available
            isAIAvailable = true;
          }
          
          setIsAIEnabled(isAIAvailable);
        } catch (error) {
          setIsAIEnabled(false);
        }
      };

      const loadPremiumFeatures = async () => {
        try {
          const premiumService = PremiumService.getInstance();
          const features = await premiumService.getUnlockedFeatures();
          setUnlockedFeatures(features);
          
          // Load unlocked personalities
          const personalities = await premiumService.getUnlockedPersonalities();
          setUnlockedPersonalities(personalities);
        } catch (error) {
          }
      };

      const loadStreak = async () => {
        try {
          const streakService = StreakService.getInstance();
          const currentStreak = await streakService.getStreak();
          setStreak(currentStreak);
        } catch (error) {
          }
      };

      checkAIStatus();
      loadPremiumFeatures();
      loadStreak();
    });

    return unsubscribe;
  }, [navigation]);

  // Handle initial tab selection from navigation
  useEffect(() => {
    const initialTab = route.params?.initialTab;
    if (initialTab && ['personalities', 'intensity', 'preferences', 'premium'].includes(initialTab)) {
      setActiveTab(initialTab as typeof activeTab);
    }
  }, [route.params?.initialTab]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Build Indicator */}


      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'personalities', label: 'Enemies', icon: 'person' },
          { key: 'intensity', label: 'Power', icon: 'flame' },
          { key: 'preferences', label: 'Settings', icon: 'settings' },
          { key: 'premium', label: 'Subs+', icon: 'star' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? '#FFD700' : '#ccc'}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* AI Personality Section */}
        {activeTab === 'personalities' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Your AI Enemy</Text>
            <Text style={styles.sectionSubtitle}>Pick the personality that will roast you</Text>
          
          {personalities.map((personality) => {
            const isInUnlockedList = unlockedPersonalities.includes(personality.id);
            const isFreePersonality = ['sarcastic', 'brutal', 'witty', 'condescending', 'streetsmart'].includes(personality.id);
            const isUnlocked = isInUnlockedList || isFreePersonality;
            const isLocked = !isUnlocked;

            return (
              <TouchableOpacity
                key={personality.id}
                style={[
                  styles.personalityCard,
                  settings.aiPersonality === personality.id && styles.selectedCard,
                  isLocked && styles.lockedCard
                ]}
                onPress={() => {
                  if (isLocked) {
                    // Show purchase options for locked personality
                    const packId = getPackForPersonality(personality.id);
                    const packName = packId ? PremiumService.getInstance().getPersonalityPacks().find(p => p.id === packId)?.name : 'Personality Pack';

                    // Create enhanced pack contents message
                    const packInfo = getPackInfoForPersonality(personality.id);
                    let packContentsMessage = '';

                    if (packInfo) {
                      const ownedCount = packInfo.personalities.filter(p => unlockedPersonalities.includes(p)).length;
                      const totalCount = packInfo.personalities.length;

                      packContentsMessage = `\n\n📦 ${packName} Pack Contents (${ownedCount}/${totalCount} unlocked):`;

                      // Show all personalities in the pack with ownership status
                      packInfo.personalities.forEach(packPersonalityId => {
                        const packPersonality = personalities.find(p => p.id === packPersonalityId);
                        const isOwned = unlockedPersonalities.includes(packPersonalityId);
                        const statusIcon = isOwned ? '✅' : '🔒';

                        if (packPersonality) {
                          packContentsMessage += `\n${statusIcon} ${packPersonality.name}`;
                        }
                      });

                      packContentsMessage += `\n\n💰 Save $${((packInfo.personalities.length - 1) * 1.99 - 7.99).toFixed(2)} by buying the pack!`;
                    }

                    Alert.alert(
                      'Premium Personality',
                      `"${personality.name}" is a premium personality.\n\nBuy individually for $1.99 or get the full ${packName} for $7.99!${packContentsMessage}`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Buy Individual ($1.99)', onPress: () => handleIndividualPersonalityPurchase(personality.id) },
                        { text: 'Buy Pack ($7.99)', onPress: () => packId ? handlePersonalityPackPurchase(packId) : null }
                      ]
                    );

                  } else {
                    updatePersonality(personality.id);
                  }
                }}
              >
                <View style={styles.personalityHeader}>
                  <Text style={styles.personalityEmoji}>{personality.emoji}</Text>
                  <View style={styles.personalityInfo}>
                    <Text style={styles.personalityName}>
                      {personality.name}
                      {isLocked && <Text style={styles.premiumBadge}> 🔒 PREMIUM</Text>}
                    </Text>
                    <Text style={styles.personalityDescription}>{personality.description}</Text>
                  </View>
                  {settings.aiPersonality === personality.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  )}
                  {isLocked && (
                    <Ionicons name="lock-closed" size={20} color="#FF6B6B" />
                  )}
                  {/* Pack badge for premium personalities */}
                  {isLocked && (() => {
                    const packInfo = getPackInfoForPersonality(personality.id);
                    return packInfo ? (
                      <View style={styles.packBadge}>
                        <Text style={styles.packBadgeIcon}>{packInfo.icon}</Text>
                      </View>
                    ) : null;
                  })()}
                </View>
                <View style={styles.traitsContainer}>
                  {personality.traits.map((trait, index) => (
                    <View key={index} style={styles.traitTag}>
                      <Text style={styles.traitText}>{trait}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
          </View>
        )}

        {/* Roast Intensity Section */}
        {activeTab === 'intensity' && (
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
        )}

        {/* Preferences Section */}
        {activeTab === 'preferences' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          {/* <View style={styles.preferenceItem}>
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
          </View> */}

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
            onPress={() => navigation.navigate('Insights')}
          >
            <View style={styles.preferenceInfo}>
              <Ionicons name="analytics" size={24} color="#4CAF50" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>Your Insights</Text>
                <Text style={styles.preferenceDescription}>
                  View your chat statistics and personality usage
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.preferenceItem}
            onPress={() => navigation.navigate('VoiceSettings')}
          >
            <View style={styles.preferenceInfo}>
              <Ionicons name="mic" size={24} color="#FFD93D" />
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>Voice Settings</Text>
                <Text style={styles.preferenceDescription}>
                  Basic voice features • Premium AI voices coming soon!
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>

          </View>
        )}

        {/* Premium Section */}
        {activeTab === 'premium' && (
        <View style={styles.section}>
          {/* Subscription Plans */}
          <Text style={styles.sectionTitle}>💎 Premium Subscriptions</Text>
          <Text style={styles.sectionSubtitle}>Get unlimited access with recurring benefits</Text>

          {PremiumService.getInstance().getSubscriptionPlans().map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.subscriptionCard,
                plan.popular && styles.popularSubscriptionCard
              ]}
              onPress={() => handleSubscriptionPress(plan.id)}
            >
              {plan.badge && (
                <View style={[styles.badge, plan.popular && styles.popularBadge]}>
                  <Text style={styles.badgeText}>{plan.badge}</Text>
                </View>
              )}
              <View style={styles.subscriptionHeader}>
                <View style={styles.subscriptionInfo}>
                  <Text style={styles.subscriptionName}>
                    {plan.name}
                    {plan.popular && <Text style={styles.popularText}> 🔥</Text>}
                  </Text>
                  <Text style={styles.subscriptionDescription}>{plan.description}</Text>
                  <Text style={styles.subscriptionPrice}>
                    ${plan.price}/{plan.duration === 'lifetime' ? 'once' : plan.duration}
                  </Text>
                  {/* Apple Required Subscription Info */}
                  <Text style={styles.subscriptionTerms}>
                    Auto-renewable subscription • Length: {plan.duration === 'month' ? '1 month' : plan.duration === 'year' ? '1 year' : 'Lifetime'} • 
                    <Text style={styles.linkText} onPress={() => Linking.openURL('https://martyhines.github.io/hater-ai-realtime-server/PRIVACY_POLICY.md')}> Privacy Policy</Text> • 
                    <Text style={styles.linkText} onPress={() => Linking.openURL('https://martyhines.github.io/hater-ai-realtime-server/TERMS_OF_SERVICE.md')}> Terms of Use</Text>
                  </Text>
                </View>
                <View style={styles.subscriptionFeatures}>
                  {plan.features.slice(0, 3).map((feature, index) => (
                    <Text key={index} style={styles.featureText}>
                      ✓ {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  ))}
                  {plan.features.length > 3 && (
                    <Text style={styles.moreFeaturesText}>
                      +{plan.features.length - 3} more features
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* Restore Purchases Button */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={isPremiumLoading}
          >
            <Ionicons name="refresh" size={20} color="#FFD700" />
            <Text style={styles.restoreButtonText}>
              {isPremiumLoading ? 'Restoring...' : 'Restore Purchases'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <Text style={styles.dividerText}>OR</Text>
          </View>

          {/* Individual Features */}
          <Text style={styles.sectionTitle}>🔥 Individual Features</Text>
          <Text style={styles.sectionSubtitle}>Buy specific features as needed</Text>

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

          {/* IAP Test Button */}
          {__DEV__ && (
            <View style={styles.testSection}>
              <Text style={styles.sectionTitle}>🧪 IAP Test</Text>
              <Text style={styles.sectionSubtitle}>Test In-App Purchase functionality</Text>

              <TouchableOpacity
                style={[styles.premiumFeatureCard, { backgroundColor: '#E8F4FD' }]}
                onPress={async () => {
                  const iapService = (await import('../services/iapService')).IAPService.getInstance();

                  // Test IAP availability
                  const available = iapService.isAvailable();
                  const status = iapService.getAvailabilityStatus();

                  // Test product fetching
                  const products = await iapService.getAvailableProducts();

                  Alert.alert(
                    'IAP Status Test',
                    `Available: ${available}\n\n${status.reason || 'Ready for testing'}\n\nProducts Found: ${products.length}\n\n${products.length > 0 ? '✅ Products loaded successfully!' : '❌ No products found - check App Store Connect'}\n\nCheck console logs for detailed info.`,
                    [{ text: 'OK' }]
                  );
                }}
              >
                <View style={styles.premiumFeatureHeader}>
                  <Ionicons name="card" size={24} color="#2196F3" />
                  <View style={styles.premiumFeatureInfo}>
                    <Text style={styles.premiumFeatureName}>Test IAP Connection</Text>
                    <Text style={styles.premiumFeatureDescription}>Check if IAP is working in this build</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Personality Packs */}
          <Text style={styles.sectionTitle}>🎭 Personality Packs</Text>
          <Text style={styles.sectionSubtitle}>Unlock entire collections of AI personalities</Text>

          {PremiumService.getInstance().getPersonalityPacks().map((pack) => (
            <TouchableOpacity
              key={pack.id}
              style={[
                styles.packCard,
                unlockedPersonalities.some(p => pack.personalities.includes(p)) && styles.unlockedPackCard
              ]}
              onPress={() => handlePersonalityPackPurchase(pack.id)}
            >
              <View style={styles.packHeader}>
                <Text style={styles.packEmoji}>{pack.icon}</Text>
                <View style={styles.packInfo}>
                  <Text style={styles.packName}>
                    {pack.name}
                    {unlockedPersonalities.some(p => pack.personalities.includes(p)) && (
                      <Text style={styles.unlockedBadge}> ✓ UNLOCKED</Text>
                    )}
                  </Text>
                  <Text style={styles.packDescription}>{pack.description}</Text>
                  <Text style={styles.packPersonalities}>
                    {pack.personalities.length} personalities included
                  </Text>
                </View>
                <View style={styles.packPrice}>
                  {unlockedPersonalities.some(p => pack.personalities.includes(p)) ? (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  ) : (
                    <Text style={styles.priceText}>${pack.price}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
          </View>
        )}

        {/* Clear API Key Button */}
        {FEATURES.ENABLE_BYOK && isAIEnabled && (
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

        {/* Debug Session Buttons (Development Only) */}
        {__DEV__ && (
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>🧪 Session Debug (Dev Only)</Text>
            <View style={styles.debugButtons}>
              {/* Row 1 */}
              <View style={styles.debugButtonRow}>
                <TouchableOpacity
                  style={[styles.debugButton, styles.debugButtonPrimary]}
                  onPress={async () => {
                    await AnalyticsService.startSession();
                    Alert.alert('Session Started', 'New session has been started');
                  }}
                >
                  <Ionicons name="play" size={16} color="#fff" />
                  <Text style={styles.debugButtonText}>Start Session</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.debugButton, styles.debugButtonSecondary]}
                  onPress={async () => {
                    await AnalyticsService.endSession();
                    Alert.alert('Session Ended', 'Current session has been ended and saved');
                  }}
                >
                  <Ionicons name="stop" size={16} color="#fff" />
                  <Text style={styles.debugButtonText}>End Session</Text>
                </TouchableOpacity>
              </View>

              {/* Row 2 */}
              <View style={styles.debugButtonRow}>
                <TouchableOpacity
                  style={[styles.debugButton, { backgroundColor: '#FF9800' }]}
                  onPress={async () => {
                    const storage = StorageService.getInstance() as any;
                    await storage.resetChatUsage();
                    Alert.alert('Chat Usage Reset', 'Your chat limit has been reset to 7 free chats for today!');
                  }}
                >
                  <Ionicons name="refresh" size={16} color="#fff" />
                  <Text style={styles.debugButtonText}>Reset Chats</Text>
                </TouchableOpacity>

              </View>

              {/* Row 3 */}
              <View style={styles.debugButtonRow}>
                <TouchableOpacity
                  style={[styles.debugButton, { backgroundColor: '#4CAF50' }]}
                  onPress={async () => {
                    const storage = StorageService.getInstance() as any;
                    await storage.addChatPack(20);
                    Alert.alert('Test Pack Added', 'Added 20 test chat pack!');
                  }}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.debugButtonText}>Add Test Pack</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.debugButton, { backgroundColor: '#FF5722' }]}
                  onPress={async () => {
                    const premiumService = PremiumService.getInstance();
                    await (premiumService as any).simulatePurchase('feature', 'chat_pack_20');
                    Alert.alert('Purchase Simulated', 'Chat pack 20 purchase simulated!');
                  }}
                >
                  <Ionicons name="card" size={16} color="#fff" />
                  <Text style={styles.debugButtonText}>Simulate Buy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Current Settings Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryBackground}>
            <Image
              source={require('../../assets/images/roasterBase.png')}
              style={styles.summaryImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.summaryForeground}>
            <Text style={styles.summaryTitle}>Current Setup</Text>
          
          {/* AI Status */}
          {/* <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>AI Mode:</Text>
            <View style={styles.aiStatusRow}>
              <Ionicons 
                name={isAIEnabled ? "sparkles" : "code-slash"} 
                size={16} 
                color={isAIEnabled ? "#FFD700" : "#ccc"} 
              />
              <Text style={[styles.summaryValue, { color: isAIEnabled ? "#FFD700" : "#ccc" }]}>
                {isAIEnabled ? "AI Enabled" : "AI Service Unavailable"}
              </Text>
            </View>
          </View> */}

          {/* Streak Counter */}
          {streak > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Daily Streak:</Text>
              <Text style={[styles.summaryValue, { color: '#FF6B6B' }]}>
                🔥 {streak} {streak === 1 ? 'day' : 'days'}
              </Text>
            </View>
          )}
          
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
  testSection: {
    marginBottom: 32,
    padding: 16,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    margin: 20,
    marginBottom: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  tabText: {
    fontSize: 12,
    color: '#ccc',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFD700',
    fontWeight: '600',
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
  lockedCard: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    opacity: 0.7,
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
    overflow: 'hidden', // Ensure background image doesn't overflow
  },
  summaryBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  summaryImage: {
    width: '100%',
    height: '100%',
    opacity: 0.05, // Semi-transparent for readability
  },
  summaryForeground: {
    position: 'relative',
    padding: 16,
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
  packBadge: {
    position: 'absolute',
    top: -16,
    right: -16,
    // backgroundColor: 'rgba(22, 0, 0, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  packBadgeIcon: {
    fontSize: 16,
    color: '#FFD700',
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
  subscriptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  popularSubscriptionCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderWidth: 2,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularBadge: {
    backgroundColor: '#FFD700',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  popularText: {
    color: '#FFD700',
  },
  subscriptionDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    lineHeight: 20,
  },
  subscriptionPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  subscriptionTerms: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    lineHeight: 16,
  },
  linkText: {
    color: '#2a7ae2',
    textDecorationLine: 'underline',
  },
  restoreButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  subscriptionFeatures: {
    marginLeft: 16,
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 2,
  },
  moreFeaturesText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
  },
  divider: {
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerText: {
    backgroundColor: '#1a1a1a',
    color: '#666',
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: 'bold',
  },
  packCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  unlockedPackCard: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  packHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  packInfo: {
    flex: 1,
  },
  packName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  packDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
    lineHeight: 18,
  },
  packPersonalities: {
    fontSize: 12,
    color: '#888',
  },
  packPrice: {
    alignItems: 'center',
  },
  debugSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
    textAlign: 'center',
  },
  debugButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  debugButtonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    minWidth: 120,
  },
  debugButtonPrimary: {
    backgroundColor: '#4CAF50',
  },
  debugButtonSecondary: {
    backgroundColor: '#FF6B6B',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SettingsScreen; 