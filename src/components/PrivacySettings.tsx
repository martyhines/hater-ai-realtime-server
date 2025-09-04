import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnalyticsService from '../services/analyticsService';
import { useAuth } from '../contexts/AuthContext';

const PrivacySettings: React.FC = () => {
  const { user, signOut } = useAuth();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [crashesEnabled, setCrashesEnabled] = useState(true);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true);

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const analytics = await AsyncStorage.getItem('analytics_enabled');
      const crashes = await AsyncStorage.getItem('crashes_enabled');
      const personalization = await AsyncStorage.getItem('personalization_enabled');

      setAnalyticsEnabled(analytics !== 'false');
      setCrashesEnabled(crashes !== 'false');
      setPersonalizationEnabled(personalization !== 'false');
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const savePrivacySetting = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
    } catch (error) {
      console.error('Error saving privacy setting:', error);
    }
  };

  const handleAnalyticsToggle = async (enabled: boolean) => {
    const analytics = AnalyticsService.getInstance();

    // Track the privacy setting change (only if analytics is currently enabled)
    if (analyticsEnabled) {
      await analytics.trackEvent({
        name: 'privacy_setting_changed',
        parameters: {
          setting: 'analytics',
          enabled,
          timestamp: Date.now()
        }
      });
    }

    // Show confirmation dialog
    Alert.alert(
      'Analytics Tracking',
      enabled
        ? 'Enable analytics to help us improve your experience? We collect anonymous usage data to enhance features and fix issues.'
        : 'Disable analytics tracking? You can always re-enable it later in Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: enabled ? 'Enable' : 'Disable',
          onPress: async () => {
            await analytics.setAnalyticsEnabled(enabled);
            setAnalyticsEnabled(enabled);
            await savePrivacySetting('analytics_enabled', enabled);
          }
        }
      ]
    );
  };

  const handleCrashesToggle = async (enabled: boolean) => {
    setCrashesEnabled(enabled);
    await savePrivacySetting('crashes_enabled', enabled);

    const analytics = AnalyticsService.getInstance();
    if (analyticsEnabled) {
      await analytics.trackEvent({
        name: 'privacy_setting_changed',
        parameters: {
          setting: 'crash_reporting',
          enabled,
          timestamp: Date.now()
        }
      });
    }
  };

  const handlePersonalizationToggle = async (enabled: boolean) => {
    setPersonalizationEnabled(enabled);
    await savePrivacySetting('personalization_enabled', enabled);

    const analytics = AnalyticsService.getInstance();
    if (analyticsEnabled) {
      await analytics.trackEvent({
        name: 'privacy_setting_changed',
        parameters: {
          setting: 'personalization',
          enabled,
          timestamp: Date.now()
        }
      });
    }
  };

  const handleDataExport = () => {
    Alert.alert(
      'Data Export',
      'We can export your data including conversations, settings, and purchase history. This may take a few days.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Export',
          onPress: () => {
            // In a real app, this would trigger a data export process
            Alert.alert('Request Submitted', 'We\'ll email your data export within 7 days.');
          }
        }
      ]
    );
  };

  const handleDataDeletion = () => {
    Alert.alert(
      'Delete Account & Data',
      'This will permanently delete your account, all conversations, settings, and purchase history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            // Sign out first
            await signOut();

            // In a real app, this would trigger account deletion
            Alert.alert(
              'Account Deletion Started',
              'Your account and data deletion is being processed. You\'ll be signed out now.'
            );
          }
        }
      ]
    );
  };

  const privacySections = [
    {
      title: 'Analytics & Performance',
      description: 'Help us improve the app by sharing anonymous usage data',
      items: [
        {
          title: 'Analytics Tracking',
          description: 'Track app usage, feature usage, and user behavior patterns',
          value: analyticsEnabled,
          onToggle: handleAnalyticsToggle
        },
        {
          title: 'Crash Reporting',
          description: 'Automatically report crashes and errors to help us fix issues',
          value: crashesEnabled,
          onToggle: handleCrashesToggle
        }
      ]
    },
    {
      title: 'Personalization',
      description: 'Customize your experience based on your preferences',
      items: [
        {
          title: 'Personalized Recommendations',
          description: 'Suggest personalities and features based on your usage',
          value: personalizationEnabled,
          onToggle: handlePersonalizationToggle
        }
      ]
    },
    {
      title: 'Your Data',
      description: 'Manage your personal data and account',
      items: [
        {
          title: 'Export Your Data',
          description: 'Download a copy of all your data',
          action: handleDataExport,
          actionTitle: 'Request Export'
        },
        {
          title: 'Delete Account',
          description: 'Permanently delete your account and all data',
          action: handleDataDeletion,
          actionTitle: 'Delete Account',
          destructive: true
        }
      ]
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Privacy & Data</Text>
        <Text style={styles.subtitle}>
          Control how we collect and use your data. We respect your privacy and comply with GDPR.
        </Text>
      </View>

      {privacySections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionDescription}>{section.description}</Text>

          {section.items.map((item, itemIndex) => (
            <View key={itemIndex} style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                <Text style={styles.settingDescription}>{item.description}</Text>
              </View>

              {item.onToggle && (
                <Switch
                  value={item.value}
                  onValueChange={item.onToggle}
                  trackColor={{ false: '#767577', true: '#FF6B35' }}
                  thumbColor={item.value ? '#fff' : '#f4f3f4'}
                />
              )}

              {item.action && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    item.destructive && styles.destructiveButton
                  ]}
                  onPress={item.action}
                >
                  <Text style={[
                    styles.actionButtonText,
                    item.destructive && styles.destructiveButtonText
                  ]}>
                    {item.actionTitle}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Changes to privacy settings take effect immediately.
          You can update these settings at any time.
        </Text>
        <Text style={styles.footerLink}>
          Read our full Privacy Policy and Terms of Service
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#888',
    lineHeight: 18,
  },
  actionButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  destructiveButton: {
    backgroundColor: '#dc3545',
  },
  destructiveButtonText: {
    color: '#fff',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 12,
  },
  footerLink: {
    fontSize: 14,
    color: '#FF6B35',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default PrivacySettings;
