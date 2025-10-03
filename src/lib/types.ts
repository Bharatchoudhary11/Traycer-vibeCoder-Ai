export type PlanStepStatus = 'todo' | 'in-progress' | 'done';

export interface PlanStep {
  id: string;
  title: string;
  detail: string;
  status: PlanStepStatus;
  blockedBy?: string;
}

export type CodeChangeStatus = 'draft' | 'ready' | 'in-review';

export interface CodeChange {
  id: string;
  filePath: string;
  summary: string;
  rationale: string;
  before: string;
  after: string;
  status: CodeChangeStatus;
  relatedPlanStepIds: string[];
}

export type ReviewSeverity = 'info' | 'warning' | 'error';

export interface ReviewComment {
  id: string;
  filePath: string;
  message: string;
  suggestion?: string;
  severity: ReviewSeverity;
  resolved: boolean;
  line?: number;
}

export interface TraycerTask {
  id: string;
  title: string;
  prompt: string;
  plan: PlanStep[];
  changes: CodeChange[];
  reviews: ReviewComment[];
  createdAt: string;
}

export interface PlanGenerationOptions {
  prompt: string;
  focusAreas?: string[];
  emphasizeTests?: boolean;
  tone?: 'succinct' | 'detailed';
}

export interface ImplementationSeedOptions {
  relatedPlanStepIds?: string[];
}

export interface ReviewRunOptions {
  strictness?: 'balanced' | 'paranoid';
}
