'use client';

import React, { useRef, useState } from 'react';
import { X, Upload, Loader2, GitCompareArrows, Sparkles, FileText } from 'lucide-react';

export function RevisionModal({
  isOpen, onClose, onIngest, onUseDemo, isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onIngest: (script: string) => void;
  onUseDemo?: () => void;
  isLoading?: boolean;
}) {
  const [script, setScript] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  if (!isOpen) return null;

  const onFile = (f?: File) => { if (f) f.text().then(setScript); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
      <div className="card w-full max-w-xl overflow-hidden shadow-2xl animate-fade-up">
        <div className="panel-head">
          <span className="eyebrow flex items-center gap-1.5"><GitCompareArrows size={13} className="text-gold" /> Ingest revision</span>
          <button onClick={onClose} className="p-1 rounded text-faint hover:text-ivory"><X size={15} /></button>
        </div>
        <div className="p-5 space-y-3.5">
          <p className="text-[13px] text-dim leading-relaxed">
            Paste or upload the revised draft. CLEARCUT diffs it against your baseline and surfaces only the changes that affect clearance, then walks you through each one.
          </p>

          {onUseDemo && (
            <button onClick={onUseDemo} disabled={isLoading}
              className="w-full flex items-center gap-2.5 rounded-lg border border-gold/30 bg-gold/[0.07] px-3.5 py-2.5 text-left hover:bg-gold/10 transition disabled:opacity-50">
              <Sparkles size={15} className="text-gold shrink-0" />
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-ivory">Use the demo revision · Pink Draft v8</span>
                <span className="block text-[11.5px] text-dim">Bean House → Northstar Coffee, and two more clearance changes.</span>
              </span>
            </button>
          )}

          <div>
            <div className="flex items-center justify-between">
              <label className="eyebrow">Revised screenplay</label>
              <button onClick={() => fileRef.current?.click()} className="text-[11px] font-medium text-gold flex items-center gap-1 hover:underline">
                <Upload size={11} /> Upload .txt / .fountain
              </button>
              <input ref={fileRef} type="file" accept=".txt,.fountain,.fdx,text/plain" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </div>
            <textarea value={script} onChange={(e) => setScript(e.target.value)} rows={9}
              placeholder={'INT. COFFEE SHOP - DAY\n\n(the revised scene...)'}
              className="mt-1.5 w-full rounded-[5px] border border-line bg-[color:var(--input-bg)] px-3 py-2.5 text-[13px] font-mono text-ivory outline-none focus:border-gold/50 transition resize-none leading-relaxed" />
            <p className="mt-1 text-[11px] text-faint flex items-center gap-1"><FileText size={11} /> Diffed against the current baseline draft for this production.</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button onClick={() => onIngest(script)} disabled={isLoading || !script.trim()} className="btn btn-primary">
              {isLoading ? <><Loader2 size={14} className="animate-spin" /> Diffing…</> : <><GitCompareArrows size={14} /> Diff revision</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RevisionModal;
