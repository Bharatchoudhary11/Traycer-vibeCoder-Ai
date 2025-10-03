import { nanoid } from './id';
import {
  CodeChange,
  ImplementationSeedOptions,
  PlanGenerationOptions,
  PlanStep,
  ReviewComment,
  ReviewRunOptions
} from './types';

function sentenceCase(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function generatePlanFromPrompt(options: PlanGenerationOptions): PlanStep[] {
  const focusList = options.focusAreas?.length ? options.focusAreas.join(', ') : 'core Traycer flows';
  const tone = options.tone ?? 'succinct';
  const detailPrefix = tone === 'detailed' ? 'Detail' : 'Outline';

  const emphasiseTests = options.emphasizeTests
    ? 'Include test impact for each change and ensure review captures regressions.'
    : 'Call out testing strategy and manual validation anchors.';

  const base: Array<{ title: string; detail: string }> = [
    {
      title: 'Clarify success metrics',
      detail: `${detailPrefix} the desired outcomes of the task: ${sentenceCase(options.prompt)} ` +
        `and decide how you will measure success (${focusList}).`
    },
    {
      title: 'Map workflows to surfaces',
      detail: `${detailPrefix} how planning, implementation, and review interactions surface in the UI. ` +
        'Identify the components and shared state that need to collaborate.'
    },
    {
      title: 'Implement guided execution tools',
      detail: `Describe edits required to support Traycer Tasks: planning wizard, change tracking, and workspace telemetry. Focus on ${focusList}.`
    },
    {
      title: 'Enable continuous reviews',
      detail: `${detailPrefix} the review loop with incremental feedback and action tracking. ${emphasiseTests}`
    }
  ];

  return base.map((entry) => ({
    id: nanoid(),
    title: entry.title,
    detail: entry.detail,
    status: 'todo'
  }));
}

export function generateImplementationSketch(
  plan: PlanStep[],
  options?: ImplementationSeedOptions
): CodeChange[] {
  if (!plan.length) {
    return [];
  }

  const planStepIds = options?.relatedPlanStepIds ?? plan.map((step) => step.id);

  const changes: CodeChange[] = [
    {
      id: nanoid(),
      filePath: 'src/components/planning/PlanningPanel.tsx',
      summary: 'Wire plan generation controls into the planning surface',
      rationale:
        'Expose Traycer plan prompts, allow editing focus areas, and persist AI-produced steps with status toggles.',
      before: `// PlanningPanel currently renders static plan steps.
// Need to add controls for AI plan generation and status editing.
`,
      after: `// Pseudocode for new implementation
function PlanningPanel() {
  // render form -> collect prompt + focus
  // invoke workspace.generatePlan
  // render list with editable statuses and notes
}
`,
      status: 'draft',
      relatedPlanStepIds: planStepIds.slice(0, 2)
    },
    {
      id: nanoid(),
      filePath: 'src/components/implementation/ImplementationPanel.tsx',
      summary: 'Add multi-file change composer with diff preview',
      rationale:
        'Provide editors for “before” and “after” code, linked to plan steps and ready states for review.',
      before: `// ImplementationPanel shows empty state only.
// Need to add change cards, editable summaries, and status transitions.
`,
      after: `// Pseudocode for change composer
function ImplementationPanel() {
  // map over task.changes
  // show editable metadata + textareas for code diff
  // include status menu + related plan steps
}
`,
      status: 'draft',
      relatedPlanStepIds: planStepIds.slice(1, 3)
    },
    {
      id: nanoid(),
      filePath: 'src/components/review/ReviewPanel.tsx',
      summary: 'Implement incremental review feedback tiles',
      rationale:
        'Surface AI review comments, allow resolving items, and capture follow-up actions with severity tags.',
      before: `// ReviewPanel only shows a basic list.
// Need AI trigger, severity filtering, and resolve controls.
`,
      after: `// Pseudocode for review feedback
function ReviewPanel() {
  // trigger workspace.runReview
  // render comments grouped by severity
  // allow resolve/unresolve actions
}
`,
      status: 'draft',
      relatedPlanStepIds: planStepIds.slice(2)
    }
  ];

  return changes;
}

export function generateReviewComments(
  changes: CodeChange[],
  options?: ReviewRunOptions
): ReviewComment[] {
  if (!changes.length) {
    return [];
  }

  const strict = options?.strictness === 'paranoid';

  return changes.flatMap((change) => {
    const comments: ReviewComment[] = [];

    if (change.status !== 'ready') {
      comments.push({
        id: nanoid(),
        filePath: change.filePath,
        severity: 'warning',
        message:
          'Change is not marked as ready. Confirm the reasoning is complete or flip the status before requesting review.',
        suggestion: `Consider updating status on ${change.filePath} to \`ready\` once manual checks pass.`,
        resolved: false
      });
    }

    if (strict) {
      comments.push({
        id: nanoid(),
        filePath: change.filePath,
        severity: 'error',
        message:
          'Strict mode: ensure automated tests cover the new behaviour and document validation notes alongside the change.',
        suggestion: 'Add a bullet in the implementation plan for test coverage or include test diffs in this change.',
        resolved: false
      });
    } else {
      comments.push({
        id: nanoid(),
        filePath: change.filePath,
        severity: 'info',
        message: 'Double-check the rationale ties back to the originating plan steps for traceability.',
        resolved: false
      });
    }

    return comments;
  });
}
