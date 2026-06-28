import React from 'react';

/** Atmospheric sunrise + layered mountains — minimal, not cartoon */
const HeroAdventureBackground: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
    {/* Sky: deep midnight → dawn amber */}
    <div className="absolute inset-0 bg-gradient-to-b from-midnight-950 via-midnight-900 to-[#1a2f3a]" />
    <div className="absolute inset-0 bg-gradient-to-t from-amber-900/25 via-orange-900/10 to-transparent" />
    <div
      className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-[140%] h-[45%] opacity-40"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(245,197,66,0.35) 0%, rgba(245,197,66,0.08) 35%, transparent 70%)',
      }}
    />

    <svg
      className="absolute bottom-0 left-0 w-full h-[55%]"
      viewBox="0 0 1440 400"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Distant ridge */}
      <path
        d="M0 280 L200 180 L380 240 L560 140 L740 220 L920 160 L1120 230 L1440 190 L1440 400 L0 400 Z"
        fill="#1a2535"
        opacity="0.9"
      />
      {/* Mid layer — olive tint */}
      <path
        d="M0 320 L160 240 L340 290 L520 210 L700 280 L880 230 L1080 290 L1440 260 L1440 400 L0 400 Z"
        fill="#2E482E"
        opacity="0.55"
      />
      {/* Foreground */}
      <path
        d="M0 360 L240 290 L420 330 L600 270 L780 320 L960 280 L1200 340 L1440 310 L1440 400 L0 400 Z"
        fill="#1e2e1e"
        opacity="0.85"
      />
      {/* Snow line hint */}
      <path
        d="M520 210 L540 195 L558 212 L578 198 L598 218"
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>

    {/* Mist */}
    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-midnight-950/80 to-transparent" />

    {/* Subtle grid — Linear-style polish */}
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }}
    />
  </div>
);

export default HeroAdventureBackground;
