import React from 'react';

interface QuiloMascotProps {
  className?: string;
  size?: number | string;
  isScanning?: boolean;
}

export const QuiloMascot: React.FC<QuiloMascotProps> = ({
  className = '',
  size = 120,
  isScanning = false,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 320 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full drop-shadow-sm ${isScanning ? 'animate-[quiloFloat_3s_ease-in-out_infinite]' : ''}`}
      >
        <defs>
          {/* Laser scanning gradient */}
          <linearGradient id="laserBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFC04D" stopOpacity="0" />
            <stop offset="25%" stopColor="#FFC04D" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="75%" stopColor="#5B8DEF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#5B8DEF" stopOpacity="0" />
          </linearGradient>

          {/* Aperture glow filter */}
          <radialGradient id="apertureGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#5B8DEF" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#FFC04D" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1E2A3A" stopOpacity="0" />
          </radialGradient>

          <filter id="laserGlow" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="goldenAura" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <style>
          {`
            @keyframes quiloFloat {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-7px); }
            }
            @keyframes scanSweep {
              0% { transform: translateY(-38px); opacity: 0.3; }
              50% { transform: translateY(38px); opacity: 1; }
              100% { transform: translateY(-38px); opacity: 0.3; }
            }
            @keyframes radarRing {
              0% { r: 18px; opacity: 0.8; stroke-width: 2.5px; }
              100% { r: 52px; opacity: 0; stroke-width: 0.5px; }
            }
            @keyframes antennaBlink {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 0.9; transform: scale(1.25); }
            }
            @keyframes sparkleGlint {
              0%, 100% { opacity: 0.2; transform: scale(0.8); }
              50% { opacity: 1; transform: scale(1.2); }
            }
          `}
        </style>

        {/* Antenna */}
        <g id="antenna">
          <path
            d="M160 88V50"
            stroke="#5B8DEF"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Yellow sphere atop antenna */}
          <circle cx="160" cy="42" r="20" fill="#FFC04D" />
          {/* Subtle light reflection on yellow sphere */}
          <circle cx="154" cy="36" r="6" fill="#FFE799" opacity="0.6" />

          {/* Active scanning golden antenna pulse */}
          {isScanning && (
            <circle
              cx="160"
              cy="42"
              r="28"
              fill="#FFC04D"
              opacity="0.4"
              filter="url(#goldenAura)"
              className="origin-[160px_42px] animate-[antennaBlink_2s_ease-in-out_infinite]"
            />
          )}
        </g>

        {/* Feet / Legs */}
        <g id="feet">
          <rect
            x="112"
            y="245"
            width="34"
            height="32"
            rx="17"
            fill="#4874D6"
          />
          <rect
            x="174"
            y="245"
            width="34"
            height="32"
            rx="17"
            fill="#4874D6"
          />
        </g>

        {/* Left Arm (viewer's left) */}
        <g id="left-arm">
          <path
            d="M80 180C58 180 44 200 48 222C52 242 74 250 88 238C98 228 98 196 80 180Z"
            fill="#5B8DEF"
          />
        </g>

        {/* Main Body */}
        <circle cx="160" cy="175" r="95" fill="#5B8DEF" />

        {/* Center Eye / Camera Lens */}
        <g id="camera-eye" className="relative">
          {/* White outer frame of lens */}
          <circle cx="160" cy="175" r="68" fill="#FFFFFF" />

          {/* Dark Charcoal camera aperture / lens */}
          <circle cx="160" cy="175" r="54" fill="#1E2A3A" />

          {/* Radar ripple rings when scanning */}
          {isScanning && (
            <g id="radar-ripples">
              <circle
                cx="160"
                cy="175"
                r="52"
                fill="url(#apertureGlow)"
              />
              <circle
                cx="160"
                cy="175"
                r="30"
                stroke="#FFC04D"
                fill="none"
                className="animate-[radarRing_2.4s_cubic-bezier(0.2,0.8,0.2,1)_infinite]"
              />
              <circle
                cx="160"
                cy="175"
                r="30"
                stroke="#5B8DEF"
                fill="none"
                style={{ animationDelay: '1.2s' }}
                className="animate-[radarRing_2.4s_cubic-bezier(0.2,0.8,0.2,1)_infinite]"
              />
            </g>
          )}

          {/* Camera lens reflections (shine) */}
          <ellipse
            cx="140"
            cy="155"
            rx="16"
            ry="19"
            transform="rotate(-25 140 155)"
            fill="#FFFFFF"
          />
          <circle cx="127" cy="183" r="7" fill="#FFFFFF" />

          {/* Sweeping laser scan beam */}
          {isScanning && (
            <g id="laser-sweep" clipPath="url(#lensClip)">
              <clipPath id="lensClip">
                <circle cx="160" cy="175" r="52" />
              </clipPath>
              {/* Vertical laser line sweeping smoothly up and down */}
              <g className="animate-[scanSweep_2.2s_ease-in-out_infinite]">
                <line
                  x1="110"
                  y1="175"
                  x2="210"
                  y2="175"
                  stroke="url(#laserBeamGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter="url(#laserGlow)"
                />
                {/* Center glint on laser line */}
                <circle cx="160" cy="175" r="3.5" fill="#FFFFFF" filter="url(#laserGlow)" />
              </g>
            </g>
          )}
        </g>

        {/* Revision sheet held in right hand */}
        <g id="revision-sheet" transform="rotate(12 250 195)">
          {/* Sheet background with rounded corners */}
          <rect
            x="195"
            y="125"
            width="82"
            height="105"
            rx="14"
            fill="#FFFFFF"
            stroke="#E1E7F0"
            strokeWidth="3"
          />
          {/* Sheet text lines (revision content) */}
          <rect x="212" y="152" width="48" height="7" rx="3.5" fill="#1E2A3A" />
          <rect x="212" y="168" width="52" height="7" rx="3.5" fill="#1E2A3A" />
          <rect x="212" y="184" width="38" height="7" rx="3.5" fill="#1E2A3A" />

          {/* Sparkles on sheet while scanning */}
          {isScanning && (
            <g id="sheet-sparkles">
              <circle
                cx="210"
                cy="138"
                r="3"
                fill="#FFC04D"
                className="animate-[sparkleGlint_1.5s_ease-in-out_infinite]"
              />
              <circle
                cx="262"
                cy="210"
                r="2.5"
                fill="#5B8DEF"
                style={{ animationDelay: '0.7s' }}
                className="animate-[sparkleGlint_1.5s_ease-in-out_infinite]"
              />
            </g>
          )}
        </g>

        {/* Right Arm / Hand holding sheet (viewer's right) */}
        <g id="right-hand">
          <circle cx="270" cy="216" r="18" fill="#4874D6" />
        </g>
      </svg>
    </div>
  );
};
