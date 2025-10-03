import './PlaceholderCommandBar.css';

export interface ICommand {
  id: string;
  label: string;
  hint?: string;
}

interface PlaceholderCommandBarProps {
  commands: ICommand[];
  onCommand?: (commandId: string) => void;
}

export function PlaceholderCommandBar({ commands, onCommand }: PlaceholderCommandBarProps) {
  return (
    <header className="command-bar">
      <div className="command-bar__logo">Traycer</div>
      <nav className="command-bar__commands">
        {commands.map((command) => (
          <button
            key={command.id}
            type="button"
            className="command-bar__command"
            onClick={() => onCommand?.(command.id)}
          >
            <span>{command.label}</span>
            {command.hint ? <kbd>{command.hint}</kbd> : null}
          </button>
        ))}
      </nav>
    </header>
  );
}
