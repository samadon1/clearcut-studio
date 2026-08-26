'use client';

import React from 'react';
import { LayoutGrid, FileText, GitCompareArrows, Image as ImageIcon } from 'lucide-react';
import { PoweredBy } from './BrandMarks';

const TABS: { key: string; label: string; icon: React.ElementType }[] = [
  { key: 'report', label: 'Report', icon: LayoutGrid },
  { key: 'script', label: 'Script', icon: FileText },
  { key: 'review', label: 'Review', icon: GitCompareArrows },
  { key: 'storyboard', label: 'Storyboard', icon: ImageIcon },
];

export function PageTabsBar({
  activeTab, onTab,
}: {
  activeTab: string;
  onTab: (t: string) => void;
}) {
  return (
    <footer className="shrink-0 h-14 border-t border-line bg-ink2 relative flex items-center px-3 select-none">
      {/* left — status */}
      <div className="flex items-center gap-1.5 text-[11px] text-faint tabular min-w-0">
        <span className="h-1.5 w-1.5 rounded-full bg-cleared" /> CLEARCUT
      </div>

      {/* center — DaVinci-style page selector: segmented cells divided by borders, active page fully gold */}
      <nav className="absolute left-1/2 -translate-x-1/2 w-[66%] max-w-[980px] flex items-stretch border border-line">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => onTab(key)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 border-l border-line first:border-l-0 transition-colors ${
                active ? 'grad-gold text-[#241b06]' : 'text-faint hover:text-ivory hover:bg-panel/50'
              }`}
            >
              <Icon size={16} />
              <span className="text-[10.5px] font-semibold tracking-wide">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* right — powered by */}
      <div className="ml-auto flex items-center gap-2 text-[11px] text-faint tabular">
        <PoweredBy showLabel={false} compact />
      </div>
    </footer>
  );
}

export default PageTabsBar;
