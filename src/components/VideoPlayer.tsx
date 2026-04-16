import { useRef, useCallback, useEffect, useState } from 'react';
import { useSubtitleStore } from '../stores/subtitleStore';

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [undoOpen, setUndoOpen] = useState(false);
  const subtitles = useSubtitleStore((s) => s.subtitles);
  const activeId = useSubtitleStore((s) => s.activeId);
  const setActive = useSubtitleStore((s) => s.setActive);
  const selectAndSeek = useSubtitleStore((s) => s.selectAndSeek);
  const splitAtTime = useSubtitleStore((s) => s.splitAtTime);
  const undo = useSubtitleStore((s) => s.undo);
  const canUndo = useSubtitleStore((s) => s.canUndo);
  const undoHistory = useSubtitleStore((s) => s.undoHistory);
  const undoTo = useSubtitleStore((s) => s.undoTo);
  const seekTarget = useSubtitleStore((s) => s.seekTarget);
  const consumeSeekTarget = useSubtitleStore((s) => s.consumeSeekTarget);
  const pinMode = useSubtitleStore((s) => s.pinMode);
  const setPinMode = useSubtitleStore((s) => s.setPinMode);
  const undoRef = useRef<HTMLDivElement>(null);
  const setVideoDuration = useSubtitleStore((s) => s.setVideoDuration);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setIsPlaying(false);
    },
    [],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      const { pinMode, activeId, subtitles, setActive } = useSubtitleStore.getState();
      if (!pinMode || !activeId) {
        const detected = subtitles.find(s => time >= s.startTime && time < s.endTime);
        if (detected) setActive(detected.id);
      }
    };
    const onLoadedMetadata = () => {
      const d = video.duration;
      setDuration(d);
      setVideoDuration(d);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, [videoSrc]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  };

  const seek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(time, duration));
  }, [duration]);

  const activeSub = subtitles.find(
    (s) => currentTime >= s.startTime && currentTime < s.endTime,
  );
  const activeSubId = activeSub?.id ?? null;

  const displaySub = activeId
    ? subtitles.find((s) => s.id === activeId) ?? null
    : null;

  useEffect(() => {
    if (!pinMode && activeSubId) setActive(activeSubId);
  }, [activeSubId, setActive, pinMode]);

  useEffect(() => {
    if (seekTarget !== null) {
      const time = consumeSeekTarget();
      if (time !== null) seek(time);
    }
  }, [seekTarget, consumeSeekTarget, seek]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setActive(null);
    seek(ratio * duration);
  };

  const stepBackward = () => { setActive(null); seek(currentTime - 0.1); };
  const stepForward = () => { setActive(null); seek(currentTime + 0.1); };

  useEffect(() => {
    if (!undoOpen) return;
    const handler = (e: MouseEvent) => {
      if (undoRef.current && !undoRef.current.contains(e.target as Node)) {
        setUndoOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [undoOpen]);

  const handleUndoTo = (index: number) => {
    undoTo(index);
    setUndoOpen(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full"
            onClick={togglePlay}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <label className="cursor-pointer border-2 border-dashed border-gray-500 rounded-lg px-8 py-6 hover:border-gray-300 transition-colors">
              <span>Select video file</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        )}

        {videoSrc && displaySub && (
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded text-center max-w-[80%] whitespace-pre-line cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (displaySub) selectAndSeek(displaySub.id);
            }}
          >
            {displaySub.text}
          </div>
        )}
      </div>

      {videoSrc && (
        <div className="flex flex-col gap-1">
          <div
            className="w-full h-2 bg-gray-200 rounded cursor-pointer relative"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-blue-500 rounded"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={stepBackward}
                className="px-2 py-1 rounded hover:bg-gray-100"
              >
                -0.1s
              </button>
              <button
                onClick={togglePlay}
                className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <label className="flex items-center gap-1 text-sm text-gray-600">
                Pin
                <button
                  onClick={() => setPinMode(!pinMode)}
                  className={`flex items-center w-10 h-5 rounded-full p-0.5 transition-colors ${pinMode ? 'bg-purple-500' : 'bg-gray-300'}`}
                  title="Pin mode"
                >
                  <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${pinMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </label>
              <button
                onClick={() => {
                  if (activeId) splitAtTime(currentTime, pinMode ? activeId : undefined);
                  if (pinMode) setActive(null);
                }}
                disabled={!isPlaying || !activeId}
                className="px-3 py-1 rounded bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Split
              </button>
              <div ref={undoRef} className="relative flex">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="px-3 py-1 rounded-l bg-gray-200 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Undo
                </button>
                <button
                  onClick={() => setUndoOpen((o) => !o)}
                  disabled={!canUndo}
                  className="px-1 py-1 rounded-r border-l border-gray-300 bg-gray-200 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="w-3 h-3" viewBox="0 0 10 6" fill="currentColor"><path d="M0 0l5 6L10 0z" /></svg>
                </button>
                {undoOpen && undoHistory.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[320px] max-h-[200px] overflow-y-auto">
                    {[...undoHistory].reverse().map((entry) => (
                      <button
                        key={entry.index}
                        onClick={() => handleUndoTo(entry.index)}
                        className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100"
                      >
                        {entry.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={stepForward}
                className="px-2 py-1 rounded hover:bg-gray-100"
              >
                +0.1s
              </button>
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
