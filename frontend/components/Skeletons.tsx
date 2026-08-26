'use client';

import React from 'react';
import { Logo } from './Logo';

/** Neutral full-screen splash shown before the app decides landing vs workspace.
 *  Prevents the landing page from flashing on refresh. */
export function BootSplash({ message = 'Reading the screenplay and building your clearance report' }: { message?: string }) {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-ink text-ivory select-none">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <Logo size={44} radius={10} />
        <div className="text-[15px] font-bold tracking-tight text-ivory/90">CLEARCUT</div>
      </div>
      <div className="mt-6 h-[3px] w-40 overflow-hidden rounded-full bg-panel2">
        <div className="h-full w-1/3 rounded-full bg-gold/70 shimmer-slide" />
      </div>
      <p className="mt-4 text-[12px] text-faint">{message}</p>
    </div>
  );
}

function Bar({ w = '100%', h = 12 }: { w?: string; h?: number }) {
  return <div className="skeleton rounded" style={{ width: w, height: h }} />;
}

/** Report/workspace content skeleton shown while a project's data loads or switches. */
export function WorkspaceSkeleton() {
  return (
    <div className="h-full flex min-h-0">
      <div className="flex-1 overflow-hidden canvas-bg">
        <div className="max-w-5xl mx-auto px-10 py-8">
          <Bar w="120px" h={10} />
          <div className="mt-3"><Bar w="240px" h={26} /></div>
          <div className="mt-3"><Bar w="380px" h={14} /></div>

          {/* stat tiles */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card px-4 py-4 space-y-3">
                <Bar w="60%" h={9} />
                <Bar w="40%" h={24} />
              </div>
            ))}
          </div>

          {/* grouped element cards */}
          <div className="mt-8 grid lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, g) => (
              <div key={g} className="space-y-2">
                <Bar w="140px" h={13} />
                <div className="card divide-y divide-line overflow-hidden">
                  {Array.from({ length: 2 }).map((_, r) => (
                    <div key={r} className="flex items-center gap-3 px-4 py-3">
                      <Bar w="40px" h={11} />
                      <div className="flex-1 space-y-1.5">
                        <Bar w="70%" h={13} />
                        <Bar w="45%" h={10} />
                      </div>
                      <div className="h-5 w-5 rounded-full skeleton" />
                      <Bar w="56px" h={18} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* activity rail */}
      <div className="w-[280px] border-l border-line bg-ink2 p-4 space-y-4 hidden xl:block">
        <Bar w="80px" h={10} />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-2.5">
            <div className="h-6 w-6 rounded-full skeleton shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Bar w="90%" h={11} />
              <Bar w="40%" h={9} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Inspector research skeleton: shimmer evidence cards while Parallel runs. */
export function ResearchSkeleton() {
  return (
    <div className="space-y-3 mt-3">
      <div className="flex items-center gap-2">
        <div className="skeleton rounded-full" style={{ width: 78, height: 20 }} />
        <div className="skeleton rounded-full" style={{ width: 96, height: 20 }} />
        <div className="skeleton rounded ml-auto" style={{ width: 52, height: 12 }} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton rounded" style={{ width: `${90 + i * 18}px`, height: 22 }} />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card px-3 py-2.5 space-y-2">
            <Bar w="35%" h={10} />
            <Bar w="80%" h={12} />
            <Bar w="100%" h={9} />
          </div>
        ))}
      </div>
      <p className="text-[11px] text-faint flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
        Searching the live web with Parallel...
      </p>
    </div>
  );
}
