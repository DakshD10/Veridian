import React from 'react';

export function Logo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vd-arc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#8B2EF0" />
          <stop offset="40%"  stopColor="#00BFFF" />
          <stop offset="100%" stopColor="#00F5A0" />
        </linearGradient>
        <linearGradient id="vd-v" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#A855F7" />
          <stop offset="50%"  stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#00F5A0" />
        </linearGradient>
        <radialGradient id="vd-inner" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#1A1035" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0B0F14" stopOpacity="0.6" />
        </radialGradient>
        <filter id="vd-glow-soft">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="vd-glow-hard">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="200" height="200" rx="36" fill="#0B0F14" />

      {/* Hex interior fill with depth */}
      <polygon
        points="100,22 169,61 169,139 100,178 31,139 31,61"
        fill="url(#vd-inner)"
      />

      {/* Hex glow halo */}
      <polygon
        points="100,22 169,61 169,139 100,178 31,139 31,61"
        fill="none"
        stroke="url(#vd-arc)"
        strokeWidth="6"
        filter="url(#vd-glow-soft)"
        opacity="0.7"
      />

      {/* Hex border — crisp top layer */}
      <polygon
        points="100,22 169,61 169,139 100,178 31,139 31,61"
        fill="none"
        stroke="url(#vd-arc)"
        strokeWidth="2.5"
      />

      {/* Vertex nodes — glowing outer ring */}
      {([
        [100, 22], [169, 61], [169, 139],
        [100, 178], [31, 139], [31, 61],
      ] as [number, number][]).map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={5.5} fill="url(#vd-arc)" filter="url(#vd-glow-hard)" />
          <circle cx={cx} cy={cy} r={3}   fill="#FFFFFF" opacity={0.9} />
        </g>
      ))}

      {/* V mark — soft bloom layer */}
      <path
        d="M74 82 L100 128 L126 82"
        stroke="url(#vd-v)"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#vd-glow-soft)"
        opacity="0.5"
      />

      {/* V mark — crisp top layer */}
      <path
        d="M74 82 L100 128 L126 82"
        stroke="url(#vd-v)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Terminal dot — green anchor */}
      <circle cx="100" cy="128" r="6"   fill="#00F5A0" filter="url(#vd-glow-hard)" />
      <circle cx="100" cy="128" r="3.5" fill="#FFFFFF" opacity="0.95" />
    </svg>
  );
}