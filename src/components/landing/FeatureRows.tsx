import { Button } from '@/components/ui/button';
import {
  Compass,
  Download,
  Headphones,
  MapPin,
  Navigation,
  QrCode,
  ShieldCheck,
  Sparkles,
  Volume2,
  WifiOff,
} from 'lucide-react';
import React from 'react';

interface FeatureRowsProps {
  onDownloadApk?: () => void;
}

export const FeatureRows: React.FC<FeatureRowsProps> = ({ onDownloadApk }) => {
  return (
    <section id="features" className="py-20 md:py-32 bg-card/40 border-b border-border space-y-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28">
        {/* Row 1: Real-Time Compass & Walking Guidance (Left Content + Right Phone Mockup) */}
        <div
          id="live-tracking"
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
        >
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
              <Compass className="w-3.5 h-3.5 text-primary" />
              <span>Real-Time Spatial Dead-Reckoning</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              Never miss a turn with live spatial tracking
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              Dual sensor fusion combines real-time GPS proximity with your smartphone's
              magnetometer heading to navigate ancient stone archways without getting lost.
            </p>
            <ul className="space-y-3.5 text-sm text-foreground">
              <li className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                <span>Micro-proximity triggers when approaching vantage viewpoints</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                <span>
                  Automatic 3D heading arrow pointing toward historical architectural details
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                <span>Seamless transition between outdoor avenues and interior vaults</span>
              </li>
            </ul>

            {/* Action Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <a href="#download" onClick={onDownloadApk}>
                <Button className="gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 shadow-sm">
                  <Download className="w-4 h-4" />
                  <span>Download Universal APK</span>
                </Button>
              </a>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-2 rounded-lg border border-border">
                <QrCode className="w-4 h-4 text-foreground" />
                <span>Scan QR for instant on-device installation</span>
              </div>
            </div>
          </div>

          {/* Right Phone Mockup */}
          <div className="flex justify-center">
            <div className="w-72 sm:w-80 h-[530px] rounded-[44px] border-4 border-foreground/20 bg-background shadow-2xl p-3 flex flex-col justify-between overflow-hidden relative">
              {/* Speaker Notch */}
              <div className="w-28 h-5 bg-foreground/15 rounded-full mx-auto mb-2 shrink-0" />

              {/* Screen Mockup */}
              <div className="flex-1 rounded-[34px] bg-secondary/40 p-4 flex flex-col justify-between border border-border overflow-hidden relative">
                {/* Simulated Map Canvas */}
                <div className="absolute inset-0 bg-zinc-900/10 flex items-center justify-center pointer-events-none">
                  {/* Circular Radar Rings */}
                  <div className="w-48 h-48 rounded-full border border-primary/20 animate-ping absolute" />
                  <div className="w-36 h-36 rounded-full border border-primary/30 absolute" />
                  <div className="w-20 h-20 rounded-full border border-primary/50 absolute" />
                  {/* Path & User Puck */}
                  <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-primary/30 flex items-center justify-center z-10">
                    <Navigation className="w-2.5 h-2.5 text-primary-foreground -rotate-45" />
                  </div>
                </div>

                {/* Top Status */}
                <div className="relative z-10 bg-background/90 backdrop-blur-md rounded-xl p-2.5 border border-border shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-foreground">GPS Active</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Accuracy ±1.8m
                  </span>
                </div>

                {/* Bottom Route Card */}
                <div className="relative z-10 bg-background/95 backdrop-blur-md rounded-2xl p-3.5 border border-border shadow-md space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">Arena Floor Itinerary</span>
                    <span className="text-primary font-semibold text-[10px]">Step 3 of 7</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Continue 12m forward toward the reconstructed Emperor Pulvinar podium.
                  </p>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-1/2 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Explore Even Without Cellular Signal (Right Content + Left Phone Mockup) */}
        <div
          id="hypogeum-offline"
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
        >
          {/* Left Visual & Checksum */}
          <div className="order-2 lg:order-1 flex justify-center">
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl max-w-sm w-full space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center shadow-xs">
                  <WifiOff className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-foreground text-base">Offline Data Bundle</h4>
                <p className="text-xs text-muted-foreground">
                  Downloaded to phone storage before entering monument gates
                </p>
              </div>

              {/* Bundle list */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-background border border-border flex items-center justify-between">
                  <span className="font-medium text-foreground">Vector Floor Plans (4 Tiers)</span>
                  <span className="text-emerald-500 font-semibold text-[11px]">Cached</span>
                </div>
                <div className="p-2.5 rounded-xl bg-background border border-border flex items-center justify-between">
                  <span className="font-medium text-foreground">19 Audio Narration Tracks</span>
                  <span className="text-emerald-500 font-semibold text-[11px]">38.4 MB</span>
                </div>
                <div className="p-2.5 rounded-xl bg-background border border-border flex items-center justify-between">
                  <span className="font-medium text-foreground">Sensor Calibration Models</span>
                  <span className="text-emerald-500 font-semibold text-[11px]">Ready</span>
                </div>
              </div>

              {/* SHA-256 Verified Checksum Badge */}
              <div className="pt-2 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>SHA-256 Verified Release</span>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
              <WifiOff className="w-3.5 h-3.5 text-primary" />
              <span>Zero-Signal Architecture</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              100% Offline-Ready for Underground Stone Tunnels
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              Ancient travertine masonry and underground hypogeum chambers create extreme cellular
              dead zones. Pre-download the full tour package over Wi-Fi before entering the monument
              to enjoy zero lag, zero buffering, and zero international roaming fees.
            </p>
            <ul className="space-y-3.5 text-sm text-foreground">
              <li className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                <span>Vector tile rendering requires no live internet connection</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                <span>Fast local SQLite database queries on your smartphone storage</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                <span>Preserves mobile battery life throughout a 3-hour expedition</span>
              </li>
            </ul>

            <div className="pt-2">
              <a href="#download" onClick={onDownloadApk}>
                <Button variant="outline" className="gap-2 border-border font-semibold">
                  <Download className="w-4 h-4 text-primary" />
                  <span>Download Offline Package (~38.4 MB)</span>
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Row 3: Engaging Storytelling by Roman Historians (Left Content + Right Phone Mockup) */}
        <div
          id="storytelling"
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
        >
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Dramatized Historical Audio</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              Breathe life into ancient ruins
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              Expert voice narration synchronized with your walking pace. Includes scrub controls,
              audio bookmarking, and background playback with phone in pocket.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-card p-4 rounded-xl border border-border space-y-1.5">
                <Volume2 className="w-5 h-5 text-primary" />
                <h5 className="font-bold text-sm text-foreground">Spatial 3D Audio</h5>
                <p className="text-xs text-muted-foreground">
                  Experience ancient roaring crowds and subterranean mechanical pulleys in your
                  headphones.
                </p>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border space-y-1.5">
                <Headphones className="w-5 h-5 text-primary" />
                <h5 className="font-bold text-sm text-foreground">Hands-Free In Pocket</h5>
                <p className="text-xs text-muted-foreground">
                  Lock your phone and walk freely—narration triggers smoothly based on your
                  footsteps.
                </p>
              </div>
            </div>
          </div>

          {/* Right Phone Mockup: Active Viewpoint Card */}
          <div className="flex justify-center">
            <div className="w-72 sm:w-80 h-[530px] rounded-[44px] border-4 border-foreground/20 bg-background shadow-2xl p-3 flex flex-col justify-between overflow-hidden">
              <div className="w-28 h-5 bg-foreground/15 rounded-full mx-auto mb-2 shrink-0" />
              <div className="flex-1 rounded-[34px] bg-secondary/30 p-4 flex flex-col justify-between border border-border">
                {/* Artwork */}
                <div className="relative rounded-2xl overflow-hidden aspect-square bg-muted">
                  <img
                    src="https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=500&auto=format&fit=crop"
                    alt="Colosseum Hypogeum"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-primary" />
                    <span>Hypogeum Chamber 02</span>
                  </div>
                </div>

                {/* Player Info */}
                <div className="bg-card rounded-2xl p-3.5 border border-border shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-foreground">Porta Libitinensis</h4>
                      <p className="text-[10px] text-muted-foreground">Gate of Death Walkthrough</p>
                    </div>
                    <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                      Playing
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-3/5 rounded-full" />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>01:42</span>
                    <span>02:45</span>
                  </div>
                </div>

                {/* Bottom sensor tag */}
                <div className="text-center">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Auto-triggered by proximity to north archway
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureRows;
