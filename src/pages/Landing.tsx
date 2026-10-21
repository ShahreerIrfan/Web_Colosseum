import { landmarkApi } from '@/apis/landmark/landmarkApi';
import AudioPreviewWidget from '@/components/landing/AudioPreviewWidget';
import FeatureRows from '@/components/landing/FeatureRows';
import Footer from '@/components/landing/Footer';
import HeroSection from '@/components/landing/HeroSection';
import LandingNavBar from '@/components/landing/LandingNavBar';
import MonumentCarousel from '@/components/landing/MonumentCarousel';
import StatsBar from '@/components/landing/StatsBar';
import VisitorFaq from '@/components/landing/VisitorFaq';
import useToast from '@/hooks/component/useToast';
import { useAudioPreview } from '@/hooks/landmark/useAudioPreview';
import { useFeaturedLandmarks } from '@/hooks/landmark/useFeaturedLandmarks';
import type { VisitorFaqItem } from '@/types/api/landmarkTypes';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showInfo } = useToast();

  // Custom hook 1: Featured monuments data fetching
  const { landmarks, loading: landmarksLoading } = useFeaturedLandmarks();

  // Custom hook 2: Web audio player controller
  const {
    tracks,
    activeTrack,
    isPlaying,
    progress,
    currentTime,
    duration,
    loading: audioLoading,
    togglePlay,
    selectTrack,
    seek,
    restart,
  } = useAudioPreview();

  // FAQs state
  const [faqs, setFaqs] = useState<VisitorFaqItem[]>([]);

  useEffect(() => {
    let ignore = false;
    landmarkApi.getFaqs().then((data) => {
      if (!ignore) {
        setFaqs(data);
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  // Handlers
  const handleSearch = (query: string) => {
    navigate(`/home?q=${encodeURIComponent(query)}`);
  };

  const handleSelectLandmark = (code: string) => {
    navigate(`/landmark/${code}`);
  };

  const handleDownloadApk = () => {
    showSuccess(
      'APK Download Triggered',
      'Downloading colosseum-guide-v1.0.0-universal-release.apk. Ensure auto-blocker is off.'
    );
  };

  const handleVerifyTicket = () => {
    showInfo(
      'Ticket Token Validation',
      'Enter your 8-digit Roman Forum / Colosseum pass code inside the app to unlock all tiers.'
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* 1. Glassmorphic Navigation Bar */}
      <LandingNavBar onDownloadApk={handleDownloadApk} />

      {/* 2. Main Landing Page Content */}
      <main className="flex-1">
        {/* Hero Section with AllTrails Search & Action Pills */}
        <HeroSection onSearch={handleSearch} />

        {/* Metric Counters & Trust Indicators */}
        <StatsBar />

        {/* Featured Monuments Carousel / Card River */}
        <MonumentCarousel
          landmarks={landmarks}
          loading={landmarksLoading}
          onSelectLandmark={handleSelectLandmark}
        />

        {/* 3 Alternating Feature Showcase Rows with Phone Mockups */}
        <FeatureRows onDownloadApk={handleDownloadApk} />

        {/* Interactive Web Audio Tour Previewer */}
        <AudioPreviewWidget
          tracks={tracks}
          activeTrack={activeTrack}
          isPlaying={isPlaying}
          progress={progress}
          currentTime={currentTime}
          duration={duration}
          loading={audioLoading}
          onTogglePlay={togglePlay}
          onSelectTrack={selectTrack}
          onSeek={seek}
          onRestart={restart}
        />

        {/* Visitor Onboarding & Hardware Troubleshooting Accordion */}
        <VisitorFaq faqs={faqs} />
      </main>

      {/* 3. Footer with SPQR Crest, Checksum & Legal Links */}
      <Footer onCopyApkLink={handleDownloadApk} onVerifyTicket={handleVerifyTicket} />
    </div>
  );
};

export default Landing;
