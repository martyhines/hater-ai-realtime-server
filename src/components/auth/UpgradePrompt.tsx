import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { upgradePromptStyles as styles } from './authStyles';

export type UpgradeType = 'streak' | 'purchase' | 'sync' | 'backup';

interface UpgradePromptProps {
  isVisible: boolean;
  type: UpgradeType;
  onUpgrade: () => void;
  onDismiss: () => void;
  data?: any; // Additional context data
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  isVisible,
  type,
  onUpgrade,
  onDismiss,
  data
}) => {
  const getPromptConfig = () => {
    switch (type) {
      case 'streak':
        const streakCount = data?.streakCount || 7;
        return {
          icon: '🔥',
          title: 'Streak Alert!',
          message: `You're on a ${streakCount}-day streak! Don't lose it when you switch devices or get a new phone.`,
          benefits: [
            { icon: '📱', text: 'Sync across all devices' },
            { icon: '💾', text: 'Never lose your progress' },
            { icon: '📊', text: 'Advanced streak analytics' },
            { icon: '🔔', text: 'Streak reminders' }
          ]
        };

      case 'purchase':
        return {
          icon: '💰',
          title: 'Save Your Purchase',
          message: 'Create an account to manage your purchases and restore them on any device.',
          benefits: [
            { icon: '🛒', text: 'Purchase history & receipts' },
            { icon: '🔄', text: 'Restore on new devices' },
            { icon: '⭐', text: 'Premium support access' },
            { icon: '📱', text: 'Cross-device entitlements' }
          ]
        };

      case 'sync':
        return {
          icon: '☁️',
          title: 'Sync Your Settings',
          message: 'Save your preferences and access them seamlessly on any device.',
          benefits: [
            { icon: '⚙️', text: 'Settings synchronization' },
            { icon: '🎨', text: 'Custom themes & preferences' },
            { icon: '🔧', text: 'Personalized experience' },
            { icon: '📱', text: 'Seamless device switching' }
          ]
        };

      case 'backup':
        return {
          icon: '💬',
          title: 'Backup Your Conversations',
          message: 'Never lose your favorite roasts - save them securely to the cloud.',
          benefits: [
            { icon: '💾', text: 'Conversation history' },
            { icon: '🔍', text: 'Search past chats' },
            { icon: '📤', text: 'Export your data' },
            { icon: '🗂️', text: 'Organized chat logs' }
          ]
        };

      default:
        return {
          icon: '✨',
          title: 'Upgrade Your Experience',
          message: 'Create an account to unlock advanced features and sync your data.',
          benefits: [
            { icon: '🔥', text: 'Advanced roasting features' },
            { icon: '📊', text: 'Detailed analytics' },
            { icon: '🎯', text: 'Personalized recommendations' },
            { icon: '⭐', text: 'Premium support' }
          ]
        };
    }
  };

  const config = getPromptConfig();

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{config.icon}</Text>
          </View>

          {/* Title and Message */}
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.message}>{config.message}</Text>

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            {config.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>{benefit.icon}</Text>
                <Text style={styles.benefitText}>{benefit.text}</Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onUpgrade}
            >
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onDismiss}
            >
              <Text style={styles.secondaryButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default UpgradePrompt;
