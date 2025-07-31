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
  const [activeProvider, setActiveProvider] = useState<'cohere' | 'huggingface' | 'openai' | 'gemini' | 'togetherai' | 'custom' | 'template'>('template');
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

  // Function to switch between available providers
  const switchProvider = async (provider: 'cohere' | 'huggingface' | 'openai' | 'gemini' | 'togetherai' | 'custom' | 'template') => {
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

      if (provider === 'template') {
        setAiService(new AIService(settings));
        setIsAIEnabled(false);
        setActiveProvider('template');
      } else if (provider === 'cohere' && availableProviders.cohere) {
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
            console.log('Hugging Face service failed, falling back to template mode');
            setAiService(new AIService(settings));
            setIsAIEnabled(false);
            setActiveProvider('template');
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

        console.log('Loaded settings:', settings);

        // Start with template service by default for faster loading
        setAiService(new AIService(settings));
        setIsAIEnabled(false);

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
          console.log('Cohere API key found, setting up Cohere service');
          setAiService(new CohereService(settings, cohereKey));
          setIsAIEnabled(true);
          setActiveProvider('cohere');
        } else if (togetherAIKey) {
          console.log('Together AI API key found, setting up Together AI service');
          setAiService(new TogetherAIService(settings, togetherAIKey));
          setIsAIEnabled(true);
          setActiveProvider('togetherai');
        } else if (geminiKey) {
          console.log('Gemini API key found, setting up Gemini service');
          setAiService(new GeminiService(settings, geminiKey));
          setIsAIEnabled(true);
          setActiveProvider('gemini');
        } else if (huggingfaceKey) {
          console.log('Hugging Face API key found, setting up HuggingFace service');
          try {
            setAiService(new HuggingFaceService(settings, huggingfaceKey));
            setIsAIEnabled(true);
            setActiveProvider('huggingface');
          } catch (error) {
            console.log('Hugging Face service failed, falling back to template mode');
            setAiService(new AIService(settings));
            setIsAIEnabled(false);
            setActiveProvider('template');
          }
        } else if (openaiKey) {
          console.log('OpenAI API key found, setting up OpenAI service');
          setAiService(new OpenAIService(settings, openaiKey));
          setIsAIEnabled(true);
          setActiveProvider('openai');
        } else {
          console.log('No API keys found, using template mode');
          setAiService(new AIService(settings));
          setIsAIEnabled(false);
          setActiveProvider('template');
        }

        const welcomeMessage: Message = {
          id: 'welcome',
          text: hasApiKey 
            ? "Oh great, another human who thinks they're worth talking to. What do you want?"
            : "Oh great, another human who thinks they're worth talking to. What do you want? (Using template responses - enable real AI for better roasts!)",
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      } catch (error) {
        console.error('Error initializing AI:', error);
        // Fallback to basic template service
        const settings: UserSettings = {
          roastIntensity: 'medium',
          aiPersonality: 'sarcastic',
          enableNotifications: true,
          enableSound: true,
          allowCursing: false,
        };
        setAiService(new AIService(settings));
        setIsAIEnabled(false);
        
        const welcomeMessage: Message = {
          id: 'welcome',
          text: "Oh great, another human who thinks they're worth talking to. What do you want? (Template mode)",
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
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
        try {
          const storage = StorageService.getInstance();
          const savedSettings = await storage.getSettings();
          console.log('🎯 ChatScreen - Loaded Settings:', savedSettings);
          console.log('🎯 ChatScreen - Personalization Data:', savedSettings.personalization);
          
          const settings: UserSettings = {
            roastIntensity: 'medium',
            aiPersonality: 'sarcastic',
            enableNotifications: true,
            enableSound: true,
            allowCursing: false,
            ...savedSettings,
          };

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
            console.log('Switching to Cohere service');
            setAiService(new CohereService(settings, cohereKey));
            setIsAIEnabled(true);
            setActiveProvider('cohere');
          } else if (togetherAIKey) {
            console.log('Switching to Together AI service');
            setAiService(new TogetherAIService(settings, togetherAIKey));
            setIsAIEnabled(true);
            setActiveProvider('togetherai');
          } else if (geminiKey) {
            console.log('Switching to Gemini service');
            setAiService(new GeminiService(settings, geminiKey));
            setIsAIEnabled(true);
            setActiveProvider('gemini');
          } else if (huggingfaceKey) {
            console.log('Switching to Hugging Face service');
            try {
              setAiService(new HuggingFaceService(settings, huggingfaceKey));
              setIsAIEnabled(true);
              setActiveProvider('huggingface');
            } catch (error) {
              console.log('Hugging Face service failed, falling back to template mode');
              setAiService(new AIService(settings));
              setIsAIEnabled(false);
              setActiveProvider('template');
            }
          } else if (openaiKey) {
            console.log('Switching to OpenAI service');
            setAiService(new OpenAIService(settings, openaiKey));
            setIsAIEnabled(true);
            setActiveProvider('openai');
          } else {
            console.log('No API keys found, using template mode');
            setAiService(new AIService(settings));
            setIsAIEnabled(false);
            setActiveProvider('template');
          }
        } catch (error) {
          console.error('Error reloading settings:', error);
          // Fallback to template service
          const settings: UserSettings = {
            roastIntensity: 'medium',
            aiPersonality: 'sarcastic',
            enableNotifications: true,
            enableSound: true,
            allowCursing: false,
          };
          setAiService(new AIService(settings));
          setIsAIEnabled(false);
          setActiveProvider('template');
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
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
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

  const handleShareToTwitter = () => {
    navigation.navigate('TweetGenerator', {
      roastText: item.text,
    });
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
                    onPress={handleShareToTikTok}
                  >
                    <Ionicons name="videocam" size={16} color="#4ECDC4" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShareToTwitter}
                  >
                    <Ionicons name="logo-twitter" size={16} color="#1DA1F2" />
                  </TouchableOpacity>
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

  // Helper to get model/provider name
  const getModelName = () => {
    switch (activeProvider) {
      case 'cohere':
        return 'Cohere (command)';
      case 'togetherai':
        return 'Together AI (Mistral-7B)';
      case 'gemini':
        return 'Google Gemini (gemini-1.5-flash)';
      case 'huggingface':
        return 'Hugging Face (DialoGPT)';
      case 'openai':
        return 'OpenAI (gpt-3.5-turbo)';
      case 'custom':
        return 'Custom Model';
      case 'template':
      default:
        return '';
    }
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
            <Text style={[styles.aiStatusText, { color: isAIEnabled ? "#FFD700" : "#ccc" }]}> 
              {isAIEnabled ? `Real AI${getModelName() ? ` (${getModelName()})` : ''}` : "Template Mode"}
            </Text>
          </View>
          
          {/* Provider Switcher - Only show if multiple providers are available */}
          {(availableProviders.cohere || availableProviders.togetherai || availableProviders.gemini || availableProviders.huggingface || availableProviders.openai || availableProviders.custom) && (
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
              <TouchableOpacity
                style={[
                  styles.providerButton,
                  activeProvider === 'template' && styles.activeProviderButton
                ]}
                onPress={() => switchProvider('template')}
              >
                <Text style={[
                  styles.providerButtonText,
                  activeProvider === 'template' && styles.activeProviderButtonText
                ]}>
                  Template
                </Text>
              </TouchableOpacity>
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