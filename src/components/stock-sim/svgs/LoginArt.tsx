import React from 'react';

export function LoginArt() {
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
          <linearGradient id="login-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="login-grad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'hsl(var(--secondary-foreground))', stopOpacity: 0.1 }} />
            <stop offset="100%" style={{ stopColor: 'hsl(var(--secondary-foreground))', stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        
        {/* Background Grid */}
        <path d="M0 400 L800 400 M400 0 L400 800" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="5,5" />
        <path d="M200 0 L200 800 M600 0 L600 800 M0 200 L800 200 M0 600 L800 600" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="2,8"/>

        {/* Abstract shapes */}
        <rect x="150" y="250" width="100" height="300" fill="url(#login-grad2)" rx="20" transform="rotate(-15 200 400)" />
        <rect x="280" y="200" width="80" height="400" fill="hsl(var(--primary))" opacity="0.7" rx="20" transform="rotate(-15 320 400)" />
        <rect x="400" y="150" width="120" height="500" fill="url(#login-grad1)" rx="20" transform="rotate(-15 460 400)" />
        <rect x="550" y="220" width="60" height="360" fill="hsl(var(--accent))" opacity="0.6" rx="20" transform="rotate(-15 580 400)" />

        {/* Floating circles */}
        <circle cx="100" cy="150" r="30" fill="hsl(var(--primary))" opacity="0.5" />
        <circle cx="700" cy="650" r="40" fill="hsl(var(--accent))" opacity="0.6" />
        <circle cx="650" cy="100" r="20" fill="url(#login-grad1)" opacity="0.8" />
        <circle cx="200" cy="700" r="15" fill="hsl(var(--primary))" opacity="0.7" />
      </svg>
    </div>
  );
}
