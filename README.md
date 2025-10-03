# Traycer Assistant

Traycer is a TypeScript + React workspace that showcases an AI-powered coding assistant which plans, implements, and reviews changes within a single interface.

## Features
- **Pulse:** Monitor delivery confidence, AI connectivity, and readiness across the workflow at a glance.
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

### Connecting a live LLM

By default Traycer ships with deterministic mock responses so you can explore the UI without network access. To connect a real
model (for example OpenAI's APIs) provide the following environment variables before running `npm run dev`:

```bash
export VITE_OPENAI_API_KEY="sk-..."
# Optional overrides
export VITE_OPENAI_MODEL="gpt-4o-mini"
export VITE_OPENAI_BASE_URL="https://api.openai.com/v1"
```

When credentials are present Traycer will call the live provider for plan, implementation, and review stages, automatically
falling back to the simulated engine if a request fails. The new AI status strips surface whether responses are live or
simulated, along with any fallback notes.

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
