'use client';

import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  Film,
  Play
} from 'lucide-react';

interface DemoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStep: (stepIndex: number) => void;
}

export const DemoTourModal: React.FC<DemoTourModalProps> = ({
  isOpen,
  onClose,
  onSelectStep,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "1. Baseline Production State",
      subtitle: "The Last Cup (Blue Draft v7)",
      desc: "Open 'The Last Cup' with 243 tracked items (221 Cleared, 14 Review, 8 Counsel). Case C-137 is CLEARED because 'Bean House' is a fictional entity.",
      tab: "overview",
      badge: "Baseline"
    },
    {
      title: "2. Screenplay Revision Ingest",
      subtitle: "Pink Draft v8 Ingest",
      desc: "Writer uploads Pink Draft v8. CLEARCUT processes 19 text edits and computes the Hero metric: '19 changes detected. Only 3 affect clearance.'",
      tab: "revisions",
      badge: "Hero Diff"
    },
    {
      title: "3. Semantic Diff & Invalidation",
      subtitle: "Bean House → Northstar Coffee",
      desc: "CLEARCUT detects that Bean House was replaced by Northstar Coffee. Because C-137 relied on fictionality, it is instantly invalidated and Case C-184 is created.",
      tab: "revisions",
      badge: "Impact Engine"
    },
    {
      title: "4. Live Parallel Search Verification",
      subtitle: "Open-Web Trademark & Brand Verification",
      desc: "The Research Agent formulates 3 targeted queries and calls the Parallel Search API to gather live web evidence from USPTO and commercial domain registries.",
      tab: "case-workspace",
      badge: "Parallel Track"
    },
    {
      title: "5. Entity Fictionalization Protocol",
      subtitle: "Generate Candidate & Verify Conflicts",
      desc: "User selects 'Fictionalize Brand'. Gemini proposes 'Harbor Brew', Parallel checks for commercial conflicts, and the human supervisor approves the replacement.",
      tab: "case-workspace",
      badge: "AI + Parallel"
    },
    {
      title: "6. The Propagation Audit",
      subtitle: "'The script is fixed. The production isn't.'",
      desc: "CLEARCUT checks downstream assets across the production. Even though Scene 42 script is updated, Storyboard 42B, Prop Cup P-018, and Rough Cut 00:42:17 still show the old brand.",
      tab: "propagation",
      badge: "Propagation Audit"
    },
    {
      title: "7. Studio Clearance Memorandum",
      subtitle: "Automated Legal Deliverable",
      desc: "Export the official Revision Clearance Memo summarizing compared revisions, Parallel citations, human approvals, and pending production tasks.",
      tab: "deliverables",
      badge: "Deliverables"
    }
  ];

  const activeStep = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      onSelectStep(next);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      onSelectStep(prev);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center text-white font-mono font-bold text-xs">
              CC
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-zinc-950 uppercase tracking-wider">
                CLEARCUT Walkthrough Guide
              </h2>
              <p className="text-[11px] text-zinc-500 font-mono">Beat {currentStep + 1} of {steps.length}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs text-zinc-700">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 font-bold uppercase border border-zinc-200">
                {activeStep.badge}
              </span>
              <span className="text-zinc-400">• {activeStep.subtitle}</span>
            </div>
            <h3 className="text-base font-black text-zinc-950 font-sans pt-1">{activeStep.title}</h3>
          </div>

          <p className="text-xs text-zinc-600 bg-zinc-50 p-4 rounded-xl border border-zinc-200 leading-relaxed font-sans">
            {activeStep.desc}
          </p>

          {/* Step Indicators */}
          <div className="flex items-center justify-center space-x-1.5 py-1">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentStep(idx);
                  onSelectStep(idx);
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStep ? 'w-6 bg-black' : 'w-2 bg-zinc-200 hover:bg-zinc-300'
                }`}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                currentStep === 0 ? 'text-zinc-300 cursor-not-allowed' : 'text-zinc-700 hover:bg-zinc-100 cursor-pointer'
              }`}
            >
              Previous
            </button>

            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs flex items-center space-x-2 transition cursor-pointer shadow-sm"
            >
              <span>{currentStep === steps.length - 1 ? 'Finish Tour' : 'Next Beat'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
