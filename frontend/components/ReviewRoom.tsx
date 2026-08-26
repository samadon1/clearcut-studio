'use client';

import React, { useMemo, useEffect, useState } from 'react';
import {
  GitCompareArrows, Sparkles, Search, Scale, Wand2, ShieldAlert, Check,
  ArrowRight, FileText, Loader2, ExternalLink, CheckCircle2, AlertTriangle,
  Film, Image as ImageIcon, Package, Upload, ChevronRight, Sun, Moon,
} from 'lucide-react';
import {
  ProductionSummary, RevisionAnalysisResult, ClearanceCase, CaseStatus,
  SemanticChangeItem, PropagationCheckResult, ClearanceCategory,
} from '../lib/types';
import { regenerateAsset } from '../lib/api';
import { CaseAssets } from './CaseAssets';
import { AssetLightbox } from './AssetLightbox';
import { Avatar } from './Avatar';
import { memberById } from '../lib/team';
import { noDash, titleOf } from '../lib/text';
import { ResearchSkeleton } from './Skeletons';

type AssetKey = 'storyboard' | 'prop' | 'footage';

/* ---------- helpers ---------- */
function statusStyle(status: CaseStatus): { label: string; cls: string; dot: string } {
  switch (status) {
    case 'RESOLVED': return { label: 'Resolved', cls: 'text-cleared border-cleared/30 bg-cleared/10', dot: 'bg-cleared' };
    case 'CLEARED': return { label: 'Cleared', cls: 'text-cleared border-cleared/30 bg-cleared/10', dot: 'bg-cleared' };
    case 'COUNSEL': return { label: 'Counsel', cls: 'text-critical border-critical/30 bg-critical/10', dot: 'bg-critical' };
    case 'BLOCKED': return { label: 'Blocked', cls: 'text-critical border-critical/30 bg-critical/10', dot: 'bg-critical' };
    case 'REVIEW': return { label: 'Review', cls: 'text-gold border-gold/30 bg-gold/10', dot: 'bg-gold' };
    default: return { label: 'Needs research', cls: 'text-info border-info/30 bg-info/10', dot: 'bg-info' };
  }
}

const CAT_ICON: Partial<Record<ClearanceCategory, React.ElementType>> = {
  TRADEMARK: Scale, BUSINESS_OR_ORGANIZATION: Scale, ARTWORK: ImageIcon,
  COPYRIGHT: FileText, MUSIC: Film, PERSON_OR_LIKENESS: ShieldAlert,
};

function confPill(v?: string) {
  const u = (v || '').toUpperCase();
  if (u === 'HIGH' || u === 'VERY HIGH') return 'text-critical border-critical/30 bg-critical/10';
  if (u === 'MEDIUM') return 'text-gold border-gold/30 bg-gold/10';
  if (u === 'NONE' || u === 'LOW') return 'text-dim border-line2 bg-panel2';
  return 'text-info border-info/30 bg-info/10';
}

/* ---------- component ---------- */
export function ReviewRoom({
  summary, analysis, activeCase, selectedCaseId, propagation,
  isLoading, isLoadingResearch, filterAssignee,
  onIngest, onSelectCase, onRunResearch, onFictionalize, onCounsel, onAccept, onSignOff,
}: {
  summary: ProductionSummary | null;
  analysis: RevisionAnalysisResult | null;
  activeCase: ClearanceCase | null;
  selectedCaseId: string | null;
  propagation: PropagationCheckResult | null;
  isLoading?: boolean;
  isLoadingResearch?: boolean;
  filterAssignee?: string | null;
  onIngest: () => void;
  onSelectCase: (id: string) => void;
  onRunResearch: (id: string) => void;
  onFictionalize: (id: string) => void;
  onCounsel: (id: string) => void;
  onAccept: (id: string) => void;
  onSignOff: () => void;
}) {
  // worklist = the real cases created from this revision's flagged changes,
  // with live status merged in from the latest summary so pills/progress update.
  const worklist: ClearanceCase[] = useMemo(() => {
    const live = summary?.all_cases ?? [];
    const revisionCases = (analysis?.affected_cases ?? []).filter((c) => c.created_from_change_id);
    let list: ClearanceCase[];
    if (revisionCases.length) {
      list = revisionCases.map((rc) => live.find((l) => l.id === rc.id) ?? rc);
    } else {
      // baseline (single-script clearance report): every element that needs a decision, plus resolved (for progress)
      const OPEN: string[] = ['RESEARCH_REQUIRED', 'RESEARCHING', 'REVIEW', 'COUNSEL', 'BLOCKED', 'RESOLVED'];
      list = live.filter((c) => OPEN.includes(c.status));
    }
    return filterAssignee ? list.filter((c) => c.assignee_id === filterAssignee) : list;
  }, [analysis, summary, filterAssignee]);
  const changeFor = (c: ClearanceCase): SemanticChangeItem | undefined =>
    analysis?.changes.find((ch) => ch.change_id === c.created_from_change_id);

  const resolved = worklist.filter((c) => c.status === 'RESOLVED').length;
  const routine = analysis ? analysis.total_changes_count - analysis.clearance_changes_count : 0;
  const readiness = summary?.readiness?.readiness_percent ?? 87;
  const allDone = worklist.length > 0 && resolved === worklist.length;

  const selected = worklist.find((c) => c.id === selectedCaseId) ?? worklist[0];
  const selectedChange = selected ? changeFor(selected) : undefined;
  // demo downstream assets live on the Northstar case
  const hasAssets = !!selected && /northstar/i.test(selected.summary);

  // Ensure the currently-focused case is "opened" so its research/resolution attaches.
  useEffect(() => {
    if (selected && selectedCaseId !== selected.id) onSelectCase(selected.id);
  }, [selected?.id, selectedCaseId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Nano Banana "fix the production": regenerated asset urls + in-flight key.
  const [fixedAssets, setFixedAssets] = useState<Record<string, string>>({});
  const [fixingKey, setFixingKey] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; label?: string } | null>(null);
  const openLightbox = (url: string, label?: string) => setLightbox({ url, label });
  const handleFixAsset = async (key: AssetKey) => {
    if (!selected) return;
    setFixingKey(key);
    try {
      const r = await regenerateAsset(key, selected.id);
      setFixedAssets((p) => ({ ...p, [key]: `${r.url}?t=${Date.now()}` }));
    } catch (e) {
      console.error(e);
    } finally {
      setFixingKey(null);
    }
  };

  /* ---- empty state: no revision ingested ---- */
  if (worklist.length === 0) {
    return (
      <div className="canvas-bg h-full flex items-center justify-center">
        <div className="text-center max-w-md animate-fade-up">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gold/15 border border-gold/25 flex items-center justify-center">
            <GitCompareArrows className="text-gold" size={24} />
          </div>
          <h2 className="mt-4 text-[20px] font-bold text-ivory">Nothing to review</h2>
          <p className="mt-2 text-[13px] text-dim leading-relaxed">
            Every clearance element is resolved, or no revision has been ingested yet. Ingest a revision to diff it against the baseline.
          </p>
          <button onClick={onIngest} disabled={isLoading} className="btn btn-primary mt-5">
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            Ingest revision
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="canvas-bg h-full flex flex-col">
      <div className="flex-1 min-h-0 grid grid-cols-[300px_1fr_380px]">
        {/* ---------- LEFT: worklist ---------- */}
        <aside className="min-h-0 overflow-y-auto border-r border-line bg-ink">
          <div className="panel-head sticky top-0 z-10">
            <span className="eyebrow">Decisions</span>
            <span className="text-[10.5px] font-semibold text-dim tabular">{resolved}/{worklist.length}</span>
          </div>
          <div className="p-2 space-y-1">
            {worklist.map((c) => {
              const st = statusStyle(c.status);
              const ch = changeFor(c);
              const Icon = CAT_ICON[c.category] ?? Scale;
              const active = selected?.id === c.id;
              return (
                <button key={c.id} onClick={() => onSelectCase(c.id)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 border transition-colors ${
                    active ? 'bg-panel2 border-line2' : 'bg-transparent border-transparent hover:bg-panel/50'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot} ${c.status !== 'RESOLVED' ? 'animate-pulse-dot' : ''}`} />
                    <span className="font-mono text-[10px] font-bold text-faint">{c.id}</span>
                    <span className="ml-auto flex items-center gap-1.5">
                      <Avatar id={c.assignee_id} size={17} />
                      <span className={`pill ${st.cls}`}>{st.label}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-start gap-2">
                    <Icon size={14} className={active ? 'text-gold mt-0.5' : 'text-faint mt-0.5'} />
                    <div className="min-w-0">
                      <div className="text-[14.5px] font-semibold text-ivory truncate">{titleOf(c.summary)}</div>
                      <div className="text-[12px] text-faint">{ch?.scene?.split(' - ')[0] ?? c.category.replace(/_/g, ' ').toLowerCase()}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {routine > 0 && (
            <div className="mx-4 mt-3 mb-4 rounded-lg border border-line bg-panel/40 px-3 py-2.5">
              <div className="flex items-center gap-2 text-[12px] text-dim">
                <CheckCircle2 size={14} className="text-cleared" />
                <span><span className="font-semibold text-ivory">{routine}</span> routine edits auto-cleared</span>
              </div>
              <p className="mt-1 text-[11px] text-faint leading-snug">Pacing, dialogue and blocking changes with no rights impact.</p>
            </div>
          )}
        </aside>

        {/* ---------- CENTER: viewer ---------- */}
        <main className="min-h-0 flex flex-col">
          <div className="panel-head">
            {selected && selectedChange ? (
              <div className="flex items-center gap-2 eyebrow tracking-[0.07em]">
                <span className="font-mono text-gold">{selected.id}</span>
                <ChevronRight size={11} className="text-faint" />
                <span>{selectedChange.scene?.split(' - ')[0]}</span>
                <ChevronRight size={11} className="text-faint" />
                <span>{selected.category.replace(/_/g, ' ').toLowerCase()}</span>
              </div>
            ) : <span className="eyebrow">Viewer</span>}
          </div>
          <div className="flex-1 overflow-y-auto px-7 py-6">
          {selected && selectedChange && (
            <div className="max-w-3xl animate-fade-up">
              <h2 className="text-[24px] font-bold text-ivory">{titleOf(selected.summary)}</h2>

              {/* semantic diff */}
              <div className="mt-5 card overflow-hidden">
                <div className="px-3.5 py-2 border-b border-line flex items-center justify-between">
                  <span className="eyebrow">Semantic diff</span>
                  <span className="font-mono text-[11px] text-faint">{selectedChange.scene?.split(' - ').slice(1).join(' - ')}</span>
                </div>
                <div className="font-mono text-[13.5px] leading-[1.75]">
                  <div className="flex items-start gap-3 px-3.5 py-2 bg-critical/[0.05] border-l-2 border-critical/50">
                    <span className="text-critical/70 select-none pt-px">−</span>
                    <p className="text-dim">{selectedChange.old_text || <span className="italic text-faint">not present in baseline</span>}</p>
                  </div>
                  <div className="flex items-start gap-3 px-3.5 py-2 bg-cleared/[0.05] border-l-2 border-cleared/50">
                    <span className="text-cleared/70 select-none pt-px">+</span>
                    <p className="text-ivory">{highlightEntities(selectedChange.new_text, selectedChange.new_entities)}</p>
                  </div>
                </div>
              </div>

              {/* why it matters */}
              <div className="mt-4 border-l-2 border-critical/50 bg-panel/40 pl-4 pr-4 py-3 rounded-r-md">
                <div className="eyebrow text-critical/80">Why it affects clearance</div>
                <p className="mt-1.5 text-[14px] text-ivory/90 leading-relaxed">{selectedChange.explanation}</p>
                {selected.previous_case_id && (
                  <p className="mt-1 text-[12px] text-dim">
                    Invalidates prior clearance <span className="font-mono text-gold">{selected.previous_case_id}</span>, which relied on the element being fictional.
                  </p>
                )}
              </div>

              {/* affected production */}
              {hasAssets ? (
                <AffectedStrip
                  caseStatus={selected.status}
                  propagation={propagation}
                  fixedAssets={fixedAssets}
                  fixingKey={fixingKey}
                  onFix={handleFixAsset}
                  onLightbox={openLightbox}
                />
              ) : (
                <CaseAssets key={selected.id} caseId={selected.id} caseResolved={selected.status === 'RESOLVED'} onLightbox={openLightbox} />
              )}
            </div>
          )}
          {selected && !selectedChange && (
            <div className="max-w-3xl animate-fade-up">
              <h2 className="text-[24px] font-bold text-ivory">{titleOf(selected.summary)}</h2>
              <div className="mt-4 border-l-2 border-gold/50 bg-panel/40 pl-4 pr-4 py-3 rounded-r-md">
                <div className="eyebrow">Why it needs clearance</div>
                <p className="mt-1.5 text-[15px] text-ivory/90 leading-relaxed">{noDash(selected.reason)}</p>
                {selected.recommended_action && (
                  <p className="mt-1 text-[12px] text-dim">Recommended: {selected.recommended_action.toLowerCase()}</p>
                )}
              </div>
              <CaseAssets key={selected.id} caseId={selected.id} caseResolved={selected.status === 'RESOLVED'} onLightbox={openLightbox} />
            </div>
          )}
          </div>
        </main>

        {/* ---------- RIGHT: decision panel ---------- */}
        <aside className="min-h-0 overflow-y-auto border-l border-line bg-ink">
          <div className="panel-head sticky top-0 z-10">
            <span className="eyebrow flex items-center gap-1.5"><Search size={12} className="text-gold" /> Inspector</span>
            <span className="eyebrow text-gold/80">Parallel · live</span>
          </div>
          <div className="p-4">
            {selected && (
              <DecisionPanel
                key={selected.id}
                caseItem={selected}
                activeCase={activeCase?.id === selected.id ? activeCase : null}
                isLoadingResearch={isLoadingResearch}
                onRunResearch={() => onRunResearch(selected.id)}
                onFictionalize={() => onFictionalize(selected.id)}
                onCounsel={() => onCounsel(selected.id)}
                onAccept={() => onAccept(selected.id)}
              />
            )}
          </div>
        </aside>
      </div>
      <AssetLightbox url={lightbox?.url ?? null} label={lightbox?.label} onClose={() => setLightbox(null)} />
    </div>
  );
}

/* ---------- theme toggle ---------- */
function ThemeToggle() {
  const [theme, setTheme] = useState<string>('dark');
  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
  }, []);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('cc-theme', next); } catch { /* ignore */ }
  };
  return (
    <button onClick={toggle} title="Toggle theme"
      className="p-2 rounded-md text-faint hover:text-ivory hover:bg-panel2 transition">
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

/* ---------- top bar ---------- */
function TopBar({ readiness, resolved, total, allDone, onSignOff }: {
  readiness: number; resolved: number; total: number; allDone: boolean; onSignOff: () => void;
}) {
  return (
    <header className="shrink-0 h-14 border-b border-line bg-ink2 flex items-center gap-5 px-5">
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-md bg-gold flex items-center justify-center">
          <span className="text-ink font-extrabold text-[13px]">C</span>
        </div>
        <div className="leading-none">
          <div className="text-[13px] font-bold text-ivory tracking-tight">CLEARCUT</div>
          <div className="text-[10px] text-faint mt-0.5">The Last Cup · Pink v8 review</div>
        </div>
      </div>

      {total > 0 && (
        <div className="flex items-center gap-2.5 ml-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <span key={i} className={`h-1.5 w-6 rounded-full ${i < resolved ? 'bg-cleared' : 'bg-line2'}`} />
            ))}
          </div>
          <span className="text-[12px] text-dim font-medium tabular">{resolved}/{total} resolved</span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-4">
        <ThemeToggle />
        <div className="text-right leading-none">
          <div className="text-[10px] uppercase tracking-wider text-faint font-semibold">Readiness</div>
          <div className="text-[15px] font-bold text-ivory tabular mt-0.5">{readiness}%</div>
        </div>
        <button onClick={onSignOff} disabled={!allDone}
          className={`btn ${allDone ? 'btn-primary' : 'btn-ghost opacity-45 cursor-not-allowed'}`}>
          <FileText size={14} /> Sign off &amp; memo
        </button>
      </div>
    </header>
  );
}

/* ---------- affected production strip (the propagation / "reel" idea) ---------- */
function AffectedStrip({ caseStatus, propagation, fixedAssets, fixingKey, onFix, onLightbox }: {
  caseStatus: CaseStatus;
  propagation: PropagationCheckResult | null;
  fixedAssets: Record<string, string>;
  fixingKey: string | null;
  onFix: (key: AssetKey) => void;
  onLightbox: (url: string, label?: string) => void;
}) {
  const tracks: { key: string; label: string; icon: React.ElementType; img: string | null; dept: string }[] = [
    { key: 'script', label: 'Script · Scene 42', icon: FileText, img: null, dept: 'Screenwriting' },
    { key: 'storyboard', label: 'Storyboard · 42B', icon: ImageIcon, img: '/assets/storyboard_42b.jpg', dept: 'Art Dept' },
    { key: 'prop', label: 'Prop · Cup P-018', icon: Package, img: '/assets/prop_cup_p018.jpg', dept: 'Props' },
    { key: 'footage', label: 'Rough Cut · 00:42:17', icon: Film, img: '/assets/rough_cut_scene42.jpg', dept: 'Post / VFX' },
  ];
  const resolvedCase = caseStatus === 'RESOLVED';
  const propItems = propagation?.items ?? [];
  const statusFor = (key: string): 'resolved' | 'affected' | 'pending' => {
    if (fixedAssets[key]) return 'resolved';
    if (key === 'script') return resolvedCase ? 'resolved' : 'pending';
    const it = propItems.find((p) => p.artifact_type.toLowerCase().includes(key === 'storyboard' ? 'storyboard' : key === 'prop' ? 'prop' : 'footage'));
    if (it) return it.current_status === 'RESOLVED' ? 'resolved' : 'affected';
    return resolvedCase ? 'affected' : 'pending';
  };

  const affectedKeys = tracks.filter((t) => t.key !== 'script' && statusFor(t.key) === 'affected').map((t) => t.key as AssetKey);
  const allFixed = resolvedCase && affectedKeys.length === 0;

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-[12.5px] font-bold text-ivory">Affected production</h3>
        {resolvedCase && (
          allFixed
            ? <span className="text-[11.5px] font-semibold text-cleared">Production matches the script.</span>
            : <span className="text-[11.5px] font-semibold text-gold">The script is fixed. The production isn&apos;t.</span>
        )}
      </div>
      <div className="space-y-2">
        {tracks.map(({ key, label, icon: Icon, img, dept }) => {
          const s = statusFor(key);
          const shownImg = fixedAssets[key] || img;
          const isFixing = fixingKey === key;
          const canFix = key !== 'script' && s === 'affected';
          return (
            <div key={key} className="flex items-center gap-3 card px-3 py-2">
              <button onClick={() => shownImg && onLightbox(shownImg, label)}
                className="h-11 w-[72px] rounded-md overflow-hidden bg-panel2 border border-line shrink-0 flex items-center justify-center relative hover:border-line2 transition">
                {shownImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shownImg} alt={label} className="h-full w-full object-cover" />
                ) : (
                  <Icon size={16} className="text-faint" />
                )}
                {isFixing && (
                  <div className="absolute inset-0 bg-ink/70 flex items-center justify-center">
                    <Loader2 size={15} className="animate-spin text-gold" />
                  </div>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold text-ivory truncate">{label}</div>
                <div className="text-[11px] text-faint">{dept}</div>
              </div>
              {canFix ? (
                <button onClick={() => onFix(key as AssetKey)} disabled={!!fixingKey}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-2.5 py-1.5 text-[11px] font-semibold text-gold hover:bg-gold/15 transition disabled:opacity-50">
                  {isFixing ? <><Loader2 size={12} className="animate-spin" /> Regenerating…</> : <><Wand2 size={12} /> Fix with AI</>}
                </button>
              ) : s === 'resolved' ? (
                <span className="pill text-cleared border-cleared/30 bg-cleared/10"><CheckCircle2 size={11} /> Updated</span>
              ) : (
                <span className="pill text-gold border-gold/30 bg-gold/10">At risk</span>
              )}
            </div>
          );
        })}
      </div>
      {resolvedCase && affectedKeys.length > 0 && (
        <p className="mt-2 text-[11.5px] text-dim">
          <span className="text-gold font-medium">Nano Banana</span> can regenerate each asset with &quot;{propagation?.replacement_name || 'the new brand'}&quot;, preserving the original composition.
        </p>
      )}
    </div>
  );
}

/* ---------- decision panel ---------- */
function DecisionPanel({ caseItem, activeCase, isLoadingResearch, onRunResearch, onFictionalize, onCounsel, onAccept }: {
  caseItem: ClearanceCase;
  activeCase: ClearanceCase | null;
  isLoadingResearch?: boolean;
  onRunResearch: () => void;
  onFictionalize: () => void;
  onCounsel: () => void;
  onAccept: () => void;
}) {
  const research = activeCase?.latest_research;
  const synth = research?.synthesis;
  const resolved = caseItem.status === 'RESOLVED';
  const counsel = caseItem.status === 'COUNSEL';
  const assignee = memberById(caseItem.assignee_id);

  return (
    <div className="animate-fade-up">
      {assignee && (
        <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-line">
          <Avatar id={caseItem.assignee_id} size={26} />
          <div className="leading-tight min-w-0">
            <div className="text-[12.5px] font-semibold text-ivory truncate">{assignee.name}{assignee.you ? ' (you)' : ''}</div>
            <div className="text-[11px] text-faint truncate">{assignee.role}</div>
          </div>
        </div>
      )}
      {resolved && (
        <div className="rounded-[5px] border border-cleared/30 bg-cleared/[0.07] px-4 py-4 text-center">
          <CheckCircle2 size={22} className="text-cleared mx-auto" />
          <div className="mt-2 text-[13px] font-bold text-ivory">Resolved</div>
          <div className="text-[12px] text-dim mt-0.5">
            {caseItem.resolution?.resolution_type?.replace(/_/g, ' ').toLowerCase()}
            {caseItem.resolution?.replacement_value ? ` → ${caseItem.resolution.replacement_value}` : ''}
          </div>
        </div>
      )}
      {counsel && !resolved && (
        <div className="rounded-[5px] border border-critical/30 bg-critical/[0.06] px-4 py-4 text-center">
          <Scale size={20} className="text-critical mx-auto" />
          <div className="mt-2 text-[13px] font-bold text-ivory">Agent recommends counsel</div>
          <div className="text-[12px] text-dim mt-0.5">{memberById('u-counsel')?.name ?? 'Entertainment Counsel'} would take the legal review, or override with a decision below.</div>
        </div>
      )}
      {research ? (
        <div className="space-y-3 mt-3">
          {/* confidence */}
          <div className="flex items-center gap-2">
            <span className={`pill ${confPill(synth?.entity_match_confidence)}`}>Match {synth?.entity_match_confidence}</span>
            <span className={`pill ${confPill(synth?.evidence_strength)}`}>Evidence {synth?.evidence_strength}</span>
            <span className="ml-auto text-[11px] text-faint tabular">{research.results.length} sources</span>
          </div>

          {/* queries */}
          <div className="flex flex-wrap gap-1.5">
            {research.queries.slice(0, 3).map((q, i) => (
              <span key={i} className="font-mono text-[10.5px] text-dim bg-panel2 border border-line rounded px-2 py-1 truncate max-w-full">{q}</span>
            ))}
          </div>

          {/* evidence cards */}
          <div className="space-y-2">
            {research.results.slice(0, 4).map((s) => (
              <a key={s.id} href={s.url} target="_blank" rel="noreferrer"
                className="block card card-hover px-3 py-2.5 group">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-gold truncate">{s.domain}</span>
                  <ExternalLink size={11} className="text-faint group-hover:text-gold shrink-0" />
                </div>
                <div className="text-[12px] font-medium text-ivory mt-0.5 truncate">{s.title}</div>
                <p className="text-[11px] text-dim mt-1 line-clamp-2 leading-snug">{noDash(s.excerpt)}</p>
              </a>
            ))}
          </div>

          {/* synthesis */}
          {synth?.reason && (
            <div className="rounded-lg bg-info/[0.06] border border-info/20 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-info text-[11px] font-semibold uppercase tracking-wider">
                <Sparkles size={12} /> Gemini synthesis
              </div>
              <p className="text-[12px] text-ivory/90 mt-1 leading-relaxed">{noDash(synth.reason)}</p>
            </div>
          )}

          {/* decision — available until the case is resolved; the human can override the agent's counsel recommendation */}
          {!resolved && (
          <div className="pt-1">
            <div className="text-[11px] uppercase tracking-wider text-faint font-semibold mb-2">Your decision</div>
            <div className="space-y-2">
              <button onClick={onFictionalize} className="btn btn-primary w-full">
                <Wand2 size={15} /> Fictionalize the element
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={onCounsel} className="btn btn-ghost"><Scale size={13} /> Refer to counsel</button>
                <button onClick={onAccept} className="btn btn-ghost"><Check size={13} /> Accept as-is</button>
              </div>
            </div>
            <p className="mt-2 text-[10.5px] text-faint leading-snug">
              CLEARCUT never decides legality. The human makes the call; every action is logged.
            </p>
          </div>
          )}
        </div>
      ) : isLoadingResearch ? (
        <ResearchSkeleton />
      ) : !resolved ? (
        <div className="rounded-xl border border-line bg-panel/40 px-4 py-5 text-center">
          <p className="text-[12.5px] text-dim leading-relaxed">
            No web evidence gathered yet. Run live research to investigate whether this is a real, rights-protected entity.
          </p>
          <button onClick={onRunResearch} disabled={isLoadingResearch} className="btn btn-primary mt-3">
            <Sparkles size={14} /> Run live research
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* highlight named entities inside the revised line */
function highlightEntities(text: string, entities: string[]) {
  if (!entities?.length) return text;
  const escaped = entities.filter(Boolean).map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!escaped.length) return text;
  const re = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(re);
  return parts.map((p, i) =>
    escaped.some((e) => new RegExp(`^${e}$`, 'i').test(p))
      ? <mark key={i} className="bg-critical/25 text-ivory rounded px-0.5">{p}</mark>
      : <React.Fragment key={i}>{p}</React.Fragment>
  );
}

export default ReviewRoom;
