import type { Subtitle } from '../types/subtitle';

let nextId = 0;

function generateId(): string {
  return `sub-${++nextId}`;
}

function parseTimestamp(ts: string): number {
  const match = ts.trim().match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
  if (!match) throw new Error(`Invalid timestamp: ${ts}`);
  const [, h, m, s, ms] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms) / 1000;
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

export function parseSrt(content: string): Subtitle[] {
  const blocks = content.trim().replace(/\r\n/g, '\n').split(/\n\n+/);
  const subtitles: Subtitle[] = [];

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 3) continue;

    const index = parseInt(lines[0], 10);
    if (isNaN(index)) continue;

    const timeMatch = lines[1].match(
      /(.+?)\s*-->\s*(.+)/
    );
    if (!timeMatch) continue;

    const startTime = parseTimestamp(timeMatch[1]);
    const endTime = parseTimestamp(timeMatch[2]);
    const text = lines.slice(2).join('\n');

    subtitles.push({
      id: generateId(),
      index,
      startTime,
      endTime,
      text,
    });
  }

  return subtitles;
}

export function serializeSrt(subtitles: Subtitle[]): string {
  const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);
  return sorted
    .map((sub, i) => {
      const idx = i + 1;
      return `${idx}\n${formatTimestamp(sub.startTime)} --> ${formatTimestamp(sub.endTime)}\n${sub.text}`;
    })
    .join('\n\n');
}

export function createSubtitle(index: number, startTime = 0, endTime = 1, text = ''): Subtitle {
  return { id: generateId(), index, startTime, endTime, text };
}
