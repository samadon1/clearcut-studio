'use client';

import React from 'react';
import { X } from 'lucide-react';

export function AssetLightbox({ url, label, onClose }: { url: string | null; label?: string; onClose: () => void }) {
  if (!url) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-black/85 backdrop-blur-sm animate-fade-up" onClick={onClose}>
      <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition">
        <X size={20} />
      </button>
      <figure onClick={(e) => e.stopPropagation()} className="flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label || ''} className="max-h-[82vh] max-w-[88vw] w-auto rounded-lg border border-white/10 shadow-2xl object-contain" />
        {label && <figcaption className="mt-3 text-center text-[13px] text-white/70">{label}</figcaption>}
      </figure>
    </div>
  );
}

export default AssetLightbox;
