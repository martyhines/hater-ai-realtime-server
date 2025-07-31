import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StorageService } from '../services/storageService';
import { CustomModel } from '../types';

interface Props {
  navigation: any;
}

const CustomModelScreen: React.FC<Props> = ({ navigation }) => {
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [modelName, setModelName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [requestFormat, setRequestFormat] = useState<'openai' | 'cohere' | 'huggingface' | 'custom'>('openai');
  const [responsePath, setResponsePath] = useState('');
  const [temperature, setTemperature] = useState('0.9');
  const [maxTokens, setMaxTokens] = useState('150');
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [customPromptTemplate, setCustomPromptTemplate] = useState('');

  useEffect(() => {
    loadCustomModels();
  }, []);

  const loadCustomModels = async () => {
    try {
      const storage = StorageService.getInstance();
      const models = await storage.getCustomModels();
      setCustomModels(models);
    } catch (error) {
      console.error('Error loading custom models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddModel = async () => {
    if (!modelName.trim() || !endpoint.trim() || !responsePath.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      Alert.alert('Error', 'Endpoint must be a valid URL starting with http:// or https://');
      return;
    }

    try {
      const newModel: CustomModel = {
        id: Date.now().toString(),
        name: modelName.trim(),
        endpoint: endpoint.trim(),
        apiKey: apiKey.trim() || undefined,
        requestFormat,
        responsePath: responsePath.trim(),
        parameters: {
          temperature: parseFloat(temperature) || 0.9,
          maxTokens: parseInt(maxTokens) || 150,
        },
        promptTemplate: useCustomPrompt ? customPromptTemplate.trim() : undefined,
      };

      const storage = StorageService.getInstance();
      await storage.saveCustomModel(newModel);
      
      Alert.alert('Success', 'Custom model added successfully!');
      setShowAddForm(false);
      resetForm();
      loadCustomModels();
    } catch (error) {
      console.error('Error adding custom model:', error);
      Alert.alert('Error', 'Failed to add custom model. Please try again.');
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    Alert.alert(
      'Delete Model',
      'Are you sure you want to delete this custom model?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const storage = StorageService.getInstance();
              await storage.deleteCustomModel(modelId);
              loadCustomModels();
            } catch (error) {
              console.error('Error deleting custom model:', error);
              Alert.alert('Error', 'Failed to delete custom model.');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setModelName('');
    setEndpoint('');
    setApiKey('');
    setRequestFormat('openai');
    setResponsePath('');
    setTemperature('0.9');
    setMaxTokens('150');
    setUseCustomPrompt(false);
    setCustomPromptTemplate('');
  };

  const getFormatExamples = () => {
    switch (requestFormat) {
      case 'openai':
        return {
          request: '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "Hello"}]}',
          response: '{"choices": [{"message": {"content": "Hello there!"}}]}',
          path: 'choices.0.message.content'
        };
      case 'cohere':
        return {
          request: '{"model": "command", "prompt": "Hello", "max_tokens": 150}',
          response: '{"generations": [{"text": "Hello there!"}]}',
          path: 'generations.0.text'
        };
      case 'huggingface':
        return {
          request: '{"inputs": "Hello", "parameters": {"max_length": 50}}',
          response: '[{"generated_text": "Hello there!"}]',
          path: '0.generated_text'
        };
      default:
        return {
          request: '{"prompt": "Hello", "max_tokens": 150}',
          response: '{"response": "Hello there!"}',
          path: 'response'
        };
    }
  };

  const examples = getFormatExamples();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Custom Models</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('HowToCustomModel')} 
            style={styles.helpButton}
          >
            <Ionicons name="help-circle-outline" size={24} color="#4ECDC4" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowAddForm(true)} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading custom models...</Text>
        ) : customModels.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="construct" size={64} color="#666" />
            <Text style={styles.emptyTitle}>No Custom Models</Text>
            <Text style={styles.emptySubtitle}>
              Add your own AI models to expand your roasting capabilities
            </Text>
            <TouchableOpacity 
              style={styles.addFirstButton}
              onPress={() => setShowAddForm(true)}
            >
              <Text style={styles.addFirstButtonText}>Add Your First Model</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.howToButton}
              onPress={() => navigation.navigate('HowToCustomModel')}
            >
              <Text style={styles.howToButtonText}>📖 How to Add Custom Models</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.modelsList}>
            {customModels.map((model) => (
              <View key={model.id} style={styles.modelCard}>
                <View style={styles.modelHeader}>
                  <Text style={styles.modelName}>{model.name}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteModel(model.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modelEndpoint}>{model.endpoint}</Text>
                <Text style={styles.modelFormat}>Format: {model.requestFormat}</Text>
                {model.apiKey && (
                  <Text style={styles.modelApiKey}>API Key: {model.apiKey.substring(0, 10)}...</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {showAddForm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Model</Text>
              <TouchableOpacity onPress={() => setShowAddForm(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Model Name *</Text>
              <TextInput
                style={styles.input}
                value={modelName}
                onChangeText={setModelName}
                placeholder="My Custom Model"
                placeholderTextColor="#666"
              />

              <Text style={styles.label}>API Endpoint *</Text>
              <TextInput
                style={styles.input}
                value={endpoint}
                onChangeText={setEndpoint}
                placeholder="https://api.example.com/v1/chat/completions"
                placeholderTextColor="#666"
                autoCapitalize="none"
              />

              <Text style={styles.label}>API Key (Optional)</Text>
              <TextInput
                style={styles.input}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="sk-..."
                placeholderTextColor="#666"
                autoCapitalize="none"
                secureTextEntry
              />

              <Text style={styles.label}>Request Format *</Text>
              <View style={styles.formatButtons}>
                {(['openai', 'cohere', 'huggingface', 'custom'] as const).map((format) => (
                  <TouchableOpacity
                    key={format}
                    style={[
                      styles.formatButton,
                      requestFormat === format && styles.formatButtonActive
                    ]}
                    onPress={() => setRequestFormat(format)}
                  >
                    <Text style={[
                      styles.formatButtonText,
                      requestFormat === format && styles.formatButtonTextActive
                    ]}>
                      {format.charAt(0).toUpperCase() + format.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Response Path *</Text>
              <TextInput
                style={styles.input}
                value={responsePath}
                onChangeText={setResponsePath}
                placeholder={examples.path}
                placeholderTextColor="#666"
                autoCapitalize="none"
              />

              <View style={styles.parameterRow}>
                <View style={styles.parameterHalf}>
                  <Text style={styles.label}>Temperature</Text>
                  <TextInput
                    style={styles.input}
                    value={temperature}
                    onChangeText={setTemperature}
                    placeholder="0.9"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.parameterHalf}>
                  <Text style={styles.label}>Max Tokens</Text>
                  <TextInput
                    style={styles.input}
                    value={maxTokens}
                    onChangeText={setMaxTokens}
                    placeholder="150"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Use Custom Prompt Template</Text>
                <Switch
                  value={useCustomPrompt}
                  onValueChange={setUseCustomPrompt}
                  trackColor={{ false: '#444', true: '#FF6B6B' }}
                  thumbColor={useCustomPrompt ? '#fff' : '#ccc'}
                />
              </View>

              {useCustomPrompt && (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={customPromptTemplate}
                  onChangeText={setCustomPromptTemplate}
                  placeholder="Use {{system}} for system prompt and {{user}} for user message"
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={4}
                />
              )}

              <View style={styles.exampleSection}>
                <Text style={styles.exampleTitle}>Example for {requestFormat}:</Text>
                <Text style={styles.exampleLabel}>Request:</Text>
                <Text style={styles.exampleCode}>{examples.request}</Text>
                <Text style={styles.exampleLabel}>Response:</Text>
                <Text style={styles.exampleCode}>{examples.response}</Text>
                <Text style={styles.exampleLabel}>Response Path:</Text>
                <Text style={styles.exampleCode}>{examples.path}</Text>
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleAddModel}>
                  <Text style={styles.saveButtonText}>Add Model</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#2a2a2a',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  helpButton: {
    padding: 8,
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingText: {
    color: '#ccc',
    textAlign: 'center',
    marginTop: 50,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  addFirstButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  howToButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 15,
  },
  howToButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modelsList: {
    gap: 15,
  },
  modelCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  deleteButton: {
    padding: 5,
  },
  modelEndpoint: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 5,
  },
  modelFormat: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  modelApiKey: {
    fontSize: 14,
    color: '#999',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  formatButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
  },
  formatButtonActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  formatButtonText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
  formatButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  parameterRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  parameterHalf: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  exampleSection: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  exampleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ccc',
    marginTop: 10,
    marginBottom: 5,
  },
  exampleCode: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    backgroundColor: '#000',
    padding: 8,
    borderRadius: 4,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    backgroundColor: '#444',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomModelScreen; 