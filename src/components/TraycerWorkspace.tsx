import { useMemo } from 'react';
import { TaskOverview } from './task/TaskOverview';
import { PlanningPanel } from './planning/PlanningPanel';
import { ImplementationPanel } from './implementation/ImplementationPanel';
import { ReviewPanel } from './review/ReviewPanel';
import { WorkspaceTelemetry } from './common/WorkspaceTelemetry';
import { TraycerWorkspaceApi } from '../hooks/useTraycerWorkspace';
import './TraycerWorkspace.css';

interface TraycerWorkspaceProps {
  workspace: TraycerWorkspaceApi;
}

export function TraycerWorkspace({ workspace }: TraycerWorkspaceProps) {
  const { task, aiStatus } = workspace;
  const layoutSections = useMemo(
    () => [
      { id: 'overview', title: 'Overview' },
      { id: 'pulse', title: 'Pulse' },
      { id: 'planning', title: 'Plan' },
      { id: 'implementation', title: 'Implement' },
      { id: 'review', title: 'Review' }
    ],
    []
  );

  return (
    <div className="workspace">
      <aside className="workspace__sidebar">
        <TaskOverview task={task} sections={layoutSections} />
      </aside>
      <main className="workspace__content">
        <section className="workspace__section workspace__section--telemetry" id="pulse">
          <WorkspaceTelemetry task={task} aiStatus={aiStatus} />
        </section>
        <section className="workspace__section" id="planning">
          <PlanningPanel
            task={task}
            aiState={aiStatus.planning}
            onGeneratePlan={workspace.regeneratePlan}
            onUpdatePlanStepStatus={workspace.updatePlanStepStatus}
          />
        </section>
        <section className="workspace__section" id="implementation">
          <ImplementationPanel
            task={task}
            aiState={aiStatus.implementation}
            onSeedChanges={workspace.seedImplementation}
            onAddManualChange={workspace.addManualChange}
            onUpdateChange={workspace.updateCodeChange}
            onUpdateChangeStatus={workspace.updateCodeChangeStatus}
            onMarkAllReady={workspace.markAllChangesReady}
            onRemoveChange={workspace.removeCodeChange}
          />
        </section>
        <section className="workspace__section" id="review">
          <ReviewPanel
            task={task}
            aiState={aiStatus.review}
            onRunReview={workspace.runReview}
            onToggleResolved={workspace.toggleReviewResolved}
            onMarkAllReady={workspace.markAllChangesReady}
          />
        </section>
      </main>
    </div>
  );
}
