'use client';

import React, { useEffect, useState } from 'react';
import { X, FileText, Loader2 } from 'lucide-react';
import { getClearanceMemoDeliverable } from '../lib/api';
import { noDash, titleOf } from '../lib/text';

interface Memo {
  title: string;
  production: string;
  date: string;
  revision_compared: string;
  hero_summary: string;
  cases_status: { case_id: string; summary: string; status: string; category: string; reason?: string; resolution?: string }[];
  disclaimer: string;
}

function dispositionStyle(status: string): string {
  const s = status.toUpperCase();
  if (s === 'RESOLVED' || s === 'CLEARED') return 'text-cleared';
  if (s === 'COUNSEL' || s === 'BLOCKED') return 'text-critical';
  return 'text-gold';
}

export function MemoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [memo, setMemo] = useState<Memo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getClearanceMemoDeliverable()
      .then((d) => setMemo(d as Memo))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
      <div className="card w-full max-w-2xl max-h-[86vh] overflow-hidden flex flex-col shadow-2xl animate-fade-up">
        {/* header */}
        <div className="px-5 py-3.5 border-b border-line flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-gold/15 border border-gold/25 flex items-center justify-center">
              <FileText size={15} className="text-gold" />
            </div>
            <div>
              <h2 className="text-[13.5px] font-semibold text-ivory">Clearance memorandum</h2>
              <p className="text-[11px] text-faint">Prepared for production wrap &amp; E&amp;O underwriting</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-faint hover:text-ivory hover:bg-panel2 transition">
            <X size={15} />
          </button>
        </div>

        {/* body */}
        <div className="overflow-y-auto p-6">
          {loading || !memo ? (
            <div className="py-16 flex items-center justify-center text-dim">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : (
            <div className="font-mono text-ivory">
              <div className="text-[17px] font-semibold tracking-tight">{memo.production}</div>
              <div className="mt-0.5 eyebrow">Production Legal &amp; Clearance</div>

              <div className="mt-4 grid grid-cols-3 gap-4 border-y border-line py-3">
                {[
                  ['Revision', memo.revision_compared],
                  ['Date', memo.date],
                  ['Reference', memo.title.replace(/CLEARCUT.*Memo/i, 'MEMO-TLC-8821')],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[9.5px] uppercase tracking-wider text-faint">{k}</div>
                    <div className="text-[11.5px] text-dim mt-0.5">{v}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <div className="eyebrow">Executive summary</div>
                <p className="mt-1.5 text-[12.5px] text-dim leading-relaxed font-sans">{noDash(memo.hero_summary)}</p>
              </div>

              <div className="mt-5">
                <div className="eyebrow mb-2">Clearance roster</div>
                <div className="border border-line rounded-lg overflow-hidden">
                  <table className="w-full text-[11.5px]">
                    <thead>
                      <tr className="bg-ink2 text-faint">
                        <th className="text-left font-medium px-3 py-2">ID</th>
                        <th className="text-left font-medium px-3 py-2">Subject</th>
                        <th className="text-left font-medium px-3 py-2">Category</th>
                        <th className="text-right font-medium px-3 py-2">Disposition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {memo.cases_status.map((c) => (
                        <tr key={c.case_id}>
                          <td className="px-3 py-2 text-gold">{c.case_id}</td>
                          <td className="px-3 py-2 text-ivory font-sans">{titleOf(c.summary)}</td>
                          <td className="px-3 py-2 text-dim font-sans">{c.category.replace(/_/g, ' ').toLowerCase()}</td>
                          <td className={`px-3 py-2 text-right font-sans font-medium ${dispositionStyle(c.status)}`}>
                            {c.resolution && c.resolution !== 'Pending Human Decision' ? c.resolution : c.status.toLowerCase()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="mt-4 text-[11px] text-faint leading-relaxed font-sans border-l-2 border-line2 pl-3">{noDash(memo.disclaimer)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MemoModal;
