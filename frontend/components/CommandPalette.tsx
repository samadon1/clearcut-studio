'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, LayoutGrid, FileText, GitCompareArrows, Image as ImageIcon,
  UserPlus, ScrollText, Home, CornerDownLeft,
} from 'lucide-react';
import { ClearanceCase } from '../lib/types';
import { titleOf } from '../lib/text';

interface Cmd {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: React.ElementType;
  run: () => void;
}

export function CommandPalette({
  open, onClose, onTab, onIngest, onAddMember, onSignOff, onHome, onOpenCase, cases,
}: {
  open: boolean;
  onClose: () => void;
  onTab: (t: 'report' | 'script' | 'review' | 'storyboard') => void;
  onIngest: () => void;
  onAddMember: () => void;
  onSignOff: () => void;
  onHome: () => void;
  onOpenCase: (id: string) => void;
  cases: ClearanceCase[];
}) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) { setQ(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 20); }
  }, [open]);

  const commands: Cmd[] = useMemo(() => {
    const act = (fn: () => void) => () => { fn(); onClose(); };
    const nav: Cmd[] = [
      { id: 'go-report', label: 'Go to Report', group: 'Navigate', icon: LayoutGrid, run: act(() => onTab('report')) },
      { id: 'go-script', label: 'Go to Script', group: 'Navigate', icon: FileText, run: act(() => onTab('script')) },
      { id: 'go-review', label: 'Go to Review', group: 'Navigate', icon: GitCompareArrows, run: act(() => onTab('review')) },
      { id: 'go-board', label: 'Go to Storyboard', group: 'Navigate', icon: ImageIcon, run: act(() => onTab('storyboard')) },
    ];
    const actions: Cmd[] = [
      { id: 'ingest', label: 'Ingest revision', group: 'Actions', icon: GitCompareArrows, run: act(onIngest) },
      { id: 'add-member', label: 'Add team member', group: 'Actions', icon: UserPlus, run: act(onAddMember) },
      { id: 'signoff', label: 'Sign off & memo', group: 'Actions', icon: ScrollText, run: act(onSignOff) },
      { id: 'home', label: 'Go to home', group: 'Actions', icon: Home, run: act(onHome) },
    ];
    const caseCmds: Cmd[] = cases.map((c) => ({
      id: `case-${c.id}`, label: titleOf(c.summary) || c.id, hint: c.id,
      group: 'Jump to element', icon: Search, run: act(() => onOpenCase(c.id)),
    }));
    return [...nav, ...actions, ...caseCmds];
  }, [cases, onTab, onIngest, onAddMember, onSignOff, onHome, onOpenCase, onClose]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return commands;
    return commands.filter((c) => (c.label + ' ' + (c.hint ?? '') + ' ' + c.group).toLowerCase().includes(term));
  }, [q, commands]);

  useEffect(() => { setSel(0); }, [q]);
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${sel}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  if (!open) return null;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); filtered[sel]?.run(); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  let lastGroup = '';
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[12vh] bg-black/55 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-xl card p-0 overflow-hidden animate-fade-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 px-4 border-b border-line">
          <Search size={16} className="text-faint shrink-0" />
          <input
            ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Search actions, pages, and elements..."
            className="flex-1 bg-transparent py-3.5 text-[14px] text-ivory placeholder:text-faint outline-none"
          />
          <kbd className="text-[10px] text-faint border border-line rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-1.5">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-[13px] text-faint">No matches.</div>
          )}
          {filtered.map((c, i) => {
            const header = c.group !== lastGroup ? c.group : null;
            lastGroup = c.group;
            const active = i === sel;
            const Icon = c.icon;
            return (
              <React.Fragment key={c.id}>
                {header && <div className="px-4 pt-2.5 pb-1 eyebrow">{header}</div>}
                <button
                  data-idx={i}
                  onMouseEnter={() => setSel(i)}
                  onClick={c.run}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                    active ? 'bg-panel2 text-ivory' : 'text-dim hover:bg-panel/50'
                  }`}
                >
                  <Icon size={15} className={active ? 'text-gold' : 'text-faint'} />
                  <span className="flex-1 text-[13.5px] truncate">{c.label}</span>
                  {c.hint && <span className="font-mono text-[10.5px] text-faint">{c.hint}</span>}
                  {active && <CornerDownLeft size={13} className="text-faint" />}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
