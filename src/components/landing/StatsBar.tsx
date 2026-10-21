import { Globe, Headphones, Landmark, WifiOff } from 'lucide-react';
import React from 'react';

export const StatsBar: React.FC = () => {
  const metrics = [
    {
      value: '5',
      label: 'Ancient Monuments & Ruins',
      detail: 'Colosseum, Forum, Palatine, Arch & Ludus Magnus',
      icon: <Landmark className="w-5 h-5 text-primary" />,
    },
    {
      value: '19+',
      label: 'Curated Panoramic Viewpoints',
      detail: 'From subterranean hypogeum to imperial tiers',
      icon: <Headphones className="w-5 h-5 text-primary" />,
    },
    {
      value: '100% Offline',
      label: 'Zero Cellular Signal Required',
      detail: 'Subterranean pedestrian dead-reckoning positioning',
      icon: <WifiOff className="w-5 h-5 text-primary" />,
    },
    {
      value: '5',
      label: 'Spoken Languages',
      detail: 'English, Italian, Spanish, French, German',
      icon: <Globe className="w-5 h-5 text-primary" />,
    },
  ];

  return (
    <section className="py-8 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {metrics.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-start sm:items-center gap-3.5 ${
                idx > 0 ? 'pt-4 lg:pt-0 lg:pl-6' : ''
              }`}
            >
              <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0 shadow-xs">
                {item.icon}
              </div>
              <div className="space-y-0.5">
                <p className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  {item.value}
                </p>
                <p className="text-xs font-semibold text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground hidden sm:block">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
