import { Button } from '@/components/ui/button';
import { ArrowRight, Compass, Headphones, Landmark, Search, WifiOff } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface HeroSectionProps {
  onSearch?: (query: string) => void;
}

const SEARCH_SUGGESTIONS = [
  'Hypogeum Tunnels',
  'Arena Floor',
  'Imperial Box',
  'Via Sacra',
  'Gladiator Barracks',
  'Gate of Death',
  'Temple of Saturn',
];

const ACTION_PILLS = [
  {
    label: '5 Monument Routes',
    icon: <Landmark className="w-4 h-4 text-primary" />,
    href: '#monuments',
  },
  {
    label: 'Sample Narration',
    icon: <Headphones className="w-4 h-4 text-primary" />,
    href: '#audio',
  },
  {
    label: 'Interactive Map',
    icon: <Compass className="w-4 h-4 text-primary" />,
    href: '#live-tracking',
  },
  {
    label: 'Offline Pack Info',
    icon: <WifiOff className="w-4 h-4 text-primary" />,
    href: '#hypogeum-offline',
  },
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      navigate(`/home?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSelectSuggestion = (tag: string) => {
    setSearchQuery(tag);
    setIsSearchFocused(false);
    if (onSearch) {
      onSearch(tag);
    } else {
      navigate(`/home?q=${encodeURIComponent(tag)}`);
    }
  };

  return (
    <section className="relative overflow-hidden pt-16 pb-24 md:pt-28 md:pb-36 border-b border-border">
      {/* Background image with atmospheric Roman amphitheater backdrop */}
      <div className="absolute inset-0 -z-10 bg-card overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1920&auto=format&fit=crop&q=80"
          alt="Ancient Roman Colosseum Arena"
          className="w-full h-full object-cover object-center opacity-25 scale-105"
        />
        {/* Subtle gradient overlay to background tokens */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-background" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
        {/* Top Roman Laurel / Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold shadow-xs">
          <Landmark className="w-4 h-4 text-primary" />
          <span>Parco Archeologico del Colosseo • Offline GPS Spatial Guide</span>
        </div>

        {/* Heading & Subheading */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground leading-[1.12]">
            Step inside Ancient Rome <br className="hidden sm:inline" />
            <span className="text-primary">with your personal audio guide</span>
          </h1>
          <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Explore the Colosseum, Roman Forum, and Palatine Hill with offline GPS guidance and
            immersive historical storytelling.
          </p>
        </div>

        {/* AllTrails Signature Search Box */}
        <div className="max-w-2xl mx-auto relative">
          <form
            onSubmit={handleSearchSubmit}
            className="bg-card border border-border shadow-xl rounded-2xl p-2 sm:p-2.5 flex flex-col sm:flex-row items-center gap-2 transition-all focus-within:ring-2 focus-within:ring-ring"
          >
            <div className="flex items-center gap-3 px-3 w-full flex-1">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search viewpoints, gladiators, emperors, or monuments (e.g. Hypogeum, Arch of Titus)..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-foreground placeholder:text-muted-foreground text-sm focus:outline-none"
              />
            </div>
            <Button
              type="submit"
              className="w-full sm:w-auto px-6 font-semibold gap-2 bg-primary text-primary-foreground shadow-sm hover:opacity-90"
            >
              <span>Explore</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Instant Suggestion Dropdown */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl p-3 z-30 text-left space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
                Popular Searches
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SEARCH_SUGGESTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onMouseDown={() => handleSelectSuggestion(tag)}
                    className="px-3 py-1 rounded-lg text-xs bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Action Pills (Below Search Bar) */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {ACTION_PILLS.map((pill) => (
            <a
              key={pill.label}
              href={pill.href}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-card border border-border text-foreground hover:bg-muted hover:border-primary/40 transition-all shadow-xs"
            >
              {pill.icon}
              <span>{pill.label}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
