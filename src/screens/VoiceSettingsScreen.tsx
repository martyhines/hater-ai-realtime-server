import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import TextToSpeechService, { VoiceSettings, VoiceOption } from '../services/textToSpeechService';
import RealtimeVoiceService from '../services/realtimeVoiceService';
import { StorageService } from '../services/storageService';

interface VoiceSettingsScreenProps {
  navigation: any;
}

export default function VoiceSettingsScreen({ navigation }: VoiceSettingsScreenProps) {
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    voice: 'com.apple.ttsbundle.Samantha-compact',
    rate: 0.5,
    pitch: 1.0,
    volume: 1.0,
    autoPlay: false,
  });
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingVoice, setTestingVoice] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [realtimeEnabled, setRealtimeEnabled] = useState<boolean>(false);
  const [realtimeSupported, setRealtimeSupported] = useState<boolean>(true);

  useEffect(() => {
    loadVoiceSettings();
    loadAvailableVoices();
    initRealtimeInfo();
  }, []);

  const initRealtimeInfo = async () => {
    try {
      const info = await RealtimeVoiceService.getSessionInfo();
      setRealtimeSupported(info.isSupported);
      setRealtimeEnabled(info.isEnabled);
    } catch {}
  };

  const loadVoiceSettings = async () => {
    try {
      const settings = await TextToSpeechService.getVoiceSettings();
      setVoiceSettings(settings);
      setSelectedVoice(settings.voice);
    } catch (error) {
    }
  };

  const loadAvailableVoices = async () => {
    try {
      setLoading(true);
      const voices = await TextToSpeechService.getAvailableVoices();
      setAvailableVoices(voices);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const saveVoiceSettings = async (newSettings: VoiceSettings) => {
    try {
      await TextToSpeechService.saveVoiceSettings(newSettings);
      setVoiceSettings(newSettings);
    } catch (error) {
      Alert.alert('Error', 'Failed to save voice settings');
    }
  };

  const handleVoiceChange = (voiceIdentifier: string) => {
    setSelectedVoice(voiceIdentifier);
    const newSettings = { ...voiceSettings, voice: voiceIdentifier };
    setVoiceSettings(newSettings);
    saveVoiceSettings(newSettings);
  };

  const handleRateChange = (rate: number) => {
    const newSettings = { ...voiceSettings, rate };
    setVoiceSettings(newSettings);
    saveVoiceSettings(newSettings);
  };

  const handlePitchChange = (pitch: number) => {
    const newSettings = { ...voiceSettings, pitch };
    setVoiceSettings(newSettings);
    saveVoiceSettings(newSettings);
  };

  const handleVolumeChange = (volume: number) => {
    const newSettings = { ...voiceSettings, volume };
    setVoiceSettings(newSettings);
    saveVoiceSettings(newSettings);
  };

  const handleAutoPlayToggle = (autoPlay: boolean) => {
    const newSettings = { ...voiceSettings, autoPlay };
    setVoiceSettings(newSettings);
    saveVoiceSettings(newSettings);
  };

  const handleRealtimeToggle = async (enabled: boolean) => {
    try {
      setRealtimeEnabled(enabled);
      const storage = StorageService.getInstance();
      const current = (await storage.getSettings()) || {};
      await storage.saveSettings({ ...current, realtimeVoiceEnabled: enabled });
      if (enabled) {
        await RealtimeVoiceService.startSession();
      } else {
        await RealtimeVoiceService.stopSession();
      }
    } catch (e) {
      setRealtimeEnabled(false);
      Alert.alert('Realtime Voice', 'Failed to toggle realtime voice.');
    }
  };

  const testVoice = async (voiceIdentifier: string) => {
    try {
      setTestingVoice(true);
      await TextToSpeechService.testVoice(voiceIdentifier);
    } catch (error) {
      Alert.alert('Error', 'Failed to test voice');
    } finally {
      setTestingVoice(false);
    }
  };

  const testCurrentSettings = async () => {
    try {
      setTestingVoice(true);
      await TextToSpeechService.speakRoast(
        "Listen up! I'm your AI enemy and I'm here to roast you with this voice. How does it sound?",
        'brutal'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to test voice settings');
    } finally {
      setTestingVoice(false);
    }
  };



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading voices...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#1a1a1a', '#2d2d2d', '#1a1a1a']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Voice Settings</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Current Settings Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Voice</Text>
          <View style={styles.currentVoiceInfo}>
            <Ionicons name="mic" size={24} color="#00ff00" />
            <Text style={styles.currentVoiceText}>
              {availableVoices.find(v => v.identifier === voiceSettings.voice)?.name || 'Samantha'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.testCurrentButton}
            onPress={testCurrentSettings}
            disabled={testingVoice}
          >
            {testingVoice ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="play-circle" size={20} color="#fff" />
            )}
            <Text style={styles.testCurrentText}>Test Current Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Voice Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Voice</Text>
          <Text style={styles.cardSubtitle}>
            Choose your preferred Siri voice for AI roasts
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedVoice}
              onValueChange={handleVoiceChange}
              style={styles.picker}
              dropdownIconColor="#fff"
              mode="dropdown"
            >
              {availableVoices.map((voice) => (
                <Picker.Item
                  key={voice.identifier}
                  label={`${voice.name} (${voice.language}${voice.gender ? ` • ${voice.gender}` : ''})`}
                  value={voice.identifier}
                  color="#fff"
                />
              ))}
            </Picker>
          </View>
          <TouchableOpacity
            style={styles.testVoiceButton}
            onPress={() => testVoice(selectedVoice)}
            disabled={testingVoice}
          >
            {testingVoice ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="play" size={16} color="#fff" />
            )}
            <Text style={styles.testVoiceText}>Test Selected Voice</Text>
          </TouchableOpacity>
        </View>

        {/* Realtime Voice (beta) */}
        <View style={styles.card}>
          <View style={styles.toggleContainer}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Realtime Voice (OpenAI) — Beta</Text>
              <Text style={styles.toggleDescription}>
                Low-latency AI voice via OpenAI. Requires dev build; Siri remains default when off.
              </Text>
              {!realtimeSupported && (
                <Text style={[styles.toggleDescription, { color: '#ff6b6b' }]}>Not supported on this build.</Text>
              )}
            </View>
            <Switch
              value={realtimeEnabled}
              onValueChange={handleRealtimeToggle}
              trackColor={{ false: '#444', true: '#00ff00' }}
              thumbColor={realtimeEnabled ? '#fff' : '#f4f3f4'}
              disabled={!realtimeSupported}
            />
          </View>
        </View>

        {/* Voice Parameters */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Voice Parameters</Text>
          
          {/* Rate Slider */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>Speed</Text>
              <Text style={styles.sliderValue}>{voiceSettings.rate.toFixed(1)}x</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0.1}
              maximumValue={2.0}
              value={voiceSettings.rate}
              onValueChange={handleRateChange}
              minimumTrackTintColor="#00ff00"
              maximumTrackTintColor="#444"
              thumbTintColor="#00ff00"
            />
          </View>

          {/* Pitch Slider */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>Pitch</Text>
              <Text style={styles.sliderValue}>{voiceSettings.pitch.toFixed(1)}x</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={2.0}
              value={voiceSettings.pitch}
              onValueChange={handlePitchChange}
              minimumTrackTintColor="#00ff00"
              maximumTrackTintColor="#444"
              thumbTintColor="#00ff00"
            />
          </View>

          {/* Volume Slider */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>Volume</Text>
              <Text style={styles.sliderValue}>{Math.round(voiceSettings.volume * 100)}%</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0.0}
              maximumValue={1.0}
              value={voiceSettings.volume}
              onValueChange={handleVolumeChange}
              minimumTrackTintColor="#00ff00"
              maximumTrackTintColor="#444"
              thumbTintColor="#00ff00"
            />
          </View>
        </View>

        {/* Auto-Play Toggle */}
        <View style={styles.card}>
          <View style={styles.toggleContainer}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Auto-Play Roasts</Text>
              <Text style={styles.toggleDescription}>
                Automatically read AI roasts aloud when they appear
              </Text>
            </View>
            <Switch
              value={voiceSettings.autoPlay}
              onValueChange={handleAutoPlayToggle}
              trackColor={{ false: '#444', true: '#00ff00' }}
              thumbColor={voiceSettings.autoPlay ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 16,
  },
  currentVoiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentVoiceText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
    fontWeight: '600',
  },
  testCurrentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00ff00',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  testCurrentText: {
    color: '#000',
    fontWeight: '600',
    marginLeft: 8,
  },
  pickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  picker: {
    color: '#fff',
    backgroundColor: 'transparent',
  },
  testVoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD93D',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  testVoiceText: {
    color: '#000',
    fontWeight: '600',
    marginLeft: 8,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  sliderValue: {
    fontSize: 14,
    color: '#00ff00',
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#00ff00',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#ccc',
  },
}); 