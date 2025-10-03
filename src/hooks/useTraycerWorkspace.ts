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
  AiProvider,
  describeProvider,
  getPreferredProvider,
  requestImplementationSketch,
  requestPlan,
  requestReviewComments
} from '../lib/aiBridge';
import { nanoid } from '../lib/id';

export type AiCallStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AiStageState {
  status: AiCallStatus;
  provider: AiProvider;
  message?: string;
  warning?: string;
  error?: string;
  updatedAt?: string;
}

export interface AiStatusMap {
  provider: AiProvider;
  planning: AiStageState;
  implementation: AiStageState;
  review: AiStageState;
}

export interface TraycerWorkspaceApi {
  task: TraycerTask;
  aiStatus: AiStatusMap;
  regeneratePlan: (options: PlanGenerationOptions) => Promise<void>;
  updatePlanStepStatus: (stepId: string, status: PlanStepStatus) => void;
  seedImplementation: (options?: ImplementationSeedOptions) => Promise<void>;
  addManualChange: (change: Pick<CodeChange, 'filePath' | 'summary' | 'rationale'> & {
    before?: string;
    after?: string;
    relatedPlanStepIds?: string[];
  }) => void;
  updateCodeChange: (changeId: string, patch: Partial<Omit<CodeChange, 'id'>>) => void;
  updateCodeChangeStatus: (changeId: string, status: CodeChangeStatus) => void;
  markAllChangesReady: () => void;
  removeCodeChange: (changeId: string) => void;
  runReview: (options?: ReviewRunOptions) => Promise<void>;
  toggleReviewResolved: (reviewId: string) => void;
  clearWorkspace: () => void;
}

export function useTraycerWorkspace(): TraycerWorkspaceApi {
  const [task, setTask] = useState<TraycerTask>(() => createInitialTask());

  const createInitialStage = useCallback(
    (provider: AiProvider): AiStageState => ({
      status: 'idle',
      provider,
      message: `Idle · ${describeProvider(provider)}`,
      warning: undefined,
      error: undefined,
      updatedAt: undefined
    }),
    []
  );

  const createInitialStatus = useCallback(
    (provider: AiProvider): AiStatusMap => ({
      provider,
      planning: createInitialStage(provider),
      implementation: createInitialStage(provider),
      review: createInitialStage(provider)
    }),
    [createInitialStage]
  );

  const [aiStatus, setAiStatus] = useState<AiStatusMap>(() => createInitialStatus(getPreferredProvider()));

  type AiStage = 'planning' | 'implementation' | 'review';

  const updateAiStage = useCallback(
    (stage: AiStage, patch: Partial<AiStageState>) => {
      setAiStatus((current) => {
        const { provider, ...rest } = patch;
        const baseStage = current[stage];
        const updatedStage: AiStageState = {
          ...baseStage,
          ...rest,
          provider: provider ?? baseStage.provider
        };

        return {
          provider: provider ?? current.provider,
          planning: stage === 'planning' ? updatedStage : current.planning,
          implementation: stage === 'implementation' ? updatedStage : current.implementation,
          review: stage === 'review' ? updatedStage : current.review
        };
      });
    },
    []
  );

  const regeneratePlan = useCallback(
    async (options: PlanGenerationOptions) => {
      updateAiStage('planning', {
        status: 'loading',
        message: 'Generating plan…',
        warning: undefined,
        error: undefined
      });

      try {
        const result = await requestPlan(options);
        setTask((current) => ({
          ...current,
          prompt: options.prompt,
          plan: result.plan,
          changes: [],
          reviews: []
        }));
        updateAiStage('planning', {
          status: 'success',
          provider: result.provider,
          message:
            result.note ??
            `Plan updated with ${result.plan.length} step${result.plan.length === 1 ? '' : 's'}.`,
          warning: result.warning,
          error: undefined,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Plan generation failed', error);
        updateAiStage('planning', {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unable to generate plan.',
          message: undefined,
          updatedAt: new Date().toISOString()
        });
      }
    },
    [updateAiStage]
  );

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

  const seedImplementation = useCallback(
    async (options?: ImplementationSeedOptions) => {
      updateAiStage('implementation', {
        status: 'loading',
        message: 'Synthesising implementation sketch…',
        warning: undefined,
        error: undefined
      });

      try {
        const result = await requestImplementationSketch(task.plan, options);
        setTask((current) => ({
          ...current,
          changes: (() => {
            const aiChanges = result.changes;
            if (!current.changes.length) {
              return aiChanges;
            }

            const existingPaths = new Set(current.changes.map((change) => change.filePath));
            const filtered = aiChanges.filter((change) => !existingPaths.has(change.filePath));
            return [...current.changes, ...filtered];
          })(),
          reviews: []
        }));
        updateAiStage('implementation', {
          status: 'success',
          provider: result.provider,
          message:
            result.note ??
            `Seeded ${result.changes.length} change${result.changes.length === 1 ? '' : 's'}.`,
          warning: result.warning,
          error: undefined,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Implementation seeding failed', error);
        updateAiStage('implementation', {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unable to seed implementation.',
          message: undefined,
          updatedAt: new Date().toISOString()
        });
      }
    },
    [task.plan, updateAiStage]
  );

  const addManualChange = useCallback(
    (change: Pick<CodeChange, 'filePath' | 'summary' | 'rationale'> & {
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
    },
    []
  );

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

  const updateCodeChangeStatus = useCallback(
    (changeId: string, status: CodeChangeStatus) => {
      updateCodeChange(changeId, { status });
    },
    [updateCodeChange]
  );

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
    updateAiStage('review', {
      status: 'idle',
      message: 'All changes marked ready for review.',
      warning: undefined,
      error: undefined,
      updatedAt: new Date().toISOString()
    });
  }, [updateAiStage]);

  const removeCodeChange = useCallback((changeId: string) => {
    setTask((current) => {
      const changes = current.changes.filter((change) => change.id !== changeId);
      const remainingPaths = new Set(changes.map((change) => change.filePath));

      return {
        ...current,
        changes,
        reviews: current.reviews.filter((review) => remainingPaths.has(review.filePath))
      };
    });
  }, []);

  const runReview = useCallback(
    async (options?: ReviewRunOptions) => {
      updateAiStage('review', {
        status: 'loading',
        message: 'Requesting review feedback…',
        warning: undefined,
        error: undefined
      });

      try {
        const result = await requestReviewComments(task.changes, options);
        setTask((current) => ({
          ...current,
          reviews: result.reviews
        }));
        updateAiStage('review', {
          status: 'success',
          provider: result.provider,
          message:
            result.note ??
            `Received ${result.reviews.length} review item${result.reviews.length === 1 ? '' : 's'}.`,
          warning: result.warning,
          error: undefined,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Review run failed', error);
        updateAiStage('review', {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unable to run review.',
          message: undefined,
          updatedAt: new Date().toISOString()
        });
      }
    },
    [task.changes, updateAiStage]
  );

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
    setAiStatus(createInitialStatus(getPreferredProvider()));
  }, [createInitialStatus]);

  return useMemo(
    () => ({
      task,
      aiStatus,
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
      aiStatus,
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
