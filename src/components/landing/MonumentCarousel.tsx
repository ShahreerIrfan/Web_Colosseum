import type { LandmarkCard } from '@/types/api/landmarkTypes';
import { ArrowLeft, ArrowRight, ChevronRight, Clock, Layers, MapPin, Star } from 'lucide-react';
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';

interface MonumentCarouselProps {
  landmarks: LandmarkCard[];
  loading: boolean;
  onSelectLandmark?: (code: string) => void;
}

export const MonumentCarousel: React.FC<MonumentCarouselProps> = ({
  landmarks,
  loading,
  onSelectLandmark,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section id="monuments" className="py-16 md:py-24 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest font-bold text-primary">
              AllTrails Roman Archaeological Circuit
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Featured Ancient Monuments & Ruins
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              Curated audio routes with architectural tiers, offline vector blueprints, and
              historical vantage points.
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="w-9 h-9 rounded-full border border-border bg-card text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                aria-label="Scroll carousel left"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="w-9 h-9 rounded-full border border-border bg-card text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                aria-label="Scroll carousel right"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <Link
              to="/home"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <span>Explore all routes</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Carousel River */}
        {loading ? (
          <div className="flex gap-6 overflow-hidden py-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="w-80 shrink-0 h-96 rounded-xl bg-muted animate-pulse border border-border"
              />
            ))}
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory scrollbar-none scroll-smooth"
          >
            {landmarks.map((landmark) => (
              <div
                key={landmark.id}
                onClick={() => onSelectLandmark?.(landmark.code)}
                className="w-80 sm:w-88 shrink-0 snap-start group relative bg-card rounded-xl border border-border overflow-hidden hover:shadow-xl hover:border-primary/50 transition-all flex flex-col"
              >
                <Link to={`/landmark/${landmark.code}`} className="flex flex-col h-full">
                  {/* 16:9 Aspect Image Banner */}
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={landmark.thumbnailUrl}
                      alt={landmark.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                    {/* Status Pill Badge */}
                    {landmark.badge && (
                      <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                        {landmark.badge}
                      </div>
                    )}

                    {/* Rating Badge */}
                    {landmark.rating && (
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] font-semibold text-white flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>{landmark.rating}</span>
                      </div>
                    )}

                    {/* Overlay Header Info */}
                    <div className="absolute bottom-3 left-3 right-3 space-y-0.5">
                      {landmark.romanEraName && (
                        <p className="text-[11px] font-serif text-amber-200 italic tracking-wide">
                          {landmark.romanEraName}
                        </p>
                      )}
                      <h3 className="text-base font-bold text-white tracking-tight leading-snug truncate">
                        {landmark.name}
                      </h3>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {landmark.description}
                    </p>

                    {/* Highlights Tags */}
                    {landmark.highlights && landmark.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {landmark.highlights.slice(0, 2).map((h, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md font-medium"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Metrics Footer */}
                    <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>{landmark.estimatedTourDurationMinutes} min walk</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        <span>{landmark.levelCount} levels</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span>{landmark.viewpointCount} spots</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default MonumentCarousel;
