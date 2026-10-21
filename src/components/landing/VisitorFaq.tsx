import type { VisitorFaqItem } from '@/types/api/landmarkTypes';
import {
  BatteryCharging,
  ChevronDown,
  Compass,
  HelpCircle,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';
import React, { useState } from 'react';

interface VisitorFaqProps {
  faqs: VisitorFaqItem[];
}

export const VisitorFaq: React.FC<VisitorFaqProps> = ({ faqs }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'installation':
        return <Smartphone className="w-4 h-4 text-primary shrink-0" />;
      case 'battery':
        return <BatteryCharging className="w-4 h-4 text-primary shrink-0" />;
      case 'calibration':
        return <Compass className="w-4 h-4 text-primary shrink-0" />;
      default:
        return <HelpCircle className="w-4 h-4 text-primary shrink-0" />;
    }
  };

  return (
    <section id="faq" className="py-16 md:py-24 bg-card/40 border-b border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            <span>Essential On-Site Hardware & Sideloading Guidance</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Visitor Onboarding & Troubleshooting
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Practical hardware configuration tips before stepping inside the Roman archaeological
            zone.
          </p>
        </div>

        {/* Notice Alert Box */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-xs text-foreground">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <p className="font-bold text-amber-600">Important Archaeological Site Notice:</p>
            <p className="text-muted-foreground">
              Travertine stone walls in the Colosseum subterranean tunnels completely block cellular
              reception. Always pre-download the offline audio package and calibrate your phone
              sensors before passing through security turnstiles.
            </p>
          </div>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.id || idx}
                className="bg-card border border-border rounded-2xl overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-semibold text-foreground text-sm sm:text-base hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(faq.category)}
                    <span>{faq.question}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-6 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default VisitorFaq;
