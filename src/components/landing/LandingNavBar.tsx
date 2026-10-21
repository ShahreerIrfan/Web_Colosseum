import { Button } from '@/components/ui/button';
import { Download, Landmark, Menu, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface LandingNavBarProps {
  onDownloadApk?: () => void;
}

export const LandingNavBar: React.FC<LandingNavBarProps> = ({ onDownloadApk }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Monuments', href: '#monuments' },
    { label: 'Live Tracking', href: '#live-tracking' },
    { label: 'Hypogeum Offline', href: '#hypogeum-offline' },
    { label: 'Audio Stories', href: '#audio' },
    { label: 'Visitor FAQ', href: '#faq' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md shadow-primary/20 group-hover:scale-105 transition-transform shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-foreground text-lg tracking-tight leading-none">
                Colosseum
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                Tour Guide
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <a href="#download" onClick={onDownloadApk}>
              <Button
                size="sm"
                className="gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Universal APK</span>
              </Button>
            </a>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen((p) => !p)}
              className="p-2 text-foreground rounded-lg hover:bg-muted"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card px-4 pt-3 pb-5 space-y-3 shadow-lg">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </a>
          ))}

          <div className="pt-3 border-t border-border flex flex-col gap-2.5">
            <a
              href="#download"
              onClick={() => {
                setMobileMenuOpen(false);
                onDownloadApk?.();
              }}
            >
              <Button className="w-full gap-2 bg-primary text-primary-foreground font-semibold shadow-sm">
                <Download className="w-4 h-4" />
                <span>Download Universal APK</span>
              </Button>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingNavBar;
