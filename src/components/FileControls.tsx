import { useRef, useEffect, useCallback } from 'react';
import { useSubtitleStore } from '../stores/subtitleStore';

const supportsFileAPI = 'showOpenFilePicker' in window;

export function FileControls() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadSrt = useSubtitleStore((s) => s.loadSrt);
  const exportSrt = useSubtitleStore((s) => s.exportSrt);
  const subtitles = useSubtitleStore((s) => s.subtitles);
  const fileHandle = useSubtitleStore((s) => s.fileHandle);
  const fileName = useSubtitleStore((s) => s.fileName);
  const isDirty = useSubtitleStore((s) => s.isDirty);
  const setFileHandle = useSubtitleStore((s) => s.setFileHandle);
  const clearDirty = useSubtitleStore((s) => s.clearDirty);

  const handleLoadWithAPI = useCallback(async () => {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'SRT files', accept: { 'text/srt': ['.srt'] } }],
      });
      const file = await handle.getFile();
      const content = await file.text();
      loadSrt(content);
      setFileHandle(handle, file.name);
    } catch {
      // user cancelled
    }
  }, [loadSrt, setFileHandle]);

  const handleLoadLegacy = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      loadSrt(content);
      setFileHandle(null, null);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSave = useCallback(async () => {
    if (!fileHandle) return;
    try {
      const writable = await fileHandle.createWritable();
      await writable.write(exportSrt());
      await writable.close();
      clearDirty();
    } catch {
      // permission denied or file removed
    }
  }, [fileHandle, exportSrt, clearDirty]);

  const handleSaveAs = useCallback(async () => {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName || 'subtitles.srt',
        types: [{ description: 'SRT files', accept: { 'text/srt': ['.srt'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(exportSrt());
      await writable.close();
      setFileHandle(handle, handle.name);
      clearDirty();
    } catch {
      // user cancelled
    }
  }, [fileName, exportSrt, setFileHandle, clearDirty]);

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

  useEffect(() => {
    if (!supportsFileAPI) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (fileHandle && isDirty) {
          handleSave();
        } else if (!fileHandle && subtitles.length > 0) {
          handleSaveAs();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fileHandle, isDirty, subtitles.length, handleSave, handleSaveAs]);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={supportsFileAPI ? handleLoadWithAPI : () => fileInputRef.current?.click()}
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
      >
        Load SRT
      </button>
      {!supportsFileAPI && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".srt"
          onChange={handleLoadLegacy}
          className="hidden"
        />
      )}
      {supportsFileAPI && (
        <>
          <button
            onClick={handleSave}
            disabled={!fileHandle || !isDirty}
            className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save
          </button>
          <button
            onClick={handleSaveAs}
            disabled={subtitles.length === 0}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save As
          </button>
        </>
      )}
      {!supportsFileAPI && (
        <button
          onClick={handleExportSrt}
          disabled={subtitles.length === 0}
          className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Export SRT
        </button>
      )}
      <span className="text-sm text-gray-500">
        {fileName && (
          <>
            {isDirty && <span className="text-orange-500">*</span>}
            {fileName}
            {' '}
          </>
        )}
        {subtitles.length} subtitle(s)
      </span>
    </div>
  );
}
