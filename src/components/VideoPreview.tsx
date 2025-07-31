import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { VideoSegment, TikTokVideoConfig } from '../services/tikTokVideoService';

interface VideoPreviewProps {
  config: TikTokVideoConfig;
  isPlaying: boolean;
}

const { width, height } = Dimensions.get('window');
const VIDEO_WIDTH = width * 0.8;
const VIDEO_HEIGHT = height * 0.4;

export default function VideoPreview({ config, isPlaying }: VideoPreviewProps) {
  const [currentSegment, setCurrentSegment] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const typewriterAnim = useRef(new Animated.Value(0)).current;

  const segments: VideoSegment[] = [
    {
      id: 'hook',
      type: 'text',
      content: 'AI is about to roast me...',
      startTime: 0,
      duration: 2,
      animation: 'fade',
      style: {
        fontSize: 24,
        color: '#FFFFFF',
        backgroundColor: 'rgba(0,0,0,0.7)',
        position: 'center'
      }
    },
    {
      id: 'build',
      type: 'text',
      content: config.userName ? `Let's see what AI thinks about ${config.userName}...` : 'Let\'s see what AI thinks...',
      startTime: 2,
      duration: 2,
      animation: 'slide',
      style: {
        fontSize: 20,
        color: '#FFFFFF',
        backgroundColor: 'rgba(0,0,0,0.7)',
        position: 'center'
      }
    },
    {
      id: 'roast',
      type: 'text',
      content: config.roastText,
      startTime: 4,
      duration: 4,
      animation: 'typewriter',
      style: {
        fontSize: 22,
        color: config.theme === 'savage' ? '#FF6B6B' : 
               config.theme === 'witty' ? '#4ECDC4' :
               config.theme === 'playful' ? '#FFE66D' : '#FF4757',
        backgroundColor: 'rgba(0,0,0,0.8)',
        position: 'center'
      }
    },
    ...(config.includeReaction ? [{
      id: 'reaction',
      type: 'reaction',
      content: '😱 AI just violated me!',
      startTime: 8,
      duration: 2,
      animation: 'bounce',
      style: {
        fontSize: 28,
        color: '#FF6B6B',
        backgroundColor: 'rgba(255,107,107,0.2)',
        position: 'bottom'
      }
    }] : []),
    {
      id: 'cta',
      type: 'text',
      content: 'Try it yourself! 👇',
      startTime: config.includeReaction ? 10 : 8,
      duration: 2,
      animation: 'fade',
      style: {
        fontSize: 20,
        color: '#4ECDC4',
        backgroundColor: 'rgba(78,205,196,0.2)',
        position: 'bottom'
      }
    }
  ];

  useEffect(() => {
    if (isPlaying) {
      playAnimation();
    } else {
      resetAnimation();
    }
  }, [isPlaying, currentSegment]);

  const playAnimation = () => {
    const segment = segments[currentSegment];
    if (!segment) return;

    switch (segment.animation) {
      case 'fade':
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.delay(segment.duration * 1000 - 500),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => nextSegment());
        break;

      case 'slide':
        Animated.sequence([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.delay(segment.duration * 1000 - 500),
          Animated.timing(slideAnim, {
            toValue: 50,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => nextSegment());
        break;

      case 'typewriter':
        const textLength = segment.content.length;
        const duration = segment.duration * 1000;
        const interval = duration / textLength;
        
        let currentLength = 0;
        const typewriterInterval = setInterval(() => {
          currentLength++;
          typewriterAnim.setValue(currentLength / textLength);
          
          if (currentLength >= textLength) {
            clearInterval(typewriterInterval);
            setTimeout(() => nextSegment(), 1000);
          }
        }, interval);
        break;

      case 'bounce':
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -10,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay(segment.duration * 1000 - 700),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => nextSegment());
        break;
    }
  };

  const nextSegment = () => {
    if (currentSegment < segments.length - 1) {
      setCurrentSegment(currentSegment + 1);
    } else {
      setCurrentSegment(0);
    }
  };

  const resetAnimation = () => {
    setCurrentSegment(0);
    fadeAnim.setValue(0);
    slideAnim.setValue(-50);
    typewriterAnim.setValue(0);
  };

  const renderSegment = () => {
    const segment = segments[currentSegment];
    if (!segment) return null;

    const animatedStyle: any = {};
    
    switch (segment.animation) {
      case 'fade':
        animatedStyle.opacity = fadeAnim;
        break;
      case 'slide':
        animatedStyle.transform = [{ translateY: slideAnim }];
        break;
      case 'typewriter':
        animatedStyle.opacity = fadeAnim;
        break;
      case 'bounce':
        animatedStyle.opacity = fadeAnim;
        animatedStyle.transform = [{ translateY: slideAnim }];
        break;
    }

    const getPositionStyle = () => {
      switch (segment.style.position) {
        case 'top':
          return { top: 50 };
        case 'bottom':
          return { bottom: 50 };
        default:
          return { top: VIDEO_HEIGHT / 2 - 50 };
      }
    };

    return (
      <Animated.View
        style={[
          styles.segmentContainer,
          getPositionStyle(),
          animatedStyle,
        ]}
      >
        <View
          style={[
            styles.textContainer,
            { backgroundColor: segment.style.backgroundColor }
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              {
                fontSize: segment.style.fontSize,
                color: segment.style.color,
              }
            ]}
          >
            {segment.animation === 'typewriter' 
              ? segment.content.substring(0, Math.floor(typewriterAnim._value * segment.content.length))
              : segment.content
            }
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <View style={styles.videoFrame}>
          {renderSegment()}
        </View>
      </View>
      <Text style={styles.previewLabel}>Video Preview</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  videoContainer: {
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#333',
  },
  videoFrame: {
    flex: 1,
    position: 'relative',
  },
  segmentContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  textContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: '90%',
  },
  segmentText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
}); 