import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TweetGenerationService, Tweet, TweetGenerationConfig } from '../services/tweetGenerationService';
import { TwitterShareService } from '../services/twitterShareService';
import { FEATURES } from '../config/features';

interface TweetGeneratorScreenProps {
  navigation: any;
  route: {
    params: {
      roastText: string;
      userName?: string;
    };
  };
}

export default function TweetGeneratorScreen({ navigation, route }: TweetGeneratorScreenProps) {
  const { roastText, userName } = route.params;
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTweet, setCurrentTweet] = useState<Tweet | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<'savage' | 'witty' | 'playful'>('savage');
  const [includeAppLink, setIncludeAppLink] = useState(true);
  const [customHashtags, setCustomHashtags] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState('');

  const tweetService = TweetGenerationService.getInstance();

  useEffect(() => {
    generateTweet();
  }, []);

  const generateTweet = async () => {
    try {
      setIsGenerating(true);
      
      const config: TweetGenerationConfig = {
        roastText,
        userName,
        style: selectedStyle,
        includeAppLink,
        customHashtags
      };
      
      const tweet = await tweetService.generateTweet(config);
      setCurrentTweet(tweet);
      
    } catch (error) {
      Alert.alert(
        'Generation Failed',
        'Failed to generate tweet. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateTweet = () => {
    generateTweet();
  };

  const addHashtag = () => {
    if (newHashtag.trim() && !newHashtag.startsWith('#')) {
      const hashtag = `#${newHashtag.trim()}`;
      if (!customHashtags.includes(hashtag)) {
        setCustomHashtags([...customHashtags, hashtag]);
        setNewHashtag('');
      }
    } else if (newHashtag.trim().startsWith('#')) {
      const hashtag = newHashtag.trim();
      if (!customHashtags.includes(hashtag)) {
        setCustomHashtags([...customHashtags, hashtag]);
        setNewHashtag('');
      }
    }
  };

  const removeHashtag = (hashtag: string) => {
    setCustomHashtags(customHashtags.filter(h => h !== hashtag));
  };

  const copyToClipboard = async () => {
    if (!currentTweet) return;
    
    try {
      const tweetText = tweetService.formatTweetForDisplay(currentTweet);
      await Clipboard.setString(tweetText);
      Alert.alert('Copied!', 'Tweet copied to clipboard!');
    } catch (error) {
      Alert.alert('Copy Failed', 'Failed to copy to clipboard.');
    }
  };

  const shareToTwitter = async () => {
    if (!currentTweet) return;
    
    try {
      const twitterService = TwitterShareService.getInstance();
      
      const success = await twitterService.shareToTwitter({
        tweet: currentTweet,
        includeAppLink: includeAppLink,
        appStoreUrl: 'https://apps.apple.com/app/hater-ai' // Replace with your actual app store URL
      });
      
      if (success) {
        Alert.alert('Shared!', 'Tweet shared to Twitter successfully!');
      } else {
        Alert.alert('Share Failed', 'Failed to share to Twitter. Please try again.');
      }
    } catch (error) {
      Alert.alert('Share Failed', 'Failed to share to Twitter.');
    }
  };

  const styleOptions = [
    { key: 'savage', label: 'Savage', color: '#FF6B6B', emoji: '🔥' },
    { key: 'witty', label: 'Witty', color: '#4ECDC4', emoji: '🧠' },
    { key: 'playful', label: 'Playful', color: '#FFE66D', emoji: '🎪' },
  ];

  const renderTweet = () => {
    if (!currentTweet) return null;
    
    return (
      <View style={styles.tweetContainer}>
        <View style={styles.tweetHeader}>
          <Text style={styles.tweetStyle}>{currentTweet.style.toUpperCase()}</Text>
          <Text style={styles.characterCount}>{currentTweet.characterCount}/280</Text>
        </View>
        <Text style={styles.tweetText}>
          {currentTweet.emojis.join('')} {currentTweet.text}
          {currentTweet.hashtags.map((tag: string) => ` ${tag}`).join('')}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Generate Tweet</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Original Roast */}
        <View style={styles.roastSection}>
          <Text style={styles.sectionTitle}>Original Roast</Text>
          <View style={styles.roastContainer}>
            <Text style={styles.roastText}>{roastText}</Text>
          </View>
        </View>

        {/* Tweet Style Selection */}
        <View style={styles.styleSection}>
          <Text style={styles.sectionTitle}>Tweet Style</Text>
          <View style={styles.styleGrid}>
            {styleOptions.map((style) => (
              <TouchableOpacity
                key={style.key}
                style={[
                  styles.styleButton,
                  selectedStyle === style.key && styles.styleButtonActive,
                  { borderColor: style.color }
                ]}
                onPress={() => setSelectedStyle(style.key as any)}
              >
                <Text style={styles.styleEmoji}>{style.emoji}</Text>
                <Text style={[
                  styles.styleLabel,
                  selectedStyle === style.key && styles.styleLabelActive
                ]}>
                  {style.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Hashtags */}
        <View style={styles.hashtagSection}>
          <Text style={styles.sectionTitle}>Custom Hashtags</Text>
          <View style={styles.hashtagInput}>
            <TextInput
              style={styles.input}
              value={newHashtag}
              onChangeText={setNewHashtag}
              placeholder="Add custom hashtag"
              placeholderTextColor="#666"
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={addHashtag}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {customHashtags.length > 0 && (
            <View style={styles.hashtagList}>
              {customHashtags.map((hashtag, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.hashtagChip}
                  onPress={() => removeHashtag(hashtag)}
                >
                  <Text style={styles.hashtagText}>{hashtag}</Text>
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Options */}
        <View style={styles.optionsSection}>
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Include App Link</Text>
            <TouchableOpacity
              style={[
                styles.toggle,
                includeAppLink && styles.toggleActive
              ]}
              onPress={() => setIncludeAppLink(!includeAppLink)}
            >
              <View style={[
                styles.toggleThumb,
                includeAppLink && styles.toggleThumbActive
              ]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={regenerateTweet}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="refresh" size={24} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Regenerate Tweet</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Generated Tweet */}
        {currentTweet && (
          <View style={styles.tweetSection}>
            <Text style={styles.sectionTitle}>Generated Tweet</Text>
            
            {/* Tweet Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{currentTweet.characterCount}</Text>
                <Text style={styles.statLabel}>Characters</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{currentTweet.hashtags.length}</Text>
                <Text style={styles.statLabel}>Hashtags</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{currentTweet.emojis.length}</Text>
                <Text style={styles.statLabel}>Emojis</Text>
              </View>
            </View>

            {/* Tweet Preview */}
            {renderTweet()}

            {/* Share Options */}
            <View style={styles.shareSection}>
              <Text style={styles.sectionTitle}>Share Your Tweet</Text>
              
              <View style={styles.shareGrid}>
                <TouchableOpacity
                  style={[styles.shareButton, styles.copyButton]}
                  onPress={copyToClipboard}
                >
                  <Ionicons name="copy" size={24} color="#FFFFFF" />
                  <Text style={styles.shareButtonText}>Copy to Clipboard</Text>
                </TouchableOpacity>

                {FEATURES.ENABLE_TWITTER_SHARE && (
                  <TouchableOpacity
                    style={[styles.shareButton, styles.twitterButton]}
                    onPress={shareToTwitter}
                  >
                    <Ionicons name="logo-twitter" size={24} color="#FFFFFF" />
                    <Text style={styles.shareButtonText}>Share to Twitter</Text>
                  </TouchableOpacity>
                )}
              </View>
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
  roastSection: {
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
  roastContainer: {
    backgroundColor: '#3a3a3a',
    padding: 16,
    borderRadius: 8,
  },
  roastText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
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
  hashtagText: {
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
  tweetSection: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  statLabel: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  tweetContainer: {
    backgroundColor: '#3a3a3a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  tweetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tweetStyle: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: 'bold',
  },
  characterCount: {
    fontSize: 14,
    color: '#999',
  },
  tweetText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  shareSection: {
    marginTop: 20,
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
  copyButton: {
    backgroundColor: '#4ECDC4',
  },
  twitterButton: {
    backgroundColor: '#1DA1F2',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
}); 