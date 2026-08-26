'use client';

import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Layers,
  ChevronDown
} from 'lucide-react';

interface ScriptUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunIngest: (draftName: string, content: string) => void;
}

export const ScriptUploadModal: React.FC<ScriptUploadModalProps> = ({
  isOpen,
  onClose,
  onRunIngest,
}) => {
  const [draftColor, setDraftColor] = useState('Pink Draft v8');
  const [baselineDraft, setBaselineDraft] = useState('Blue Draft v7 (Locked)');
  const [scriptText, setScriptText] = useState(
`SCENE 42 - INT. NORTHSTAR COFFEE - DAY *

JULIAN
Northstar Coffee roasts the best Ethiopian blend in the city.

Julian sips from an embossed NORTHSTAR COFFEE paper cup, setting it down near the neon sign. *`
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setProgressStep('Parsing screenplay scene headers & dialogue...');
    setTimeout(() => {
      setProgressStep('Extracting named entities & commercial references...');
      setTimeout(() => {
        setProgressStep('Detecting semantic diff against Blue Draft v7...');
        setTimeout(() => {
          setIsProcessing(false);
          onRunIngest(draftColor, scriptText);
          onClose();
        }, 600);
      }, 600);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans">
      <div className="bg-white border border-neutral-200 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center font-bold text-xs">
              <UploadCloud className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-neutral-950 uppercase tracking-wider font-poppins">
                Ingest Screenplay Revision Draft
              </h2>
              <p className="text-[10px] text-neutral-500">
                Automated Semantic Diffing & Clearance Invalidation Pipeline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Draft Revision & Baseline Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-neutral-600">Revision Draft Color</label>
              <select
                value={draftColor}
                onChange={(e) => setDraftColor(e.target.value)}
                className="w-full p-2 rounded-md bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 outline-hidden font-medium"
              >
                <option value="Pink Draft v8">Pink Draft v8 (Production Collation)</option>
                <option value="Yellow Draft v9">Yellow Draft v9 (Post-Collation)</option>
                <option value="Green Draft v10">Green Draft v10</option>
                <option value="Goldenrod Draft v11">Goldenrod Draft v11</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-neutral-600">Comparison Baseline</label>
              <select
                value={baselineDraft}
                onChange={(e) => setBaselineDraft(e.target.value)}
                className="w-full p-2 rounded-md bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 outline-hidden font-medium"
              >
                <option value="Blue Draft v7 (Locked)">Blue Draft v7 (Locked Production Baseline)</option>
                <option value="White Draft v1">White Draft v1 (Original Script)</option>
              </select>
            </div>
          </div>

          {/* Script Revision Editor / Dropzone */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-neutral-600">Screenplay Text or Paste Scene</label>
              <span className="text-[10px] text-neutral-400 font-mono">Supports Final Draft & Standard Format</span>
            </div>
            <textarea
              rows={5}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              className="w-full p-3 rounded-md bg-neutral-50 border border-neutral-200 text-xs font-courier text-neutral-900 outline-hidden focus:bg-white focus:border-neutral-400 font-medium leading-relaxed"
            />
          </div>

          {/* Dropzone Hint */}
          <div className="p-3 rounded-md border border-dashed border-neutral-300 text-center space-y-1 bg-neutral-50/50">
            <div className="text-[11px] text-neutral-600">
              Or drag & drop <span className="font-mono font-semibold">.fdx</span> or <span className="font-mono font-semibold">.pdf</span> script file
            </div>
            <div className="text-[10px] text-neutral-400">Maximum file size: 25MB • Up to 180 pages</div>
          </div>

          {/* Processing Status Indicator */}
          {isProcessing && (
            <div className="p-3 rounded-md bg-neutral-100 border border-neutral-200 flex items-center space-x-2 text-xs text-neutral-800 font-mono animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-neutral-950 animate-spin" />
              <span>{progressStep}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium text-xs transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isProcessing || !scriptText.trim()}
              className="px-4 py-1.5 rounded-md bg-black hover:bg-neutral-800 text-white font-medium text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
            >
              <span>{isProcessing ? 'Ingesting Script...' : 'Run Collation Diff'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
