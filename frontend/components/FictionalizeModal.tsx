'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, ShieldAlert, ArrowRight, Wand2, ExternalLink, Loader2 } from 'lucide-react';
import { FictionalCandidate } from '../lib/types';
import { noDash } from '../lib/text';

interface FictionalizeModalProps {
  candidate: FictionalCandidate | null;
  onClose: () => void;
  onApprove: (replacementName: string) => void;
  isApproving: boolean;
}

export const FictionalizeModal: React.FC<FictionalizeModalProps> = ({
  candidate, onClose, onApprove, isApproving,
}) => {
  const [customName, setCustomName] = useState<string>('');

  // Loading state: the agent is coining a replacement and running the live conflict check.
  if (!candidate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
        <div className="card w-full max-w-lg overflow-hidden shadow-2xl animate-fade-up">
          <div className="px-5 py-3.5 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-gold/15 border border-gold/25 flex items-center justify-center">
                <Wand2 size={15} className="text-gold" />
              </div>
              <div>
                <h2 className="text-[13.5px] font-semibold text-ivory">Fictionalize element</h2>
                <p className="text-[11px] text-faint">Candidate generated, then conflict-checked live via Parallel</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md text-faint hover:text-ivory hover:bg-panel2 transition">
              <X size={15} />
            </button>
          </div>
          <div className="px-5 py-12 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 size={26} className="text-gold animate-spin" />
            <p className="text-[13px] text-dim">Coining a distinctive replacement</p>
            <p className="text-[11.5px] text-faint">Then checking it against the live web with Parallel...</p>
          </div>
        </div>
      </div>
    );
  }

  const name = customName.trim() || candidate.candidate_name;
  const conf = (candidate.conflict_confidence || '').toUpperCase();
  const hasConflict = candidate.conflict_found && (conf === 'HIGH' || conf === 'MEDIUM');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
      <div className="card w-full max-w-lg overflow-hidden shadow-2xl animate-fade-up">
        {/* header */}
        <div className="px-5 py-3.5 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-gold/15 border border-gold/25 flex items-center justify-center">
              <Wand2 size={15} className="text-gold" />
            </div>
            <div>
              <h2 className="text-[13.5px] font-semibold text-ivory">Fictionalize element</h2>
              <p className="text-[11px] text-faint">Candidate generated, then conflict-checked live via Parallel</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-faint hover:text-ivory hover:bg-panel2 transition">
            <X size={15} />
          </button>
        </div>

        {/* body */}
        <div className="p-5 space-y-4">
          {/* candidate */}
          <div className="rounded-lg border border-line bg-ink2 px-5 py-5 text-center">
            <div className="eyebrow">Proposed replacement</div>
            <input
              value={name}
              onChange={(e) => setCustomName(e.target.value)}
              className="mt-2 w-full bg-transparent text-center text-[26px] font-semibold text-ivory tracking-tight outline-none focus:text-gold transition-colors"
            />
            <p className="mt-1.5 text-[12px] text-dim max-w-sm mx-auto leading-relaxed">{candidate.rational}</p>
            <div className="mt-3 inline-flex">
              {hasConflict ? (
                <span className="pill text-critical border-critical/30 bg-critical/10">
                  <ShieldAlert size={12} /> Possible conflict · {conf}
                </span>
              ) : (
                <span className="pill text-cleared border-cleared/30 bg-cleared/10">
                  <CheckCircle2 size={12} /> No commercial conflict found
                </span>
              )}
            </div>
          </div>

          {/* conflict proof */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="eyebrow">Parallel conflict check</span>
              <span className="text-[11px] text-faint tabular">{candidate.conflict_search_queries.length} queries · {candidate.parallel_sources.length} sources</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {candidate.conflict_search_queries.map((q, i) => (
                <span key={i} className="font-mono text-[10.5px] text-dim bg-panel2 border border-line rounded px-2 py-1">{q}</span>
              ))}
            </div>
            {candidate.parallel_sources.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {candidate.parallel_sources.slice(0, 2).map((s) => (
                  <a key={s.id} href={s.url} target="_blank" rel="noreferrer"
                    className="block card card-hover px-3 py-2 group">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-gold">{s.domain}</span>
                      <ExternalLink size={10} className="text-faint group-hover:text-gold" />
                    </div>
                    <p className="text-[11px] text-dim mt-0.5 line-clamp-1">{noDash(s.excerpt)}</p>
                  </a>
                ))}
              </div>
            )}
            <p className="text-[12px] text-dim leading-relaxed">{candidate.conflict_summary}</p>
          </div>

          {/* disclaimer */}
          <div className="flex items-start gap-2 text-[11.5px] text-faint border-l-2 border-line2 pl-3 py-0.5">
            <ShieldAlert size={13} className="text-faint shrink-0 mt-0.5" />
            <span>{candidate.disclaimer}</span>
          </div>

          {/* actions */}
          <div className="flex items-center justify-between pt-1">
            <button onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button onClick={() => onApprove(name)} disabled={isApproving} className="btn btn-primary">
              {isApproving ? <><Loader2 size={14} className="animate-spin" /> Checking production…</> : <>Approve &amp; check propagation <ArrowRight size={14} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FictionalizeModal;
