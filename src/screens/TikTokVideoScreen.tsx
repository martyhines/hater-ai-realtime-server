import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TikTokVideoService, TikTokVideoConfig } from '../services/tikTokVideoService';
import { UserSettings } from '../types/index';
import VideoPreview from '../components/VideoPreview';
import VideoRenderer from '../components/VideoRenderer';
import { VideoGenerationService } from '../services/videoGenerationService';
import { AudioService, AudioTrack } from '../services/audioService';

interface TikTokVideoScreenProps {
  navigation: any;
  route: {
    params: {
      roastText: string;
      settings: UserSettings;
    };
  };
}

export default function TikTokVideoScreen({ navigation, route }: TikTokVideoScreenProps) {
  const { roastText, settings } = route.params;
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [videoFrames, setVideoFrames] = useState<any[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<string>('dramatic_1');
  const [availableAudioTracks, setAvailableAudioTracks] = useState<AudioTrack[]>([]);
  const [videoConfig, setVideoConfig] = useState<TikTokVideoConfig>({
    roastText,
    userName: '',
    theme: 'savage',
    duration: 10,
    includeReaction: true,
    textAnimation: 'typewriter',
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
  });

  const videoService = TikTokVideoService.getInstance();

  const generateVideo = async () => {
    try {
      setIsGenerating(true);
      setIsRendering(true);
      console.log('Generating TikTok video with config:', videoConfig);
      
      // Generate video frames first
      const videoGenService = VideoGenerationService.getInstance();
      const frames = videoGenService.createVideoFrames(videoConfig);
      setVideoFrames(frames);
      
      // Generate background music
      const audioService = AudioService.getInstance();
      const audioPath = await audioService.generateAudioTrack(selectedAudioTrack);
      
      // Generate the actual video file
      const generatedPath = await videoService.generateTikTokVideo(videoConfig);
      
      // Add audio to video
      const finalVideoPath = await audioService.addAudioToVideo(generatedPath, audioPath, generatedPath);
      setVideoPath(finalVideoPath);
      
      Alert.alert(
        'Video Generated!',
        'Your TikTok roasting video with background music is ready to share!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error generating video:', error);
      Alert.alert(
        'Generation Failed',
        'Failed to generate video. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGenerating(false);
      setIsRendering(false);
    }
  };

  const shareToTikTok = async () => {
    if (!videoPath) {
      Alert.alert('No Video', 'Please generate a video first.');
      return;
    }

    try {
      setIsSharing(true);
      const success = await videoService.shareToTikTok(videoPath);
      
      if (success) {
        Alert.alert('Shared!', 'Video shared to TikTok successfully!');
      } else {
        Alert.alert('Sharing Failed', 'Failed to share to TikTok. Please try again.');
      }
    } catch (error) {
      console.error('Error sharing to TikTok:', error);
      Alert.alert('Sharing Error', 'An error occurred while sharing.');
    } finally {
      setIsSharing(false);
    }
  };

  const saveToGallery = async () => {
    if (!videoPath) {
      Alert.alert('No Video', 'Please generate a video first.');
      return;
    }

    try {
      setIsSharing(true);
      const success = await videoService.saveToGallery(videoPath);
      
      if (success) {
        Alert.alert('Saved!', 'Video saved to your gallery!');
      } else {
        Alert.alert('Save Failed', 'Failed to save video. Please check permissions.');
      }
    } catch (error) {
      console.error('Error saving to gallery:', error);
      Alert.alert('Save Error', 'An error occurred while saving.');
    } finally {
      setIsSharing(false);
    }
  };

  const shareVideo = async () => {
    if (!videoPath) {
      Alert.alert('No Video', 'Please generate a video first.');
      return;
    }

    try {
      setIsSharing(true);
      const success = await videoService.shareVideo(videoPath);
      
      if (!success) {
        Alert.alert('Sharing Failed', 'Sharing not available on this device.');
      }
    } catch (error) {
      console.error('Error sharing video:', error);
      Alert.alert('Sharing Error', 'An error occurred while sharing.');
    } finally {
      setIsSharing(false);
    }
  };

  const themes = [
    { key: 'savage', label: 'Savage', color: '#FF6B6B' },
    { key: 'witty', label: 'Witty', color: '#4ECDC4' },
    { key: 'playful', label: 'Playful', color: '#FFE66D' },
    { key: 'brutal', label: 'Brutal', color: '#FF4757' },
  ];

  const animations = [
    { key: 'typewriter', label: 'Typewriter' },
    { key: 'fade', label: 'Fade' },
    { key: 'slide', label: 'Slide' },
    { key: 'bounce', label: 'Bounce' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Create TikTok Video</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Video Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Video Preview</Text>
          {videoFrames.length > 0 ? (
            <VideoRenderer 
              frames={videoFrames}
              onComplete={() => setIsRendering(false)}
            />
          ) : (
            <VideoPreview config={videoConfig} isPlaying={isPreviewPlaying} />
          )}
          {videoFrames.length === 0 && (
            <TouchableOpacity
              style={styles.previewButton}
              onPress={() => setIsPreviewPlaying(!isPreviewPlaying)}
            >
              <Ionicons 
                name={isPreviewPlaying ? "pause" : "play"} 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.previewButtonText}>
                {isPreviewPlaying ? "Pause Preview" : "Play Preview"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Video Configuration */}
        <View style={styles.configSection}>
          <Text style={styles.sectionTitle}>Video Settings</Text>

          {/* User Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Name (Optional)</Text>
            <TextInput
              style={styles.input}
              value={videoConfig.userName}
              onChangeText={(text) => setVideoConfig({ ...videoConfig, userName: text })}
              placeholder="Enter your name"
              placeholderTextColor="#666"
            />
          </View>

          {/* Theme Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Video Theme</Text>
            <View style={styles.themeGrid}>
              {themes.map((theme) => (
                <TouchableOpacity
                  key={theme.key}
                  style={[
                    styles.themeButton,
                    videoConfig.theme === theme.key && styles.themeButtonActive,
                    { borderColor: theme.color }
                  ]}
                  onPress={() => setVideoConfig({ ...videoConfig, theme: theme.key as any })}
                >
                  <View style={[styles.themeColor, { backgroundColor: theme.color }]} />
                  <Text style={styles.themeLabel}>{theme.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Animation Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Text Animation</Text>
            <View style={styles.animationGrid}>
              {animations.map((animation) => (
                <TouchableOpacity
                  key={animation.key}
                  style={[
                    styles.animationButton,
                    videoConfig.textAnimation === animation.key && styles.animationButtonActive
                  ]}
                  onPress={() => setVideoConfig({ ...videoConfig, textAnimation: animation.key as any })}
                >
                  <Text style={styles.animationLabel}>{animation.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Audio Track Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Background Music</Text>
            <View style={styles.audioGrid}>
              {availableAudioTracks.map((track) => (
                <TouchableOpacity
                  key={track.id}
                  style={[
                    styles.audioButton,
                    selectedAudioTrack === track.id && styles.audioButtonActive
                  ]}
                  onPress={() => setSelectedAudioTrack(track.id)}
                >
                  <Ionicons 
                    name="musical-notes" 
                    size={16} 
                    color={selectedAudioTrack === track.id ? "#FFFFFF" : "#666"} 
                  />
                  <Text style={[
                    styles.audioButtonText,
                    selectedAudioTrack === track.id && styles.audioButtonTextActive
                  ]}>
                    {track.name}
                  </Text>
                  <Text style={styles.audioButtonDescription}>
                    {track.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Include Reaction Toggle */}
          <View style={styles.toggleGroup}>
            <Text style={styles.label}>Include Reaction</Text>
            <Switch
              value={videoConfig.includeReaction}
              onValueChange={(value) => setVideoConfig({ ...videoConfig, includeReaction: value })}
              trackColor={{ false: '#767577', true: '#4ECDC4' }}
              thumbColor={videoConfig.includeReaction ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={generateVideo}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="videocam" size={24} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Generate TikTok Video</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Share Options */}
        {videoPath && (
          <View style={styles.shareSection}>
            <Text style={styles.sectionTitle}>Share Your Video</Text>
            
            <View style={styles.shareGrid}>
              <TouchableOpacity
                style={[styles.shareButton, styles.tiktokButton]}
                onPress={shareToTikTok}
                disabled={isSharing}
              >
                <Ionicons name="logo-tiktok" size={24} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>Share to TikTok</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shareButton, styles.galleryButton]}
                onPress={saveToGallery}
                disabled={isSharing}
              >
                <Ionicons name="save" size={24} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>Save to Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shareButton, styles.shareButton]}
                onPress={shareVideo}
                disabled={isSharing}
              >
                <Ionicons name="share-social" size={24} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>Share Video</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

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
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  previewSection: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  previewButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },

  configSection: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
  },
  themeButtonActive: {
    borderColor: '#4ECDC4',
  },
  themeColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  themeLabel: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  animationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  animationButton: {
    backgroundColor: '#3a3a3a',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  animationButtonActive: {
    borderColor: '#4ECDC4',
  },
  animationLabel: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  audioGrid: {
    gap: 10,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  audioButtonActive: {
    borderColor: '#4ECDC4',
    backgroundColor: '#4a4a4a',
  },
  audioButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  audioButtonTextActive: {
    color: '#4ECDC4',
  },
  audioButtonDescription: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
    flex: 1,
  },
  toggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  generateButtonDisabled: {
    backgroundColor: '#666',
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  shareSection: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
  },
  shareGrid: {
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  tiktokButton: {
    backgroundColor: '#FF0050',
  },
  galleryButton: {
    backgroundColor: '#4ECDC4',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
}); 