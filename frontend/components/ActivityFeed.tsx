'use client';

import React, { useEffect, useState } from 'react';
import { getActivity, ActivityItem } from '../lib/api';
import { Avatar } from './Avatar';
import { memberById } from '../lib/team';

function rel(ts: string): string {
  const t = new Date(ts).getTime();
  if (isNaN(t)) return '';
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function describe(e: ActivityItem): React.ReactNode {
  const p = e.payload || {};
  const to = p.to ? (memberById(p.to)?.name ?? p.to) : '';
  switch (e.event_type) {
    case 'SCRIPT_REVISION_UPLOADED':
      return <>ingested a revision · <b className="text-ivory font-semibold">{p.clearance_impacts ?? p.clearance_impacts === 0 ? p.clearance_impacts : '·'}</b> affect clearance</>;
    case 'CLEARANCE_REPORT_GENERATED':
      return <>generated the clearance report · <b className="text-ivory font-semibold">{p.elements ?? '·'}</b> elements</>;
    case 'CLEARANCE_CASE_INVALIDATED':
      return <>invalidated <b className="text-ivory font-semibold">{e.entity_id}</b></>;
    case 'PARALLEL_SEARCH_EXECUTED':
      return <>ran live research on <b className="text-ivory font-semibold">{p.case_id ?? e.entity_id}</b></>;
    case 'RESOLUTION_APPROVED':
      return <>resolved <b className="text-ivory font-semibold">{e.entity_id}</b>{p.replacement ? <> → {p.replacement}</> : <> · {String(p.type || '').replace(/_/g, ' ').toLowerCase()}</>}</>;
    case 'PROPAGATION_CHECK_COMPLETED':
      return <>checked production for <b className="text-ivory font-semibold">{e.entity_id}</b></>;
    case 'CASE_ASSIGNED':
      return <>assigned <b className="text-ivory font-semibold">{e.entity_id}</b> to {to}</>;
    case 'CASE_CLEARED':
      return <>cleared <b className="text-ivory font-semibold">{e.entity_id}</b></>;
    case 'PRODUCTION_INITIALIZED':
      return <>opened the production</>;
    default:
      return <>{e.event_type.replace(/_/g, ' ').toLowerCase()} · {e.entity_id}</>;
  }
}

export function ActivityFeed({ refreshKey }: { refreshKey?: number }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  useEffect(() => { getActivity().then(setItems); }, [refreshKey]);

  return (
    <aside className="w-[300px] shrink-0 border-l border-line bg-ink flex flex-col min-h-0">
      <div className="panel-head sticky top-0 z-10">
        <span className="eyebrow">Activity</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {items.length === 0 && <p className="text-[12px] text-faint px-1 py-2">No activity yet.</p>}
        {items.map((e) => (
          <div key={e.id} className="flex gap-2.5">
            {e.actor_initials
              ? <Avatar member={{ initials: e.actor_initials, color: e.actor_color || '#666', name: e.actor_name }} size={24} />
              : <div className="h-6 w-6 rounded-full bg-panel2 border border-line flex items-center justify-center shrink-0"><span className="text-[9px] font-bold text-gold">AI</span></div>}
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] text-dim leading-snug">
                <span className="font-semibold text-ivory">{e.actor_name}</span> {describe(e)}
              </p>
              <p className="text-[11px] text-faint mt-0.5">{rel(e.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default ActivityFeed;
