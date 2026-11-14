import React from 'react';

interface PlutoLogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
  versionBadge?: string;
}

export const PlutoLogo: React.FC<PlutoLogoProps> = ({
  className = '',
  size = 28,
  showWordmark = false,
  versionBadge,
}) => {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Planetary Orbit SVG Emblem */}
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]"
        >
          <defs>
            {/* Core dwarf planet gradient */}
            <linearGradient id="plutoPlanetGrad" x1="15%" y1="10%" x2="85%" y2="90%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="40%" stopColor="#6366f1" />
              <stop offset="85%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>

            {/* Atmosphere Ring Gradient */}
            <linearGradient id="plutoRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.1" />
            </linearGradient>

            {/* Orbital Dust Glow */}
            <radialGradient id="plutoGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#4f46e5" stopOpacity="0.1" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Ambient Glow Aura */}
          <circle cx="50" cy="50" r="46" fill="url(#plutoGlow)" />

          {/* Outer Orbital Ring (Tilted elliptical orbit of Pluto) */}
          <ellipse
            cx="50"
            cy="50"
            rx="44"
            ry="16"
            transform="rotate(-25 50 50)"
            stroke="url(#plutoRingGrad)"
            strokeWidth="3.2"
            strokeDasharray="90 8 12 8"
          />

          {/* Dwarf Planet Core Sphere */}
          <circle cx="50" cy="50" r="28" fill="url(#plutoPlanetGrad)" />

          {/* Atmospheric Crescent Shadow */}
          <circle
            cx="50"
            cy="50"
            r="28"
            fill="black"
            opacity="0.3"
            mask="url(#shadowMask)"
          />

          {/* Inner Stylized 'P' Monogram */}
          <path
            d="M44 33 H54 C58.5 33 62 36.5 62 41 C62 45.5 58.5 49 54 49 H44 V67"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M44 49 H54 C58.5 49 62 45.5 62 41 C62 36.5 58.5 33 54 33 H44"
            fill="white"
            fillOpacity="0.25"
          />

          {/* Orbital Satellite Node */}
          <circle
            cx="84"
            cy="36"
            r="3.5"
            fill="#38bdf8"
            className="animate-pulse"
          />
        </svg>
      </div>

      {/* Wordmark and Version Badge */}
      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-extrabold tracking-tight text-white text-sm bg-gradient-to-r from-cyan-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
              PLUTO
            </span>
            <span className="text-[11px] font-bold text-cyan-400 font-mono tracking-wider">
              OS
            </span>
            {versionBadge && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-mono font-medium">
                {versionBadge}
              </span>
            )}
          </div>
          <span className="text-[9px] text-slate-400 font-medium tracking-wide mt-0.5">
            Kernel 6.12 RT · Zero-Knowledge
          </span>
        </div>
      )}
    </div>
  );
};
