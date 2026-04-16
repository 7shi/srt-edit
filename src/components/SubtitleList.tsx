import { useEffect, useRef } from 'react';
import { useSubtitleStore } from '../stores/subtitleStore';
import { SubtitleItem } from './SubtitleItem';

export function SubtitleList() {
  const subtitles = useSubtitleStore((s) => s.subtitles);
  const addSubtitle = useSubtitleStore((s) => s.addSubtitle);
  const mergeWithNext = useSubtitleStore((s) => s.mergeWithNext);
  const activeId = useSubtitleStore((s) => s.activeId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeId || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(`[data-subtitle-id="${activeId}"]`) as HTMLElement | null;
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeId]);

  const canMerge = (() => {
    if (!activeId) return false;
    const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);
    const idx = sorted.findIndex((s) => s.id === activeId);
    return idx !== -1 && idx < sorted.length - 1;
  })();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Subtitles</h2>
        <div className="flex gap-2">
          <button
            onClick={() => addSubtitle(activeId ?? undefined)}
            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
          >
            + Add
          </button>
          <button
            onClick={() => activeId && mergeWithNext(activeId)}
            disabled={!canMerge}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Merge
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex flex-col gap-1 max-h-[400px] overflow-y-auto">
        {subtitles.map((sub) => (
          <SubtitleItem key={sub.id} id={sub.id} />
        ))}
      </div>
      {subtitles.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          Load an SRT file or click Add to create subtitles
        </p>
      )}
    </div>
  );
}
