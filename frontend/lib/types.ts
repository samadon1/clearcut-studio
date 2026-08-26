export type ArtifactType = 
  | 'SCRIPT'
  | 'STORYBOARD'
  | 'PROP_IMAGE'
  | 'ARTWORK'
  | 'LOCATION_REFERENCE'
  | 'FOOTAGE'
  | 'MUSIC_CUE'
  | 'LICENSE'
  | 'RELEASE'
  | 'OTHER';

export type ClearanceCategory = 
  | 'TRADEMARK'
  | 'COPYRIGHT'
  | 'MUSIC'
  | 'ARTWORK'
  | 'PERSON_OR_LIKENESS'
  | 'BUSINESS_OR_ORGANIZATION'
  | 'PRODUCT'
  | 'LOCATION_OR_SIGNAGE'
  | 'FACTUAL_CLAIM'
  | 'DEFAMATION_REVIEW'
  | 'OFFICIAL_SYMBOL'
  | 'FOOTAGE_OR_ARCHIVAL_MEDIA'
  | 'RELEASE_OR_CONSENT'
  | 'AI_PROVENANCE'
  | 'OTHER';

export type CaseStatus = 
  | 'UNREVIEWED'
  | 'RESEARCH_REQUIRED'
  | 'RESEARCHING'
  | 'REVIEW'
  | 'COUNSEL'
  | 'CLEARED'
  | 'RESOLVED'
  | 'BLOCKED';

export type ResolutionType = 
  | 'FICTIONALIZE'
  | 'REPLACE'
  | 'REWRITE'
  | 'OBTAIN_PERMISSION'
  | 'REFER_TO_COUNSEL'
  | 'ACCEPT_PRODUCTION_DECISION'
  | 'REMOVE'
  | 'MARK_CLEARED';

export interface EvidenceSource {
  id: string;
  research_run_id: string;
  title: string;
  url: string;
  domain: string;
  excerpt: string;
  retrieved_at: string;
  source_relevance?: string;
}

export interface ResearchRun {
  id: string;
  case_id: string;
  objective: string;
  queries: string[];
  status: string;
  started_at: string;
  completed_at?: string;
  agent_run_id?: string;
  results: EvidenceSource[];
  synthesis?: {
    entity_match_confidence?: string;
    evidence_strength?: string;
    established_facts?: string[];
    unresolved_questions?: string[];
    recommended_status?: string;
    reason?: string;
    disclaimer?: string;
  };
}

export interface Resolution {
  id: string;
  case_id: string;
  resolution_type: ResolutionType;
  proposed_by: string;
  approved_by?: string;
  replacement_value?: string;
  notes?: string;
  created_at: string;
}

export interface ClearanceCase {
  id: string;
  production_id: string;
  entity_id: string;
  category: ClearanceCategory;
  status: CaseStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  owner?: string;
  summary: string;
  reason?: string;
  created_from_change_id?: string;
  previous_case_id?: string;
  invalidated_reason?: string;
  assignee_id?: string;
  unresolved_questions: string[];
  established_facts: string[];
  recommended_action?: string;
  confidence: number;
  created_at: string;
  updated_at: string;
  latest_research?: ResearchRun;
  resolution?: Resolution;
}

export interface SemanticChangeItem {
  change_id: string;
  scene: string;
  page: number;
  change_type: string;
  old_text: string;
  new_text: string;
  old_entities: string[];
  new_entities: string[];
  clearance_impact: boolean;
  impact_categories: ClearanceCategory[];
  affected_case_ids: string[];
  explanation: string;
  recommended_next_step: string;
  confidence: number;
}

export interface RevisionAnalysisResult {
  artifact_version_from: string;
  artifact_version_to: string;
  total_changes_count: number;
  clearance_changes_count: number;
  hero_message: string;
  changes: SemanticChangeItem[];
  affected_cases: ClearanceCase[];
}

export interface PropagationItem {
  artifact_type: ArtifactType;
  artifact_id: string;
  artifact_name: string;
  version_label: string;
  location: string;
  current_status: 'RESOLVED' | 'AFFECTED_OLD_ENTITY_PRESENT' | 'PENDING_UPDATE';
  snippet_or_label: string;
  department: string;
  recommended_task: string;
}

export interface PropagationCheckResult {
  case_id: string;
  resolved_entity_name: string;
  replacement_name: string;
  status: 'COMPLETE' | 'INCOMPLETE';
  hero_message: string;
  items: PropagationItem[];
  tasks_created: boolean;
}

export interface FictionalCandidate {
  candidate_name: string;
  rational: string;
  conflict_search_queries: string[];
  conflict_found: boolean;
  conflict_confidence: string;
  conflict_summary: string;
  parallel_sources: EvidenceSource[];
  disclaimer: string;
}

export interface ProductionSummary {
  production: {
    id: string;
    title: string;
    description: string;
    status: string;
  };
  readiness: {
    total_items: number;
    cleared: number;
    review: number;
    counsel: number;
    blocked: number;
    readiness_percent: number;
    departments: {
      Script: number;
      Storyboard: number;
      Props: number;
      Footage: number;
    };
  };
  latest_revision_analysis?: RevisionAnalysisResult;
  is_custom?: boolean;
  urgent_cases: ClearanceCase[];
  all_cases: ClearanceCase[];
  audit_events: Array<{
    id: string;
    actor_type: string;
    actor_id: string;
    event_type: string;
    entity_type: string;
    entity_id: string;
    payload: Record<string, any>;
    timestamp: string;
  }>;
}
