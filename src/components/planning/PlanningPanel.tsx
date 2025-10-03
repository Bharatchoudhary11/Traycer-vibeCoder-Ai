import { FormEvent, useEffect, useMemo, useState } from 'react';
import { PlanGenerationOptions, PlanStepStatus, TraycerTask } from '../../lib/types';
import { AiStageState } from '../../hooks/useTraycerWorkspace';
import { describeProvider } from '../../lib/aiBridge';
import '../common/panel.css';
import '../common/badge.css';
import '../common/ai-status.css';
import './PlanningPanel.css';

const PLAN_STATUSES: PlanStepStatus[] = ['todo', 'in-progress', 'done'];

interface PlanningPanelProps {
  task: TraycerTask;
  aiState: AiStageState;
  onGeneratePlan: (options: PlanGenerationOptions) => Promise<void> | void;
  onUpdatePlanStepStatus: (stepId: string, status: PlanStepStatus) => void;
}

export function PlanningPanel({ task, aiState, onGeneratePlan, onUpdatePlanStepStatus }: PlanningPanelProps) {
  const [promptText, setPromptText] = useState(task.prompt);
  const [focusText, setFocusText] = useState('planning, implementation, review');
  const [emphasizeTests, setEmphasizeTests] = useState(true);
  const [tone, setTone] = useState<PlanGenerationOptions['tone']>('detailed');

  useEffect(() => {
    setPromptText(task.prompt);
  }, [task.prompt]);

  const planSummary = useMemo(() => {
    const total = task.plan.length;
    const done = task.plan.filter((step) => step.status === 'done').length;
    const inProgress = task.plan.filter((step) => step.status === 'in-progress').length;
    const progress = total > 0 ? done / total : 0;
    return { total, done, inProgress, progress };
  }, [task.plan]);

  const planLookup = useMemo(() => {
    const lookup = new Map<string, { title: string; index: number }>();
    task.plan.forEach((step, index) => {
      lookup.set(step.id, { title: step.title, index: index + 1 });
    });
    return lookup;
  }, [task.plan]);

  const plannerProvider = useMemo(() => describeProvider(aiState.provider), [aiState.provider]);
  const plannerMessage = aiState.error ?? aiState.message ?? 'Ready to generate a plan.';
  const plannerWarning = aiState.warning;
  const plannerTimestamp = useMemo(
    () => (aiState.updatedAt ? new Date(aiState.updatedAt).toLocaleTimeString() : undefined),
    [aiState.updatedAt]
  );
  const isGenerating = aiState.status === 'loading';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const focusAreas = focusText
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    onGeneratePlan({
      prompt: promptText,
      focusAreas,
      emphasizeTests,
      tone
    });
  };

  return (
    <div className="panel planning-panel">
      <header className="panel__header">
        <h2>Plan</h2>
        <p>Design the execution strategy before touching code.</p>
      </header>

      <div className={`ai-status-strip ai-status-strip--${aiState.status}`} aria-live="polite">
        <span className="ai-status-strip__dot" aria-hidden />
        <div className="ai-status-strip__content">
          <div className="ai-status-strip__row">
            <span className="ai-status-strip__label">AI planner</span>
            <span className="ai-status-strip__provider">{plannerProvider}</span>
            {plannerTimestamp ? (
              <span className="ai-status-strip__timestamp">Updated {plannerTimestamp}</span>
            ) : null}
          </div>
          <span className={`ai-status-strip__message ${aiState.status === 'error' ? 'ai-status-strip__message--error' : ''}`}>
            {plannerMessage}
          </span>
          {plannerWarning ? <span className="ai-status-strip__warning">Fallback: {plannerWarning}</span> : null}
        </div>
      </div>

      {task.plan.length ? (
        <div className="plan-progress" aria-live="polite">
          <div className="plan-progress__meta">
            <strong>{planSummary.done}</strong>
            <span>Complete</span>
          </div>
          <div className="plan-progress__bar">
            <span style={{ width: `${Math.round(planSummary.progress * 100)}%` }} />
          </div>
          <div className="plan-progress__meta plan-progress__meta--secondary">
            <strong>{planSummary.inProgress}</strong>
            <span>In progress</span>
          </div>
        </div>
      ) : null}

      {task.plan.length ? (
        <ol className="plan-timeline">
          {task.plan.map((step, index) => (
            <li key={step.id} className={`plan-timeline__item plan-timeline__item--${step.status}`}>
              <span className="plan-timeline__index">{index + 1}</span>
              <div className="plan-timeline__copy">
                <span className="plan-timeline__title">{step.title}</span>
                {step.blockedBy ? (
                  <span className="plan-timeline__blocked">
                    {(() => {
                      const blocked = planLookup.get(step.blockedBy);
                      return blocked
                        ? `Blocked by step ${blocked.index}: ${blocked.title}`
                        : `Blocked by step ${step.blockedBy}`;
                    })()}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      <form className="plan-form" onSubmit={handleSubmit}>
        <label className="plan-form__group">
          <span>Task prompt</span>
          <textarea
            value={promptText}
            onChange={(event) => setPromptText(event.target.value)}
            rows={4}
            required
          />
        </label>

        <div className="plan-form__row">
          <label className="plan-form__group">
            <span>Focus areas</span>
            <input
              type="text"
              value={focusText}
              onChange={(event) => setFocusText(event.target.value)}
              placeholder="planning, implementation, review"
            />
          </label>

          <label className="plan-form__group plan-form__group--select">
            <span>Tone</span>
            <select value={tone} onChange={(event) => setTone(event.target.value as PlanGenerationOptions['tone'])}>
              <option value="succinct">Succinct</option>
              <option value="detailed">Detailed</option>
            </select>
          </label>
        </div>

        <label className="plan-form__checkbox">
          <input
            type="checkbox"
            checked={emphasizeTests}
            onChange={(event) => setEmphasizeTests(event.target.checked)}
          />
          <span>Highlight test and validation expectations</span>
        </label>

        <div className="plan-form__actions">
          <button type="submit" className="primary" disabled={isGenerating}>
            {isGenerating ? 'Generating…' : 'Generate AI plan'}
          </button>
          <span className="plan-form__summary">
            {planSummary.done}/{planSummary.total} complete &middot; {planSummary.inProgress} in progress
          </span>
        </div>
      </form>

      <ul className="plan-list">
        {task.plan.map((step) => (
          <li key={step.id}>
            <div className="plan-list__step">
              <div className="plan-list__copy">
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </div>
              <label className="plan-list__status">
                <span>Status</span>
                <select
                  value={step.status}
                  onChange={(event) => onUpdatePlanStepStatus(step.id, event.target.value as PlanStepStatus)}
                >
                  {PLAN_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </li>
        ))}
        <li className="plan-list__validation">
          <div className="plan-list__step plan-list__step--validation">
            <div className="plan-list__copy">
              <h3>Validate with automated tests</h3>
              <p>
                Ensure new behaviour is covered by automated tests and capture the validation notes alongside the
                implementation changes before marking the work ready for review.
              </p>
            </div>
            <div className="plan-list__status plan-list__status--validation">
              <span>Expectation</span>
              <span className="badge badge--required">Always</span>
            </div>
          </div>
        </li>
      </ul>
    </div>
  );
}
