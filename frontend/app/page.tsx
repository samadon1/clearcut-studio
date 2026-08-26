'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ReviewRoom } from '../components/ReviewRoom';
import { Landing } from '../components/Landing';
import { WorkspaceTopBar } from '../components/WorkspaceTopBar';
import { PageTabsBar } from '../components/PageTabsBar';
import { ReportView } from '../components/ReportView';
import { ScriptView } from '../components/ScriptView';
import { StoryboardBoard } from '../components/StoryboardBoard';
import { MemoModal } from '../components/MemoModal';
import { FictionalizeModal } from '../components/FictionalizeModal';
import { RevisionModal } from '../components/RevisionModal';
import { AddMemberModal } from '../components/AddMemberModal';
import { BootSplash, WorkspaceSkeleton } from '../components/Skeletons';
import { CommandPalette } from '../components/CommandPalette';
import { ToastNotification, ToastMessage } from '../components/ToastNotification';
import {
  fetchProductionSummary,
  resetToDemoBaseline,
  analyzeRevision,
  executeParallelResearch,
  previewFictionalCandidate,
  approveResolution,
  createProject,
  ingestRevision,
  referToCounsel,
  switchProject,
} from '../lib/api';
import {
  ProductionSummary,
  RevisionAnalysisResult,
  ClearanceCase,
  FictionalCandidate,
  PropagationCheckResult,
  ResolutionType,
} from '../lib/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [summary, setSummary] = useState<ProductionSummary | null>(null);
  const [analysis, setAnalysis] = useState<RevisionAnalysisResult | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeCase, setActiveCase] = useState<ClearanceCase | null>(null);
  const [fictionalCandidate, setFictionalCandidate] = useState<FictionalCandidate | null>(null);
  const [isFictionalizeOpen, setIsFictionalizeOpen] = useState<boolean>(false);
  const [propagationResult, setPropagationResult] = useState<PropagationCheckResult | null>(null);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isCommandOpen, setIsCommandOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isAddEntityOpen, setIsAddEntityOpen] = useState<boolean>(false);
  const [isMemoOpen, setIsMemoOpen] = useState<boolean>(false);
  const [isRevisionOpen, setIsRevisionOpen] = useState<boolean>(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState<boolean>(false);
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [appView, setAppView] = useState<'landing' | 'workspace'>('landing');
  const [workspaceTab, setWorkspaceTab] = useState<'report' | 'script' | 'review' | 'storyboard'>('report');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingResearch, setIsLoadingResearch] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);

  const addToast = (type: 'success' | 'warning' | 'info', title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const hydratedRef = useRef(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [transitioning, setTransitioning] = useState<boolean>(false);

  useEffect(() => {
    // Restore the workspace across a refresh instead of dropping to the landing page.
    try {
      if (localStorage.getItem('cc-view') === 'workspace') {
        setAppView('workspace');
        const t = localStorage.getItem('cc-tab');
        if (t === 'report' || t === 'script' || t === 'review' || t === 'storyboard') setWorkspaceTab(t);
      }
    } catch { /* localStorage unavailable */ }
    hydratedRef.current = true;
    // Hold the blank ground until data is actually loaded, so a fast refresh goes
    // blank -> content with no skeleton flicker (no artificial delay).
    loadSummary().finally(() => setMounted(true));
    return () => {};
  }, []);

  // ⌘K / Ctrl+K opens the command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Persist which view/tab the user is on so a refresh keeps their place.
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem('cc-view', appView);
      localStorage.setItem('cc-tab', workspaceTab);
    } catch { /* localStorage unavailable */ }
  }, [appView, workspaceTab]);

  const handleGoHome = () => {
    setAppView('landing');
    try { localStorage.setItem('cc-view', 'landing'); } catch { /* ignore */ }
  };

  const loadSummary = async () => {
    setIsLoading(true);
    try {
      const data = await fetchProductionSummary();
      setSummary(data);
      if (data.latest_revision_analysis) {
        setAnalysis(data.latest_revision_analysis);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    try {
      const data = await resetToDemoBaseline();
      setSummary(data);
      setAnalysis(null);
      setPropagationResult(null);
      setSelectedCaseId(null);
      setActiveTab('overview');
      addToast('info', 'Reset to Baseline', 'Production state reset to locked Blue Draft v7.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryDemo = async () => {
    setTransitioning(true); setIsLoading(true);
    try {
      // Simulate a brief "building your report" moment so the loader reads as real work.
      const [data] = await Promise.all([
        resetToDemoBaseline(),
        new Promise((r) => setTimeout(r, 1700)),
      ]);
      setSummary(data);
      setAnalysis(null);
      setPropagationResult(null);
      setSelectedCaseId(null);
      setWorkspaceTab('report');
      setAppView('workspace');
    } catch (err) { console.error(err); } finally { setIsLoading(false); setTransitioning(false); }
  };

  const handleCreateProject = async (title: string, script: string) => {
    setTransitioning(true); setIsLoading(true);
    try {
      const data = await createProject(title, script);
      setSummary(data);
      setAnalysis(null);
      setPropagationResult(null);
      setSelectedCaseId(null);
      setWorkspaceTab('report');
      setAppView('workspace');
      addToast('success', 'Clearance report ready', `${data.all_cases.length} elements identified.`);
    } catch (err) {
      console.error(err);
      addToast('warning', 'Could not process script', 'Please try again.');
    } finally { setIsLoading(false); setTransitioning(false); }
  };

  const openCaseInReview = (id: string) => { handleOpenCase(id); setWorkspaceTab('review'); };

  const handleSwitchProject = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await switchProject(id);
      setSummary(data);
      setAnalysis(data.latest_revision_analysis ?? null);
      setSelectedCaseId(null);
      setActiveCase(null);
      setPropagationResult(null);
      setWorkspaceTab('report');
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  const handleReferCounsel = async (id: string) => {
    setIsApproving(true);
    try {
      await referToCounsel(id);
      const s = await fetchProductionSummary();
      setSummary(s);
      const c = s.all_cases.find((x) => x.id === id);
      if (c) setActiveCase(c);
      addToast('info', 'Referred to counsel', `${id} assigned to Entertainment Counsel.`);
    } catch (err) { console.error(err); } finally { setIsApproving(false); }
  };

  const handleAnalyzePinkV8 = async () => {
    setIsLoading(true);
    try {
      const result = await analyzeRevision('ver-script-v7', 'Pink Draft v8');
      setAnalysis(result);
      const updatedSummary = await fetchProductionSummary();
      setSummary(updatedSummary);
      setSelectedCaseId(null);
      setActiveCase(null);
      setIsRevisionOpen(false);
      setWorkspaceTab('review');
      addToast('success', 'Revision diffed', `${result.total_changes_count} changes · ${result.clearance_changes_count} affect clearance.`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIngestRevision = async (script: string) => {
    setIsLoading(true);
    try {
      const data = await ingestRevision(script);
      setSummary(data);
      setAnalysis(data.latest_revision_analysis ?? null);
      setSelectedCaseId(null);
      setActiveCase(null);
      setIsRevisionOpen(false);
      setWorkspaceTab('review');
      addToast('success', 'Revision diffed', `${data.latest_revision_analysis?.clearance_changes_count ?? 0} clearance changes found.`);
    } catch (err) {
      console.error(err);
      addToast('warning', 'Could not diff revision', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEntity = (entity: any) => {
    addToast('success', 'Entity Tracked', `"${entity.name}" added to clearance pipeline.`);
  };

  const handleOpenCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    const found = summary?.urgent_cases?.find((c) => c.id === caseId) || 
      summary?.all_cases?.find((c) => c.id === caseId) || {
        id: caseId,
        production_id: 'prod-last-cup',
        entity_id: 'ent-northstar-coffee',
        category: 'TRADEMARK' as const,
        status: 'COUNSEL' as const,
        priority: 'URGENT' as const,
        owner: 'Entertainment Counsel',
        summary: 'Northstar Coffee - Scene 42 Commercial Brand Depiction',
        reason: 'Replaces fictional Bean House in Pink Draft v8. Potentially real commercial brand and registered trademark depicted on hero cup prop.',
        previous_case_id: 'C-137',
        unresolved_questions: [
          'Confirm active commercial trademark registrations in Class 030 and Class 043.',
          'Assess whether portrayal in Scene 42 dialogue requires brand permission or fictionalization.'
        ],
        established_facts: [
          "Scene 42 script specifically references 'Northstar Coffee' Ethiopian roast.",
          "Prop Department spec sheet P-018 calls for custom embossed logo cups."
        ],
        confidence: 0.96,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    setActiveCase(found);
  };

  const handleExecuteResearch = async (caseId: string) => {
    setIsLoadingResearch(true);
    try {
      const run = await executeParallelResearch(caseId);
      if (activeCase) {
        setActiveCase({
          ...activeCase,
          latest_research: run,
        });
      }
      const updatedSummary = await fetchProductionSummary();
      setSummary(updatedSummary);
      addToast('success', 'Parallel Search Complete', 'Retrieved 3 USPTO registrations and commercial domain citations.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingResearch(false);
    }
  };

  const handleOpenFictionalize = async (caseId: string) => {
    // Open the modal immediately in a loading state, then fill it in once the agent has
    // coined a candidate and finished the live Parallel conflict check.
    setFictionalCandidate(null);
    setIsFictionalizeOpen(true);
    try {
      const candidate = await previewFictionalCandidate(caseId);
      setFictionalCandidate(candidate);
    } catch (err) {
      console.error(err);
      setIsFictionalizeOpen(false);
      addToast('warning', 'Could not propose a replacement', 'Please try again.');
    }
  };

  const resolveCase = async (caseId: string, type: ResolutionType, replacement = '') => {
    setIsApproving(true);
    try {
      const res = await approveResolution(caseId, type, replacement);
      setPropagationResult(res.propagation);
      setIsFictionalizeOpen(false);
      const s = await fetchProductionSummary();
      setSummary(s);
      if (res.case) setActiveCase(res.case);
      const label = replacement ? `"${replacement}"` : type.replace(/_/g, ' ').toLowerCase();
      addToast('success', 'Decision recorded', `${caseId} resolved · ${label}.`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsApproving(false);
    }
  };

  const handleApproveResolution = (replacementName: string) => {
    if (!selectedCaseId) return;
    resolveCase(selectedCaseId, 'FICTIONALIZE', replacementName);
  };

  const handleTourStep = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        setActiveTab('overview');
        break;
      case 1:
        handleAnalyzePinkV8();
        break;
      case 2:
        setActiveTab('revisions');
        break;
      case 3:
        handleOpenCase('C-184');
        handleExecuteResearch('C-184');
        break;
      case 4:
        handleOpenFictionalize('C-184');
        break;
      case 5:
        setActiveTab('propagation');
        break;
      case 6:
        setActiveTab('deliverables');
        break;
      default:
        break;
    }
  };

  // Blank ground until we know landing vs workspace, so refresh shows neither a landing
  // flash nor the branded splash — it resolves straight into the skeleton/content.
  if (!mounted) return <div className="h-screen w-screen bg-ink" />;

  // The branded CLEARCUT loader is reserved for the intense landing -> workspace build
  // (running the Gemini clearance extraction), not for plain refreshes or project switches.
  if (transitioning) return <BootSplash />;

  if (appView === 'landing') {
    return (
      <>
        <Landing onTryDemo={handleTryDemo} onCreateProject={handleCreateProject} isLoading={isLoading} />
        <ToastNotification toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      </>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-ink text-ivory overflow-hidden font-sans select-none antialiased">
      <WorkspaceTopBar
        title={summary?.production?.title ?? 'CLEARCUT'}
        subtitle="Clearance workspace"
        readiness={summary?.readiness?.readiness_percent ?? 0}
        openCount={summary?.urgent_cases?.length ?? 0}
        onSignOff={() => setIsMemoOpen(true)}
        onIngestRevision={() => setIsRevisionOpen(true)}
        onInvite={() => setIsAddMemberOpen(true)}
        onSwitchProject={handleSwitchProject}
        onNewProject={handleGoHome}
        onHome={handleGoHome}
        filterAssignee={filterAssignee}
        onFilterAssignee={(id) => setFilterAssignee((cur) => (cur === id ? null : id))}
        onClearFilter={() => setFilterAssignee(null)}
      />

      <div className="flex-1 min-h-0">
        {(isLoading && !summary) ? (
          <WorkspaceSkeleton />
        ) : (
        <>
        {workspaceTab === 'report' && (
          <ReportView summary={summary} onOpenCase={openCaseInReview} onGotoScript={() => setWorkspaceTab('script')} refreshKey={summary?.audit_events?.length} filterAssignee={filterAssignee} />
        )}
        {workspaceTab === 'script' && (
          <ScriptView onOpenCase={openCaseInReview} refreshKey={summary?.production?.id} />
        )}
        {workspaceTab === 'storyboard' && (
          <StoryboardBoard onOpenCase={openCaseInReview} refreshKey={summary?.production?.id} />
        )}
        {workspaceTab === 'review' && (
          <ReviewRoom
            summary={summary}
            analysis={analysis}
            activeCase={activeCase}
            selectedCaseId={selectedCaseId}
            filterAssignee={filterAssignee}
            propagation={propagationResult}
            isLoading={isLoading}
            isLoadingResearch={isLoadingResearch}
            onIngest={() => setIsRevisionOpen(true)}
            onSelectCase={handleOpenCase}
            onRunResearch={handleExecuteResearch}
            onFictionalize={handleOpenFictionalize}
            onCounsel={handleReferCounsel}
            onAccept={(id) => resolveCase(id, 'ACCEPT_PRODUCTION_DECISION')}
            onSignOff={() => setIsMemoOpen(true)}
          />
        )}
        </>
        )}
      </div>

      {/* DaVinci-style bottom page selector + status */}
      <PageTabsBar
        activeTab={workspaceTab}
        onTab={(t) => setWorkspaceTab(t as 'report' | 'script' | 'review' | 'storyboard')}
      />

      {isAddMemberOpen && (
        <AddMemberModal
          onClose={() => setIsAddMemberOpen(false)}
          onAdded={(m) => { setIsAddMemberOpen(false); addToast('success', 'Member added', `${m.name} · ${m.role} joined the team.`); }}
        />
      )}

      <CommandPalette
        open={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onTab={(t) => setWorkspaceTab(t)}
        onIngest={() => setIsRevisionOpen(true)}
        onAddMember={() => setIsAddMemberOpen(true)}
        onSignOff={() => setIsMemoOpen(true)}
        onHome={handleGoHome}
        onOpenCase={openCaseInReview}
        cases={summary?.all_cases ?? []}
      />

      <MemoModal isOpen={isMemoOpen} onClose={() => setIsMemoOpen(false)} />

      <RevisionModal
        isOpen={isRevisionOpen}
        onClose={() => setIsRevisionOpen(false)}
        onIngest={handleIngestRevision}
        onUseDemo={summary && !summary.is_custom ? handleAnalyzePinkV8 : undefined}
        isLoading={isLoading}
      />

      {/* Fictionalize Candidate & Conflict Search Modal */}
      {isFictionalizeOpen && (
        <FictionalizeModal
          candidate={fictionalCandidate}
          onClose={() => setIsFictionalizeOpen(false)}
          onApprove={handleApproveResolution}
          isApproving={isApproving}
        />
      )}

      {/* Toast Notification Stream */}
      <ToastNotification
        toasts={toasts}
        onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
      />
    </div>
  );
}
