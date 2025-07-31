import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import { ScreenshotService, ScreenshotConfig } from '../services/screenshotService';

interface ScreenshotScreenProps {
  navigation: any;
  route: {
    params: {
      roastText: string;
      userName?: string;
      messages?: any[];
    };
  };
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ScreenshotScreen({ navigation, route }: ScreenshotScreenProps) {
  const { roastText, userName, messages } = route.params;
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshotPath, setScreenshotPath] = useState<string | null>(null);
  const [format, setFormat] = useState<'portrait' | 'landscape'>('portrait');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const screenshotService = ScreenshotService.getInstance();
  const viewShotRef = useRef<ViewShot>(null);

  const captureScreenshot = async () => {
    try {
      setIsCapturing(true);
      
      const config: ScreenshotConfig = {
        roastText,
        userName,
        style: 'savage', // Default style
        includeAppLink: false, // No app link needed
        customHashtags: [],
        format,
        theme,
      };

      if (!viewShotRef.current) {
        throw new Error('View reference not available');
      }

      const path = await screenshotService.captureChatScreenshot(viewShotRef, config);
      setScreenshotPath(path);
      
      Alert.alert(
        'Success!', 
        'Screenshot captured successfully! You can now save it to your gallery or share it.'
      );
      
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      Alert.alert('Error', 'Failed to capture screenshot. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const saveToGallery = async () => {
    if (!screenshotPath) return;
    
    try {
      const success = await screenshotService.saveToGallery(screenshotPath);
      if (success) {
        Alert.alert('Saved!', 'Screenshot saved to your gallery!');
      } else {
        Alert.alert(
          'Error', 
          'Failed to save to gallery. Please check that you have granted photo library permissions.'
        );
      }
    } catch (error) {
      console.error('Error saving to gallery:', error);
      Alert.alert(
        'Error', 
        'Failed to save to gallery. Please try again or check your permissions.'
      );
    }
  };

  const shareScreenshot = async () => {
    if (!screenshotPath) return;
    
    try {
      const success = await screenshotService.shareScreenshot(screenshotPath);
      if (success) {
        Alert.alert(
          'Shared!', 
          'Screenshot ready for sharing! In a full implementation, this would open your device\'s share sheet.'
        );
      } else {
        Alert.alert(
          'Error', 
          'Failed to prepare screenshot for sharing. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error sharing screenshot:', error);
      Alert.alert(
        'Error', 
        'Failed to share screenshot. Please try again.'
      );
    }
  };

  const formatOptions = [
    { key: 'portrait', label: 'Portrait', icon: 'phone-portrait' },
    { key: 'landscape', label: 'Landscape', icon: 'phone-landscape' },
  ];

  const themeOptions = [
    { key: 'dark', label: 'Dark', icon: 'moon' },
    { key: 'light', label: 'Light', icon: 'sunny' },
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
        <Text style={styles.title}>Screenshot Tweet</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Screenshot Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Screenshot Preview</Text>
          <View style={styles.previewContainer}>
            <ViewShot
              ref={viewShotRef}
              style={[
                styles.screenshotPreview,
                format === 'portrait' ? styles.portraitPreview : styles.landscapePreview,
                theme === 'dark' ? styles.darkTheme : styles.lightTheme
              ]}
            >
              {/* Chat Preview */}
              <View style={styles.chatPreview}>
                <View style={styles.messageContainer}>
                  <View style={styles.aiMessage}>
                                    <Text style={styles.aiText} numberOfLines={20}>
                  {roastText}
                </Text>
                  </View>
                </View>
              </View>

              {/* App Branding Overlay */}
              <View style={styles.brandingOverlay}>
                <View style={styles.brandingContent}>
                  <Text style={styles.appIcon}>🤖</Text>
                  <Text style={styles.appName}>Hater AI</Text>
                </View>
              </View>
            </ViewShot>
          </View>
        </View>



        {/* Capture Button */}
        <TouchableOpacity
          style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
          onPress={captureScreenshot}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="camera" size={24} color="#FFFFFF" />
              <Text style={styles.captureButtonText}>Capture Screenshot</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Share Options */}
        {screenshotPath && (
          <View style={styles.shareSection}>
            <Text style={styles.sectionTitle}>Share Your Screenshot</Text>
            
            <View style={styles.shareGrid}>
              <TouchableOpacity
                style={[styles.shareButton, styles.saveButton]}
                onPress={saveToGallery}
              >
                <Ionicons name="save" size={24} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>Save to Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shareButton, styles.shareButtonStyle]}
                onPress={shareScreenshot}
              >
                <Ionicons name="share" size={24} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>Share</Text>
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  previewContainer: {
    alignItems: 'center',
  },
  screenshotPreview: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  portraitPreview: {
    width: screenWidth * 0.8,
    height: screenHeight * 0.8, // Even more height for complete text display
  },
  landscapePreview: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.7, // Even more height for complete text display
  },
  darkTheme: {
    backgroundColor: '#1a1a1a',
  },
  lightTheme: {
    backgroundColor: '#FFFFFF',
  },
  chatPreview: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8, // Minimal padding to overlay
    justifyContent: 'flex-start', // Move to top
  },
  messageContainer: {
    marginBottom: 0, // Remove bottom margin to extend to overlay
  },
  aiMessage: {
    alignSelf: 'center', // Center the message
    backgroundColor: '#3a3a3a',
    padding: 20,
    borderRadius: 16,
    maxWidth: '95%', // Even wider since we have more space
    marginBottom: 8, // Minimal space to overlay
  },
  aiText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    flexWrap: 'wrap', // Allow text to wrap
  },
  brandingOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  brandingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  appIcon: {
    fontSize: 16,
  },
  appName: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: 'bold',
  },

  styleSection: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  styleGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  styleButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  styleButtonActive: {
    borderColor: '#4ECDC4',
    backgroundColor: '#4a4a4a',
  },
  styleEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  styleLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  styleLabelActive: {
    color: '#4ECDC4',
  },
  formatSection: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  formatGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  formatButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  formatButtonActive: {
    borderColor: '#4ECDC4',
    backgroundColor: '#4a4a4a',
  },
  formatLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 8,
  },
  formatLabelActive: {
    color: '#4ECDC4',
  },
  themeSection: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  themeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  themeButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeButtonActive: {
    borderColor: '#4ECDC4',
    backgroundColor: '#4a4a4a',
  },
  themeLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 8,
  },
  themeLabelActive: {
    color: '#4ECDC4',
  },
  hashtagSection: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  hashtagInput: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#3a3a3a',
    padding: 12,
    borderRadius: 8,
    color: '#FFFFFF',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#4ECDC4',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hashtagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hashtagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  hashtagChipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  optionsSection: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  toggle: {
    width: 50,
    height: 28,
    backgroundColor: '#666',
    borderRadius: 14,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#4ECDC4',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  captureButtonDisabled: {
    backgroundColor: '#666',
  },
  captureButtonText: {
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
  saveButton: {
    backgroundColor: '#4ECDC4',
  },
  shareButtonStyle: {
    backgroundColor: '#1DA1F2',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
}); 