'use client';

import React, { useRef, useState } from 'react';
import { Plus, Play, Loader2, Upload, X, FileText, Clapperboard } from 'lucide-react';
import { Logo } from './Logo';
import { PoweredBy } from './BrandMarks';

export function Landing({
  onTryDemo, onCreateProject, isLoading,
}: {
  onTryDemo: () => void;
  onCreateProject: (title: string, script: string) => void;
  isLoading?: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [script, setScript] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (f?: File) => {
    if (!f) return;
    if (!title) setTitle(f.name.replace(/\.(txt|fountain|fdx)$/i, ''));
    f.text().then((t) => setScript(t));
  };

  return (
    <div className="h-screen flex flex-col canvas-bg relative overflow-hidden">
      {/* subtle frame lines */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      <div className="relative flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-xl animate-fade-up">
          <div className="mx-auto mb-10 w-full aspect-[16/10] rounded-2xl overflow-hidden border border-line shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/landing_hero.jpg" alt="Clearance for film" className="h-full w-full object-cover" />
          </div>
          <div className="flex items-center justify-center gap-3">
            <Logo size={36} />
            <h1 className="text-[32px] font-bold text-ivory tracking-tight">CLEARCUT</h1>
            <span className="text-[10px] font-bold tracking-wider text-gold border border-gold/30 rounded px-1.5 py-0.5">STUDIO</span>
          </div>
          <p className="mt-6 text-[16px] text-dim leading-[1.75] max-w-md mx-auto">
            Import a screenplay to get an AI-powered <span className="text-ivory font-medium">clearance report</span> in minutes. Every brand, artwork, song, name and location that needs clearing. Or explore with a ready-made demo.
          </p>

          <div className="mt-10 flex items-center justify-center gap-3">
            <button onClick={() => setCreateOpen(true)} className="btn btn-primary px-5 py-3 text-[15px]">
              <Plus size={17} /> Create your own project
            </button>
            <button onClick={onTryDemo} disabled={isLoading} className="btn btn-ghost px-5 py-3 text-[15px]">
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={15} />} Try with demo script
            </button>
          </div>
        </div>
      </div>

      <footer className="relative pb-7 text-center">
        <p className="inline-flex items-center justify-center gap-1.5 text-[12.5px] text-faint">
          <PoweredBy />
        </p>
      </footer>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
          <div className="card w-full max-w-xl overflow-hidden shadow-2xl animate-fade-up">
            <div className="panel-head">
              <span className="eyebrow flex items-center gap-1.5"><Clapperboard size={12} className="text-gold" /> New project</span>
              <button onClick={() => setCreateOpen(false)} className="p-1 rounded text-faint hover:text-ivory"><X size={15} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="eyebrow">Production title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Last Cup"
                  className="mt-1.5 w-full rounded-[5px] border border-line bg-[color:var(--input-bg)] px-3 py-2 text-[13px] text-ivory outline-none focus:border-gold/50 transition" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="eyebrow">Screenplay</label>
                  <button onClick={() => fileRef.current?.click()} className="text-[11px] font-medium text-gold flex items-center gap-1 hover:underline">
                    <Upload size={11} /> Upload .txt / .fountain
                  </button>
                  <input ref={fileRef} type="file" accept=".txt,.fountain,.fdx,text/plain" className="hidden"
                    onChange={(e) => onFile(e.target.files?.[0])} />
                </div>
                <textarea value={script} onChange={(e) => setScript(e.target.value)} rows={10}
                  placeholder={'INT. COFFEE SHOP - DAY\n\nMAYA sits across from JULIAN...'}
                  className="mt-1.5 w-full rounded-[5px] border border-line bg-[color:var(--input-bg)] px-3 py-2.5 text-[12.5px] font-mono text-ivory outline-none focus:border-gold/50 transition resize-none leading-relaxed" />
                <p className="mt-1 text-[11px] text-faint flex items-center gap-1"><FileText size={11} /> Paste or upload a screenplay. Fountain / plain-text scene headings (INT./EXT.) work best.</p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button onClick={() => setCreateOpen(false)} className="btn btn-ghost">Cancel</button>
                <button onClick={() => onCreateProject(title || 'Untitled Production', script)}
                  disabled={isLoading || !script.trim()} className="btn btn-primary">
                  {isLoading ? <><Loader2 size={14} className="animate-spin" /> Generating report…</> : 'Generate clearance report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Landing;
