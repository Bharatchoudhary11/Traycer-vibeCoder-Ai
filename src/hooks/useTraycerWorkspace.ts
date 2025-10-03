import { useCallback, useMemo, useState } from 'react';
import {
  CodeChange,
  CodeChangeStatus,
  ImplementationSeedOptions,
  PlanGenerationOptions,
  PlanStepStatus,
  ReviewRunOptions,
  TraycerTask
} from '../lib/types';
import { createInitialTask } from '../lib/workspace';
import {
  generateImplementationSketch,
  generatePlanFromPrompt,
  generateReviewComments
} from '../lib/fakeAi';
import { nanoid } from '../lib/id';

export interface TraycerWorkspaceApi {
  task: TraycerTask;
  regeneratePlan: (options: PlanGenerationOptions) => void;
  updatePlanStepStatus: (stepId: string, status: PlanStepStatus) => void;
  seedImplementation: (options?: ImplementationSeedOptions) => void;
  addManualChange: (change: Pick<CodeChange, 'filePath' | 'summary' | 'rationale'> & {
    before?: string;
    after?: string;
    relatedPlanStepIds?: string[];
  }) => void;
  updateCodeChange: (changeId: string, patch: Partial<Omit<CodeChange, 'id'>>) => void;
  updateCodeChangeStatus: (changeId: string, status: CodeChangeStatus) => void;
  markAllChangesReady: () => void;
  removeCodeChange: (changeId: string) => void;
  runReview: (options?: ReviewRunOptions) => void;
  toggleReviewResolved: (reviewId: string) => void;
  clearWorkspace: () => void;
}

export function useTraycerWorkspace(): TraycerWorkspaceApi {
  const [task, setTask] = useState<TraycerTask>(() => createInitialTask());

  const regeneratePlan = useCallback((options: PlanGenerationOptions) => {
    const plan = generatePlanFromPrompt(options);
    setTask((current) => ({
      ...current,
      prompt: options.prompt,
      plan,
      changes: [],
      reviews: []
    }));
  }, []);

  const updatePlanStepStatus = useCallback((stepId: string, status: PlanStepStatus) => {
    setTask((current) => ({
      ...current,
      plan: current.plan.map((step) =>
        step.id === stepId
          ? {
              ...step,
              status
            }
          : step
      )
    }));
  }, []);

  const seedImplementation = useCallback((options?: ImplementationSeedOptions) => {
    setTask((current) => ({
      ...current,
      changes: (() => {
        const aiChanges = generateImplementationSketch(current.plan, options);
        if (!current.changes.length) {
          return aiChanges;
        }

        const existingPaths = new Set(current.changes.map((change) => change.filePath));
        const filtered = aiChanges.filter((change) => !existingPaths.has(change.filePath));
        return [...current.changes, ...filtered];
      })(),
      reviews: []
    }));
  }, []);

  const addManualChange = useCallback((change: Pick<CodeChange, 'filePath' | 'summary' | 'rationale'> & {
    before?: string;
    after?: string;
    relatedPlanStepIds?: string[];
  }) => {
    setTask((current) => ({
      ...current,
      changes: [
        ...current.changes,
        {
          id: nanoid(),
          filePath: change.filePath,
          summary: change.summary,
          rationale: change.rationale,
          before: change.before ?? '// original code snippet',
          after: change.after ?? '// proposed update',
          status: 'draft',
          relatedPlanStepIds: change.relatedPlanStepIds ?? []
        }
      ]
    }));
  }, []);

  const updateCodeChange = useCallback((changeId: string, patch: Partial<Omit<CodeChange, 'id'>>) => {
    setTask((current) => ({
      ...current,
      changes: current.changes.map((change) =>
        change.id === changeId
          ? {
              ...change,
              ...patch
            }
          : change
      )
    }));
  }, []);

  const updateCodeChangeStatus = useCallback((changeId: string, status: CodeChangeStatus) => {
    updateCodeChange(changeId, { status });
  }, [updateCodeChange]);

  const markAllChangesReady = useCallback(() => {
    setTask((current) => ({
      ...current,
      changes: current.changes.map((change) =>
        change.status === 'ready'
          ? change
          : {
              ...change,
              status: 'ready'
            }
      ),
      reviews: []
    }));
  }, []);

  const removeCodeChange = useCallback((changeId: string) => {
    setTask((current) => ({
      ...current,
      changes: current.changes.filter((change) => change.id !== changeId)
    }));
  }, []);

  const runReview = useCallback((options?: ReviewRunOptions) => {
    setTask((current) => ({
      ...current,
      reviews: generateReviewComments(current.changes, options)
    }));
  }, []);

  const toggleReviewResolved = useCallback((reviewId: string) => {
    setTask((current) => ({
      ...current,
      reviews: current.reviews.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              resolved: !review.resolved
            }
          : review
      )
    }));
  }, []);

  const clearWorkspace = useCallback(() => {
    setTask(createInitialTask());
  }, []);

  return useMemo(
    () => ({
      task,
      regeneratePlan,
      updatePlanStepStatus,
      seedImplementation,
      addManualChange,
      updateCodeChange,
      updateCodeChangeStatus,
      markAllChangesReady,
      removeCodeChange,
      runReview,
      toggleReviewResolved,
      clearWorkspace
    }),
    [
      task,
      regeneratePlan,
      updatePlanStepStatus,
      seedImplementation,
      addManualChange,
      updateCodeChange,
      updateCodeChangeStatus,
      markAllChangesReady,
      removeCodeChange,
      runReview,
      toggleReviewResolved,
      clearWorkspace
    ]
  );
}
