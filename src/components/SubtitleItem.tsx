import { useSubtitleStore } from '../stores/subtitleStore';

export function SubtitleItem({
  id,
}: {
  id: string;
}) {
  const subtitle = useSubtitleStore((s) =>
    s.subtitles.find((sub) => sub.id === id),
  );
  const activeId = useSubtitleStore((s) => s.activeId);
  const updateSubtitle = useSubtitleStore((s) => s.updateSubtitle);
  const removeSubtitle = useSubtitleStore((s) => s.removeSubtitle);
  const setActive = useSubtitleStore((s) => s.selectAndSeek);

  if (!subtitle) return null;

  const isActive = activeId === id;

  const formatInput = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toFixed(3);
    return `${String(m).padStart(2, '0')}:${s.padStart(6, '0')}`;
  };

  const parseInput = (val: string): number | null => {
    const match = val.match(/(\d{1,2}):(\d{2}(?:\.\d{0,3})?)/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  };

  return (
    <div
      data-subtitle-id={id}
      className={`flex items-start gap-2 px-3 py-2 rounded border ${
        isActive
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-200 bg-white'
      } hover:border-blue-300 transition-colors`}
      onClick={() => setActive(id)}
    >
      <span className="text-xs text-gray-400 w-6 pt-1 text-right shrink-0">
        {subtitle.index}
      </span>

      <div className="flex items-center gap-1 shrink-0">
        <input
          type="text"
          value={formatInput(subtitle.startTime)}
          onChange={(e) => {
            const val = parseInput(e.target.value);
            if (val !== null) updateSubtitle(id, { startTime: val });
          }}
          className="w-24 px-1 py-0.5 text-xs font-mono border rounded text-center"
        />
        <span className="text-xs text-gray-400">→</span>
        <input
          type="text"
          value={formatInput(subtitle.endTime)}
          onChange={(e) => {
            const val = parseInput(e.target.value);
            if (val !== null) updateSubtitle(id, { endTime: val });
          }}
          className="w-24 px-1 py-0.5 text-xs font-mono border rounded text-center"
        />
      </div>

      <textarea
        value={subtitle.text}
        onChange={(e) => updateSubtitle(id, { text: e.target.value })}
        rows={1}
        className="flex-1 px-2 py-0.5 text-sm border rounded resize-none min-w-0"
      />

      <button
        onClick={(e) => {
          e.stopPropagation();
          removeSubtitle(id);
        }}
        className="text-red-400 hover:text-red-600 text-sm shrink-0 pt-1"
      >
        ✕
      </button>
    </div>
  );
}
