import { useMemo } from 'react';
import { TraycerTask } from '../../lib/types';
import { AiStageState, AiStatusMap } from '../../hooks/useTraycerWorkspace';
import { describeProvider } from '../../lib/aiBridge';
import './ai-status.css';
import './WorkspaceTelemetry.css';

interface WorkspaceTelemetryProps {
  task: TraycerTask;
  aiStatus: AiStatusMap;
}

const clampRatio = (value: number) => Math.max(0, Math.min(1, value));

const stageEntries: Array<{ key: 'planning' | 'implementation' | 'review'; label: string }> = [
  { key: 'planning', label: 'Planner' },
  { key: 'implementation', label: 'Implementation' },
  { key: 'review', label: 'Reviewer' }
];

const formatPercent = (ratio: number) => `${Math.round(clampRatio(ratio) * 100)}%`;

export function WorkspaceTelemetry({ task, aiStatus }: WorkspaceTelemetryProps) {
  const planTotals = useMemo(() => {
    const total = task.plan.length;
    const done = task.plan.filter((step) => step.status === 'done').length;
    const inProgress = task.plan.filter((step) => step.status === 'in-progress').length;
    const ratio = total > 0 ? done / total : 0;
    return { total, done, inProgress, ratio };
  }, [task.plan]);

  const changeTotals = useMemo(() => {
    const total = task.changes.length;
    const ready = task.changes.filter((change) => change.status === 'ready').length;
    const ratio = total > 0 ? ready / total : 0;
    return { total, ready, ratio };
  }, [task.changes]);

  const reviewTotals = useMemo(() => {
    const total = task.reviews.length;
    const resolved = task.reviews.filter((review) => review.resolved).length;
    const ratio = total > 0 ? resolved / total : changeTotals.total === 0 ? 1 : 0;
    return { total, resolved, ratio };
  }, [task.reviews, changeTotals.total]);

  const confidenceScore = useMemo(() => {
    const weighted = planTotals.ratio * 0.4 + changeTotals.ratio * 0.35 + reviewTotals.ratio * 0.25;
    return Math.round(clampRatio(weighted) * 100);
  }, [planTotals.ratio, changeTotals.ratio, reviewTotals.ratio]);

  return (
    <section className="workspace-telemetry" aria-label="Workspace telemetry">
      <div className="workspace-telemetry__card workspace-telemetry__card--pulse">
        <header>
          <h3>Delivery pulse</h3>
          <p>Signal across plan, code, and review readiness.</p>
        </header>
        <div className="workspace-telemetry__score">
          <span className="workspace-telemetry__score-value">{confidenceScore}</span>
          <span className="workspace-telemetry__score-unit">% confidence</span>
        </div>
        <div className="workspace-telemetry__bars">
          <div className="workspace-telemetry__bar">
            <div className="workspace-telemetry__bar-header">
              <span>Plan completion</span>
              <strong>{formatPercent(planTotals.ratio)}</strong>
            </div>
            <span className="workspace-telemetry__bar-track">
              <span style={{ width: formatPercent(planTotals.ratio) }} />
            </span>
          </div>
          <div className="workspace-telemetry__bar">
            <div className="workspace-telemetry__bar-header">
              <span>Implementation ready</span>
              <strong>{formatPercent(changeTotals.ratio)}</strong>
            </div>
            <span className="workspace-telemetry__bar-track">
              <span style={{ width: formatPercent(changeTotals.ratio) }} />
            </span>
          </div>
          <div className="workspace-telemetry__bar">
            <div className="workspace-telemetry__bar-header">
              <span>Review clearance</span>
              <strong>{formatPercent(reviewTotals.ratio)}</strong>
            </div>
            <span className="workspace-telemetry__bar-track">
              <span style={{ width: formatPercent(reviewTotals.ratio) }} />
            </span>
          </div>
        </div>
      </div>

      <div className="workspace-telemetry__card workspace-telemetry__card--ai">
        <header>
          <h3>AI link status</h3>
          <p>Monitor which agent is active or running locally.</p>
        </header>
        <ul className="workspace-telemetry__ai-list">
          {stageEntries.map(({ key, label }) => {
            const state = aiStatus[key] as AiStageState;
            const timestamp = state.updatedAt ? new Date(state.updatedAt).toLocaleTimeString() : undefined;
            const message = state.error ?? state.message ?? 'Idle';

            return (
              <li
                key={label}
                className={`ai-status-strip ai-status-strip--compact ai-status-strip--${state.status}`}
                aria-live="polite"
              >
                <span className="ai-status-strip__dot" aria-hidden />
                <div className="ai-status-strip__content">
                  <div className="ai-status-strip__row">
                    <span className="ai-status-strip__label">{label}</span>
                    <span className="ai-status-strip__provider">{describeProvider(state.provider)}</span>
                    {timestamp ? <span className="ai-status-strip__timestamp">{timestamp}</span> : null}
                  </div>
                  <span
                    className={`ai-status-strip__message ${
                      state.status === 'error' ? 'ai-status-strip__message--error' : ''
                    }`}
                  >
                    {message}
                  </span>
                  {state.warning ? (
                    <span className="ai-status-strip__warning">Fallback: {state.warning}</span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
