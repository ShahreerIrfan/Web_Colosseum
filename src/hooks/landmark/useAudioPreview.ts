import { landmarkApi } from '@/apis/landmark/landmarkApi';
import useToast from '@/hooks/component/useToast';
import type { AudioTrack } from '@/types/api/landmarkTypes';
import { useCallback, useEffect, useRef, useState } from 'react';

const formatSeconds = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const useAudioPreview = () => {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [activeTrack, setActiveTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');
  const [loading, setLoading] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const { showError } = useToast();

  // Load sample tracks
  useEffect(() => {
    let ignore = false;
    landmarkApi
      .getAudioSample()
      .then((data) => {
        if (!ignore && data.length > 0) {
          setTracks(data);
          setActiveTrack(data[0]);
          setDuration(data[0].durationLabel);
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load audio tracks.';
        showError('Audio Error', msg);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [showError]);

  // Audio setup
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (audio.duration && audio.duration > 0) {
        const pct = (audio.currentTime / audio.duration) * 100;
        setProgress(pct);
        setCurrentTime(formatSeconds(audio.currentTime));
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime('00:00');
    };

    const handleError = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
    };
  }, []);

  // Update src when activeTrack changes
  useEffect(() => {
    if (audioRef.current && activeTrack) {
      const wasPlaying = isPlayingRef.current;
      audioRef.current.pause();
      audioRef.current.src = activeTrack.audioUrl;
      audioRef.current.load();
      setProgress(0);
      setCurrentTime('00:00');
      setDuration(activeTrack.durationLabel);

      if (wasPlaying) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  }, [activeTrack]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
          showError(
            'Audio Playback Failed',
            'Unable to play audio in the current browser session.'
          );
        });
    }
  }, [isPlaying, showError]);

  const selectTrack = useCallback((track: AudioTrack) => {
    setActiveTrack(track);
  }, []);

  const seek = useCallback((percent: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const targetTime = (percent / 100) * audio.duration;
    audio.currentTime = targetTime;
    setProgress(percent);
    setCurrentTime(formatSeconds(targetTime));
  }, []);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setProgress(0);
    setCurrentTime('00:00');
  }, []);

  return {
    tracks,
    activeTrack,
    isPlaying,
    progress,
    currentTime,
    duration,
    loading,
    togglePlay,
    selectTrack,
    seek,
    restart,
  };
};

export default useAudioPreview;
