import { FormEvent, useEffect, useMemo, useState } from 'react';
import { PlanGenerationOptions, PlanStepStatus, TraycerTask } from '../../lib/types';
import '../common/panel.css';
import '../common/badge.css';
import './PlanningPanel.css';

const PLAN_STATUSES: PlanStepStatus[] = ['todo', 'in-progress', 'done'];

interface PlanningPanelProps {
  task: TraycerTask;
  onGeneratePlan: (options: PlanGenerationOptions) => void;
  onUpdatePlanStepStatus: (stepId: string, status: PlanStepStatus) => void;
}

export function PlanningPanel({ task, onGeneratePlan, onUpdatePlanStepStatus }: PlanningPanelProps) {
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
    return { total, done, inProgress };
  }, [task.plan]);

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
          <button type="submit" className="primary">
            Generate AI plan
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
      </ul>
    </div>
  );
}
