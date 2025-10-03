import { useMemo } from 'react';
import { ReviewRunOptions, TraycerTask } from '../../lib/types';
import { AiStageState } from '../../hooks/useTraycerWorkspace';
import { describeProvider } from '../../lib/aiBridge';
import '../common/panel.css';
import '../common/empty-state.css';
import '../common/ai-status.css';
import './ReviewPanel.css';

interface ReviewPanelProps {
  task: TraycerTask;
  aiState: AiStageState;
  onRunReview: (options?: ReviewRunOptions) => Promise<void> | void;
  onToggleResolved: (reviewId: string) => void;
  onMarkAllReady: () => void;
}

export function ReviewPanel({ task, aiState, onRunReview, onToggleResolved, onMarkAllReady }: ReviewPanelProps) {
  const stats = useMemo(() => {
    const total = task.reviews.length;
    const resolved = task.reviews.filter((item) => item.resolved).length;
    const bySeverity = task.reviews.reduce(
      (acc, item) => {
        acc[item.severity] += 1;
        return acc;
      },
      { info: 0, warning: 0, error: 0 }
    );

    return { total, resolved, bySeverity };
  }, [task.reviews]);

  const notReadyChanges = useMemo(
    () => task.changes.filter((change) => change.status !== 'ready'),
    [task.changes]
  );
  const hasReadyChanges = task.changes.some((change) => change.status === 'ready');
  const isReviewing = aiState.status === 'loading';
  const reviewerProvider = describeProvider(aiState.provider);
  const reviewerMessage = aiState.error ?? aiState.message ?? 'Run the reviewer once implementation is ready.';
  const reviewerWarning = aiState.warning;
  const reviewerTimestamp = aiState.updatedAt ? new Date(aiState.updatedAt).toLocaleTimeString() : undefined;

  const runBalancedReview = () => onRunReview({ strictness: 'balanced' });
  const runStrictReview = () => onRunReview({ strictness: 'paranoid' });

  return (
    <div className="panel review-panel">
      <header className="panel__header">
        <h2>Review</h2>
        <p>Catch regressions early with incremental feedback.</p>
      </header>

      <div className={`ai-status-strip ai-status-strip--${aiState.status}`} aria-live="polite">
        <span className="ai-status-strip__dot" aria-hidden />
        <div className="ai-status-strip__content">
          <div className="ai-status-strip__row">
            <span className="ai-status-strip__label">AI reviewer</span>
            <span className="ai-status-strip__provider">{reviewerProvider}</span>
            {reviewerTimestamp ? (
              <span className="ai-status-strip__timestamp">Updated {reviewerTimestamp}</span>
            ) : null}
          </div>
          <span className={`ai-status-strip__message ${aiState.status === 'error' ? 'ai-status-strip__message--error' : ''}`}>
            {reviewerMessage}
          </span>
          {reviewerWarning ? <span className="ai-status-strip__warning">Fallback: {reviewerWarning}</span> : null}
        </div>
      </div>

      {task.changes.length > 0 && !hasReadyChanges ? (
        <div className="review-readiness">
          <div>
            <strong>Changes still in draft</strong>
            <p>
              Mark your implementation updates as ready before requesting an AI review. This ensures the reviewer focuses on
              finalised work.
            </p>
            <ul>
              {notReadyChanges.map((change) => (
                <li key={change.id}>{change.filePath}</li>
              ))}
            </ul>
          </div>
          <button type="button" className="secondary" onClick={onMarkAllReady}>
            Mark all ready
          </button>
        </div>
      ) : null}

      <div className="review-toolbar">
        <button
          type="button"
          className="secondary"
          onClick={runBalancedReview}
          disabled={!hasReadyChanges || isReviewing}
        >
          Run review
        </button>
        <button
          type="button"
          className="secondary"
          onClick={runStrictReview}
          disabled={!hasReadyChanges || isReviewing}
        >
          Run strict review
        </button>
        <div className="review-toolbar__summary">
          <span>Total: {stats.total}</span>
          <span>Resolved: {stats.resolved}</span>
          <span>
            Info {stats.bySeverity.info} &middot; Warn {stats.bySeverity.warning} &middot; Err {stats.bySeverity.error}
          </span>
        </div>
      </div>

      {task.reviews.length === 0 ? (
        <div className="empty-state">
          <strong>No review feedback yet.</strong>
          <span>Request an AI review once there are code changes.</span>
        </div>
      ) : (
        <ul className="review-list">
          {task.reviews.map((review) => (
            <li
              key={review.id}
              className={`review-card review-card--${review.severity} ${review.resolved ? 'review-card--resolved' : ''}`}
            >
              <div className="review-card__header">
                <div>
                  <span className="review-card__tag">{review.severity.toUpperCase()}</span>
                  <span className="review-card__file">{review.filePath}</span>
                </div>
                <button type="button" className="link" onClick={() => onToggleResolved(review.id)}>
                  {review.resolved ? 'Mark unresolved' : 'Resolve'}
                </button>
              </div>
              <p>{review.message}</p>
              {review.suggestion ? <pre>{review.suggestion}</pre> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
