'use client';

import React, { useState } from 'react';
import {
  Scale, Image as ImageIcon, FileText, Film, ShieldAlert, Package, MapPin, Tag,
  ArrowUpRight,
} from 'lucide-react';
import { ProductionSummary, ClearanceCase, CaseStatus, ClearanceCategory } from '../lib/types';
import { Avatar } from './Avatar';
import { ActivityFeed } from './ActivityFeed';
import { noDash, titleOf } from '../lib/text';

const CAT_ICON: Partial<Record<ClearanceCategory, React.ElementType>> = {
  TRADEMARK: Scale, BUSINESS_OR_ORGANIZATION: Scale, PRODUCT: Package,
  ARTWORK: ImageIcon, COPYRIGHT: FileText, MUSIC: Film,
  PERSON_OR_LIKENESS: ShieldAlert, DEFAMATION_REVIEW: ShieldAlert,
  LOCATION_OR_SIGNAGE: MapPin, OFFICIAL_SYMBOL: Tag,
};

function catLabel(c: string) { return c.replace(/_/g, ' ').toLowerCase(); }

function statusStyle(status: CaseStatus): { label: string; cls: string } {
  switch (status) {
    case 'RESOLVED': case 'CLEARED': return { label: status === 'RESOLVED' ? 'Resolved' : 'Cleared', cls: 'text-cleared border-cleared/30 bg-cleared/10' };
    case 'COUNSEL': case 'BLOCKED': return { label: status === 'COUNSEL' ? 'Counsel' : 'Blocked', cls: 'text-critical border-critical/30 bg-critical/10' };
    case 'REVIEW': return { label: 'Review', cls: 'text-gold border-gold/30 bg-gold/10' };
    default: return { label: 'Research', cls: 'text-info border-info/30 bg-info/10' };
  }
}

function Stat({ label, value, tone = 'ivory' }: { label: string; value: React.ReactNode; tone?: string }) {
  const t: Record<string, string> = { ivory: 'text-ivory', gold: 'text-gold', critical: 'text-critical', cleared: 'text-cleared' };
  return (
    <div className="card px-4 py-4">
      <div className="eyebrow">{label}</div>
      <div className={`mt-1.5 text-[30px] leading-none font-bold tabular ${t[tone]}`}>{value}</div>
    </div>
  );
}

export function ReportView({
  summary, onOpenCase, onGotoScript, refreshKey, filterAssignee,
}: {
  summary: ProductionSummary | null;
  onOpenCase: (id: string) => void;
  onGotoScript: (caseId: string) => void;
  refreshKey?: number;
  filterAssignee?: string | null;
}) {
  const allCases: ClearanceCase[] = summary?.all_cases ?? [];
  const cases: ClearanceCase[] = filterAssignee ? allCases.filter((c) => c.assignee_id === filterAssignee) : allCases;
  const [filter, setFilter] = useState<'all' | 'cleared' | 'review'>('all');

  const isCleared = (c: ClearanceCase) => c.status === 'CLEARED' || c.status === 'RESOLVED';
  const clearedN = cases.filter(isCleared).length;
  const reviewN = cases.filter((c) => c.status === 'REVIEW').length;
  const counselN = cases.filter((c) => ['COUNSEL', 'RESEARCH_REQUIRED', 'RESEARCHING', 'BLOCKED'].includes(c.status)).length;
  const flagged = cases.length - clearedN;

  const visible = cases.filter((c) =>
    filter === 'cleared' ? isCleared(c) : filter === 'review' ? !isCleared(c) : true
  );

  // group by category, order by count
  const groups = new Map<string, ClearanceCase[]>();
  for (const c of visible) {
    const g = groups.get(c.category) ?? [];
    g.push(c);
    groups.set(c.category, g);
  }
  const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

  const FILTERS: { k: 'all' | 'cleared' | 'review'; label: string; n: number }[] = [
    { k: 'all', label: 'All', n: cases.length },
    { k: 'cleared', label: 'Cleared', n: clearedN },
    { k: 'review', label: 'In review', n: flagged },
  ];

  return (
    <div className="h-full flex min-h-0">
      <div className="flex-1 overflow-y-auto canvas-bg">
      <div className="max-w-5xl mx-auto px-10 py-8 animate-fade-up">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[30px] font-bold text-ivory tracking-tight">{summary?.production?.title ?? 'Production'}</h1>
          </div>
        </div>

        {/* stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <Stat label="Elements" value={cases.length} />
          <Stat label="Cleared" value={clearedN} tone="cleared" />
          <Stat label="In review" value={reviewN} tone="gold" />
          <Stat label="Counsel / research" value={counselN} tone="critical" />
        </div>

        {/* filter */}
        <div className="mt-12 flex items-center gap-1 rounded-md bg-ink border border-line p-0.5 w-fit">
          {FILTERS.map(({ k, label, n }) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`flex items-center gap-1.5 rounded-[4px] px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                filter === k ? 'bg-panel2 text-ivory' : 'text-faint hover:text-dim'
              }`}>
              {label} <span className={`text-[11px] tabular ${filter === k ? 'text-dim' : 'opacity-70'}`}>{n}</span>
            </button>
          ))}
        </div>

        {/* grouped elements — 2-col masonry on wide screens */}
        <div className="mt-5 lg:columns-2 lg:gap-6">
          {ordered.length === 0 && (
            <div className="card px-5 py-10 text-center text-[14px] text-dim">
              {filter === 'cleared' ? 'Nothing cleared yet.' : filter === 'review' ? 'Nothing in review. Everything is cleared.' : 'No clearance elements found in this script.'}
            </div>
          )}
          {ordered.map(([cat, items]) => {
            const Icon = CAT_ICON[cat as ClearanceCategory] ?? Tag;
            return (
              <div key={cat} className="mb-6 break-inside-avoid">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} className="text-dim" />
                  <h2 className="text-[15px] font-semibold text-ivory capitalize">{catLabel(cat)}</h2>
                  <span className="text-[12.5px] text-faint tabular">{items.length}</span>
                </div>
                <div className="card divide-y divide-line overflow-hidden">
                  {items.map((c) => {
                    const st = statusStyle(c.status);
                    return (
                      <div key={c.id} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-panel2/50 transition-colors">
                        <span className="font-mono text-[11px] font-bold text-faint w-11 shrink-0">{c.id}</span>
                        <button onClick={() => onOpenCase(c.id)} className="min-w-0 flex-1 text-left">
                          <div className="text-[15.5px] font-semibold text-ivory truncate">{titleOf(c.summary)}</div>
                          <div className="text-[13px] text-faint truncate">{noDash(c.reason)}</div>
                        </button>
                        <button onClick={() => onGotoScript(c.id)} title="View in screenplay"
                          className="hidden sm:inline-flex items-center gap-1 rounded-full border border-line bg-panel2/50 pl-1.5 pr-2 py-0.5 text-[11px] text-faint hover:text-gold hover:border-gold/40 transition-colors shrink-0">
                          <FileText size={11} /> in script
                        </button>
                        <Avatar id={c.assignee_id} size={22} />
                        <span className={`pill ${st.cls} shrink-0`}>{st.label}</span>
                        <button onClick={() => onOpenCase(c.id)} className="shrink-0">
                          <ArrowUpRight size={15} className="text-faint group-hover:text-gold transition-colors" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>
      <ActivityFeed refreshKey={refreshKey} />
    </div>
  );
}

export default ReportView;
