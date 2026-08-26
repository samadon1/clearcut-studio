'use client';

import React from 'react';

/**
 * CLEARCUT mark — a clapperboard whose slate reads as a check (clear + cut).
 * Crisp at any size; brass badge with an ink glyph.
 */
export function Logo({ size = 32, radius }: { size?: number; radius?: number }) {
  const r = radius ?? Math.round(size * 0.24);
  return (
    <div
      style={{ width: size, height: size, borderRadius: r }}
      className="relative flex items-center justify-center bg-gradient-to-br from-gold to-gold-dim ring-1 ring-black/15 shadow-sm overflow-hidden"
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        {/* slate body */}
        <rect x="3.2" y="11" width="17.6" height="9.6" rx="1.6" fill="var(--btn-primary-fg)" />
        {/* clapper bar (angled) */}
        <path d="M3.2 10.2 L20.8 6.9 L20.8 10.2 Z" fill="var(--btn-primary-fg)" />
        <path d="M3.2 10.2 L20.8 6.9 L20.8 8.0 L3.2 11.3 Z" fill="var(--btn-primary-fg)" />
        {/* diagonal clapper slits */}
        <g stroke="var(--gold)" strokeWidth="0.9">
          <path d="M7.3 10.2 L8.9 7.9" />
          <path d="M11.0 9.7 L12.6 7.4" />
          <path d="M14.7 9.1 L16.3 6.8" />
        </g>
        {/* check on the slate */}
        <path d="M7.6 15.6 l2.4 2.4 l4.4 -4.6" stroke="var(--gold)" strokeWidth="1.8"
          fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default Logo;
