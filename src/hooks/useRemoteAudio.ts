import { useEffect, useCallback } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

export function useRemoteAudio(sourceUrl?: string) {
  const player = useAudioPlayer(sourceUrl);
  const status = useAudioPlayerStatus(player);

  const load = useCallback(async (url?: string) => {
    const target = url ?? sourceUrl;
    if (!target) throw new Error('No audio URL provided');
    player.replace(target);
  }, [sourceUrl, player]);

  const unload = useCallback(async () => {
    player.remove();
  }, [player]);

  const play = useCallback(async () => {
    if (!player.isLoaded) throw new Error('Sound not loaded');
    player.play();
  }, [player]);

  const pause = useCallback(async () => {
    if (!player.isLoaded) return;
    player.pause();
  }, [player]);

  useEffect(() => {
    return () => { 
      player.remove(); 
    };
  }, [player]);

  return { 
    load, 
    unload, 
    play, 
    pause, 
    isLoaded: status.isLoaded, 
    isPlaying: status.isPlaying, 
    durationMs: status.duration ? status.duration * 1000 : null, 
    positionMs: status.currentTime ? status.currentTime * 1000 : 0 
  };
}

