# Traycer Assistant

Traycer is a TypeScript + React workspace that showcases an AI-powered coding assistant which plans, implements, and reviews changes within a single interface.

## Features
- **Plan:** Generate execution plans from prompts, tune focus areas, and track per-step status.
- **Implement:** Seed AI-crafted change sketches, draft manual edits, and manage rationale plus diff notes per file.
- **Review:** Run balanced or strict review simulations, surface actionable feedback, and resolve items inline.

## Getting started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open the printed URL (defaults to `http://localhost:5173`).

## Project structure
- `src/App.tsx` – top-level shell wiring the workspace and command bar
- `src/hooks/useTraycerWorkspace.ts` – stateful API that orchestrates planning, implementation, and review interactions
- `src/lib/fakeAi.ts` – deterministic simulation of Traycer AI responses for plans, code changes, and reviews
- `src/components` – UI for each stage of the Traycer workflow, built with modular CSS

## Next steps
- Swap the simulated AI layer with real model calls or API integrations.
- Persist tasks and change history across browser sessions.
- Add diff visualisation using CodeMirror or Monaco for richer editing UX.
- Layer in task analytics (velocity, review turnaround) to evolve Traycer dashboards.
