'use client';

import React, { useState } from 'react';
import { UserPlus, X, Loader2 } from 'lucide-react';
import { addTeamMember, Collaborator } from '../lib/api';
import { refreshTeam } from '../lib/team';

const ROLE_SUGGESTIONS = [
  'Creative Director', 'Producer', 'Showrunner', 'Line Producer',
  'Costume Designer', 'Production Designer', 'Post Supervisor', 'Assistant Editor',
];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AddMemberModal({
  onClose, onAdded,
}: {
  onClose: () => void;
  onAdded: (m: Collaborator) => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const m = await addTeamMember(name.trim(), role.trim() || 'Collaborator');
      await refreshTeam();
      onAdded(m);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md card p-0 overflow-hidden animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <div className="flex items-center gap-2">
            <UserPlus size={15} className="text-gold" />
            <span className="eyebrow">Add team member</span>
          </div>
          <button onClick={onClose} className="text-faint hover:text-ivory"><X size={16} /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* live preview */}
          <div className="flex items-center gap-3">
            <div
              style={{ background: `linear-gradient(145deg, color-mix(in srgb, #8a6fd8 78%, #fff) 0%, #8a6fd8 52%, color-mix(in srgb, #8a6fd8 82%, #000) 100%)` }}
              className="h-11 w-11 rounded-full flex items-center justify-center ring-1 ring-black/15 shrink-0">
              <span className="text-[15px] font-bold text-black/75">{initialsOf(name || 'New')}</span>
            </div>
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold text-ivory truncate">{name.trim() || 'New member'}</div>
              <div className="text-[12px] text-faint truncate">{role.trim() || 'Collaborator'}</div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-faint font-semibold mb-1.5">Name</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              placeholder="e.g. Amara Boateng"
              className="w-full rounded-md bg-ink border border-line px-3 py-2 text-[13.5px] text-ivory placeholder:text-faint focus:border-gold/50 outline-none" />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-faint font-semibold mb-1.5">Role</label>
            <input value={role} onChange={(e) => setRole(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              placeholder="e.g. Creative Director"
              className="w-full rounded-md bg-ink border border-line px-3 py-2 text-[13.5px] text-ivory placeholder:text-faint focus:border-gold/50 outline-none" />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {ROLE_SUGGESTIONS.map((r) => (
                <button key={r} onClick={() => setRole(r)}
                  className="text-[11px] rounded-full border border-line bg-panel2/60 px-2 py-0.5 text-faint hover:text-ivory hover:border-gold/40 transition-colors">
                  {r}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-faint leading-snug">
            No invite or login. The member joins the roster immediately and can be assigned clearance elements.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-line">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={submit} disabled={!name.trim() || saving} className="btn btn-primary">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Adding…</> : <><UserPlus size={14} /> Add member</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddMemberModal;
