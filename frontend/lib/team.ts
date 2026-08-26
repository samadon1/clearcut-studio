'use client';

import { useEffect, useState } from 'react';
import { Collaborator, getTeam } from './api';

let _team: Collaborator[] = [];
const subs = new Set<() => void>();

export function memberById(id?: string): Collaborator | undefined {
  return id ? _team.find((m) => m.id === id) : undefined;
}
export async function refreshTeam(): Promise<Collaborator[]> {
  _team = await getTeam();
  subs.forEach((s) => s());
  return _team;
}
export function teamList(): Collaborator[] {
  return _team;
}
export function useTeam(): Collaborator[] {
  const [, force] = useState(0);
  useEffect(() => {
    const cb = () => force((x) => x + 1);
    subs.add(cb);
    if (_team.length === 0) getTeam().then((t) => { _team = t; subs.forEach((s) => s()); });
    else force((x) => x + 1);
    return () => { subs.delete(cb); };
  }, []);
  return _team;
}
