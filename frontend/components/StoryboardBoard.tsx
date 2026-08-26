'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Wand2, Image as ImageIcon } from 'lucide-react';
import { getBoard, generateBoardFrame, generateBoardAll, BoardScene } from '../lib/api';
import { AssetLightbox } from './AssetLightbox';

function catColor(cat: string): string {
  if (['TRADEMARK', 'BUSINESS_OR_ORGANIZATION', 'PRODUCT'].includes(cat)) return 'gold';
  if (['MUSIC', 'ARTWORK', 'COPYRIGHT', 'FOOTAGE_OR_ARCHIVAL_MEDIA'].includes(cat)) return 'info';
  if (['PERSON_OR_LIKENESS', 'DEFAMATION_REVIEW'].includes(cat)) return 'critical';
  if (['LOCATION_OR_SIGNAGE', 'OFFICIAL_SYMBOL'].includes(cat)) return 'cleared';
  return 'dim';
}

export function StoryboardBoard({ onOpenCase, refreshKey }: { onOpenCase: (id: string) => void; refreshKey?: string | number }) {
  const [scenes, setScenes] = useState<BoardScene[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; label?: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    getBoard().then((d) => setScenes(d.scenes)).finally(() => setLoading(false));
  }, [refreshKey]);

  const genAll = async () => {
    setBusy('all');
    try { const d = await generateBoardAll(); setScenes(d.scenes); } catch (e) { console.error(e); } finally { setBusy(null); }
  };
  const genOne = async (i: number) => {
    setBusy(String(i));
    try { const f = await generateBoardFrame(i); setScenes((p) => p.map((s) => (s.index === i ? { ...s, frame_url: f.url, status: f.status } : s))); }
    catch (e) { console.error(e); } finally { setBusy(null); }
  };

  const generated = scenes.filter((s) => s.frame_url).length;

  return (
    <div className="h-full flex flex-col canvas-bg">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-ink2 border-b border-line">
        <span className="eyebrow flex items-center gap-1.5"><ImageIcon size={12} className="text-gold" /> Storyboard · {generated}/{scenes.length} frames</span>
        <button onClick={genAll} disabled={!!busy || scenes.length === 0 || generated === scenes.length} className="btn btn-primary py-1.5 px-3 text-[12.5px]">
          {busy === 'all' ? <><Loader2 size={13} className="animate-spin" /> Generating board…</> : <><Wand2 size={13} /> Generate all</>}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="h-full flex items-center justify-center text-dim"><Loader2 size={18} className="animate-spin" /></div>
        ) : scenes.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="max-w-sm text-[13px] text-dim">No screenplay for this project yet. Create a project from a script to storyboard its scenes.</p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {scenes.map((sc) => {
              const isBusy = busy === String(sc.index);
              return (
                <div key={sc.index} className="card overflow-hidden animate-fade-up">
                  <div className="relative aspect-video bg-ink2 flex items-center justify-center">
                    {sc.frame_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img onClick={() => setLightbox({ url: sc.frame_url!, label: sc.heading })} src={sc.frame_url} alt={sc.heading} className="h-full w-full object-cover cursor-pointer" />
                    ) : (
                      <button onClick={() => genOne(sc.index)} disabled={!!busy} className="flex flex-col items-center gap-1.5 text-faint hover:text-gold transition disabled:opacity-50">
                        {isBusy ? <Loader2 size={20} className="animate-spin text-gold" /> : <><Wand2 size={18} /><span className="text-[12px] font-medium">Generate frame</span></>}
                      </button>
                    )}
                    {isBusy && sc.frame_url && <div className="absolute inset-0 bg-ink/70 flex items-center justify-center"><Loader2 size={18} className="animate-spin text-gold" /></div>}
                    {sc.flags.length > 0 && (
                      <div className="absolute top-2 left-2 flex gap-1">
                        {sc.flags.slice(0, 5).map((f) => (
                          <span key={f.case_id} title={f.name} className="h-2.5 w-2.5 rounded-full ring-1 ring-black/40" style={{ background: `var(--${catColor(f.category)})` }} />
                        ))}
                      </div>
                    )}
                    <span className="absolute top-2 right-2 text-[10px] font-mono text-white/85 bg-black/50 rounded px-1.5 py-0.5">#{sc.index + 1}</span>
                  </div>
                  <div className="px-3 py-2.5">
                    <div className="text-[13.5px] font-semibold text-ivory truncate">{sc.heading}</div>
                    {sc.flags.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {sc.flags.map((f) => (
                          <button key={f.case_id} onClick={() => onOpenCase(f.case_id)} title={`Open ${f.case_id}`}
                            className="text-[11.5px] px-1.5 py-0.5 rounded border hover:brightness-125 transition"
                            style={{ color: `var(--${catColor(f.category)})`, borderColor: `color-mix(in oklab, var(--${catColor(f.category)}) 40%, transparent)` }}>
                            {f.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-1 text-[11px] text-faint">No clearance elements</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <AssetLightbox url={lightbox?.url ?? null} label={lightbox?.label} onClose={() => setLightbox(null)} />
    </div>
  );
}

export default StoryboardBoard;
