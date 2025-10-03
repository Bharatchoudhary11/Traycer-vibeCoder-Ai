import { FormEvent, useMemo, useState } from 'react';
import { CodeChange, CodeChangeStatus, ImplementationSeedOptions, TraycerTask } from '../../lib/types';
import '../common/panel.css';
import '../common/badge.css';
import '../common/empty-state.css';
import './ImplementationPanel.css';

const CHANGE_STATUSES: CodeChangeStatus[] = ['draft', 'ready', 'in-review'];

interface ManualChangeDraft {
  filePath: string;
  summary: string;
  rationale: string;
}

interface ImplementationPanelProps {
  task: TraycerTask;
  onSeedChanges: (options?: ImplementationSeedOptions) => void;
  onAddManualChange: (
    change: ManualChangeDraft & {
      before?: string;
      after?: string;
      relatedPlanStepIds?: string[];
    }
  ) => void;
  onUpdateChange: (id: string, patch: Partial<Omit<CodeChange, 'id'>>) => void;
  onUpdateChangeStatus: (id: string, status: CodeChangeStatus) => void;
  onMarkAllReady: () => void;
  onRemoveChange: (id: string) => void;
}

export function ImplementationPanel({
  task,
  onSeedChanges,
  onAddManualChange,
  onUpdateChange,
  onUpdateChangeStatus,
  onMarkAllReady,
  onRemoveChange
}: ImplementationPanelProps) {
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualDraft, setManualDraft] = useState<ManualChangeDraft>({
    filePath: 'src/',
    summary: '',
    rationale: ''
  });

  const planLookup = useMemo(() => {
    const entries = new Map<string, string>();
    task.plan.forEach((step) => entries.set(step.id, step.title));
    return entries;
  }, [task.plan]);

  const stats = useMemo(() => {
    const total = task.changes.length;
    const ready = task.changes.filter((change) => change.status === 'ready').length;
    const draft = task.changes.filter((change) => change.status === 'draft').length;
    const inReview = task.changes.filter((change) => change.status === 'in-review').length;
    return { total, ready, draft, inReview };
  }, [task.changes]);

  const hasPendingStatuses = stats.total > 0 && (stats.draft > 0 || stats.inReview > 0);

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!manualDraft.summary.trim()) {
      return;
    }

    onAddManualChange({
      ...manualDraft,
      before: '// outline current behaviour',
      after: '// describe intended change'
    });
    setManualDraft({ filePath: 'src/', summary: '', rationale: '' });
    setShowManualForm(false);
  };

  const handleSeed = () => {
    onSeedChanges({ relatedPlanStepIds: task.plan.map((step) => step.id) });
  };

  return (
    <div className="panel implementation-panel">
      <header className="panel__header">
        <h2>Implement</h2>
        <p>Track precise edits, rationale, and readiness for review.</p>
      </header>

      <div className="implementation-toolbar">
        <button type="button" className="secondary" onClick={handleSeed}>
          Seed from plan
        </button>
        <button type="button" className="secondary" onClick={() => setShowManualForm((value) => !value)}>
          {showManualForm ? 'Cancel manual change' : 'Add manual change'}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={onMarkAllReady}
          disabled={!hasPendingStatuses}
        >
          Mark all ready
        </button>
        <div className="implementation-toolbar__summary">
          <span>Total: {stats.total}</span>
          <span>Ready: {stats.ready}</span>
          <span>Draft: {stats.draft}</span>
          <span>In review: {stats.inReview}</span>
        </div>
      </div>

      {showManualForm ? (
        <form className="manual-change" onSubmit={handleManualSubmit}>
          <div className="manual-change__row">
            <label>
              <span>File path</span>
              <input
                type="text"
                value={manualDraft.filePath}
                onChange={(event) => setManualDraft((draft) => ({ ...draft, filePath: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Summary</span>
              <input
                type="text"
                value={manualDraft.summary}
                onChange={(event) => setManualDraft((draft) => ({ ...draft, summary: event.target.value }))}
                required
              />
            </label>
          </div>
          <label>
            <span>Rationale</span>
            <textarea
              value={manualDraft.rationale}
              rows={3}
              onChange={(event) => setManualDraft((draft) => ({ ...draft, rationale: event.target.value }))}
              placeholder="What outcome does this change support?"
            />
          </label>
          <div className="manual-change__actions">
            <button type="submit" className="primary">
              Create change
            </button>
          </div>
        </form>
      ) : null}

      {task.changes.length === 0 ? (
        <div className="empty-state">
          <strong>No code changes yet.</strong>
          <span>Seed from the plan or add a manual change to begin implementation.</span>
        </div>
      ) : (
        <ul className="changes-list">
          {task.changes.map((change) => (
            <li key={change.id}>
              <article className="change-card">
                <header>
                  <div className="change-card__meta">
                    <input
                      className="change-card__file"
                      value={change.filePath}
                      onChange={(event) => onUpdateChange(change.id, { filePath: event.target.value })}
                    />
                    <select
                      value={change.status}
                      onChange={(event) => onUpdateChangeStatus(change.id, event.target.value as CodeChangeStatus)}
                    >
                      {CHANGE_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="change-card__status">
                    <span className={`badge badge--${change.status}`}>{change.status}</span>
                    <button
                      type="button"
                      className="change-card__remove"
                      onClick={() => onRemoveChange(change.id)}
                    >
                      Remove change
                    </button>
                  </div>
                </header>

                <label className="change-card__field">
                  <span>Summary</span>
                  <input
                    type="text"
                    value={change.summary}
                    onChange={(event) => onUpdateChange(change.id, { summary: event.target.value })}
                  />
                </label>

                <label className="change-card__field">
                  <span>Rationale</span>
                  <textarea
                    value={change.rationale}
                    rows={3}
                    onChange={(event) => onUpdateChange(change.id, { rationale: event.target.value })}
                  />
                </label>

                <div className="change-card__code">
                  <label>
                    <span>Before</span>
                    <textarea value={change.before} rows={6} readOnly />
                  </label>
                  <label>
                    <span>After</span>
                    <textarea
                      value={change.after}
                      rows={6}
                      onChange={(event) => onUpdateChange(change.id, { after: event.target.value })}
                    />
                  </label>
                </div>

                {change.relatedPlanStepIds.length ? (
                  <div className="change-card__related">
                    <span>Related plan steps</span>
                    <ul>
                      {change.relatedPlanStepIds.map((relatedId) => (
                        <li key={relatedId}>{planLookup.get(relatedId) ?? relatedId}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
