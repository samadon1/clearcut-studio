'use client';

import React from 'react';
import {
  LayoutGrid, GitCompareArrows, Layers, Image as ImageIcon,
  Search, ScrollText, Play, RotateCcw, ChevronRight,
} from 'lucide-react';
import { ProductionSummary } from '../lib/types';

const NAV: { key: string; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Clearance Dashboard', icon: LayoutGrid },
  { key: 'revisions', label: 'Screenplay Diff', icon: GitCompareArrows },
  { key: 'propagation', label: 'Propagation Matrix', icon: Layers },
  { key: 'assets', label: 'Production Assets', icon: ImageIcon },
  { key: 'research', label: 'Parallel Evidence', icon: Search },
  { key: 'deliverables', label: 'Studio Memorandum', icon: ScrollText },
];

export function ProdifySidebar({
  activeTab,
  setActiveTab,
  summary,
  onReset,
  onStartDemoTour,
  isLoading,
}: {
  activeTab: string;
  setActiveTab: (t: string) => void;
  summary: ProductionSummary | null;
  onReset: () => void;
  onAnalyzePinkV8?: () => void;
  onStartDemoTour: () => void;
  isLoading?: boolean;
}) {
  const readiness = summary?.readiness?.readiness_percent ?? 87;
  const counsel = summary?.readiness?.counsel ?? 0;
  const review = summary?.readiness?.review ?? 0;

  return (
    <aside className="w-[248px] shrink-0 h-full flex flex-col bg-ink2 border-r border-line">
      {/* brand */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-gold flex items-center justify-center shadow-[0_2px_10px_rgba(227,180,94,0.25)]">
            <span className="text-ink font-extrabold text-[15px] tracking-tight">C</span>
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-ivory font-bold text-[15px] tracking-tight">CLEARCUT</span>
              <span className="text-[8.5px] font-bold tracking-wider text-gold/90 border border-gold/30 rounded px-1 py-[1px]">STUDIO</span>
            </div>
            <div className="text-faint text-[11px]">The Last Cup · Clearance</div>
          </div>
        </div>
      </div>

      {/* readiness meter */}
      <div className="px-4 pb-4">
        <div className="card px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] uppercase tracking-wider text-faint font-semibold">Release Readiness</span>
            <span className="text-ivory font-bold text-[13px] tabular">{readiness}%</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-line overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold transition-all duration-700" style={{ width: `${readiness}%` }} />
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px]">
            <span className="text-critical font-semibold tabular">{counsel} counsel</span>
            <span className="text-gold font-semibold tabular">{review} review</span>
          </div>
        </div>
      </div>

      {/* nav */}
      <div className="px-3">
        <div className="px-2 pb-1.5 text-[10px] uppercase tracking-[0.14em] text-faint font-semibold">Clearance Operations</div>
        <nav className="space-y-0.5">
          {NAV.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`group w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] transition-colors ${
                  active
                    ? 'bg-panel2 text-ivory font-semibold'
                    : 'text-dim hover:text-ivory hover:bg-panel/60'
                }`}
              >
                <span className={`relative flex items-center justify-center h-5 w-5 ${active ? 'text-gold' : 'text-faint group-hover:text-dim'}`}>
                  {active && <span className="absolute -left-2.5 h-4 w-[2.5px] rounded-full bg-gold" />}
                  <Icon size={16} strokeWidth={active ? 2.4 : 2} />
                </span>
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1" />

      {/* footer actions */}
      <div className="p-3 space-y-2 border-t border-line">
        <button
          onClick={onStartDemoTour}
          className="w-full flex items-center justify-between rounded-lg bg-panel border border-line px-3 py-2.5 text-[12.5px] text-ivory hover:border-line2 transition-colors"
        >
          <span className="flex items-center gap-2 font-medium">
            <Play size={13} className="text-gold" fill="currentColor" /> 3-Minute Tour
          </span>
          <ChevronRight size={14} className="text-faint" />
        </button>
        <button
          onClick={onReset}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12px] text-dim hover:text-ivory transition-colors disabled:opacity-50"
        >
          <RotateCcw size={13} /> Reset to Blue Draft v7
        </button>
      </div>
    </aside>
  );
}

export default ProdifySidebar;
