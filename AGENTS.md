# AGENTS.md

See README.md for project overview, features, tech stack, and scripts.

## Source Structure

```
src/
├── App.tsx                    # Root layout
├── main.tsx                   # Entry point
├── index.css                  # Tailwind import only
├── types/
│   ├── subtitle.ts            # Subtitle { id, index, startTime, endTime, text }
│   └── file-system.d.ts       # Type declarations for File System Access API
├── utils/
│   ├── srtParser.ts           # parseSrt() / serializeSrt() / createSubtitle()
│   └── srtParser.test.ts      # Unit tests for parser
├── stores/
│   └── subtitleStore.ts       # Zustand store — all subtitle CRUD, undo, seek
├── components/
│   ├── VideoPlayer.tsx        # Video playback, overlay, play/pause/split/undo controls
│   ├── FileControls.tsx       # SRT load/export, Ctrl+Z handler
│   ├── SubtitleList.tsx       # Scrollable subtitle list + Add button
│   └── SubtitleItem.tsx       # Single subtitle row (time inputs, text, delete)
└── test-setup.ts              # Vitest setup (jest-dom)
```

## Architecture

- **State**: Single Zustand store (`useSubtitleStore`). All mutations go through store actions.
- **Undo**: Module-level `undoStack[]` (max 50). `pushUndo()` saves snapshot + sets `canUndo`. Covers: split, add, remove. Does NOT cover text edits (`updateSubtitle`).
- **Seek**: `seekTarget` in store. `selectAndSeek(id)` sets it; `VideoPlayer` consumes it via `useEffect`. `setActive(id)` only highlights without seeking.
- **Overlap fix**: `fixOverlaps()` clamps endTime to next subtitle's startTime. Called in `loadSrt` and `exportSrt`.
- **Sort**: Subtitles are sorted by startTime and re-indexed in `loadSrt` and `exportSrt`.
- **Active subtitle detection**: Half-open interval `[startTime, endTime)` in `VideoPlayer.activeSub`.
- **Add button**: Inserts after selected subtitle. Uses gap if available; otherwise splits selected subtitle's duration in half.

## Conventions

- All UI text in English
- No comments in source code unless explicitly requested
- Test files colocated with source (e.g., `srtParser.test.ts` next to `srtParser.ts`)

## Version Upgrade

1. Update version in `package.json` and add entry to `CHANGELOG.md`
2. Commit all changes
3. `npm run deploy`
4. Tag the commit: `git tag v<version> && git push origin main --tags`
