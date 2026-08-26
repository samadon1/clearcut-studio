'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ChevronRight,
  Filter,
  Eye,
  Layers
} from 'lucide-react';
import { RevisionAnalysisResult } from '../lib/types';

interface RevisionsTabProps {
  analysis: RevisionAnalysisResult | null;
  onOpenCase: (caseId: string) => void;
  onAnalyzeRevision: () => void;
  isLoading: boolean;
}

export const RevisionsTab: React.FC<RevisionsTabProps> = ({
  analysis,
  onOpenCase,
  onAnalyzeRevision,
  isLoading,
}) => {
  const [activeScene, setActiveScene] = useState<number>(42);
  const [filterMode, setFilterMode] = useState<'all' | 'impacts_only'>('impacts_only');

  const scenes = [
    { number: 1, title: 'EXT. DOWNTOWN STREET - DAY', status: 'CLEARED', change: 'Taxi fleet sign' },
    { number: 12, title: 'INT. ART GALLERY - NIGHT', status: 'CLEARED', change: 'Stencil painting' },
    { number: 42, title: 'INT. COFFEE SHOP - DAY', status: 'ACTION_REQUIRED', change: 'Bean House → Northstar Coffee', caseId: 'C-184' },
    { number: 43, title: 'EXT. ALLEYWAY - NIGHT', status: 'ROUTINE', change: 'Pacing polish (Filtered)' },
    { number: 50, title: 'INT. APARTMENT - DAY', status: 'ROUTINE', change: 'Dialogue polish (Filtered)' }
  ];

  return (
    <div className="space-y-6 pb-12 font-sans max-w-7xl mx-auto text-xs">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-950 tracking-tight">
            Screenplay Collation & Semantic Clearance Diff
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Comparing Blue Draft v7 (Locked Base) against Pink Draft v8 (Revision Collation).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterMode('impacts_only')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterMode === 'impacts_only' ? 'bg-white text-slate-950 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Clearance Impacts (3)
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterMode === 'all' ? 'bg-white text-slate-950 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Changes (19)
            </button>
          </div>

          <button
            onClick={onAnalyzeRevision}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>{isLoading ? 'Collating...' : 'Re-collate Pink v8'}</span>
          </button>
        </div>
      </div>

      {/* 3-Column Screenplay Diff Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scene Index List */}
        <div className="lg:col-span-3 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1">
            Scenes Ingested (Pink v8)
          </div>

          <div className="space-y-1.5">
            {scenes.map((s) => {
              const isActive = activeScene === s.number;
              const isAction = s.status === 'ACTION_REQUIRED';

              return (
                <div
                  key={s.number}
                  onClick={() => setActiveScene(s.number)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    isActive 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                      : 'bg-white text-slate-800 border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold font-mono">Scene {s.number}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                      isAction
                        ? isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-800'
                        : s.status === 'CLEARED'
                        ? isActive ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                        : isActive ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {s.status === 'ACTION_REQUIRED' ? 'Action' : s.status === 'CLEARED' ? 'Cleared' : 'Routine'}
                    </span>
                  </div>
                  <div className={`text-[11px] font-mono truncate mt-1 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                    {s.title}
                  </div>
                  <div className={`text-[10px] mt-0.5 ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                    {s.change}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Blue Draft v7 (Locked Base) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs p-6 space-y-4 font-courier">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-sans">
            <div>
              <span className="font-bold text-slate-950 text-xs">Blue Draft v7</span>
              <span className="text-[11px] text-slate-400 ml-1.5">(Locked Production Baseline)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono text-[10px] font-semibold border border-blue-200">
              Pg 61
            </span>
          </div>

          <div className="space-y-4 text-xs text-slate-800 leading-relaxed select-text">
            <div className="font-bold">SCENE 42 - INT. BEAN HOUSE - DAY</div>
            <div>
              A cozy neighborhood diner. Sunlight streams through the blinds.
            </div>
            <div className="pl-8">
              <span className="font-bold">JULIAN</span><br />
              (stirring his cup)<br />
              Bean House roasts the best Ethiopian blend in the city.
            </div>
            <div>
              Julian sips from a generic ceramic diner mug, setting it down on the formica table.
            </div>
          </div>
        </div>

        {/* Right Column: Pink Draft v8 (Revision Collation) */}
        <div className="lg:col-span-5 bg-white border border-rose-200 rounded-2xl shadow-xs p-6 space-y-4 font-courier bg-rose-50/10 relative">
          {/* Pink Revision Margin Bar */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-400 rounded-l-2xl" />

          <div className="flex items-center justify-between border-b border-rose-100 pb-3 font-sans">
            <div>
              <span className="font-bold text-slate-950 text-xs">Pink Draft v8</span>
              <span className="text-[11px] text-rose-700 font-semibold ml-1.5">(Revision Collation)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 font-mono text-[10px] font-bold border border-pink-200">
              Pg 61 • Pink *
            </span>
          </div>

          <div className="space-y-4 text-xs text-slate-800 leading-relaxed select-text">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-950">
                SCENE 42 - INT. <span className="bg-rose-100 text-rose-900 px-1 rounded font-bold">NORTHSTAR COFFEE</span> - DAY
              </div>
              <span className="text-rose-600 font-bold">*</span>
            </div>

            <div>
              A sleek modern coffee shop. Sunlight reflects off brushed steel espresso machines.
            </div>

            <div className="pl-8">
              <span className="font-bold text-slate-950">JULIAN</span><br />
              (admiring the branded cup)<br />
              <span className="bg-rose-100 text-rose-900 px-1 rounded font-bold">Northstar Coffee</span> roasts the best Ethiopian blend in the city.
            </div>

            <div className="flex items-start justify-between">
              <div>
                Julian sips from an embossed <span className="bg-rose-100 text-rose-900 px-1 rounded font-bold">NORTHSTAR COFFEE</span> paper cup, setting it down near the neon sign.
              </div>
              <span className="text-rose-600 font-bold">*</span>
            </div>

            {/* Clickable Legal Action Callout */}
            <div 
              onClick={() => onOpenCase('C-184')}
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 font-sans space-y-1.5 cursor-pointer hover:bg-rose-100/70 transition shadow-2xs"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-900 flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Case C-184: Trademark Invalidation</span>
                </span>
                <span className="text-[10px] font-semibold text-rose-700 underline">
                  Inspect Dossier →
                </span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                Pink Revision replaces fictional "Bean House" with real registered mark "Northstar Coffee". Invalidates prior baseline Case C-137.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
