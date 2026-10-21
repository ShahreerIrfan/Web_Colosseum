import { Download, FileCode, Headphones, Landmark, ShieldCheck, Ticket } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
  onCopyApkLink?: () => void;
  onVerifyTicket?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onCopyApkLink, onVerifyTicket }) => {
  return (
    <footer className="bg-card border-t border-border pt-16 pb-12 text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & SPQR Crest Col */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md shadow-primary/20 shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-foreground text-lg tracking-tight block leading-none">
                  Colosseum Tour Guide
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                  Senatus Populusque Romanus • S•P•Q•R
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              Official architectural orientation and autonomous offline audio guide for the Flavian
              Amphitheatre, Forum Romanum, and Palatine Hill archaeological circuit.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Compliant with Parco Archeologico del Colosseo visitor standards</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Navigation
            </h5>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/home" className="hover:text-foreground transition-colors">
                  Explorer Home
                </Link>
              </li>
              <li>
                <a href="#monuments" className="hover:text-foreground transition-colors">
                  Monuments Circuit
                </a>
              </li>
              <li>
                <a href="#live-tracking" className="hover:text-foreground transition-colors">
                  Spatial Tracking
                </a>
              </li>
              <li>
                <a href="#audio" className="hover:text-foreground transition-colors">
                  Sample Narration
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-foreground transition-colors">
                  Visitor Troubleshooting
                </a>
              </li>
              <li>
                <Link to="/admin" className="hover:text-foreground transition-colors">
                  Guide / Staff Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Release & Cryptographic Verification */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Official Release & Verification
            </h5>
            <div className="bg-background rounded-2xl p-3.5 border border-border space-y-2.5 text-xs">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="font-semibold text-foreground truncate">
                  colosseum-guide-v1.0.0-universal-release.apk
                </span>
              </div>

              {/* SHA256 Checksum Link */}
              <a
                href="#checksum"
                className="text-[10px] font-mono text-muted-foreground hover:text-foreground break-all bg-muted/60 p-2 rounded-lg flex items-start gap-1.5 border border-border transition-colors"
                title="Cryptographic Checksum"
              >
                <FileCode className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>SHA256: 7f8a3d12...c9e4b1 (SHA256SUMS.txt)</span>
              </a>

              {/* Ticket Validation Link */}
              <button
                type="button"
                onClick={onVerifyTicket}
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-secondary text-secondary-foreground font-semibold text-xs hover:bg-muted transition-colors cursor-pointer border border-border"
              >
                <Ticket className="w-3.5 h-3.5 text-primary" />
                <span>Verify Ticket Pass Token</span>
              </button>

              {/* Download APK Action */}
              <button
                type="button"
                onClick={onCopyApkLink}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Universal APK</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar with SPQR Crest & Legal Links */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Headphones className="w-3.5 h-3.5 text-primary" />
            <p>© 2026 Colosseum Audio Tour Guide. Rome Archaeological Heritage.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="hover:text-foreground cursor-pointer">Accessibility</span>
            <span>•</span>
            <span className="hover:text-foreground cursor-pointer">Offline Audio License</span>
            <span>•</span>
            <span className="hover:text-foreground cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-foreground cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
