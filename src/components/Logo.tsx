import React from 'react';

export default function Logo() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-12 h-12"
    >
      {/* Modern geometric logo design */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="logoGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      
      {/* Outer ring */}
      <circle
        cx="24"
        cy="24"
        r="22"
        stroke="url(#logoGradient)"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Inner stylized X shape representing connection */}
      <path
        d="M12 12 L36 36 M36 12 L12 36"
        stroke="url(#logoGradient)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* Connection dots at intersection points */}
      <circle cx="24" cy="24" r="3" fill="url(#logoGradient2)" />
      <circle cx="15" cy="15" r="2" fill="url(#logoGradient)" />
      <circle cx="33" cy="33" r="2" fill="url(#logoGradient)" />
      <circle cx="33" cy="15" r="2" fill="url(#logoGradient2)" />
      <circle cx="15" cy="33" r="2" fill="url(#logoGradient2)" />
      
      {/* Subtle glow effect */}
      <circle
        cx="24"
        cy="24"
        r="20"
        stroke="url(#logoGradient)"
        strokeWidth="0.5"
        fill="none"
        opacity="0.3"
      />
    </svg>
  );
}
