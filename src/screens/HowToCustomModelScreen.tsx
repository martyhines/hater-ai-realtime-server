import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  navigation: any;
}

const HowToCustomModelScreen: React.FC<Props> = ({ navigation }) => {
  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>How to Add Custom Models</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 What are Custom Models?</Text>
          <Text style={styles.description}>
            Custom models allow you to connect your own AI endpoints to Hater AI. This means you can use any AI service that provides a REST API, giving you unlimited flexibility in choosing your AI provider.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 What You'll Need</Text>
          <View style={styles.requirementItem}>
            <Ionicons name="globe" size={20} color="#FF6B6B" />
            <Text style={styles.requirementText}>An AI service with a REST API endpoint</Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons name="key" size={20} color="#FF6B6B" />
            <Text style={styles.requirementText}>API key (if required by your service)</Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons name="document-text" size={20} color="#FF6B6B" />
            <Text style={styles.requirementText}>API documentation for request/response format</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Step-by-Step Guide</Text>
          
          <View style={styles.step}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepTitle}>Choose Your AI Service</Text>
            </View>
            <Text style={styles.stepDescription}>
              Select an AI service that provides a REST API. Popular options include:
            </Text>
            <View style={styles.serviceList}>
              <TouchableOpacity 
                style={styles.serviceItem}
                onPress={() => openLink('https://platform.openai.com/docs/api-reference')}
              >
                <Text style={styles.serviceName}>• OpenAI API</Text>
                <Ionicons name="open-outline" size={16} color="#4ECDC4" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.serviceItem}
                onPress={() => openLink('https://docs.cohere.com/reference/generate')}
              >
                <Text style={styles.serviceName}>• Cohere API</Text>
                <Ionicons name="open-outline" size={16} color="#4ECDC4" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.serviceItem}
              >
                <Text style={styles.serviceName}>• Hugging Face Inference API</Text>
                <Ionicons name="open-outline" size={16} color="#4ECDC4" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.serviceItem}
                onPress={() => openLink('https://www.anthropic.com/claude/docs')}
              >
                <Text style={styles.serviceName}>• Anthropic Claude API</Text>
                <Ionicons name="open-outline" size={16} color="#4ECDC4" />
              </TouchableOpacity>
              <Text style={styles.serviceName}>• Your own self-hosted model</Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>Get Your API Details</Text>
            </View>
            <Text style={styles.stepDescription}>
              From your AI service, you'll need:
            </Text>
            <View style={styles.detailList}>
              <Text style={styles.detailItem}>• API endpoint URL</Text>
              <Text style={styles.detailItem}>• API key (if required)</Text>
              <Text style={styles.detailItem}>• Request format (JSON structure)</Text>
              <Text style={styles.detailItem}>• Response format (where to find the text)</Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepTitle}>Configure in Hater AI</Text>
            </View>
            <Text style={styles.stepDescription}>
              In the Custom Models screen, fill in:
            </Text>
            <View style={styles.detailList}>
              <Text style={styles.detailItem}>• Model Name: Any name you want</Text>
              <Text style={styles.detailItem}>• API Endpoint: Your service's URL</Text>
              <Text style={styles.detailItem}>• API Key: Your authentication key</Text>
              <Text style={styles.detailItem}>• Request Format: Choose the closest match</Text>
              <Text style={styles.detailItem}>• Response Path: JSON path to extract text</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Common Examples</Text>
          
          <View style={styles.example}>
            <Text style={styles.exampleTitle}>OpenAI GPT-3.5/4</Text>
            <Text style={styles.exampleLabel}>Endpoint:</Text>
            <Text style={styles.exampleCode}>https://api.openai.com/v1/chat/completions</Text>
            <Text style={styles.exampleLabel}>Request Format:</Text>
            <Text style={styles.exampleCode}>OpenAI</Text>
            <Text style={styles.exampleLabel}>Response Path:</Text>
            <Text style={styles.exampleCode}>choices.0.message.content</Text>
          </View>

          <View style={styles.example}>
            <Text style={styles.exampleTitle}>Cohere Command</Text>
            <Text style={styles.exampleLabel}>Endpoint:</Text>
            <Text style={styles.exampleCode}>https://api.cohere.ai/v1/generate</Text>
            <Text style={styles.exampleLabel}>Request Format:</Text>
            <Text style={styles.exampleCode}>Cohere</Text>
            <Text style={styles.exampleLabel}>Response Path:</Text>
            <Text style={styles.exampleCode}>generations.0.text</Text>
          </View>

          <View style={styles.example}>
            <Text style={styles.exampleTitle}>Hugging Face Inference</Text>
            <Text style={styles.exampleLabel}>Endpoint:</Text>
            <Text style={styles.exampleLabel}>Request Format:</Text>
            <Text style={styles.exampleCode}>Hugging Face</Text>
            <Text style={styles.exampleLabel}>Response Path:</Text>
            <Text style={styles.exampleCode}>0.generated_text</Text>
          </View>

          <View style={styles.example}>
            <Text style={styles.exampleTitle}>Custom API</Text>
            <Text style={styles.exampleLabel}>Endpoint:</Text>
            <Text style={styles.exampleCode}>https://your-api.com/generate</Text>
            <Text style={styles.exampleLabel}>Request Format:</Text>
            <Text style={styles.exampleCode}>Custom</Text>
            <Text style={styles.exampleLabel}>Response Path:</Text>
            <Text style={styles.exampleCode}>response.text</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 Finding Response Paths</Text>
          <Text style={styles.description}>
            The response path tells Hater AI where to find the generated text in your API's JSON response. Here's how to find it:
          </Text>
          
          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>💡 Pro Tip</Text>
            <Text style={styles.tipText}>
              1. Make a test API call to your service{'\n'}
              2. Look at the JSON response{'\n'}
              3. Find the field containing the generated text{'\n'}
              4. Use dot notation to specify the path
            </Text>
          </View>

          <Text style={styles.exampleLabel}>Example Response:</Text>
          <Text style={styles.exampleCode}>
            {`{
  "choices": [
    {
      "message": {
        "content": "Your generated text here"
      }
    }
  ]
}`}
          </Text>
          <Text style={styles.exampleLabel}>Response Path:</Text>
          <Text style={styles.exampleCode}>choices.0.message.content</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Troubleshooting</Text>
          
          <View style={styles.troubleshootItem}>
            <Text style={styles.troubleshootTitle}>❌ "Invalid response path"</Text>
            <Text style={styles.troubleshootText}>
              Check that your response path matches the actual JSON structure. Use your API's documentation or test the endpoint first.
            </Text>
          </View>

          <View style={styles.troubleshootItem}>
            <Text style={styles.troubleshootTitle}>❌ "API error: 401/403"</Text>
            <Text style={styles.troubleshootText}>
              Your API key is invalid or missing. Check your key and make sure it's entered correctly.
            </Text>
          </View>

          <View style={styles.troubleshootItem}>
            <Text style={styles.troubleshootTitle}>❌ "API error: 404"</Text>
            <Text style={styles.troubleshootText}>
              The endpoint URL is incorrect. Double-check the URL from your AI service's documentation.
            </Text>
          </View>

          <View style={styles.troubleshootItem}>
            <Text style={styles.troubleshootTitle}>❌ "Empty response"</Text>
            <Text style={styles.troubleshootText}>
              The response path is correct but the field is empty. Check if your API requires different parameters or if the model is available.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Advanced Features</Text>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>Custom Prompt Templates</Text>
            <Text style={styles.featureDescription}>
              Use {'{system}'} for the system prompt and {'{user}'} for the user message. This gives you complete control over how prompts are formatted.
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>Custom Headers</Text>
            <Text style={styles.featureDescription}>
              Some APIs require custom headers. You can add these in the advanced settings when configuring your model.
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>Parameter Tuning</Text>
            <Text style={styles.featureDescription}>
              Adjust temperature, max tokens, and other parameters to fine-tune your model's responses for the perfect roast.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 Need Help?</Text>
          <Text style={styles.description}>
            If you're having trouble setting up your custom model:
          </Text>
          <View style={styles.helpList}>
            <Text style={styles.helpItem}>• Check your AI service's API documentation</Text>
            <Text style={styles.helpItem}>• Test your endpoint with a tool like Postman first</Text>
            <Text style={styles.helpItem}>• Make sure your API key has the right permissions</Text>
            <Text style={styles.helpItem}>• Verify the request/response format matches your service</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.addModelButton}
            onPress={() => {}}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.addModelButtonText}>Add Your First Custom Model</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#2a2a2a',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  requirementText: {
    fontSize: 16,
    color: '#ccc',
    marginLeft: 10,
  },
  step: {
    marginBottom: 25,
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepDescription: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 10,
  },
  serviceList: {
    marginTop: 10,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    color: '#ccc',
  },
  detailList: {
    marginTop: 10,
  },
  detailItem: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 5,
    paddingLeft: 10,
  },
  example: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  exampleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 10,
  },
  exampleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 10,
    marginBottom: 5,
  },
  exampleCode: {
    fontSize: 14,
    color: '#4ECDC4',
    fontFamily: 'monospace',
    backgroundColor: '#1a1a1a',
    padding: 8,
    borderRadius: 6,
    marginBottom: 5,
  },
  tipBox: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 12,
    marginVertical: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 22,
  },
  troubleshootItem: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  troubleshootTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  troubleshootText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 22,
  },
  featureItem: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 22,
  },
  helpList: {
    marginTop: 10,
  },
  helpItem: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 8,
    paddingLeft: 10,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  addModelButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  addModelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default HowToCustomModelScreen; 