import { useMemo } from 'react';
import { ReviewRunOptions, TraycerTask } from '../../lib/types';
import '../common/panel.css';
import '../common/empty-state.css';
import './ReviewPanel.css';

interface ReviewPanelProps {
  task: TraycerTask;
  onRunReview: (options?: ReviewRunOptions) => void;
  onToggleResolved: (reviewId: string) => void;
}

export function ReviewPanel({ task, onRunReview, onToggleResolved }: ReviewPanelProps) {
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

  const runBalancedReview = () => onRunReview({ strictness: 'balanced' });
  const runStrictReview = () => onRunReview({ strictness: 'paranoid' });

  return (
    <div className="panel review-panel">
      <header className="panel__header">
        <h2>Review</h2>
        <p>Catch regressions early with incremental feedback.</p>
      </header>

      <div className="review-toolbar">
        <button type="button" className="secondary" onClick={runBalancedReview}>
          Run review
        </button>
        <button type="button" className="secondary" onClick={runStrictReview}>
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
