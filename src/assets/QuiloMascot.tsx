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
        className="w-full h-full drop-shadow-sm"
      >
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

          {/* Camera lens reflections */}
          <ellipse
            cx="140"
            cy="155"
            rx="16"
            ry="19"
            transform="rotate(-25 140 155)"
            fill="#FFFFFF"
          />
          <circle cx="127" cy="183" r="7" fill="#FFFFFF" />

          {/* Scanning animation effect if active */}
          {isScanning && (
            <g className="animate-pulse">
              <circle
                cx="160"
                cy="175"
                r="50"
                stroke="#FFC04D"
                strokeWidth="3"
                opacity="0.8"
              />
              <line
                x1="110"
                y1="175"
                x2="210"
                y2="175"
                stroke="#FFC04D"
                strokeWidth="3"
                strokeLinecap="round"
                className="animate-bounce"
              />
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
        </g>

        {/* Right Arm / Hand holding sheet (viewer's right) */}
        <g id="right-hand">
          <circle cx="270" cy="216" r="18" fill="#4874D6" />
        </g>
      </svg>
    </div>
  );
};
