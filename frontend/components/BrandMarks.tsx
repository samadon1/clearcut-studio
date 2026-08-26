'use client';

import React from 'react';

/**
 * Brand marks for the "powered by" lockup.
 * The Gemini spark is rendered faithfully; the Parallel mark is a clean placeholder.
 * To use the official logos, drop `gemini.svg` / `parallel.svg` into `/public` and
 * swap these inline SVGs for <img src="/gemini.svg" .../>.
 */

export function GeminiMark({ size = 13 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img src="/gemini.png" alt="Gemini" width={size} height={size}
      className="shrink-0 object-contain" style={{ width: size, height: size }} />
  );
}

export function ParallelMark({ size = 12 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img src="/parallel.png" alt="Parallel" width={size} height={size}
      className="shrink-0 rounded-[3px] object-contain" style={{ width: size, height: size }} />
  );
}

export function PoweredBy({
  className = '', showLabel = true, compact = false,
}: {
  className?: string; showLabel?: boolean; compact?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {showLabel && <span className="text-faint">powered by</span>}
      <span className="inline-flex items-center gap-1">
        <GeminiMark size={compact ? 12 : 13} />
        <span className="font-medium text-dim">Gemini</span>
      </span>
      <span className="text-line2">·</span>
      <span className="inline-flex items-center gap-1 text-dim">
        <ParallelMark size={compact ? 11 : 12} />
        <span className="font-medium">Parallel</span>
      </span>
    </span>
  );
}

export default PoweredBy;
