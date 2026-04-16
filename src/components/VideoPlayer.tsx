import { useRef, useCallback, useEffect, useState } from 'react';
import { useSubtitleStore } from '../stores/subtitleStore';

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const subtitles = useSubtitleStore((s) => s.subtitles);
  const setActive = useSubtitleStore((s) => s.setActive);

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
      setCurrentTime(video.currentTime);
    };
    const onLoadedMetadata = () => setDuration(video.duration);
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

  const seek = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(time, duration));
  };

  const activeSub = subtitles.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime,
  );

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seek(ratio * duration);
  };

  const stepBackward = () => seek(currentTime - 0.1);
  const stepForward = () => seek(currentTime + 0.1);

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

        {videoSrc && activeSub && (
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded text-center max-w-[80%] whitespace-pre-line cursor-pointer"
            onClick={() => activeSub && setActive(activeSub.id)}
          >
            {activeSub.text}
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
