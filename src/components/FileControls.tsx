import { useRef, useEffect } from 'react';
import { useSubtitleStore } from '../stores/subtitleStore';

export function FileControls() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadSrt = useSubtitleStore((s) => s.loadSrt);
  const exportSrt = useSubtitleStore((s) => s.exportSrt);
  const undo = useSubtitleStore((s) => s.undo);
  const subtitles = useSubtitleStore((s) => s.subtitles);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo]);

  const handleLoadSrt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      loadSrt(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportSrt = () => {
    const content = exportSrt();
    const blob = new Blob([content], { type: 'text/srt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.srt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
      >
        Load SRT
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".srt"
        onChange={handleLoadSrt}
        className="hidden"
      />
      <button
        onClick={handleExportSrt}
        disabled={subtitles.length === 0}
        className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Export SRT
      </button>
      <span className="text-sm text-gray-500">
        {subtitles.length} subtitle(s)
      </span>
    </div>
  );
}
