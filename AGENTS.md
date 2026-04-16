# AGENTS.md

## Project Overview

Browser-based SRT subtitle editor. Load a video and SRT file, adjust subtitle timing visually, and export. No server required — everything runs client-side.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (Vite) |
| `npm run build` | Type-check (`tsc -b`) then build |
| `npm run lint` | ESLint |
| `npx vitest run` | Run tests |

## Source Structure

```
src/
├── App.tsx                    # Root layout
├── main.tsx                   # Entry point
├── index.css                  # Tailwind import only
├── types/
│   └── subtitle.ts            # Subtitle { id, index, startTime, endTime, text }
├── utils/
│   ├── srtParser.ts           # parseSrt() / serializeSrt() / createSubtitle()
│   └── srtParser.test.ts      # Unit tests for parser
├── stores/
│   └── subtitleStore.ts       # Zustand store — all subtitle CRUD, undo, seek
├── components/
│   ├── VideoPlayer.tsx        # Video playback, overlay, play/pause/split/undo controls
│   ├── FileControls.tsx       # SRT load/export, Ctrl+Z handler
│   ├── SubtitleList.tsx       # Scrollable subtitle list + Add button
│   ├── SubtitleItem.tsx       # Single subtitle row (time inputs, text, delete)
│   └── Timeline.tsx           # Visual timeline with drag-to-resize
├── hooks/                     # (empty, reserved)
└── test-setup.ts              # Vitest setup (jest-dom)
```

## Architecture

- **State**: Single Zustand store (`useSubtitleStore`). All mutations go through store actions.
- **Undo**: Module-level `undoStack[]` (max 50). `pushUndo()` saves snapshot + sets `canUndo`. Covers: split, add, remove, reorder. Does NOT cover text edits (`updateSubtitle`).
- **Seek**: `seekTarget` in store. `selectAndSeek(id)` sets it; `VideoPlayer` consumes it via `useEffect`. `setActive(id)` only highlights without seeking.
- **Overlap fix**: `fixOverlaps()` clamps endTime to next subtitle's startTime. Called in `updateSubtitle` and `splitAtTime`.
- **Active subtitle detection**: Half-open interval `[startTime, endTime)` in `VideoPlayer.activeSub`.
- **Add button**: Inserts after selected subtitle. Uses gap if available; otherwise splits selected subtitle's duration in half.

## Conventions

- All UI text in English
- No comments in source code unless explicitly requested
- Tailwind CSS for styling (no CSS modules or separate stylesheets)
- Test files colocated with source (e.g., `srtParser.test.ts` next to `srtParser.ts`)
