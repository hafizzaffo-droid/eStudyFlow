import React, { useState } from 'react';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  withGlow?: boolean;
  alt?: string;
}

const SIZE_CONFIGS = {
  xs: { box: 'w-6 h-6 rounded-lg', img: 'w-6 h-6', icon: 'w-3.5 h-3.5' },
  sm: { box: 'w-7 h-7 sm:w-8 sm:h-8 rounded-xl', img: 'w-7 h-7 sm:w-8 sm:h-8', icon: 'w-4 h-4' },
  md: { box: 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl', img: 'w-9 h-9 sm:w-10 sm:h-10', icon: 'w-5 h-5' },
  lg: { box: 'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl', img: 'w-12 h-12 sm:w-14 sm:h-14', icon: 'w-7 h-7' },
  xl: { box: 'w-16 h-16 sm:w-20 sm:h-20 rounded-3xl', img: 'w-16 h-16 sm:w-20 sm:h-20', icon: 'w-10 h-10' },
};

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'sm',
  className = '',
  withGlow = true,
  alt = 'eStudyFlow Icon',
}) => {
  const [imageError, setImageError] = useState(false);
  const cfg = SIZE_CONFIGS[size] || SIZE_CONFIGS.sm;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-[#0045F9] ${cfg.box} ${
        withGlow ? 'shadow-md shadow-[#0045F9]/25' : ''
      } ${className}`}
    >
      {!imageError ? (
        <img
          src="/768A0A14-F8B3-4B95-A605-A0DF9D6DE431.PNG"
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover object-center ${cfg.img}`}
          loading="eager"
        />
      ) : (
        /* Vector SVG fallback with official Royal Blue gradient & Academic Flow symbol */
        <div className="w-full h-full bg-gradient-to-tr from-[#0038D1] via-[#0045F9] to-[#2563EB] flex items-center justify-center text-white p-1">
          <svg viewBox="0 0 40 40" className={`${cfg.icon} text-white fill-current`} aria-hidden="true">
            {/* Mortarboard cap */}
            <path d="M 20 6 L 36 14 L 20 22 L 4 14 Z" fill="currentColor" />
            {/* Under cap */}
            <path d="M 12 18 L 12 26 C 12 29, 28 29, 28 26 L 28 18 L 20 22 Z" fill="currentColor" opacity="0.85" />
            {/* Tassel line & pearl */}
            <path d="M 33 16 C 35 20, 34 25, 31 28" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="31" cy="28" r="2" fill="#FBBF24" />
            {/* Flow wave swoop */}
            <path d="M 8 32 C 14 30, 24 35, 32 30" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.9" />
          </svg>
        </div>
      )}
    </div>
  );
};
