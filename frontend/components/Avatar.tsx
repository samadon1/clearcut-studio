'use client';

import React from 'react';
import { memberById, useTeam } from '../lib/team';

interface Member { initials: string; color: string; name?: string; role?: string }

export function Avatar({ id, member, size = 22, ring = true }: { id?: string; member?: Member; size?: number; ring?: boolean }) {
  useTeam(); // re-render when the roster loads so id-based avatars resolve
  const m = member ?? memberById(id);
  if (!m) {
    return <div style={{ width: size, height: size }} className="rounded-full bg-panel2 border border-line shrink-0" />;
  }
  const grad = `linear-gradient(145deg, color-mix(in srgb, ${m.color} 78%, #ffffff) 0%, ${m.color} 52%, color-mix(in srgb, ${m.color} 82%, #000000) 100%)`;
  return (
    <div
      title={m.name ? `${m.name}${m.role ? ` · ${m.role}` : ''}` : undefined}
      style={{ width: size, height: size, background: grad }}
      className={`rounded-full flex items-center justify-center shrink-0 ${ring ? 'ring-1 ring-black/15' : ''}`}
    >
      <span style={{ fontSize: Math.round(size * 0.42) }} className="font-bold text-black/75 leading-none">{m.initials}</span>
    </div>
  );
}

export function AvatarStack({
  members, size = 24, max = 6, onAvatarClick, activeId,
}: {
  members: Array<Member & { id?: string }>;
  size?: number;
  max?: number;
  onAvatarClick?: (id: string) => void;
  activeId?: string | null;
}) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((m, i) => {
        const clickable = !!onAvatarClick && !!m.id;
        const dimmed = activeId != null && m.id !== activeId;
        return (
          <button
            key={m.id ?? i}
            type="button"
            disabled={!clickable}
            onClick={() => m.id && onAvatarClick?.(m.id)}
            title={clickable ? `Filter by ${m.name ?? ''}` : undefined}
            style={{ marginLeft: i === 0 ? 0 : -size * 0.32, zIndex: shown.length - i }}
            className={`rounded-full transition ${m.id === activeId ? 'ring-2 ring-gold' : 'ring-2 ring-ink2'} ${
              clickable ? 'hover:z-20 hover:-translate-y-0.5 cursor-pointer' : ''
            } ${dimmed ? 'opacity-45' : ''}`}
          >
            <Avatar member={m} size={size} ring={false} />
          </button>
        );
      })}
      {extra > 0 && (
        <div style={{ width: size, height: size, marginLeft: -size * 0.32 }} className="rounded-full bg-panel2 border border-line2 flex items-center justify-center ring-2 ring-ink2">
          <span className="text-[9px] font-bold text-dim">+{extra}</span>
        </div>
      )}
    </div>
  );
}

export default Avatar;
