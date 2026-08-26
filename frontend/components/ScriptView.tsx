'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, FileText } from 'lucide-react';
import { getScript, ScriptMention } from '../lib/api';

function catColor(cat: string): string {
  if (['TRADEMARK', 'BUSINESS_OR_ORGANIZATION', 'PRODUCT'].includes(cat)) return 'gold';
  if (['MUSIC', 'ARTWORK', 'COPYRIGHT', 'FOOTAGE_OR_ARCHIVAL_MEDIA'].includes(cat)) return 'info';
  if (['PERSON_OR_LIKENESS', 'DEFAMATION_REVIEW'].includes(cat)) return 'critical';
  if (['LOCATION_OR_SIGNAGE', 'OFFICIAL_SYMBOL'].includes(cat)) return 'cleared';
  return 'dim';
}
function catLabel(c: string) { return c.replace(/_/g, ' ').toLowerCase(); }

export function ScriptView({
  onOpenCase, refreshKey,
}: {
  onOpenCase: (caseId: string) => void;
  refreshKey?: string | number;
}) {
  const [data, setData] = useState<{ script_text: string | null; mentions: ScriptMention[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [flashId, setFlashId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    getScript().then((d) => setData(d)).catch(() => setData({ script_text: null, mentions: [] })).finally(() => setLoading(false));
  }, [refreshKey]);

  const jumpTo = (entityId: string) => {
    const el = document.getElementById(`mention-${entityId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlashId(entityId);
    setTimeout(() => setFlashId(null), 1400);
  };

  const nodes = useMemo(() => {
    const text = data?.script_text ?? '';
    const mentions = data?.mentions ?? [];
    if (!text) return null;
    const lower = text.toLowerCase();
    const matches: { start: number; end: number; m: ScriptMention }[] = [];
    for (const m of mentions) {
      if (!m.quote) continue;
      const idx = lower.indexOf(m.quote.toLowerCase());
      if (idx >= 0) matches.push({ start: idx, end: idx + m.quote.length, m });
    }
    matches.sort((a, b) => a.start - b.start);
    const kept: typeof matches = [];
    let lastEnd = -1;
    for (const mt of matches) { if (mt.start >= lastEnd) { kept.push(mt); lastEnd = mt.end; } }

    const out: React.ReactNode[] = [];
    let cursor = 0;
    kept.forEach((mt, i) => {
      if (mt.start > cursor) out.push(text.slice(cursor, mt.start));
      const cv = catColor(mt.m.category);
      out.push(
        <mark
          key={`m-${i}`}
          id={`mention-${mt.m.entity_id}`}
          onClick={() => mt.m.case_id && onOpenCase(mt.m.case_id)}
          title={`${mt.m.name} · ${catLabel(mt.m.category)}`}
          className={`rounded-[3px] px-0.5 cursor-pointer transition-shadow ${flashId === mt.m.entity_id ? 'ring-2 ring-gold' : ''}`}
          style={{ backgroundColor: `color-mix(in oklab, var(--${cv}) 20%, transparent)`, borderBottom: `1.5px solid var(--${cv})`, color: 'var(--ivory)' }}
        >
          {text.slice(mt.start, mt.end)}
        </mark>
      );
      cursor = mt.end;
    });
    if (cursor < text.length) out.push(text.slice(cursor));
    return out;
  }, [data, flashId, onOpenCase]);

  const mentions = data?.mentions ?? [];

  return (
    <div className="h-full grid grid-cols-[280px_1fr] canvas-bg">
      {/* rail: elements */}
      <aside className="min-h-0 overflow-y-auto border-r border-line bg-ink">
        <div className="panel-head sticky top-0 z-10">
          <span className="eyebrow">Clearance elements</span>
          <span className="text-[10.5px] font-semibold text-dim tabular">{mentions.length}</span>
        </div>
        <div className="p-2 space-y-0.5">
          {mentions.length === 0 && (
            <p className="px-2 py-3 text-[12px] text-faint">No linked elements in this script yet.</p>
          )}
          {mentions.map((m) => {
            const cv = catColor(m.category);
            return (
              <button key={m.entity_id} onClick={() => jumpTo(m.entity_id)}
                className="w-full text-left rounded-md px-2.5 py-2 hover:bg-panel/60 transition-colors group">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: `var(--${cv})` }} />
                  <span className="text-[14.5px] font-semibold text-ivory truncate">{m.name}</span>
                </div>
                <div className="mt-0.5 pl-4 text-[12.5px] text-faint">{catLabel(m.category)} · {m.scene?.split(' - ')[0]}</div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* script */}
      <main className="min-h-0 flex flex-col">
        <div className="panel-head">
          <span className="eyebrow flex items-center gap-1.5"><FileText size={12} className="text-gold" /> Screenplay</span>
          <span className="eyebrow">click a highlight to open its case</span>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-7">
          {loading ? (
            <div className="h-full flex items-center justify-center text-dim"><Loader2 size={18} className="animate-spin" /></div>
          ) : !data?.script_text ? (
            <div className="h-full flex items-center justify-center text-center">
              <div className="max-w-sm">
                <FileText size={22} className="text-faint mx-auto" />
                <p className="mt-2 text-[13px] text-dim">No screenplay text for this project. Create a project from a pasted or uploaded script to read it here with clearance highlights.</p>
              </div>
            </div>
          ) : (
            <pre className="max-w-4xl mx-auto font-mono text-[14.5px] leading-[1.95] text-dim whitespace-pre-wrap">
              {nodes}
            </pre>
          )}
        </div>
      </main>
    </div>
  );
}

export default ScriptView;
