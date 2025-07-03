import React from 'react';

export function WelcomeArt() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg 
        viewBox="0 0 600 600"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="welcome-grad-bg" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--background))" stopOpacity="0" />
            <stop offset="100%" stopColor="hsl(var(--background))" />
          </linearGradient>
          <linearGradient id="welcome-grad-line" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
           <filter id="welcome-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="coloredBlur" />
            <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Grid */}
        <g opacity="0.1" className="dark:opacity-[0.15]">
            <path d="M100 0 V600 M200 0 V600 M300 0 V600 M400 0 V600 M500 0 V600" stroke="hsl(var(--foreground))" strokeWidth="1"/>
            <path d="M0 100 H600 M0 200 H600 M0 300 H600 M0 400 H600 M0 500 H600" stroke="hsl(var(--foreground))" strokeWidth="1"/>
        </g>
        
        {/* Main Chart Line */}
        <polyline
          points="50,450 150,350 250,400 350,250 450,300 550,150"
          fill="none"
          stroke="url(#welcome-grad-line)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#welcome-glow)"
        />

        {/* Area under the chart */}
        <polygon
          points="50,450 150,350 250,400 350,250 450,300 550,150 550,550 50,550"
          fill="url(#welcome-grad-line)"
          opacity="0.1"
        />

        {/* Floating UI Elements */}
        <g transform="translate(50, 80)" opacity="0.8">
            <rect x="0" y="0" width="200" height="60" rx="10" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
            <rect x="10" y="10" width="40" height="40" rx="5" fill="hsl(var(--primary))" />
            <rect x="60" y="15" width="100" height="10" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.5"/>
            <rect x="60" y="35" width="60" height="10" rx="3" fill="hsl(var(--muted-foreground))" opacity="0.3"/>
        </g>

        <g transform="translate(350, 450)" opacity="0.9">
            <rect x="0" y="0" width="180" height="80" rx="10" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
            <circle cx="30" cy="25" r="12" fill="hsl(var(--accent))" />
            <rect x="55" y="18" width="90" height="8" rx="2" fill="hsl(var(--muted-foreground))" opacity="0.5"/>
            <rect x="15" y="50" width="150" height="15" rx="4" fill="hsl(var(--primary))" opacity="0.6" />
        </g>

        {/* Masking Gradient */}
        <rect x="0" y="0" width="600" height="600" fill="url(#welcome-grad-bg)" />
      </svg>
    </div>
  );
}
