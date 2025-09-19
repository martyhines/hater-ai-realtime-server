import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FEATURES } from '../config/features';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { Message, UserSettings, AIProvider, getPersonalityInfo } from '../types';
import { AIService } from '../services/aiService';
import { OpenAIService } from '../services/openaiService';
import { CohereService } from '../services/cohereService';
import { GeminiService } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import TextToSpeechService from '../services/textToSpeechService';
import { AnalyticsService } from '../services/analyticsService';
import { PremiumService } from '../services/premiumService';


type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;

interface Props {
  navigation: ChatScreenNavigationProp;
}

interface TypingIndicatorProps {
  isTyping: boolean;
}

const TypingIndicator = React.memo<TypingIndicatorProps>(({ isTyping }) => {
  if (!isTyping) return null;

  return (
    <View style={[styles.messageContainer, styles.aiMessage]}>
      <View style={[styles.messageBubble, styles.aiBubble]}>
        <View style={styles.typingContainer}>
          <ActivityIndicator size="small" color="#FF6B6B" />
          <Text style={styles.typingText}>AI is crafting your roast...</Text>
        </View>
      </View>
    </View>
  );
});

const ChatScreen: React.FC<Props> = ({ navigation }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiService, setAiService] = useState<AIService | OpenAIService | CohereService | GeminiService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [activeProvider, setActiveProvider] = useState<AIProvider>('cohere');
  // Model/provider details are no longer shown to users
  const [availableProviders, setAvailableProviders] = useState<{
    cohere: boolean;
    openai: boolean;
    gemini: boolean;
  }>({
    cohere: false,
    openai: false,
    gemini: false,
  });
  
  const flatListRef = useRef<FlatList>(null);

  // Update chat usage data
  const updateChatUsage = async () => {
    try {
      const storage = StorageService.getInstance() as any;
      const premiumService = PremiumService.getInstance();

      const usage = await storage.getChatUsage();
      const remaining = await storage.getRemainingFreeChats();
      const hasSubscription = await (premiumService as any).hasActiveSubscription();

      console.log('🔄 Updating chat usage:', {
        usage,
        remaining,
        hasSubscription
      });

      setChatUsage(usage);

      // Determine what to show based on user status
      if (hasSubscription) {
        setRemainingFreeChats(999); // Unlimited
        console.log('🎯 Showing: Unlimited chats');
      } else if (usage.packChats > 0 && remaining === 0) {
        setRemainingFreeChats(0); // Has pack chats but no free chats
        console.log('🎯 Showing: Pack chats available');
      } else if (remaining > 0) {
        setRemainingFreeChats(remaining); // Show remaining free chats
        console.log('🎯 Showing: Free chats remaining');
      } else {
        setRemainingFreeChats(0); // No chats available
        console.log('🎯 Showing: No chats available');
      }
    } catch (error) {
      console.error('❌ Error updating chat usage:', error);
    }
  };


  // Chat usage state
  const [chatUsage, setChatUsage] = useState<{ date: string; count: number; packChats: number } | null>(null);
  const [remainingFreeChats, setRemainingFreeChats] = useState(7);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [personalityUpdateKey, setPersonalityUpdateKey] = useState(0); // Force re-renders when personality changes

  // Load chat usage on mount
  useEffect(() => {
    updateChatUsage();
  }, []);

  // Function to switch between available providers
  const switchProvider = async (provider: AIProvider) => {
    try {
      const storage = StorageService.getInstance();
      const savedSettings = await storage.getSettings();

      const settings: UserSettings = {
        roastIntensity: 'medium',
        aiPersonality: 'sarcastic',
        enableNotifications: true,
        enableSound: true,
        ...savedSettings,
      };

      if (provider === 'cohere' && availableProviders.cohere) {
        const cohereKey = await storage.getCohereKey();
        if (cohereKey) {
          setAiService(new CohereService(settings, cohereKey));
          setIsAIEnabled(true);
          setActiveProvider('cohere');
        }
      } else if (provider === 'openai' && availableProviders.openai) {
        const openaiKey = await storage.getOpenAIKey();
        if (openaiKey) {
          setAiService(new OpenAIService(settings, openaiKey));
          setIsAIEnabled(true);
          setActiveProvider('openai');
        }
      } else if (provider === 'gemini' && availableProviders.gemini) {
        const geminiKey = await storage.getGeminiKey();
        if (geminiKey) {
          setAiService(new GeminiService(settings, geminiKey));
          setIsAIEnabled(true);
          setActiveProvider('gemini');
        }
      }
    } catch (error) {
      // Error switching provider
    }
  };

  // Initialize AI service and welcome message
  useEffect(() => {
    const initializeAI = async () => {
      try {
        const storage = StorageService.getInstance();
        
        // Check for API key with timeout to prevent hanging
        let hasApiKey = false;
        try {
          hasApiKey = await Promise.race([
            storage.hasApiKey(),
            new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
          ]);
        } catch (error) {
          // Timeout or other error - assume no key available
          hasApiKey = false;
        }
        
        // Load saved settings or use defaults
        let savedSettings = null;
        try {
          savedSettings = await Promise.race([
            storage.getSettings(),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
          ]);
        } catch (error) {
          // Timeout or other error - use defaults
          savedSettings = null;
        }
        
        const settings: UserSettings = {
          roastIntensity: 'medium',
          aiPersonality: 'sarcastic',
          enableNotifications: true,
          enableSound: true,
          ...savedSettings, // Override with saved settings if they exist
        };


        // If BYOK is disabled, default to backend-powered service (server chooses best available)
        if (!FEATURES.ENABLE_BYOK) {
          setAiService(new OpenAIService(settings, ''));
          setIsAIEnabled(true);
          setActiveProvider('cohere'); // Default to preferred provider
          const welcomeMessage: Message = {
            id: 'welcome',
            text: "Oh great, another human who thinks they're worth talking to. What do you want?",
            sender: 'ai',
            timestamp: new Date(),
          };
          setMessages([welcomeMessage]);
          return;
        }

        // Start with no service - will show error if no providers available
        setAiService(null);
        setIsAIEnabled(false);

        // Check for all available providers
        const [cohereKey, openaiKey, geminiKey] = FEATURES.ENABLE_BYOK
          ? await Promise.all([
              storage.getCohereKey(),
              storage.getOpenAIKey(),
              storage.getGeminiKey(),
            ])
          : [null, null, null];

        
        // Update available providers state
        setAvailableProviders({
          cohere: !!cohereKey,
          openai: !!openaiKey,
          gemini: !!geminiKey,
        });

        // Set the best available provider as default (Cohere > Gemini > OpenAI)
        if (cohereKey) {
          setAiService(new CohereService(settings, cohereKey));
          setIsAIEnabled(true);
          setActiveProvider('cohere');
        } else if (geminiKey) {
          setAiService(new GeminiService(settings, geminiKey));
          setIsAIEnabled(true);
          setActiveProvider('gemini');
        } else if (openaiKey) {
          setAiService(new OpenAIService(settings, openaiKey));
          setIsAIEnabled(true);
          setActiveProvider('openai');
                  } else {
            setAiService(null);
            setIsAIEnabled(false);
            const errorMessage: Message = {
              id: 'no-keys-focus',
              text: "No AI service available. Please add API keys or enable the server.",
              sender: 'ai',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
          }

        const welcomeMessage: Message = {
          id: 'welcome',
          text: hasApiKey
            ? "Oh great, another human who thinks they're worth talking to. What do you want?"
            : "Oh great, another human who thinks you're worth talking to. What do you want? (AI service unavailable - check your connection!)",
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      } catch (error) {
        // Error initializing AI
        // Show error to user instead of falling back to template
        setIsAIEnabled(false);
        const errorMessage: Message = {
          id: 'error',
          text: "Unable to connect to AI service. Please check your connection and try again.",
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages([errorMessage]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAI();
  }, []);


  // Reload settings when screen focuses (in case user changed settings)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const reloadSettings = async () => {
        // Update chat usage in case user subscribed or purchased chat packs
        await updateChatUsage();
        try {
          const storage = StorageService.getInstance();
          const savedSettings = (await storage.getSettings()) || {};

          const settings: UserSettings = {
            roastIntensity: 'medium',
            aiPersonality: 'sarcastic',
            enableNotifications: true,
            enableSound: true,
            allowCursing: false,
            ...savedSettings,
          };


          // If BYOK is disabled, keep using backend-powered OpenAI
          if (!FEATURES.ENABLE_BYOK) {
            const newAiService = new OpenAIService(settings, '');
            setAiService(newAiService);
            setIsAIEnabled(true);
            setActiveProvider('openai');
            setPersonalityUpdateKey(prev => prev + 1); // Force re-render
            return;
          }

          // Check for all available providers
          const [cohereKey, openaiKey, geminiKey] = await Promise.all([
            storage.getCohereKey(),
            storage.getOpenAIKey(),
            storage.getGeminiKey(),
          ]);

          
          // Update available providers state
          setAvailableProviders({
            cohere: !!cohereKey,
            openai: !!openaiKey,
            gemini: !!geminiKey,
          });

          // Set the best available provider as default (Cohere > Gemini > OpenAI)
          if (cohereKey) {
            const newAiService = new CohereService(settings, cohereKey);
            setAiService(newAiService);
            setIsAIEnabled(true);
            setActiveProvider('cohere');
            setPersonalityUpdateKey(prev => prev + 1); // Force re-render
          } else if (geminiKey) {
            const newAiService = new GeminiService(settings, geminiKey);
            setAiService(newAiService);
            setIsAIEnabled(true);
            setActiveProvider('gemini');
            setPersonalityUpdateKey(prev => prev + 1); // Force re-render
          } else if (openaiKey) {
            const newAiService = new OpenAIService(settings, openaiKey);
            setAiService(newAiService);
            setIsAIEnabled(true);
            setActiveProvider('openai');
            setPersonalityUpdateKey(prev => prev + 1); // Force re-render
          } else {
            setIsAIEnabled(false);
            const errorMessage: Message = {
              id: 'no-keys',
              text: "No AI service available. Please add API keys or enable the server.",
              sender: 'ai',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
          }
        } catch (error) {
          // Error logged
          // Keep existing AI service but show error state
          setIsAIEnabled(false);
          const errorMessage: Message = {
            id: 'reload-error',
            text: "Connection to AI service lost. Please check your connection.",
            sender: 'ai',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      };
      reloadSettings();
    });

    return unsubscribe;
  }, [navigation]);


  // Auto-scroll when keyboard appears
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    return () => keyboardDidShowListener.remove();
  }, []);


  const sendMessage = async () => {
    if (!inputText.trim() || !aiService) return;

    // Check rate limits before sending
    try {
      const storage = StorageService.getInstance() as any;
      const canSend = await storage.canSendMessage();

      if (!canSend) {
        const premiumService = PremiumService.getInstance();
        const hasSubscription = await (premiumService as any).hasActiveSubscription();

        if (!hasSubscription) {
          // Check if user has pack chats
          const usage = await storage.getChatUsage();

          // Show appropriate message
          Alert.alert(
            'Chat Limit Reached',
            usage.packChats > 0
              ? `You've used all your free chats today, but you have ${usage.packChats} pack chats available!`
              : 'You\'ve used all your free chats today! Upgrade to continue chatting.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: usage.packChats > 0 ? 'Continue with Pack' : 'Upgrade',
                onPress: () => navigation.navigate('Settings')
              }
            ]
          );
          return;
        }
      }

      // Consume chat credit
      const creditConsumed = await (storage as any).consumeChatCredit();
      if (!creditConsumed) {
        Alert.alert('Error', 'Unable to process chat. Please try again.');
        return;
      }

      // Update chat usage in real-time
      await updateChatUsage();
    } catch (error) {
      // Rate limiting error - allow message to proceed
      console.error('Rate limiting error:', error);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Hide keyboard after sending message
    Keyboard.dismiss();

    // Track message sent
    const startTime = Date.now();
    const messageLength = userMessage.text.length;
    const hasEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(userMessage.text);
    const personality = (aiService as any).settings?.aiPersonality || 'brutal';

    // Track the message sent event
    await AnalyticsService.trackEvent('chat_message_sent', {
      personality,
      messageLength,
      hasEmoji,
      isVoice: false
    });

    try {

      // Simulate typing delay
      await aiService.simulateTyping();

      const aiResponse = await aiService.generateResponse(userMessage.text);

      // We no longer surface which backend provider handled the response

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update chat usage after successful response
      await updateChatUsage();

      // Track successful response
      const responseTime = Date.now() - startTime;
      await AnalyticsService.trackEvent('ai_response_success', {
        personality,
        responseTimeMs: responseTime,
        responseLength: aiResponse.length
      });

      // Auto-play voice if enabled
      try {
        const voiceSettings = await TextToSpeechService.getVoiceSettings();
        if (voiceSettings?.autoPlay) {
          const personality = (aiService as any).settings?.aiPersonality || 'brutal';
          await TextToSpeechService.speakRoast(aiResponse, personality);
        }
      } catch (error) {
        // Voice error - continue without voice
        console.error('Voice error:', error);
      }
    } catch (error) {
      // Track error
      await AnalyticsService.trackEvent('ai_response_error', {
        personality,
        errorType: 'generation_failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Ugh, even my responses are broken because of you. Try again.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    

  const handleShareRoast = async () => {
    try {
      console.log('📤 Sharing roast using existing ScreenshotService...');

      // Navigate to the ScreenshotScreen which properly uses the ScreenshotService
      // This is the same approach as the camera button and ensures proper UI capture
      if (aiService) {
        const settings = (aiService as any).settings || {
          roastIntensity: 'medium',
          aiPersonality: 'sarcastic',
          allowCursing: false,
        };

        // Extract the user's prompt that led to this roast (to avoid non-serializable timestamps)
        let userPrompt = null;
        try {
          if (messages && Array.isArray(messages)) {
            const aiIndex = messages.findIndex((m: any) => m.text === item.text && m.sender === 'ai');
            if (aiIndex > -1) {
              for (let i = aiIndex - 1; i >= 0; i -= 1) {
                const m = messages[i];
                if (m && m.sender === 'user' && typeof m.text === 'string' && m.text.trim().length > 0) {
                  userPrompt = m.text.trim();
                  break;
                }
              }
            }
            // Fallback: last user message
            if (!userPrompt) {
              const lastUser = [...messages].reverse().find((m: any) => m.sender === 'user' && m.text);
              if (lastUser) {
                userPrompt = (lastUser.text as string).trim();
              }
            }
          }
        } catch (e) {
          // Ignore extraction errors; prompt simply won't be shown
          console.log('⚠️ Could not extract user prompt for screenshot');
        }

        navigation.navigate('Screenshot', {
          roastText: item.text,
          userName: settings?.userName,
          userPrompt: userPrompt || undefined, // Convert null to undefined for navigation type
          // Add a flag to indicate this is for sharing (not just saving)
          isForSharing: true
        });

        console.log('📸 Navigated to ScreenshotScreen for sharing');
      } else {
        // Fallback to text-only sharing if no AI service
        console.log('⚠️ No AI service available, using text-only sharing');

        const shareOptions = {
          message: `🤖 "${item.text.length > 100 ? item.text.substring(0, 100) + '...' : item.text}" #AIRoast\n\nGet the app: https://apps.apple.com/app/hater-ai`,
          title: 'Share your Hater AI roast'
        };

        const result = await Share.share(shareOptions);

        if (result.action === Share.sharedAction) {
          console.log('🎉 Successfully shared roast (text-only)');
        } else if (result.action === Share.dismissedAction) {
          console.log('📝 Share sheet dismissed by user');
        }
      }

    } catch (error) {
      console.error('💥 Error sharing roast:', error);
      Alert.alert('Sharing Error', 'Unable to share roast. Please try again.');
    }
  };

  const handleShareScreenshot = () => {
    if (aiService) {
      const settings = (aiService as any).settings || {
        roastIntensity: 'medium',
        aiPersonality: 'sarcastic',
        allowCursing: false,
      };

      // Extract the user's prompt that led to this roast (to avoid non-serializable timestamps)
      let userPrompt = null;
      try {
        if (messages && Array.isArray(messages)) {
          const aiIndex = messages.findIndex((m: any) => m.text === item.text && m.sender === 'ai');
          if (aiIndex > -1) {
            for (let i = aiIndex - 1; i >= 0; i -= 1) {
              const m = messages[i];
              if (m && m.sender === 'user' && typeof m.text === 'string' && m.text.trim().length > 0) {
                userPrompt = m.text.trim();
                break;
              }
            }
          }
          // Fallback: last user message
          if (!userPrompt) {
            const lastUser = [...messages].reverse().find((m: any) => m.sender === 'user' && m.text);
            if (lastUser) {
              userPrompt = (lastUser.text as string).trim();
            }
          }
        }
      } catch (e) {
        // Ignore extraction errors; prompt simply won't be shown
        console.log('⚠️ Could not extract user prompt for screenshot');
      }

      navigation.navigate('Screenshot', {
        roastText: item.text,
        userName: settings?.userName,
        userPrompt: userPrompt || undefined, // Convert null to undefined for navigation type
        // isForSharing defaults to false for camera button
      });
    }
  };

  const handleSpeakRoast = async () => {
    try {
      await TextToSpeechService.speakRoast(item.text);
    } catch (error) {
      // Error logged
    }
  };
    
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.aiMessage]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.aiTimestamp]}>
              {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
                          {!isUser && (
                <View style={styles.shareButtons}>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleSpeakRoast}
                  >
                    <Ionicons name="mic" size={16} color="#FFD93D" />
                  </TouchableOpacity>
                  {/* <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShareRoast}
                  >
                    <Ionicons name="share-social" size={16} color="#4CAF50" />
                  </TouchableOpacity> */}
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShareScreenshot}
                  >
                    <Ionicons name="share" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              )}
          </View>
        </View>
      </View>
    );
  };


  // Helper to get current personality name
  const getModelName = () => {
    // Get current personality from AI service settings
    if (aiService && 'settings' in aiService) {
      const personalityKey = (aiService as any).settings?.aiPersonality || 'sarcastic';
      console.log('🔍 ChatScreen: Getting personality name for key:', personalityKey);
      const personality = getPersonalityInfo(personalityKey);
      console.log('🔍 ChatScreen: Personality info:', personality);
      return personality ? personality.name : 'AI Assistant';
    }
    return 'AI Assistant';
  };

  if (isLoading) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B6B" />
            <Text style={styles.loadingText}>Initializing your AI enemy...</Text>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <SafeAreaView style={styles.container}>
        {/* AI Status Header */}
        <View style={styles.aiStatusHeader}>
          <View style={styles.aiStatusContainer}>
            <Ionicons
              name={isAIEnabled ? "sparkles" : "code-slash"}
              size={16}
              color={isAIEnabled ? "#FFD700" : "#ccc"}
            />
            <Text key={`personality-${personalityUpdateKey}`} style={[styles.aiStatusText, { color: isAIEnabled ? "#FFD700" : "#ccc" }]}>
              {isAIEnabled ? `${getModelName()}` : "AI Service Unavailable"}
            </Text>
          </View>
          
          {/* Provider Switcher - Only show if BYOK enabled and multiple providers are available */}
          {FEATURES.ENABLE_BYOK && (availableProviders.cohere || availableProviders.gemini || availableProviders.openai) && (
            <View style={styles.providerSwitcher}>
              {availableProviders.cohere && (
                <TouchableOpacity
                  style={[
                    styles.providerButton,
                    activeProvider === 'cohere' && styles.activeProviderButton
                  ]}
                  onPress={() => switchProvider('cohere')}
                >
                  <Text style={[
                    styles.providerButtonText,
                    activeProvider === 'cohere' && styles.activeProviderButtonText
                  ]}>
                    Cohere
                  </Text>
                </TouchableOpacity>
              )}
              {availableProviders.gemini && (
                <TouchableOpacity
                  style={[
                    styles.providerButton,
                    activeProvider === 'gemini' && styles.activeProviderButton
                  ]}
                  onPress={() => switchProvider('gemini')}
                >
                  <Text style={[
                    styles.providerButtonText,
                    activeProvider === 'gemini' && styles.activeProviderButtonText
                  ]}>
                    Gemini
                  </Text>
                </TouchableOpacity>
              )}
              {availableProviders.openai && (
                <TouchableOpacity
                  style={[
                    styles.providerButton,
                    activeProvider === 'openai' && styles.activeProviderButton
                  ]}
                  onPress={() => switchProvider('openai')}
                >
                  <Text style={[
                    styles.providerButtonText,
                    activeProvider === 'openai' && styles.activeProviderButtonText
                  ]}>
                    OpenAI
                  </Text>
                </TouchableOpacity>
              )}

            </View>
          )}
        </View>
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={<TypingIndicator isTyping={isTyping} />}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />
        {/* Input Section */}
        <View style={styles.inputContainer}>
          {/* Chat Usage Display */}
          {chatUsage && (
            <View style={styles.usageDisplay}>
              <Ionicons name="chatbubble" size={14} color="#FFD700" />
              <Text style={styles.usageText}>
                {remainingFreeChats >= 999
                  ? 'Unlimited chats - enjoy!'
                  : remainingFreeChats > 0
                    ? `${remainingFreeChats} free chats left today`
                    : chatUsage.packChats > 0
                      ? `${chatUsage.packChats} pack chats available`
                      : 'Chat limit reached - upgrade to continue'
                }
              </Text>
              {remainingFreeChats < 999 && remainingFreeChats === 0 && chatUsage.packChats === 0 && (
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={() => navigation.navigate('Settings')}
                >
                  <Text style={styles.upgradeButtonText}>Upgrade</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.inputWrapper}>

            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor="#888"
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isTyping}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() && !isTyping ? "#fff" : "#666"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  userBubble: {
    backgroundColor: '#FF6B6B',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#2d2d2d',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  userTimestamp: {
    color: '#fff',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#ccc',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#2d2d2d',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: Platform.OS === 'ios' ? 16 : 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 16,
  },
  usageDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  usageText: {
    fontSize: 12,
    color: '#FFD700',
    marginLeft: 6,
    flex: 1,
  },
  upgradeButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  aiStatusHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  aiStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiStatusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  providerSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  providerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeProviderButton: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  providerButtonText: {
    fontSize: 12,
    color: '#ccc',
    fontWeight: '500',
  },
  activeProviderButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  shareButton: {
    padding: 4,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 8,
  },
});

export default ChatScreen; 