'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Wand2, Upload, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { listCaseAssets, generateCaseAsset, uploadCaseAsset, fixStoredAsset, CaseAsset } from '../lib/api';

export function CaseAssets({
  caseId, caseResolved, onLightbox,
}: {
  caseId: string;
  caseResolved: boolean;
  onLightbox: (url: string, label?: string) => void;
}) {
  const [assets, setAssets] = useState<CaseAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    listCaseAssets(caseId).then(setAssets).finally(() => setLoading(false));
  }, [caseId]);

  const generate = async () => {
    setBusy('generate');
    try { const a = await generateCaseAsset(caseId); setAssets((p) => [...p, a]); }
    catch (e) { console.error(e); } finally { setBusy(null); }
  };
  const onFile = async (f?: File) => {
    if (!f) return;
    setBusy('upload');
    try {
      const b64 = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(f); });
      const a = await uploadCaseAsset(caseId, 'storyboard', f.name, b64);
      setAssets((p) => [...p, a]);
    } catch (e) { console.error(e); } finally { setBusy(null); }
  };
  const fix = async (id: string) => {
    setBusy(id);
    try { const a = await fixStoredAsset(id); setAssets((p) => p.map((x) => (x.id === id ? a : x))); }
    catch (e) { console.error(e); } finally { setBusy(null); }
  };
  const fixAll = async () => {
    setBusy('all');
    try {
      for (const a of assets.filter((x) => x.status !== 'RESOLVED')) {
        const r = await fixStoredAsset(a.id);
        setAssets((p) => p.map((x) => (x.id === a.id ? r : x)));
      }
    } catch (e) { console.error(e); } finally { setBusy(null); }
  };

  const affectedCount = assets.filter((a) => a.status !== 'RESOLVED').length;
  const affected = affectedCount > 0;

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-[13.5px] font-bold text-ivory">Production assets</h3>
        {caseResolved && assets.length > 0 && (
          affected ? (
            <div className="flex items-center gap-2.5">
              <span className="text-[12px] font-semibold text-gold hidden md:inline">The script is fixed. The production isn&apos;t.</span>
              {affectedCount > 1 && (
                <button onClick={fixAll} disabled={!!busy}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11.5px] font-semibold text-gold hover:bg-gold/15 transition disabled:opacity-50">
                  {busy === 'all' ? <><Loader2 size={11} className="animate-spin" /> Fixing all…</> : <><Wand2 size={11} /> Fix all with AI</>}
                </button>
              )}
            </div>
          ) : <span className="text-[12px] font-semibold text-cleared">Production matches the script.</span>
        )}
      </div>

      {loading ? (
        <div className="card px-4 py-6 flex justify-center"><Loader2 size={16} className="animate-spin text-dim" /></div>
      ) : assets.length === 0 ? (
        <div className="card px-4 py-5 text-center">
          <ImageIcon size={20} className="text-faint mx-auto" />
          <p className="mt-2 text-[13px] text-dim leading-relaxed max-w-md mx-auto">
            No linked visual assets. Generate a storyboard from the scene, or upload one, to check whether the production carries this element.
          </p>
          <div className="mt-3.5 flex items-center justify-center gap-2">
            <button onClick={generate} disabled={!!busy} className="btn btn-primary">
              {busy === 'generate' ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><Wand2 size={14} /> Generate storyboard</>}
            </button>
            <button onClick={() => fileRef.current?.click()} disabled={!!busy} className="btn btn-ghost">
              {busy === 'upload' ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><Upload size={14} /> Upload asset</>}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {assets.map((a) => {
              const isFixing = busy === a.id;
              const resolved = a.status === 'RESOLVED';
              return (
                <div key={a.id} className="flex items-center gap-3 card px-3 py-2">
                  <button onClick={() => onLightbox(a.url, a.label)} className="h-12 w-20 rounded-md overflow-hidden bg-panel2 border border-line shrink-0 relative hover:border-line2 transition">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.url} alt={a.label} className="h-full w-full object-cover" />
                    {isFixing && <div className="absolute inset-0 bg-ink/70 flex items-center justify-center"><Loader2 size={14} className="animate-spin text-gold" /></div>}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-ivory truncate">{a.label}</div>
                    <div className="text-[11.5px] text-faint truncate">
                      {a.department}{a.detected?.length ? ` · shows ${a.detected[0]}` : ''}
                    </div>
                  </div>
                  {resolved ? (
                    <span className="pill text-cleared border-cleared/30 bg-cleared/10"><CheckCircle2 size={11} /> Updated</span>
                  ) : caseResolved ? (
                    <button onClick={() => fix(a.id)} disabled={!!busy}
                      className="inline-flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-2.5 py-1.5 text-[12px] font-semibold text-gold hover:bg-gold/15 transition disabled:opacity-50">
                      {isFixing ? <><Loader2 size={12} className="animate-spin" /> Regenerating…</> : <><Wand2 size={12} /> Fix with AI</>}
                    </button>
                  ) : (
                    <span className="pill text-gold border-gold/30 bg-gold/10">Shows element</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2.5 flex items-center gap-3 text-[12px]">
            <button onClick={generate} disabled={!!busy} className="font-medium text-gold hover:underline flex items-center gap-1 disabled:opacity-50"><Wand2 size={12} /> Generate another</button>
            <span className="text-faint">·</span>
            <button onClick={() => fileRef.current?.click()} disabled={!!busy} className="font-medium text-dim hover:text-ivory flex items-center gap-1 disabled:opacity-50"><Upload size={12} /> Upload</button>
          </div>
        </>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  );
}

export default CaseAssets;
