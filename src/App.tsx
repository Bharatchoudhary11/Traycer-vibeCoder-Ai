import { useCallback, useMemo } from 'react';
import { ICommand, PlaceholderCommandBar } from './components/PlaceholderCommandBar';
import { TraycerWorkspace } from './components/TraycerWorkspace';
import { useTraycerWorkspace } from './hooks/useTraycerWorkspace';

function App() {
  const workspace = useTraycerWorkspace();
  const { clearWorkspace } = workspace;

  const commands: ICommand[] = useMemo(
    () => [
      {
        id: 'new-task',
        label: 'New Task',
        hint: '⌘ + N'
      },
      {
        id: 'open-history',
        label: 'History',
        hint: '⌘ + H'
      },
      {
        id: 'open-settings',
        label: 'Settings',
        hint: '⌘ + ,'
      }
    ],
    []
  );

  const handleCommand = useCallback(
    (commandId: string) => {
      if (commandId === 'new-task') {
        clearWorkspace();
      }
    },
    [clearWorkspace]
  );

  return (
    <div className="app-shell">
      <PlaceholderCommandBar commands={commands} onCommand={handleCommand} />
      <TraycerWorkspace workspace={workspace} />
    </div>
  );
}

export default App;
