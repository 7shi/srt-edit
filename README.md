# SRT Edit

A browser-based subtitle editing tool for adjusting SRT subtitle timing while previewing video.

**[Demo](https://7shi.github.io/srt-edit/)**

## Features

- Load and play local video files directly in the browser
- Import SRT subtitle files (File System Access API with legacy fallback)
- Save / Save As / Export SRT files (Ctrl+S shortcut supported)
- Edit subtitle text inline
- Adjust start/end times via timestamp input fields
- Add, delete, and merge subtitle entries
- Click subtitles to seek video position
- Real-time subtitle overlay on video
- Pin mode to lock subtitle selection during playback
- Adjust button to split subtitle boundaries at current playback position
- Step forward/backward by 0.1s
- Undo with full history dropdown (up to 50 steps)
- Automatic overlap prevention between subtitles
- Dirty indicator (*) for unsaved changes

## Tech Stack

- **Vite + React + TypeScript**
- **Tailwind CSS** — styling
- **Zustand** — state management
- **Vitest** — testing

## Getting Started

```bash
npm install
npm run dev
```

Open the URL shown in your terminal (typically http://localhost:5173).

## Usage

1. Click the video area to load a local video file
2. Click **Load SRT** to import an SRT file (or add subtitles manually with the **+ Add** button)
3. Edit timing by typing in the timestamp fields (MM:SS.mmm format)
4. Use **Adjust** during playback to split subtitle boundaries at the current position
5. Click **Save** / **Save As** (or Ctrl+S) to write changes back to an SRT file

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npx vitest run` | Run tests |
| `npm run deploy` | Build and deploy to GitHub Pages |
