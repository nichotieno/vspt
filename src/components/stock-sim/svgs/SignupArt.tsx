import React from 'react';

export function SignupArt() {
  return (
    <div className="h-full w-full bg-muted p-10 flex items-center justify-center">
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 800 800" 
        xmlns="http://www.w3.org/2000/svg"
        className="dark:opacity-80"
      >
        <defs>
          <linearGradient id="signup-grad1" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
          </linearGradient>
           <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="15" result="coloredBlur" />
            <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
        </defs>

        {/* Background elements */}
        <circle cx="400" cy="400" r="350" fill="hsl(var(--background))" />
        <circle cx="400" cy="400" r="300" stroke="hsl(var(--border))" strokeWidth="1" fill="none" strokeDasharray="10, 10" />
        <circle cx="400" cy="400" r="200" stroke="hsl(var(--border))" strokeWidth="1" fill="none" strokeDasharray="5, 15" />


        {/* Main graph line */}
        <path 
            d="M150 600 C 250 500, 300 300, 400 350 C 500 400, 550 200, 650 250"
            stroke="url(#signup-grad1)"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            filter="url(#glow)"
        />

        {/* Data points */}
        <circle cx="150" cy="600" r="15" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="4" />
        <circle cx="400" cy="350" r="15" fill="hsl(var(--background))" stroke="hsl(var(--accent))" strokeWidth="4" />
        <circle cx="650" cy="250" r="15" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="4" />

        {/* Connecting lines */}
        <line x1="150" y1="600" x2="400" y2="350" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="2,2" />
        <line x1="400" y1="350" x2="650" y2="250" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="2,2" />
        
        {/* Floating elements */}
        <rect x="100" y="200" width="50" height="50" rx="10" fill="hsl(var(--primary))" opacity="0.3" transform="rotate(20 125 225)"/>
        <rect x="650" y="550" width="80" height="80" rx="15" fill="hsl(var(--accent))" opacity="0.3" transform="rotate(-30 690 590)"/>

      </svg>
    </div>
  );
}
