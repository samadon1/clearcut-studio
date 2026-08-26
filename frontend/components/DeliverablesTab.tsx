'use client';

import React, { useState } from 'react';
import { 
  FileCheck2, 
  Printer, 
  Download, 
  Share2, 
  CheckCircle2, 
  ShieldCheck, 
  Building2,
  FileText,
  Copy,
  ExternalLink
} from 'lucide-react';

export const DeliverablesTab: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Case ID,Scene,Entity,Category,Status,Parallel Verification,Resolution\n" +
      "C-184,Scene 42,Northstar Coffee,TRADEMARK,ACTION_REQUIRED,3 USPTO Citations,Fictionalize to Harbor Brew\n" +
      "C-112,Scene 12,Gallery Stencil Canvas,ARTWORK,CLEARED,Signed Release Verified,Work-for-Hire on File\n" +
      "C-109,Scene 1,Downtown Taxi Sign,LOCATION_SIGN,CLEARED,Public Domain,Incidental Background\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "CLEARCUT_Paramount_TheLastCup_Clearance_DOOD.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJSON = () => {
    const jsonContent = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      production: "The Last Cup",
      studio: "Paramount Pictures",
      script_version: "Pink Draft v8",
      readiness: "87.4%",
      insurance_policy: "Allianz Global Entertainment E&O #88219",
      clearance_cases: [
        { id: "C-184", entity: "Northstar Coffee", category: "TRADEMARK", status: "ACTION_REQUIRED", resolution: "Harbor Brew" },
        { id: "C-112", entity: "Gallery Stencil Canvas", category: "ARTWORK", status: "CLEARED" },
        { id: "C-109", entity: "Downtown Taxi Sign", category: "LOCATION_SIGN", status: "CLEARED" }
      ]
    }, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonContent);
    link.setAttribute("download", "CLEARCUT_Compliance_Package_TheLastCup.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 font-sans max-w-5xl mx-auto text-xs">
      {/* Top Export Toolbar */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-950 tracking-tight">
            Production Clearance Memorandum & Studio Deliverables
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official legal documentation prepared for Paramount Pictures production wrap and E&O insurance underwriting.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Compliance JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Official Paramount Pictures Studio Memo Paper */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-8 sm:p-12 space-y-8 font-sans">
        {/* Memo Header */}
        <div className="border-b-2 border-slate-950 pb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-black text-lg text-slate-950 tracking-wider">
                PARAMOUNT PICTURES
              </div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                PRODUCTION LEGAL & CLEARANCE DIVISION
              </div>
            </div>

            <div className="text-right font-mono text-[11px] text-slate-500 space-y-0.5">
              <div>MEMO REF: <strong>#MEMO-2026-TLC-8821</strong></div>
              <div>DATE: <strong>AUGUST 25, 2026</strong></div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">PRODUCTION:</span>
              <strong className="text-slate-900">THE LAST CUP</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">SCRIPT DRAFT:</span>
              <strong className="text-pink-700 font-bold">PINK DRAFT V8</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">INSURER:</span>
              <strong className="text-slate-900">ALLIANZ E&O #88219</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">READINESS:</span>
              <strong className="text-emerald-700 font-bold">87.4% (CLEARED)</strong>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h2 className="font-bold text-sm text-slate-950 uppercase tracking-wider">
            1. EXECUTIVE CLEARANCE SUMMARY
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed font-sans">
            CLEARCUT has completed automated semantic collation and revision clearance analysis on <strong>Pink Draft v8</strong> against locked baseline <strong>Blue Draft v7</strong>. A total of 19 revisions were ingested. 16 routine narrative and dialogue polish edits were verified to introduce zero IP liability.
          </p>
        </div>

        {/* Invalidation & Resolution */}
        <div className="space-y-3">
          <h2 className="font-bold text-sm text-slate-950 uppercase tracking-wider">
            2. ACTIONABLE INVALIDATION & BRAND FICTIONALIZATION
          </h2>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-sans">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
              <span>Scene 42 • Case C-184: Northstar Coffee (Supersedes C-137)</span>
              <span className="text-rose-700 font-mono">ACTION REQUIRED</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pink Draft v8 introduced "Northstar Coffee" replacing the fictional "Bean House". Parallel Search retrieved 3 live USPTO Class 030/043 registrations for Northstar Coffee. Fictional candidate <strong>"Harbor Brew"</strong> has been verified with 0 commercial conflicts and recommended for production use.
            </p>
          </div>
        </div>

        {/* Clearance Disposition Table */}
        <div className="space-y-3">
          <h2 className="font-bold text-sm text-slate-950 uppercase tracking-wider">
            3. PRODUCTION CLEARANCE ROSTER
          </h2>
          <table className="w-full text-left divide-y divide-slate-200 text-xs font-sans">
            <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-2">Item ID</th>
                <th className="py-2">Scene</th>
                <th className="py-2">Subject</th>
                <th className="py-2">Parallel Ground Truth</th>
                <th className="py-2 text-right">Disposition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr>
                <td className="py-2.5 font-mono font-bold text-slate-900">C-184</td>
                <td className="py-2.5 font-mono">Scene 42</td>
                <td className="py-2.5 font-bold">Northstar Coffee</td>
                <td className="py-2.5 font-mono text-slate-600">3 USPTO Registrations</td>
                <td className="py-2.5 text-right font-bold text-rose-700">Fictionalize (Harbor Brew)</td>
              </tr>
              <tr>
                <td className="py-2.5 font-mono font-bold text-slate-900">C-112</td>
                <td className="py-2.5 font-mono">Scene 12</td>
                <td className="py-2.5 font-bold">Gallery Stencil Canvas</td>
                <td className="py-2.5 font-mono text-slate-600">Work-for-hire release on file</td>
                <td className="py-2.5 text-right font-bold text-emerald-700">✓ Cleared</td>
              </tr>
              <tr>
                <td className="py-2.5 font-mono font-bold text-slate-900">C-109</td>
                <td className="py-2.5 font-mono">Scene 1</td>
                <td className="py-2.5 font-bold">Downtown Taxi Sign</td>
                <td className="py-2.5 font-mono text-slate-600">Public domain street view</td>
                <td className="py-2.5 text-right font-bold text-emerald-700">✓ Cleared</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legal Signatures */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-12 text-xs font-sans">
          <div className="space-y-6">
            <div className="text-slate-400 font-mono text-[10px]">PRODUCTION LEGAL SIGN-OFF:</div>
            <div className="font-serif italic text-base text-slate-900">Sarah Morandi</div>
            <div className="border-t border-slate-300 pt-1 text-slate-600">
              <strong>Sarah Morandi, Esq.</strong><br />
              VP, Production Legal & Clearance • Paramount Pictures
            </div>
          </div>

          <div className="space-y-6">
            <div className="text-slate-400 font-mono text-[10px]">PRODUCER / LINE PRODUCER ACKNOWLEDGEMENT:</div>
            <div className="font-serif italic text-base text-slate-900">David Fincher</div>
            <div className="border-t border-slate-300 pt-1 text-slate-600">
              <strong>David Fincher</strong><br />
              Director / Executive Producer • The Last Cup
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
