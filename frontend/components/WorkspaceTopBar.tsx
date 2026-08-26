'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon, GitCompareArrows, ScrollText, UserPlus, X } from 'lucide-react';
import { AvatarStack, Avatar } from './Avatar';
import { ProjectSwitcher } from './ProjectSwitcher';
import { useTeam, memberById } from '../lib/team';

function ReadinessRing({ pct }: { pct: number }) {
  const size = 32, stroke = 3, r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const off = circ * (1 - clamped / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} title={`Clearance readiness ${pct}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--gold)" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset .5s ease' }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-ivory tabular">{pct}</span>
    </div>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState<string>('dark');
  useEffect(() => { setTheme(document.documentElement.getAttribute('data-theme') || 'dark'); }, []);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('cc-theme', next); } catch { /* ignore */ }
  };
  return (
    <button onClick={toggle} title="Toggle theme" className="p-2 rounded-md text-faint hover:text-ivory hover:bg-panel2 transition">
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

export function WorkspaceTopBar({
  title, readiness, openCount, onSignOff, onIngestRevision, onInvite, onSwitchProject, onNewProject, onHome,
  filterAssignee, onFilterAssignee, onClearFilter,
}: {
  title: string;
  subtitle?: string;
  readiness: number;
  openCount: number;
  onSignOff: () => void;
  onIngestRevision: () => void;
  onInvite?: () => void;
  onSwitchProject: (id: string) => void;
  onNewProject: () => void;
  onHome: () => void;
  filterAssignee?: string | null;
  onFilterAssignee?: (id: string) => void;
  onClearFilter?: () => void;
}) {
  const team = useTeam();
  const allClear = openCount === 0;
  const filtered = filterAssignee ? memberById(filterAssignee) : undefined;
  return (
    <header className="shrink-0 h-12 border-b border-line bg-ink2 flex items-center gap-3 px-3">
      <ProjectSwitcher title={title} onSwitch={onSwitchProject} onNewProject={onNewProject} onHome={onHome} />

      <div className="ml-auto flex items-center gap-3">
        {filtered && (
          <button onClick={onClearFilter}
            className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 pl-1 pr-2 py-0.5 text-[12px] text-ivory hover:bg-gold/15 transition group">
            <Avatar id={filtered.id} size={18} ring={false} />
            <span>Filtered by <span className="font-semibold">{filtered.name.split(' ')[0]}</span></span>
            <X size={13} className="text-faint group-hover:text-ivory" />
          </button>
        )}
        {team.length > 0 && (
          <div className="flex items-center gap-1.5">
            <AvatarStack members={team} size={24} onAvatarClick={onFilterAssignee} activeId={filterAssignee} />
            <button onClick={onInvite} title="Add team member"
              className="h-6 w-6 rounded-full border border-dashed border-line2 text-faint hover:text-ivory hover:border-ivory/40 flex items-center justify-center transition">
              <UserPlus size={12} />
            </button>
          </div>
        )}
        <div className="h-6 w-px bg-line" />
        <button onClick={onIngestRevision} className="btn btn-ghost py-1.5 px-3 text-[13.5px]">
          <GitCompareArrows size={15} /> Ingest revision
        </button>
        <div className="flex items-center gap-2">
          <div className="text-[11px] uppercase tracking-wider text-faint font-semibold">Readiness</div>
          <ReadinessRing pct={readiness} />
        </div>
        <div className="h-6 w-px bg-line" />
        <ThemeToggle />
        <button onClick={onSignOff} disabled={!allClear}
          className={`btn text-[13.5px] ${allClear ? 'btn-primary' : 'btn-ghost opacity-45 cursor-not-allowed'}`}>
          <ScrollText size={15} /> Sign off &amp; memo
        </button>
      </div>
    </header>
  );
}

export default WorkspaceTopBar;
