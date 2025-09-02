import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FEATURES } from '../config/features';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { Message, UserSettings } from '../types';
import { AIService } from '../services/aiService';
import { OpenAIService } from '../services/openaiService';
import { HuggingFaceService } from '../services/huggingFaceService';
import { CohereService } from '../services/cohereService';
import { GeminiService } from '../services/geminiService';
import { CustomModelService } from '../services/customModelService';
import { TogetherAIService } from '../services/togetherAIService';
import { StorageService } from '../services/storageService';
import { TikTokVideoService } from '../services/tikTokVideoService';
import TextToSpeechService from '../services/textToSpeechService';
import SpeechToTextService from '../services/speechToTextService';
import { TwitterShareService } from '../services/twitterShareService';

type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;

interface Props {
  navigation: ChatScreenNavigationProp;
}

const ChatScreen: React.FC<Props> = ({ navigation }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiService, setAiService] = useState<AIService | OpenAIService | HuggingFaceService | CohereService | GeminiService | CustomModelService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [activeProvider, setActiveProvider] = useState<'cohere' | 'huggingface' | 'openai' | 'gemini' | 'togetherai' | 'custom'>('openai');
  // Model/provider details are no longer shown to users
  const [availableProviders, setAvailableProviders] = useState<{
    cohere: boolean;
    huggingface: boolean;
    openai: boolean;
    gemini: boolean;
    togetherai: boolean;
    custom: boolean;
  }>({
    cohere: false,
    huggingface: false,
    openai: false,
    gemini: false,
    togetherai: false,
    custom: false,
  });
  
  const flatListRef = useRef<FlatList>(null);

  // Speech-to-text state
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [speechToTextSettings, setSpeechToTextSettings] = useState<any>(null);

  // Function to switch between available providers
  const switchProvider = async (provider: 'cohere' | 'huggingface' | 'openai' | 'gemini' | 'togetherai' | 'custom') => {
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
      } else if (provider === 'huggingface' && availableProviders.huggingface) {
        const huggingfaceKey = await storage.getHuggingFaceKey();
        if (huggingfaceKey) {
          try {
            setAiService(new HuggingFaceService(settings, huggingfaceKey));
            setIsAIEnabled(true);
            setActiveProvider('huggingface');
          } catch (error) {
            setIsAIEnabled(false);
            const errorMessage: Message = {
              id: 'hf-error-switch',
              text: "Hugging Face service unavailable. Please try a different AI provider.",
              sender: 'ai',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
          }
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
      } else if (provider === 'togetherai' && availableProviders.togetherai) {
        const togetherAIKey = await storage.getTogetherAIKey();
        if (togetherAIKey) {
          setAiService(new TogetherAIService(settings, togetherAIKey));
          setIsAIEnabled(true);
          setActiveProvider('togetherai');
        }
      } else if (provider === 'custom' && availableProviders.custom) {
        const customModels = await storage.getCustomModels();
        if (customModels.length > 0) {
          // Use the first custom model for now (could be enhanced to let user choose)
          const customModel = customModels[0];
          setAiService(new CustomModelService(settings, customModel));
          setIsAIEnabled(true);
          setActiveProvider('custom');
        }
      }
    } catch (error) {
      console.error('Error switching provider:', error);
    }
  };

  // Initialize AI service and welcome message
  useEffect(() => {
    const initializeAI = async () => {
      try {
        const storage = StorageService.getInstance();
        
        // Add timeout to prevent hanging
        const hasApiKey = await Promise.race([
          storage.hasApiKey(),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000))
        ]);
        
        // Load saved settings or use defaults
        const savedSettings = await Promise.race([
          storage.getSettings(),
          new Promise<any>((resolve) => setTimeout(() => resolve(null), 2000))
        ]);
        
        const settings: UserSettings = {
          roastIntensity: 'medium',
          aiPersonality: 'sarcastic',
          enableNotifications: true,
          enableSound: true,
          ...savedSettings, // Override with saved settings if they exist
        };


        // If BYOK is disabled, default to backend-powered OpenAI service
        if (!FEATURES.ENABLE_BYOK) {
          setAiService(new OpenAIService(settings, ''));
          setIsAIEnabled(true);
          setActiveProvider('openai');
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
        const [cohereKey, huggingfaceKey, openaiKey, geminiKey, togetherAIKey] = FEATURES.ENABLE_BYOK
          ? await Promise.all([
              storage.getCohereKey(),
              storage.getHuggingFaceKey(),
              storage.getOpenAIKey(),
              storage.getGeminiKey(),
              storage.getTogetherAIKey(),
            ])
          : [null, null, null, null, null];

        // Check for custom models
        const customModels = await storage.getCustomModels();
        
        // Update available providers state
        setAvailableProviders({
          cohere: !!cohereKey,
          huggingface: !!huggingfaceKey,
          openai: !!openaiKey,
          gemini: !!geminiKey,
          togetherai: !!togetherAIKey,
          custom: customModels.length > 0,
        });

        // Set the best available provider as default (Cohere > Together AI > Gemini > Hugging Face > OpenAI > Template)
        if (cohereKey) {
          setAiService(new CohereService(settings, cohereKey));
          setIsAIEnabled(true);
          setActiveProvider('cohere');
        } else if (togetherAIKey) {
          setAiService(new TogetherAIService(settings, togetherAIKey));
          setIsAIEnabled(true);
          setActiveProvider('togetherai');
        } else if (geminiKey) {
          setAiService(new GeminiService(settings, geminiKey));
          setIsAIEnabled(true);
          setActiveProvider('gemini');
        } else if (huggingfaceKey) {
          try {
            setAiService(new HuggingFaceService(settings, huggingfaceKey));
            setIsAIEnabled(true);
            setActiveProvider('huggingface');
                      } catch (error) {
              setAiService(null);
              setIsAIEnabled(false);
              const errorMessage: Message = {
                id: 'hf-error-focus',
                text: "Hugging Face service unavailable. Please try a different AI provider.",
                sender: 'ai',
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, errorMessage]);
            }
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
        console.error('Error initializing AI:', error);
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

  // Load speech-to-text settings
  useEffect(() => {
    const loadSpeechToTextSettings = async () => {
      try {
        const storage = StorageService.getInstance();
        const settings = await storage.getSpeechToTextSettings();
        setSpeechToTextSettings(settings || {
          language: 'en-US',
          autoSend: true,
          continuous: false,
          timeout: 5000,
        });
      } catch (error) {
        console.error('Error loading speech-to-text settings:', error);
      }
    };
    loadSpeechToTextSettings();
  }, []);

  // Reload settings when screen focuses (in case user changed settings)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const reloadSettings = async () => {
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
            setAiService(new OpenAIService(settings, ''));
            setIsAIEnabled(true);
            setActiveProvider('openai');
            return;
          }

          // Check for all available providers
          const [cohereKey, huggingfaceKey, openaiKey, geminiKey, togetherAIKey] = await Promise.all([
            storage.getCohereKey(),
            storage.getHuggingFaceKey(),
            storage.getOpenAIKey(),
            storage.getGeminiKey(),
            storage.getTogetherAIKey(),
          ]);

          // Check for custom models
          const customModels = await storage.getCustomModels();
          
          // Update available providers state
          setAvailableProviders({
            cohere: !!cohereKey,
            huggingface: !!huggingfaceKey,
            openai: !!openaiKey,
            gemini: !!geminiKey,
            togetherai: !!togetherAIKey,
            custom: customModels.length > 0,
          });

          // Set the best available provider as default (Cohere > Together AI > Gemini > Hugging Face > OpenAI > Template)
          if (cohereKey) {
            setAiService(new CohereService(settings, cohereKey));
            setIsAIEnabled(true);
            setActiveProvider('cohere');
          } else if (togetherAIKey) {
            setAiService(new TogetherAIService(settings, togetherAIKey));
            setIsAIEnabled(true);
            setActiveProvider('togetherai');
          } else if (geminiKey) {
            setAiService(new GeminiService(settings, geminiKey));
            setIsAIEnabled(true);
            setActiveProvider('gemini');
          } else if (huggingfaceKey) {
            try {
              setAiService(new HuggingFaceService(settings, huggingfaceKey));
              setIsAIEnabled(true);
              setActiveProvider('huggingface');
            } catch (error) {
              setIsAIEnabled(false);
              const errorMessage: Message = {
                id: 'hf-error',
                text: "Hugging Face service unavailable. Please try a different AI provider.",
                sender: 'ai',
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, errorMessage]);
            }
          } else if (openaiKey) {
            setAiService(new OpenAIService(settings, openaiKey));
            setIsAIEnabled(true);
            setActiveProvider('openai');
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
          console.error('Error reloading settings:', error);
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

  // Cleanup speech-to-text service on unmount
  useEffect(() => {
    return () => {
      if (FEATURES.ENABLE_REALTIME_VOICE) {
        const speechToTextService = SpeechToTextService.getInstance();
        speechToTextService.destroy();
      }
    };
  }, []);

  // Auto-scroll when keyboard appears
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    return () => keyboardDidShowListener.remove();
  }, []);

  // Speech-to-text functions
  const startRecording = async () => {
    if (!FEATURES.ENABLE_REALTIME_VOICE) {
      return;
    }

    try {
      const speechToTextService = SpeechToTextService.getInstance();
      
      // Update service settings with user preferences
      if (speechToTextSettings) {
        speechToTextService.updateSettings(speechToTextSettings);
      }

      const success = await speechToTextService.startRecording(
        (result) => {
          // Handle partial results
          setTranscriptionText(result.text);
        },
        (error) => {
          console.error('Speech recognition error:', error);
          setIsRecording(false);
        }
      );

      if (success) {
        setIsRecording(true);
        setTranscriptionText('');
      }
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  };

  const stopRecording = async () => {
    if (!FEATURES.ENABLE_REALTIME_VOICE) {
      return;
    }

    try {
      const speechToTextService = SpeechToTextService.getInstance();
      await speechToTextService.stopRecording();
      setIsRecording(false);
      
      // Get the final result
      const finalResult = speechToTextService.getLastResult();
      const finalText = finalResult?.text || transcriptionText;
      
      // If auto-send is enabled and we have transcription text, send the message
      if (speechToTextSettings?.autoSend && finalText.trim()) {
        setInputText(finalText);
        setTimeout(() => {
          sendMessage();
        }, 100);
      } else if (finalText.trim()) {
        // Just set the text for manual sending
        setInputText(finalText);
      }
      
      setTranscriptionText('');
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      setIsRecording(false);
    }
  };

  const handleVoiceButtonPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !aiService) return;

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

      // Auto-play voice if enabled
      try {
        const voiceSettings = await TextToSpeechService.getVoiceSettings();
        if (voiceSettings?.autoPlay) {
          const personality = (aiService as any).settings?.aiPersonality || 'brutal';
          await TextToSpeechService.speakRoast(aiResponse, personality);
        }
      } catch (error) {
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
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
    
      const handleShareToTikTok = () => {
    if (aiService) {
      const settings = (aiService as any).settings || {
        roastIntensity: 'medium',
        aiPersonality: 'sarcastic',
        allowCursing: false,
      };
      navigation.navigate('TikTokVideo', {
        roastText: item.text,
        settings,
      });
    }
  };

  const handleShareToTwitter = async () => {
    try {
      const twitterService = TwitterShareService.getInstance();
      
      const success = await twitterService.shareRoastToTwitter(
        item.text,
        true // include app link
      );
      
      if (success) {
        // Show success feedback
      } else {
        // Fall back to tweet generator
        navigation.navigate('TweetGenerator', {
          roastText: item.text,
        });
      }
    } catch (error) {
      console.error('Error sharing roast to Twitter:', error);
      // Fall back to tweet generator
      navigation.navigate('TweetGenerator', {
        roastText: item.text,
      });
    }
  };

  const handleShareScreenshot = () => {
    if (aiService) {
      const settings = (aiService as any).settings || {
        roastIntensity: 'medium',
        aiPersonality: 'sarcastic',
        allowCursing: false,
      };
      navigation.navigate('Screenshot', {
        roastText: item.text,
        userName: settings?.userName,
        messages: messages,
      });
    }
  };

  const handleSpeakRoast = async () => {
    try {
      await TextToSpeechService.speakRoast(item.text);
    } catch (error) {
      console.error('Error speaking roast:', error);
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
                  {FEATURES.ENABLE_TIKTOK_VIDEO ? (
                    <TouchableOpacity
                      style={styles.shareButton}
                      onPress={handleShareToTikTok}
                    >
                      <Ionicons name="videocam" size={16} color="#4ECDC4" />
                    </TouchableOpacity>
                  ) : null}
                  {FEATURES.ENABLE_TWITTER_SHARE && (
                    <TouchableOpacity
                      style={styles.shareButton}
                      onPress={handleShareToTwitter}
                    >
                      <Ionicons name="logo-twitter" size={16} color="#1DA1F2" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShareScreenshot}
                  >
                    <Ionicons name="camera" size={16} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              )}
          </View>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
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
  };

  // Helper to get model/provider name (hidden)
  const getModelName = () => '';

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
            <Text style={[styles.aiStatusText, { color: isAIEnabled ? "#FFD700" : "#ccc" }]}>
              {isAIEnabled ? `AI Enabled${getModelName() ? ` (${getModelName()})` : ''}` : "AI Service Unavailable"}
            </Text>
          </View>
          
          {/* Provider Switcher - Only show if BYOK enabled and multiple providers are available */}
          {FEATURES.ENABLE_BYOK && (availableProviders.cohere || availableProviders.togetherai || availableProviders.gemini || availableProviders.huggingface || availableProviders.openai || availableProviders.custom) && (
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
              {availableProviders.togetherai && (
                <TouchableOpacity
                  style={[
                    styles.providerButton,
                    activeProvider === 'togetherai' && styles.activeProviderButton
                  ]}
                  onPress={() => switchProvider('togetherai')}
                >
                  <Text style={[
                    styles.providerButtonText,
                    activeProvider === 'togetherai' && styles.activeProviderButtonText
                  ]}>
                    Together
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
              {availableProviders.huggingface && (
                <TouchableOpacity
                  style={[
                    styles.providerButton,
                    activeProvider === 'huggingface' && styles.activeProviderButton
                  ]}
                  onPress={() => switchProvider('huggingface')}
                >
                  <Text style={[
                    styles.providerButtonText,
                    activeProvider === 'huggingface' && styles.activeProviderButtonText
                  ]}>
                    HF
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
              {availableProviders.custom && (
                <TouchableOpacity
                  style={[
                    styles.providerButton,
                    activeProvider === 'custom' && styles.activeProviderButton
                  ]}
                  onPress={() => switchProvider('custom')}
                >
                  <Text style={[
                    styles.providerButtonText,
                    activeProvider === 'custom' && styles.activeProviderButtonText
                  ]}>
                    Custom
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
          ListFooterComponent={renderTypingIndicator}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />
        {/* Input Section */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            {/* Voice Button */}
            {FEATURES.ENABLE_REALTIME_VOICE && (
              <TouchableOpacity
                style={[styles.voiceButton, isRecording && styles.voiceButtonRecording]}
                onPress={handleVoiceButtonPress}
                disabled={isTyping}
              >
                <Ionicons
                  name={isRecording ? "stop" : "mic"}
                  size={20}
                  color={isRecording ? "#FF4444" : "#FFD93D"}
                />
              </TouchableOpacity>
            )}

            {/* Transcription Display */}
            {FEATURES.ENABLE_REALTIME_VOICE && transcriptionText && (
              <View style={styles.transcriptionContainer}>
                <Text style={styles.transcriptionText}>{transcriptionText}</Text>
              </View>
            )}

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
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 217, 61, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 217, 61, 0.3)',
  },
  voiceButtonRecording: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderColor: 'rgba(255, 68, 68, 0.5)',
  },
  transcriptionContainer: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  transcriptionText: {
    color: '#4ECDC4',
    fontSize: 14,
    fontStyle: 'italic',
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