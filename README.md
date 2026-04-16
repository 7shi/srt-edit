# SRT Edit

A browser-based subtitle editing tool for adjusting SRT subtitle timing while previewing video.

## Features

- Load and play local video files directly in the browser
- Import/export SRT subtitle files
- Edit subtitle text inline
- Adjust start/end times via text input or drag on the timeline
- Add and delete subtitle entries
- Click subtitles to seek video position
- Real-time subtitle overlay on video

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
3. Edit timing by typing in the timestamp fields or dragging blocks on the timeline
4. Click **Export SRT** to export the edited subtitles

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npx vitest run` | Run tests |
