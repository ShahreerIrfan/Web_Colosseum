import { Button } from '@/components/ui/button';
import type { AudioTrack } from '@/types/api/landmarkTypes';
import { Headphones, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import React from 'react';

interface AudioPreviewWidgetProps {
  tracks: AudioTrack[];
  activeTrack: AudioTrack | null;
  isPlaying: boolean;
  progress: number;
  currentTime: string;
  duration: string;
  loading?: boolean;
  onTogglePlay: () => void;
  onSelectTrack: (track: AudioTrack) => void;
  onSeek: (percent: number) => void;
  onRestart: () => void;
}

const WAVEFORM_HEIGHT_CLASSES = [
  'h-3',
  'h-5',
  'h-7',
  'h-10',
  'h-4',
  'h-8',
  'h-9',
  'h-6',
  'h-5',
  'h-8',
  'h-10',
  'h-7',
  'h-4',
  'h-6',
  'h-9',
  'h-8',
  'h-4',
  'h-6',
  'h-8',
  'h-10',
  'h-6',
  'h-8',
  'h-5',
  'h-4',
  'h-7',
  'h-8',
  'h-5',
  'h-7',
  'h-9',
  'h-5',
  'h-3',
  'h-6',
  'h-8',
  'h-5',
  'h-4',
  'h-3',
  'h-6',
  'h-9',
  'h-10',
  'h-7',
  'h-5',
  'h-4',
  'h-5',
  'h-7',
  'h-8',
  'h-4',
  'h-3',
];

export const AudioPreviewWidget: React.FC<AudioPreviewWidgetProps> = ({
  tracks,
  activeTrack,
  isPlaying,
  progress,
  currentTime,
  duration,
  loading = false,
  onTogglePlay,
  onSelectTrack,
  onSeek,
  onRestart,
}) => {
  return (
    <section id="audio" className="py-16 md:py-24 bg-background border-b border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-xs uppercase tracking-widest font-bold text-primary">
            Interactive Web Tour Experience
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Hear Ancient Rome Come Alive
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Test the on-site audio narration sample from Roman historians, recorded in studio HD
            with spatial sound design.
          </p>
        </div>

        {/* Viewpoint Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {tracks.map((track) => {
            const isSelected = activeTrack?.id === track.id;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => onSelectTrack(track)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <span>{track.title}</span>
                <span className="ml-2 text-[10px] opacity-75 font-mono">
                  ({track.durationLabel})
                </span>
              </button>
            );
          })}
        </div>

        {/* Audio Player Card */}
        <div className="bg-card border border-border shadow-xl rounded-3xl p-6 sm:p-8 space-y-6">
          {loading ? (
            <div className="h-44 rounded-2xl bg-muted animate-pulse" />
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Play / Pause Toggle Button */}
                <button
                  type="button"
                  onClick={onTogglePlay}
                  className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                  aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </button>

                {/* Track Info & Simulated Waveform */}
                <div className="flex-1 w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-foreground text-base">
                        {activeTrack?.title || 'Select a viewpoint audio'}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {activeTrack?.monumentName} • {activeTrack?.viewpointName} • Voice:{' '}
                        {activeTrack?.speaker}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-primary font-mono bg-primary/10 px-2.5 py-1 rounded-md">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{activeTrack?.bitrate || '320 kbps'}</span>
                    </div>
                  </div>

                  {/* Waveform Bars (Zero inline styles) */}
                  <div className="h-10 flex items-center gap-1 w-full py-1">
                    {WAVEFORM_HEIGHT_CLASSES.map((heightClass, i) => {
                      const isPassed = (i / WAVEFORM_HEIGHT_CLASSES.length) * 100 <= progress;
                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-full transition-colors duration-150 ${heightClass} ${
                            isPassed ? 'bg-primary' : 'bg-muted'
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Progress Scrub Bar */}
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span>{currentTime}</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => onSeek(Number(e.target.value))}
                      className="w-full mx-4 h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <span>{duration}</span>
                  </div>
                </div>

                {/* Restart Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onRestart}
                  className="shrink-0 hidden sm:flex border-border"
                  title="Restart track"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              {/* Historical Transcript Excerpt */}
              {activeTrack?.transcript && (
                <div className="bg-muted/40 rounded-2xl p-4 border border-border/60 space-y-1.5">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-primary">
                    Historical Narration Transcript:
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">
                    {activeTrack.transcript}
                  </p>
                </div>
              )}

              {/* Footer info pill */}
              <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Headphones className="w-4 h-4 text-primary" />
                  Spatial 3D audio activates automatically when using wired or Bluetooth headphones.
                </span>
                <span className="font-semibold text-foreground">
                  Universal APK includes 19 full-length tracks
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default AudioPreviewWidget;
