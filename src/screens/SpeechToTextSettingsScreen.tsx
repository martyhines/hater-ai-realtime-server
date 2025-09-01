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
import { API_CONFIG } from '../config/api';
import { requestRealtimeToken } from '../services/realtimeService';
import { useRemoteAudio } from '../hooks/useRemoteAudio';
import RealtimeVoiceService from '../services/realtimeVoiceService';
import { FEATURES } from '../config/features';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import { StorageService } from '../services/storageService';
import { SpeechToTextSettings } from '../types';

const SpeechToTextSettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [settings, setSettings] = useState<SpeechToTextSettings>({
    language: 'en-US',
    autoSend: true,
    continuous: false,
    timeout: 5000,
  });
  const [loading, setLoading] = useState(true);
  const audio = useRemoteAudio(API_CONFIG.REALTIME.TEST_AUDIO_URL);

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
    } catch (error) {
      console.error('Error saving speech-to-text settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleRequestRealtimeToken = async () => {
    try {
      const token = await requestRealtimeToken();
      Alert.alert('Realtime Token', 'Token request succeeded. Check console logs.');
    } catch (e: any) {
      console.error('Realtime token error:', e);
      Alert.alert('Error', e?.message ?? 'Token request failed');
    }
  };

  const handlePlayTestAudio = async () => {
    try {
      if (!audio.isLoaded) {
        await audio.load();
      }
      await audio.play();
    } catch (e: any) {
      console.error('Audio play error:', e);
      Alert.alert('Audio Error', e?.message ?? 'Failed to play');
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
        {/* Realtime + Audio Test */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Realtime/Audio Test</Text>
          <Text style={styles.cardSubtitle}>Verify backend auth header and audio playback</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={styles.testButton} onPress={handleRequestRealtimeToken}>
              <Ionicons name="key" size={20} color="#000" />
              <Text style={styles.testButtonText}>Request Token</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.testButton} onPress={handlePlayTestAudio}>
              <Ionicons name="play" size={20} color="#000" />
              <Text style={styles.testButtonText}>Play Test Audio</Text>
            </TouchableOpacity>
            {FEATURES.ENABLE_REALTIME_VOICE ? (
              <>
                <TouchableOpacity
                  style={styles.testButton}
                  onPress={async () => {
                    try {
                      const info = await RealtimeVoiceService.getSessionInfo();
                      if (!info.isSupported) {
                        Alert.alert('Not supported', 'Install dev build with react-native-webrtc');
                        return;
                      }
                      await RealtimeVoiceService.startSession();
                      Alert.alert('Realtime', 'Voice session started');
                    } catch (e: any) {
                      console.error('Start realtime error:', e);
                      Alert.alert('Error', e?.message ?? 'Failed to start');
                    }
                  }}
                >
                  <Ionicons name="mic" size={20} color="#000" />
                  <Text style={styles.testButtonText}>Start Voice</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.testButton}
                  onPress={async () => {
                    try {
                      await RealtimeVoiceService.stopSession();
                      Alert.alert('Realtime', 'Voice session stopped');
                    } catch (e: any) {
                      // ignore
                    }
                  }}
                >
                  <Ionicons name="stop" size={20} color="#000" />
                  <Text style={styles.testButtonText}>Stop Voice</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
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

        {/* Expo Go Limitation Card */}
        <View style={styles.limitationCard}>
          <Ionicons name="warning" size={24} color="#FF6B6B" />
          <Text style={styles.limitationText}>
            Note: Full speech recognition functionality requires a development build. In Expo Go, web-based speech recognition may be used as a fallback.
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
    marginBottom: 16,
  },
  infoText: {
    color: '#FFD93D',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  limitationCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  limitationText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD93D',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
  },
  testButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});

export default SpeechToTextSettingsScreen; 