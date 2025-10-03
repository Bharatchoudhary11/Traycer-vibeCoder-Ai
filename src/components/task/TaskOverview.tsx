import { useMemo } from 'react';
import { TraycerTask } from '../../lib/types';
import './TaskOverview.css';

interface TaskOverviewProps {
  task: TraycerTask;
  sections: Array<{ id: string; title: string }>;
}

export function TaskOverview({ task, sections }: TaskOverviewProps) {
  const planSummary = useMemo(() => {
    const total = task.plan.length;
    const done = task.plan.filter((step) => step.status === 'done').length;
    const inProgress = task.plan.filter((step) => step.status === 'in-progress').length;
    return { total, done, inProgress };
  }, [task.plan]);

  return (
    <div className="task-overview">
      <div className="task-overview__header">
        <h1>{task.title}</h1>
        <p>{task.prompt}</p>
      </div>
      <div className="task-overview__meta">
        <dl>
          <div>
            <dt>Created</dt>
            <dd>{new Date(task.createdAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt>Plan Steps</dt>
            <dd>
              {planSummary.done}/{planSummary.total} · {planSummary.inProgress} active
            </dd>
          </div>
          <div>
            <dt>Code Changes</dt>
            <dd>{task.changes.length}</dd>
          </div>
        </dl>
      </div>
      <nav className="task-overview__nav">
        <span>Workspace</span>
        <ul>
          {sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`}>{section.title}</a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
