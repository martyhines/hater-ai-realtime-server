import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { VideoFrame } from '../services/videoGenerationService';

interface VideoRendererProps {
  frames: VideoFrame[];
  onFrameRendered?: (frameIndex: number, frameData: any) => void;
  onComplete?: () => void;
}

const { width, height } = Dimensions.get('window');
const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1920;
const SCALE = Math.min(width / VIDEO_WIDTH, height / VIDEO_HEIGHT);

export default function VideoRenderer({ frames, onFrameRendered, onComplete }: VideoRendererProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const canvasRef = useRef<any>(null);
  const animationRef = useRef<any>(null);

  useEffect(() => {
    if (frames.length > 0 && !isRendering) {
      startRendering();
    }
  }, [frames]);

  const startRendering = async () => {
    setIsRendering(true);
    setCurrentFrame(0);
    
    for (let i = 0; i < frames.length; i++) {
      await renderFrame(i);
      setCurrentFrame(i);
      
      if (onFrameRendered) {
        onFrameRendered(i, frames[i]);
      }
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    setIsRendering(false);
    if (onComplete) {
      onComplete();
    }
  };

  const renderFrame = async (frameIndex: number) => {
    const frame = frames[frameIndex];
    if (!frame) return;

    try {
      // In a real implementation, this would render to a canvas or GL context
      // For now, we'll simulate the rendering process
      
      const frameData = {
        timestamp: frame.timestamp,
        text: frame.text,
        style: frame.style,
        animation: frame.animation,
        position: getTextPosition(frame.style.position),
        opacity: getAnimationOpacity(frame.animation, frameIndex, frames.length),
        transform: getAnimationTransform(frame.animation, frameIndex, frames.length),
      };

      // Simulate rendering time
      await new Promise(resolve => setTimeout(resolve, 10));
      
      return frameData;
    } catch (error) {
      console.error('Error rendering frame:', error);
    }
  };

  const getTextPosition = (position: 'top' | 'center' | 'bottom') => {
    switch (position) {
      case 'top':
        return { top: 100 };
      case 'bottom':
        return { bottom: 100 };
      default:
        return { top: VIDEO_HEIGHT / 2 - 50 };
    }
  };

  const getAnimationOpacity = (animation: string, frameIndex: number, totalFrames: number) => {
    const progress = frameIndex / totalFrames;
    
    switch (animation) {
      case 'fade':
        return progress < 0.1 ? progress * 10 : progress > 0.9 ? (1 - progress) * 10 : 1;
      case 'slide':
        return 1;
      case 'typewriter':
        return 1;
      case 'bounce':
        return progress < 0.1 ? progress * 10 : 1;
      default:
        return 1;
    }
  };

  const getAnimationTransform = (animation: string, frameIndex: number, totalFrames: number) => {
    const progress = frameIndex / totalFrames;
    
    switch (animation) {
      case 'slide':
        const slideProgress = progress < 0.1 ? progress * 10 : progress > 0.9 ? (1 - progress) * 10 : 1;
        return { translateY: (1 - slideProgress) * 50 };
      case 'bounce':
        if (progress < 0.1) {
          return { translateY: -10 * Math.sin(progress * 100) };
        }
        return { translateY: 0 };
      default:
        return { translateY: 0 };
    }
  };

  const renderPreviewFrame = () => {
    if (frames.length === 0 || currentFrame >= frames.length) return null;
    
    const frame = frames[currentFrame];
    const position = getTextPosition(frame.style.position);
    const opacity = getAnimationOpacity(frame.animation, currentFrame, frames.length);
    const transform = getAnimationTransform(frame.animation, currentFrame, frames.length);

    return (
      <View style={[styles.frameContainer, position]}>
        <View
          style={[
            styles.textContainer,
            {
              backgroundColor: frame.style.backgroundColor,
              opacity,
              transform: [transform],
            }
          ]}
        >
          <Text
            style={[
              styles.frameText,
              {
                fontSize: frame.style.fontSize * SCALE,
                color: frame.style.color,
              }
            ]}
          >
            {frame.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <View style={styles.videoFrame}>
          {renderPreviewFrame()}
        </View>
        
        {isRendering && (
          <View style={styles.renderingOverlay}>
            <Text style={styles.renderingText}>
              Rendering frame {currentFrame + 1} of {frames.length}
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((currentFrame + 1) / frames.length) * 100}%` }
                ]} 
              />
            </View>
          </View>
        )}
      </View>
      
      <View style={styles.controls}>
        <Text style={styles.statusText}>
          {isRendering 
            ? `Rendering: ${currentFrame + 1}/${frames.length} frames`
            : `Ready: ${frames.length} frames`
          }
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  videoContainer: {
    width: VIDEO_WIDTH * SCALE,
    height: VIDEO_HEIGHT * SCALE,
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#333',
    position: 'relative',
  },
  videoFrame: {
    flex: 1,
    position: 'relative',
  },
  frameContainer: {
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
  frameText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  renderingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  renderingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
  },
  controls: {
    marginTop: 16,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
}); 