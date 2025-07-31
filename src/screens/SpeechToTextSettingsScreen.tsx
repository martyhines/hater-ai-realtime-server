import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import StorageService from '../services/storageService';
import { SpeechToTextSettings } from '../types';

const SpeechToTextSettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [settings, setSettings] = useState<SpeechToTextSettings>({
    language: 'en-US',
    autoSend: true,
    continuous: false,
    timeout: 5000,
  });
  const [loading, setLoading] = useState(true);

  const availableLanguages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'en-AU', name: 'English (Australia)' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storage = StorageService.getInstance();
      const savedSettings = await storage.getSpeechToTextSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error('Error loading speech-to-text settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: SpeechToTextSettings) => {
    try {
      const storage = StorageService.getInstance();
      await storage.saveSpeechToTextSettings(newSettings);
      setSettings(newSettings);
      console.log('Speech-to-text settings saved');
    } catch (error) {
      console.error('Error saving speech-to-text settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleLanguageChange = (language: string) => {
    const newSettings = { ...settings, language };
    saveSettings(newSettings);
  };

  const handleAutoSendToggle = (value: boolean) => {
    const newSettings = { ...settings, autoSend: value };
    saveSettings(newSettings);
  };

  const handleContinuousToggle = (value: boolean) => {
    const newSettings = { ...settings, continuous: value };
    saveSettings(newSettings);
  };

  const handleTimeoutChange = (value: number) => {
    const newSettings = { ...settings, timeout: value };
    saveSettings(newSettings);
  };

  const formatTimeout = (ms: number) => {
    if (ms === 0) return 'No timeout';
    const seconds = ms / 1000;
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFD93D" />
        </TouchableOpacity>
        <Text style={styles.title}>Speech-to-Text Settings</Text>
      </View>

      <View style={styles.content}>
        {/* Language Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Language</Text>
          <Text style={styles.cardSubtitle}>
            Choose your preferred language for speech recognition
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={settings.language}
              onValueChange={handleLanguageChange}
              style={styles.picker}
              dropdownIconColor="#fff"
              mode="dropdown"
            >
              {availableLanguages.map((lang) => (
                <Picker.Item
                  key={lang.code}
                  label={lang.name}
                  value={lang.code}
                  color="#fff"
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Auto Send Toggle */}
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="send" size={24} color="#FFD93D" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Auto Send</Text>
                <Text style={styles.settingDescription}>
                  Automatically send message when speech recognition ends
                </Text>
              </View>
            </View>
            <Switch
              value={settings.autoSend}
              onValueChange={handleAutoSendToggle}
              trackColor={{ false: '#444', true: '#FFD93D' }}
              thumbColor={settings.autoSend ? '#000' : '#fff'}
            />
          </View>
        </View>

        {/* Continuous Recognition Toggle */}
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="infinite" size={24} color="#FFD93D" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Continuous Recognition</Text>
                <Text style={styles.settingDescription}>
                  Keep listening for multiple phrases (experimental)
                </Text>
              </View>
            </View>
            <Switch
              value={settings.continuous}
              onValueChange={handleContinuousToggle}
              trackColor={{ false: '#444', true: '#FFD93D' }}
              thumbColor={settings.continuous ? '#000' : '#fff'}
            />
          </View>
        </View>

        {/* Timeout Setting */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recording Timeout</Text>
          <Text style={styles.cardSubtitle}>
            Maximum time to record before auto-stopping
          </Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={15000}
              step={1000}
              value={settings.timeout}
              onValueChange={handleTimeoutChange}
              minimumTrackTintColor="#FFD93D"
              maximumTrackTintColor="#444"
              thumbTintColor="#FFD93D"
            />
            <Text style={styles.sliderValue}>{formatTimeout(settings.timeout)}</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#FFD93D" />
          <Text style={styles.infoText}>
            Speech-to-text requires microphone permissions. The feature works best in quiet environments with clear speech.
          </Text>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 16,
  },
  pickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  picker: {
    color: '#fff',
    backgroundColor: 'transparent',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  settingDescription: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 2,
  },
  sliderContainer: {
    alignItems: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    fontSize: 16,
    color: '#FFD93D',
    fontWeight: '600',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 217, 61, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFD93D',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    color: '#FFD93D',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});

export default SpeechToTextSettingsScreen; 