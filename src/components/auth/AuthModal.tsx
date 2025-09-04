import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { styles } from './authStyles';

export type AuthTrigger = 'streak' | 'purchase' | 'settings' | 'backup' | 'manual';

interface AuthModalProps {
  isVisible: boolean;
  onClose: () => void;
  trigger: AuthTrigger;
  onSuccess?: () => void;
}

interface AuthFormData {
  email: string;
  password: string;
  displayName: string;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isVisible,
  onClose,
  trigger,
  onSuccess
}) => {
  const { user, signUpWithEmail, signInWithEmail, linkAnonymousAccount, isAnonymous } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    displayName: ''
  });

  const triggerConfig = {
    streak: {
      title: 'Save Your Streak! 🔥',
      subtitle: 'Create an account to sync your progress across all devices',
      benefits: [
        '🔥 Never lose your streak',
        '📱 Sync across all devices',
        '📊 Advanced progress tracking',
        '💾 Automatic data backup'
      ]
    },
    purchase: {
      title: 'Save Your Purchase 💰',
      subtitle: 'Create an account to manage your purchases and restore them anytime',
      benefits: [
        '🛒 Purchase history & receipts',
        '🔄 Restore purchases on new devices',
        '⭐ Premium support access',
        '📱 Cross-device entitlements'
      ]
    },
    settings: {
      title: 'Sync Your Settings ☁️',
      subtitle: 'Save your preferences and access them on any device',
      benefits: [
        '⚙️ Settings sync',
        '🎨 Personalized themes',
        '🔧 Custom preferences',
        '📱 Seamless experience'
      ]
    },
    backup: {
      title: 'Backup Your Conversations 💬',
      subtitle: 'Never lose your favorite roasts - save them to the cloud',
      benefits: [
        '💾 Conversation history',
        '🔍 Search past chats',
        '📤 Export your data',
        '🗂️ Organized chat logs'
      ]
    },
    manual: {
      title: 'Create Your Account',
      subtitle: 'Get the most out of your AI roasting experience',
      benefits: [
        '🔥 Advanced roasting features',
        '📊 Detailed analytics',
        '🎯 Personalized recommendations',
        '⭐ Premium support'
      ]
    }
  };

  const config = triggerConfig[trigger];

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up flow
        await signUpWithEmail(
          formData.email,
          formData.password,
          formData.displayName || undefined
        );

        Alert.alert(
          'Account Created! 🎉',
          'Your account has been created and your data has been synced.',
          [{ text: 'Awesome!', onPress: handleSuccess }]
        );
      } else {
        // Sign in or link account
        if (isAnonymous && user) {
          // Link anonymous account
          await linkAnonymousAccount(formData.email, formData.password);

          Alert.alert(
            'Account Linked! 🔗',
            'Your anonymous account has been linked and your data has been migrated.',
            [{ text: 'Perfect!', onPress: handleSuccess }]
          );
        } else {
          // Regular sign in
          await signInWithEmail(formData.email, formData.password);

          Alert.alert(
            'Welcome Back! 👋',
            'You\'ve been signed in successfully.',
            [{ text: 'Let\'s Go!', onPress: handleSuccess }]
          );
        }
      }
    } catch (error) {
      Alert.alert('Authentication Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    onClose();
    onSuccess?.();
  };

  const resetForm = () => {
    setFormData({ email: '', password: '', displayName: '' });
    setIsSignUp(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>{config.subtitle}</Text>
          </View>

          {/* Benefits List */}
          <View style={styles.benefitsContainer}>
            {config.benefits.map((benefit, index) => (
              <Text key={index} style={styles.benefitText}>
                {benefit}
              </Text>
            ))}
          </View>

          {/* Auth Form */}
          <View style={styles.formContainer}>
            {isSignUp && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Display Name (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.displayName}
                  onChangeText={(text) =>
                    setFormData(prev => ({ ...prev, displayName: text }))
                  }
                  placeholder="Your name"
                  placeholderTextColor="#666"
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={formData.email}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, email: text }))
                }
                placeholder="your@email.com"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.textInput}
                value={formData.password}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, password: text }))
                }
                placeholder="At least 6 characters"
                placeholderTextColor="#666"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isSignUp ? 'Create Account & Sync' : isAnonymous ? 'Link Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Toggle Sign Up/Sign In */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isSignUp
                ? 'Already have an account?'
                : "Don't have an account yet?"
              }
            </Text>
            <TouchableOpacity
              onPress={() => setIsSignUp(!isSignUp)}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleButtonText}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Skip Option */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleClose}
          >
            <Text style={styles.skipButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default AuthModal;
