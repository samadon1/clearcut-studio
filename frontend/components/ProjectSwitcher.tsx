'use client';

import React, { useState } from 'react';
import { ChevronDown, Plus, Check } from 'lucide-react';
import { listProjects, ProjectSummaryItem } from '../lib/api';
import { Logo } from './Logo';

export function ProjectSwitcher({
  title, onSwitch, onNewProject, onHome,
}: {
  title: string;
  onSwitch: (id: string) => void;
  onNewProject: () => void;
  onHome: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectSummaryItem[]>([]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) listProjects().then(setProjects);
  };

  return (
    <div className="relative flex items-center gap-2.5">
      <button onClick={onHome} title="Go to home" className="shrink-0 rounded-md hover:brightness-110 transition">
        <Logo size={28} radius={6} />
      </button>
      <button onClick={toggle} className="flex items-center gap-1 pr-1 group text-left">
        <div className="leading-none">
          <div className="flex items-center gap-1">
            <span className="text-[15px] font-bold text-ivory tracking-tight group-hover:text-gold transition-colors">{title}</span>
            <ChevronDown size={14} className="text-faint" />
          </div>
          <div className="text-[12px] text-faint mt-0.5">Clearance workspace</div>
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 z-50 w-64 card shadow-2xl p-1.5 animate-fade-up">
            <div className="px-2 py-1 eyebrow">Productions</div>
            {projects.map((p) => (
              <button key={p.id} onClick={() => { setOpen(false); if (!p.active) onSwitch(p.id); }}
                className="w-full flex items-center gap-2 rounded-md px-2 py-2 hover:bg-panel2 text-left transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-ivory truncate">{p.title}</div>
                  <div className="text-[11px] text-faint">{p.elements} element{p.elements !== 1 ? 's' : ''} · {p.readiness}%{p.is_custom ? '' : ' · demo'}</div>
                </div>
                {p.active && <Check size={14} className="text-gold shrink-0" />}
              </button>
            ))}
            <div className="my-1 border-t border-line" />
            <button onClick={() => { setOpen(false); onNewProject(); }}
              className="w-full flex items-center gap-2 rounded-md px-2 py-2 hover:bg-panel2 text-[12.5px] text-dim hover:text-ivory transition-colors">
              <Plus size={14} className="text-gold" /> New project
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ProjectSwitcher;
