import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { StorageService } from '../services/storageService';
import { FEATURES } from '../config/features';

type ApiKeyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ApiKey'>;

interface Props {
  navigation: ApiKeyScreenNavigationProp;
}

const ApiKeyScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'cohere' | 'gemini' | 'custom'>('cohere');
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [existingKeys, setExistingKeys] = useState<{
    openai: boolean;
    cohere: boolean;
    gemini: boolean;
    custom: boolean;
  }>({
    openai: false,
    cohere: false,
    gemini: false,
    custom: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const providerNames = {
    openai: 'OpenAI',
    cohere: 'Cohere',
    gemini: 'Google Gemini',
    custom: 'Custom Model'
  };

  // Check for existing API keys on component mount and when screen focuses
  useEffect(() => {
    const checkExistingKeys = async () => {
      try {
        const storage = StorageService.getInstance();

        const [openaiKey, cohereKey, geminiKey, customModels] = await Promise.all([
          storage.getOpenAIKey(),
          storage.getCohereKey(),
          storage.getGeminiKey(),
          storage.getCustomModels(),
        ]);

        setExistingKeys({
          openai: !!openaiKey,
          cohere: !!cohereKey,
          gemini: !!geminiKey,
          custom: customModels.length > 0,
        });
      } catch (error) {
        } finally {
        setIsLoading(false);
      }
    };

    checkExistingKeys();
  }, []);

  // Refresh existing keys when screen focuses (in case user navigated back from Chat)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const refreshExistingKeys = async () => {
        try {
          const storage = StorageService.getInstance();

          const [openaiKey, cohereKey, geminiKey, customModels] = await Promise.all([
            storage.getOpenAIKey(),
            storage.getCohereKey(),
            storage.getGeminiKey(),
            storage.getCustomModels(),
          ]);

          setExistingKeys({
            openai: !!openaiKey,
            cohere: !!cohereKey,
            gemini: !!geminiKey,
            custom: customModels.length > 0,
          });
        } catch (error) {
          }
      };
      refreshExistingKeys();
    });

    return unsubscribe;
  }, [navigation]);

  const validateApiKey = (key: string): boolean => {
    if (selectedProvider === 'openai') {
      return key.startsWith('sk-') && key.length > 20;
    } else if (selectedProvider === 'gemini') {
      // Gemini API keys start with AIza and contain alphanumeric, hyphens, and underscores
      return /^AIza[a-zA-Z0-9_-]{35,}$/.test(key);
    } else {
      // Cohere API keys are alphanumeric and typically 40+ characters
      return /^[a-zA-Z0-9]{40,}$/.test(key);
    }
  };

  const handleProviderSelect = (provider: 'openai' | 'cohere' | 'gemini' | 'custom') => {
    if (provider === 'custom') {
      // Navigate to custom models screen
      navigation.navigate('CustomModel');
    } else if (existingKeys[provider]) {
      // If this provider already has a key, navigate directly to Chat
      navigation.navigate('Chat');
    } else {
      // No key exists, allow normal selection
      setSelectedProvider(provider);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    if (!validateApiKey(apiKey)) {
      Alert.alert('Error', 'Invalid API key format');
      return;
    }

    setIsValidating(true);

    try {
      const storage = StorageService.getInstance();

      switch (selectedProvider) {
        case 'openai':
          await storage.saveOpenAIKey(apiKey);
          break;
        case 'cohere':
          await storage.saveCohereKey(apiKey);
          break;
        case 'gemini':
          await storage.saveGeminiKey(apiKey);
          break;
        case 'custom':
          // Custom models are handled in CustomModelScreen
          break;
      }

      setApiKey('');
      setSelectedProvider('cohere');

      // Refresh existing keys
      const [openaiKey, cohereKey, geminiKey, customModels] = await Promise.all([
        storage.getOpenAIKey(),
        storage.getCohereKey(),
        storage.getGeminiKey(),
        storage.getCustomModels(),
      ]);

      setExistingKeys({
        openai: !!openaiKey,
        cohere: !!cohereKey,
        gemini: !!geminiKey,
        custom: customModels.length > 0,
      });

      Alert.alert('Success', `${providerNames[selectedProvider]} API key saved successfully!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleDeleteApiKey = async (provider: 'openai' | 'cohere' | 'gemini' | 'custom') => {
    Alert.alert(
      'Delete API Key',
      `Are you sure you want to delete your ${providerNames[provider]} API key?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const storage = StorageService.getInstance();

              switch (provider) {
                case 'openai':
                  await storage.deleteOpenAIKey();
                  break;
                case 'cohere':
                  await storage.deleteCohereKey();
                  break;
                case 'gemini':
                  await storage.deleteGeminiKey();
                  break;
                case 'custom':
                  // Custom models are handled in CustomModelScreen
                  break;
              }

              // Refresh existing keys
              const [openaiKey, cohereKey, geminiKey, customModels] = await Promise.all([
                storage.getOpenAIKey(),
                storage.getCohereKey(),
                storage.getGeminiKey(),
                storage.getCustomModels(),
              ]);

              setExistingKeys({
                openai: !!openaiKey,
                cohere: !!cohereKey,
                gemini: !!geminiKey,
                custom: customModels.length > 0,
              });

              Alert.alert('Success', `${providerNames[provider]} API key deleted successfully!`);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete API key. Please try again.');
            }
          },
        },
      ]
    );
  };

  const openOpenAISignup = () => {
    Linking.openURL('https://platform.openai.com/signup');
  };

  const openOpenAIApiKeys = () => {
    Linking.openURL('https://platform.openai.com/api-keys');
  };

  const openCohereSignup = () => {
    Linking.openURL('https://cohere.ai/signup');
  };

  const openCohereApiKeys = () => {
    Linking.openURL('https://dashboard.cohere.ai/api-keys');
  };

  const openGeminiSignup = () => {
    Linking.openURL('https://makersuite.google.com/app/apikey');
  };

  const openGeminiApiKeys = () => {
    Linking.openURL('https://makersuite.google.com/app/apikey');
  };

  const openTogetherAISignup = () => {
    Linking.openURL('https://together.xyz');
  };

  const openTogetherAIApiKeys = () => {
    Linking.openURL('https://together.xyz/api-keys');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Checking your AI setup...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!FEATURES.ENABLE_BYOK) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Managed billing is enabled. User API keys are disabled.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="key" size={48} color="#FF6B6B" />
          <Text style={styles.title}>Enable AI Enabled</Text>
          <Text style={styles.subtitle}>
            Choose your AI provider and connect your API key
          </Text>
        </View>

        {/* API Provider Selection */}
        <View style={styles.providerContainer}>
          <Text style={styles.sectionTitle}>Choose AI Provider:</Text>

          <View style={styles.providerCardContainer}>
            <TouchableOpacity
              style={[
                styles.providerCard,
                selectedProvider === 'cohere' && styles.selectedProviderCard,
                existingKeys.cohere && styles.providerCardWithKey
              ]}
              onPress={() => handleProviderSelect('cohere')}
            >
              <View style={styles.providerHeader}>
                <Ionicons name="rocket" size={24} color="#FF6B6B" />
                <Text style={styles.providerName}>Cohere (Recommended)</Text>
                {existingKeys.cohere && (
                  <View style={styles.keyIndicator}>
                    <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                    <Text style={styles.keyIndicatorText}>Ready</Text>
                  </View>
                )}
              </View>
              <Text style={styles.providerDescription}>
                Free tier: 5 requests/minute • Reliable • High quality responses
              </Text>
              <Text style={styles.providerKeyFormat}>Key format: 40+ character alphanumeric string</Text>
              {existingKeys.cohere && (
                <Text style={styles.readyToUseText}>✅ Ready to use - tap to start chatting!</Text>
              )}
            </TouchableOpacity>
            {existingKeys.cohere && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteApiKey('cohere')}
              >
                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            )}
          </View>



          <View style={styles.providerCardContainer}>
            <TouchableOpacity
              style={[
                styles.providerCard,
                selectedProvider === 'gemini' && styles.selectedProviderCard,
                existingKeys.gemini && styles.providerCardWithKey
              ]}
              onPress={() => handleProviderSelect('gemini')}
            >
              <View style={styles.providerHeader}>
                <Ionicons name="logo-google" size={24} color="#4285F4" />
                <Text style={styles.providerName}>Google Gemini</Text>
                {existingKeys.gemini && (
                  <View style={styles.keyIndicator}>
                    <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                    <Text style={styles.keyIndicatorText}>Ready</Text>
                  </View>
                )}
              </View>
              <Text style={styles.providerDescription}>
                Free tier: 60 requests/minute • High quality • Reliable service
              </Text>
              <Text style={styles.providerKeyFormat}>Key format: 40+ character alphanumeric string</Text>
              {existingKeys.gemini && (
                <Text style={styles.readyToUseText}>✅ Ready to use - tap to start chatting!</Text>
              )}
            </TouchableOpacity>
            {existingKeys.gemini && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteApiKey('gemini')}
              >
                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.providerCardContainer}>
            <TouchableOpacity
              style={[
                styles.providerCard,
                selectedProvider === 'openai' && styles.selectedProviderCard,
                existingKeys.openai && styles.providerCardWithKey
              ]}
              onPress={() => handleProviderSelect('openai')}
            >
              <View style={styles.providerHeader}>
                <Ionicons name="bulb" size={24} color="#A8E6CF" />
                <Text style={styles.providerName}>OpenAI</Text>
                {existingKeys.openai && (
                  <View style={styles.keyIndicator}>
                    <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                    <Text style={styles.keyIndicatorText}>Ready</Text>
                  </View>
                )}
              </View>
              <Text style={styles.providerDescription}>
                Paid service • High quality responses • Advanced models
              </Text>
              <Text style={styles.providerKeyFormat}>Key format: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</Text>
              {existingKeys.openai && (
                <Text style={styles.readyToUseText}>✅ Ready to use - tap to start chatting!</Text>
              )}
            </TouchableOpacity>
            {existingKeys.openai && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteApiKey('openai')}
              >
                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.providerCard,
              selectedProvider === 'custom' && styles.selectedProviderCard,
              existingKeys.custom && styles.providerCardWithKey
            ]}
            onPress={() => handleProviderSelect('custom')}
          >
            <View style={styles.providerHeader}>
              <Ionicons name="construct" size={24} color="#FFD700" />
              <Text style={styles.providerName}>Custom Model</Text>
              {existingKeys.custom && (
                <View style={styles.keyIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                  <Text style={styles.keyIndicatorText}>Ready</Text>
                </View>
              )}
            </View>
            <Text style={styles.providerDescription}>
              Add your own AI models • Custom endpoints • Flexible configuration
            </Text>
            <Text style={styles.providerKeyFormat}>Configure your own API endpoints and parameters</Text>
            {existingKeys.custom && (
              <Text style={styles.readyToUseText}>✅ Ready to use - tap to start chatting!</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* API Key Input - Only show if no key exists for selected provider */}
        {!existingKeys[selectedProvider] && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{providerNames[selectedProvider]} API Key</Text>
            <TextInput
              style={styles.textInput}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder={selectedProvider === 'openai' ? 'sk-...' : selectedProvider === 'gemini' ? 'Your Gemini API key...' : 'Your Cohere API key...'}
              placeholderTextColor="#666"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.inputHint}>
              Your API key is encrypted and stored securely on your device
            </Text>
          </View>
        )}

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>What you'll get:</Text>

          <View style={styles.benefitItem}>
            <Ionicons name="sparkles" size={20} color="#FFD700" />
            <Text style={styles.benefitText}>Dynamic, contextual responses</Text>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons name="bulb" size={20} color="#4ECDC4" />
            <Text style={styles.benefitText}>Conversation memory</Text>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons name="infinite" size={20} color="#FF6B6B" />
            <Text style={styles.benefitText}>Unlimited unique roasts</Text>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons name="trending-up" size={20} color="#A8E6CF" />
            <Text style={styles.benefitText}>Adaptive personality</Text>
          </View>
        </View>



        {/* Action Buttons - Only show if no key exists for selected provider */}
        {!existingKeys[selectedProvider] && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.saveButton, !apiKey.trim() && styles.saveButtonDisabled]}
              onPress={handleSaveApiKey}
              disabled={!apiKey.trim() || isValidating}
            >
              <Text style={styles.saveButtonText}>
                {isValidating ? 'Validating...' : 'Save & Continue'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Help Section - Only show if no key exists for selected provider */}
        {!existingKeys[selectedProvider] && (
          <View style={styles.helpContainer}>
            <Text style={styles.helpTitle}>Need help getting an API key?</Text>

            {selectedProvider === 'cohere' ? (
              <>
                <TouchableOpacity style={styles.helpButton} onPress={openCohereSignup}>
                  <Ionicons name="person-add" size={16} color="#4ECDC4" />
                  <Text style={styles.helpButtonText}>Create Cohere Account</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.helpButton} onPress={openCohereApiKeys}>
                  <Ionicons name="key-outline" size={16} color="#4ECDC4" />
                  <Text style={styles.helpButtonText}>Get API Key</Text>
                </TouchableOpacity>
              </>
            ) : selectedProvider === 'gemini' ? (
              <>
                <TouchableOpacity style={styles.helpButton} onPress={openGeminiSignup}>
                  <Ionicons name="person-add" size={16} color="#4ECDC4" />
                  <Text style={styles.helpButtonText}>Create Google AI Studio Account</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.helpButton} onPress={openGeminiApiKeys}>
                  <Ionicons name="key-outline" size={16} color="#4ECDC4" />
                  <Text style={styles.helpButtonText}>Get API Key</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.helpButton} onPress={openOpenAISignup}>
                  <Ionicons name="person-add" size={16} color="#4ECDC4" />
                  <Text style={styles.helpButtonText}>Create OpenAI Account</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.helpButton} onPress={openOpenAIApiKeys}>
                  <Ionicons name="key-outline" size={16} color="#4ECDC4" />
                  <Text style={styles.helpButtonText}>Get API Key</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Cost Info - Only show if no key exists for selected provider */}
        {!existingKeys[selectedProvider] && (
          <View style={styles.costContainer}>
            <Text style={styles.costTitle}>💰 Cost Information</Text>
            <Text style={styles.costText}>
              {selectedProvider === 'cohere'
                ? 'Cohere offers 5 free requests per minute! Perfect for testing and casual use. No credit card required.'
                : selectedProvider === 'gemini'
                  ? 'Google Gemini offers 60 free requests per minute! Perfect for testing and casual use. No credit card required.'
                  : 'OpenAI charges ~$0.03 per 1K tokens. A typical roast uses about 50-100 tokens, so you can get hundreds of roasts for just a few dollars!'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 22,
  },
  providerContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  providerCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  providerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  selectedProviderCard: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  providerCardWithKey: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  keyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyIndicatorText: {
    fontSize: 14,
    color: '#4ECDC4',
    marginLeft: 4,
    fontWeight: '600',
  },
  readyToUseText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  providerDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
    lineHeight: 18,
  },
  providerKeyFormat: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  benefitsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputHint: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginBottom: 30,
  },
  saveButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#444',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#ccc',
  },
  helpContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  helpButtonText: {
    fontSize: 16,
    color: '#4ECDC4',
    marginLeft: 8,
  },
  costContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  costTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  costText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
});

export default ApiKeyScreen; 