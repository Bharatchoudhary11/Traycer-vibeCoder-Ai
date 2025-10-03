import { nanoid } from './id';
import { PlanStep, TraycerTask } from './types';

const demoPlan: PlanStep[] = [
  {
    id: nanoid(),
    title: 'Inspect repository layout',
    detail: 'Review existing project structure to identify affected modules and touchpoints.',
    status: 'todo'
  },
  {
    id: nanoid(),
    title: 'Draft execution plan',
    detail: 'Outline implementation strategy, covering planning, editing, and review flows.',
    status: 'todo'
  },
  {
    id: nanoid(),
    title: 'Implement Traycer UI',
    detail: 'Create planning board, code change editor, and review feedback surfaces.',
    status: 'todo'
  }
];

export function createInitialTask(): TraycerTask {
  return {
    id: nanoid(),
    title: 'Scaffold Traycer Assistant',
    prompt:
      'Build an AI-powered coding assistant that plans, implements, and reviews every change. Traycer Tasks simplify complex changes by planning large refactors and making precise edits across multiple files. Traycer Reviews provide incremental feedback to catch and fix bugs in real-time.',
    plan: demoPlan,
    changes: [],
    reviews: [],
    createdAt: new Date().toISOString()
  };
}
