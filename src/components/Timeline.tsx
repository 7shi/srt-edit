import { useRef, useCallback, useEffect, useState } from 'react';
import { useSubtitleStore } from '../stores/subtitleStore';

export function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const subtitles = useSubtitleStore((s) => s.subtitles);
  const updateSubtitle = useSubtitleStore((s) => s.updateSubtitle);
  const setActive = useSubtitleStore((s) => s.setActive);
  const activeId = useSubtitleStore((s) => s.activeId);
  const reorderSubtitles = useSubtitleStore((s) => s.reorderSubtitles);

  const [duration, setDuration] = useState(0);
  const [dragInfo, setDragInfo] = useState<{
    id: string;
    edge: 'start' | 'end' | 'move';
    offsetX: number;
    origStart: number;
    origEnd: number;
  } | null>(null);

  useEffect(() => {
    const video = document.querySelector('video');
    if (video) {
      const onUpdate = () => setDuration(video.duration || 0);
      video.addEventListener('loadedmetadata', onUpdate);
      video.addEventListener('durationchange', onUpdate);
      return () => {
        video.removeEventListener('loadedmetadata', onUpdate);
        video.removeEventListener('durationchange', onUpdate);
      };
    }
  }, []);

  const getDuration = useCallback(() => {
    if (duration > 0) return duration;
    if (subtitles.length === 0) return 60;
    return Math.max(...subtitles.map((s) => s.endTime), 60);
  }, [duration, subtitles]);

  const timeToX = useCallback(
    (time: number) => {
      const d = getDuration();
      return (time / d) * 100;
    },
    [getDuration],
  );

  const xToTime = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return 0;
      const rect = container.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      return Math.max(0, ratio * getDuration());
    },
    [getDuration],
  );

  const handleMouseDown = (
    e: React.MouseEvent,
    id: string,
    edge: 'start' | 'end' | 'move',
  ) => {
    e.stopPropagation();
    const sub = subtitles.find((s) => s.id === id);
    if (!sub) return;
    setActive(id);
    setDragInfo({
      id,
      edge,
      offsetX: edge === 'move' ? xToTime(e.clientX) - sub.startTime : 0,
      origStart: sub.startTime,
      origEnd: sub.endTime,
    });
  };

  useEffect(() => {
    if (!dragInfo) return;

    const handleMouseMove = (e: MouseEvent) => {
      const time = xToTime(e.clientX);
      const sub = subtitles.find((s) => s.id === dragInfo.id);
      if (!sub) return;

      if (dragInfo.edge === 'start') {
        const newStart = Math.min(time, sub.endTime - 0.1);
        updateSubtitle(dragInfo.id, { startTime: Math.max(0, newStart) });
      } else if (dragInfo.edge === 'end') {
        const newEnd = Math.max(time, sub.startTime + 0.1);
        updateSubtitle(dragInfo.id, { endTime: newEnd });
      } else {
        const len = dragInfo.origEnd - dragInfo.origStart;
        let newStart = time - dragInfo.offsetX;
        newStart = Math.max(0, newStart);
        updateSubtitle(dragInfo.id, {
          startTime: newStart,
          endTime: newStart + len,
        });
      }
    };

    const handleMouseUp = () => {
      reorderSubtitles();
      setDragInfo(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragInfo, subtitles, updateSubtitle, xToTime, reorderSubtitles]);

  const handleTrackClick = (e: React.MouseEvent) => {
    if (dragInfo) return;
    const time = xToTime(e.clientX);
    const video = document.querySelector('video');
    if (video) video.currentTime = time;
  };

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold">Timeline</h2>
      <div
        ref={containerRef}
        className="relative w-full h-16 bg-gray-100 rounded border border-gray-200 cursor-crosshair select-none overflow-hidden"
        onClick={handleTrackClick}
      >
        {subtitles.map((sub) => {
          const left = timeToX(sub.startTime);
          const right = timeToX(sub.endTime);
          const width = right - left;
          return (
            <div
              key={sub.id}
              className={`absolute top-1 h-14 rounded group ${
                activeId === sub.id
                  ? 'bg-blue-200 border-blue-400'
                  : 'bg-blue-100 border-blue-300'
              } border`}
              style={{
                left: `${left}%`,
                width: `${Math.max(width, 0.3)}%`,
              }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-blue-400/50 hover:bg-blue-500 rounded-l"
                onMouseDown={(e) => handleMouseDown(e, sub.id, 'start')}
              />
              <div
                className="absolute inset-0 flex items-center justify-center text-xs text-gray-600 truncate px-3 cursor-move"
                onMouseDown={(e) => handleMouseDown(e, sub.id, 'move')}
              >
                {sub.text.slice(0, 20)}
              </div>
              <div
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-blue-400/50 hover:bg-blue-500 rounded-r"
                onMouseDown={(e) => handleMouseDown(e, sub.id, 'end')}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>0:00</span>
        <span>{Math.floor(getDuration() / 60)}:{String(Math.floor(getDuration() % 60)).padStart(2, '0')}</span>
      </div>
    </div>
  );
}
