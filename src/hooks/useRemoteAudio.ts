import { useEffect, useRef, useState, useCallback } from 'react';
import { Audio, AVPlaybackStatusSuccess } from 'expo-av';

export function useRemoteAudio(sourceUrl?: string) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [positionMs, setPositionMs] = useState<number>(0);

  const unload = useCallback(async () => {
    if (soundRef.current) {
      try { await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
      setIsLoaded(false);
      setIsPlaying(false);
      setDurationMs(null);
      setPositionMs(0);
    }
  }, []);

  const load = useCallback(async (url?: string) => {
    const target = url ?? sourceUrl;
    if (!target) throw new Error('No audio URL provided');
    await unload();
    const { sound } = await Audio.Sound.createAsync({ uri: target }, { shouldPlay: false }, (status) => {
      const s = status as AVPlaybackStatusSuccess;
      if (s.isLoaded) {
        setIsPlaying(s.isPlaying);
        setDurationMs(s.durationMillis ?? null);
        setPositionMs(s.positionMillis ?? 0);
      }
    });
    soundRef.current = sound;
    setIsLoaded(true);
  }, [sourceUrl, unload]);

  const play = useCallback(async () => {
    if (!soundRef.current) throw new Error('Sound not loaded');
    await soundRef.current.playAsync();
  }, []);

  const pause = useCallback(async () => {
    if (!soundRef.current) return;
    await soundRef.current.pauseAsync();
  }, []);

  useEffect(() => {
    return () => { unload(); };
  }, [unload]);

  return { load, unload, play, pause, isLoaded, isPlaying, durationMs, positionMs };
}

