import { create } from 'zustand';
import type { Subtitle } from '../types/subtitle';
import { parseSrt, serializeSrt, createSubtitle } from '../utils/srtParser';

function fixOverlaps(subtitles: Subtitle[]): Subtitle[] {
  const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].endTime > sorted[i + 1].startTime) {
      sorted[i] = { ...sorted[i], endTime: sorted[i + 1].startTime };
    }
  }
  return sorted;
}

function clampToDuration(subtitles: Subtitle[], maxDuration: number | null): { subs: Subtitle[]; changed: boolean } {
  if (maxDuration === null || maxDuration <= 0) return { subs: subtitles, changed: false };
  let changed = false;
  const subs = subtitles.map(s => {
    const st = Math.min(s.startTime, maxDuration);
    const et = Math.min(s.endTime, maxDuration);
    if (st !== s.startTime || et !== s.endTime) changed = true;
    return { ...s, startTime: st, endTime: et };
  });
  return { subs, changed };
}

const MAX_UNDO = 50;

function fmtTime(t: number): string {
  const m = Math.floor(t / 60);
  const s = t % 60;
  const whole = Math.floor(s);
  const frac = Math.round((s - whole) * 1000);
  return `${String(m).padStart(2, '0')}:${String(whole).padStart(2, '0')}.${String(frac).padStart(3, '0')}`;
}

function shortText(text: string): string {
  return text.replace(/\n/g, ' ').slice(0, 20) || '(empty)';
}

interface UndoEntry {
  subtitles: Subtitle[];
  label: string;
}

let undoStack: UndoEntry[] = [];

function pushUndo(subtitles: Subtitle[], label: string): void {
  undoStack = [
    ...undoStack.slice(-(MAX_UNDO - 1)),
    { subtitles: subtitles.map((s) => ({ ...s })), label },
  ];
  useSubtitleStore.setState({
    canUndo: true,
    undoHistory: undoStack.map((e, i) => ({ label: e.label, index: i })),
  });
}

interface SubtitleState {
  subtitles: Subtitle[];
  activeId: string | null;
  canUndo: boolean;
  undoHistory: { label: string; index: number }[];
  fileHandle: FileSystemFileHandle | null;
  fileName: string | null;
  isDirty: boolean;
  loadSrt: (content: string) => void;
  exportSrt: () => string;
  addSubtitle: (afterId?: string) => void;
  removeSubtitle: (id: string) => void;
  updateSubtitle: (id: string, updates: Partial<Pick<Subtitle, 'startTime' | 'endTime' | 'text'>>) => void;
  setActive: (id: string | null) => void;
  selectAndSeek: (id: string) => void;
  mergeWithNext: (id: string) => void;
  reorderSubtitles: () => void;
  adjustAtTime: (currentTime: number, subId?: string) => void;
  undo: () => void;
  undoTo: (index: number) => void;
  seekTarget: number | null;
  consumeSeekTarget: () => number | null;
  pinMode: boolean;
  setPinMode: (mode: boolean) => void;
  setFileHandle: (handle: FileSystemFileHandle | null, name: string | null) => void;
  clearDirty: () => void;
  videoDuration: number | null;
  setVideoDuration: (d: number | null) => void;
}

export const useSubtitleStore = create<SubtitleState>((set, get) => ({
  subtitles: [],
  activeId: null,
  canUndo: false,
  undoHistory: [],
  fileHandle: null,
  fileName: null,
  isDirty: false,

  loadSrt: (content: string) => {
    const parsed = parseSrt(content);
    const { subs, changed } = clampToDuration(parsed, get().videoDuration);
    undoStack = [];
    set({ subtitles: subs, activeId: null, canUndo: false, undoHistory: [], pinMode: false, isDirty: changed });
  },

  exportSrt: () => {
    return serializeSrt(get().subtitles);
  },

  addSubtitle: (afterId?: string) => {
    const { subtitles } = get();
    const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);
    let label = 'Add subtitle';
    if (afterId) {
      const afterSub = sorted.find((s) => s.id === afterId);
      if (afterSub) label = `Add: ${fmtTime(afterSub.startTime)} ${shortText(afterSub.text)}`;
    }
    pushUndo(subtitles, label);
   
    if (afterId) {
      const afterIdx = sorted.findIndex((s) => s.id === afterId);
      if (afterIdx === -1) {
        const newSub = createSubtitle(sorted.length + 1, 0, 2);
        set({ subtitles: [...sorted, newSub], activeId: newSub.id, isDirty: true });
        return;
      }
      const afterSub = sorted[afterIdx];
      const nextSub = sorted[afterIdx + 1];
      const gap = nextSub ? nextSub.startTime - afterSub.endTime : Infinity;

      let newSub: Subtitle;
      const newSubs = [...sorted];

      if (gap > 0.1) {
        newSub = createSubtitle(0, afterSub.endTime, nextSub ? nextSub.startTime : afterSub.endTime + 2);
      } else {
        const duration = afterSub.endTime - afterSub.startTime;
        const midPoint = afterSub.startTime + duration / 2;
        newSubs[afterIdx] = { ...afterSub, endTime: midPoint };
        newSub = createSubtitle(0, midPoint, afterSub.endTime);
      }

      newSubs.splice(afterIdx + 1, 0, newSub);
      const reindexed = newSubs.map((s, i) => ({ ...s, index: i + 1 }));
      set({ subtitles: reindexed, activeId: newSub.id, isDirty: true });
      return;
    }

    const newSub = createSubtitle(sorted.length + 1, 0, 2);
    set({ subtitles: [...sorted, newSub], activeId: newSub.id, isDirty: true });
  },

  removeSubtitle: (id: string) => {
    const { subtitles, activeId } = get();
    const sub = subtitles.find((s) => s.id === id);
    const label = sub
      ? `Remove: ${fmtTime(sub.startTime)} ${shortText(sub.text)}`
      : 'Remove subtitle';
    pushUndo(subtitles, label);
    const newSubs = subtitles
      .filter((s) => s.id !== id)
      .map((s, i) => ({ ...s, index: i + 1 }));
    set({
      subtitles: newSubs,
      activeId: activeId === id ? null : activeId,
      isDirty: true,
    });
  },

  updateSubtitle: (id, updates) => {
    const updated = get().subtitles.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );
    const { subs } = clampToDuration(fixOverlaps(updated), get().videoDuration);
    set({ subtitles: subs, isDirty: true });
  },

  setActive: (id) => set({ activeId: id }),

  selectAndSeek: (id) => {
    const sub = get().subtitles.find((s) => s.id === id);
    if (sub) set({ activeId: id, seekTarget: sub.startTime });
  },

  mergeWithNext: (id: string) => {
    const { subtitles } = get();
    const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);
    const idx = sorted.findIndex((s) => s.id === id);
    if (idx === -1 || idx === sorted.length - 1) return;
    const current = sorted[idx];
    const next = sorted[idx + 1];
    const label = `Merge: ${fmtTime(current.startTime)} ${shortText(current.text)} + ${fmtTime(next.startTime)} ${shortText(next.text)}`;
    pushUndo(subtitles, label);
    const merged: Subtitle = {
      ...current,
      endTime: next.endTime,
      text: current.text + ' ' + next.text,
    };
    const newSubs = sorted
      .filter((s) => s.id !== next.id)
      .map((s) => (s.id === id ? merged : s))
      .map((s, i) => ({ ...s, index: i + 1 }));
    set({ subtitles: newSubs, activeId: id, isDirty: true });
  },

  reorderSubtitles: () => {
    pushUndo(get().subtitles, 'Reorder');
    set({
      subtitles: get()
        .subtitles
        .sort((a, b) => a.startTime - b.startTime)
        .map((s, i) => ({ ...s, index: i + 1 })),
      isDirty: true,
    });
  },

  adjustAtTime: (currentTime: number, subId?: string) => {
    const { subtitles } = get();
    const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);
    const currentIdx = subId
      ? sorted.findIndex((s) => s.id === subId)
      : sorted.findIndex(
          (s) => currentTime >= s.startTime && currentTime <= s.endTime,
        );
    const sub = currentIdx !== -1 ? sorted[currentIdx] : null;
    const label = sub
      ? `Adjust: ${fmtTime(currentTime)} ${shortText(sub.text)}`
      : 'Adjust';
    pushUndo(subtitles, label);
    if (currentIdx === -1) return;

    const updated = sorted.map((s, i) => {
      if (i === currentIdx) return { ...s, endTime: currentTime };
      if (i === currentIdx + 1) return { ...s, startTime: currentTime };
      return s;
    }).map((s, i) => ({ ...s, index: i + 1 }));

    set({ subtitles: fixOverlaps(updated).map((s, i) => ({ ...s, index: i + 1 })), isDirty: true });
  },

  undo: () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    undoStack = undoStack.slice(0, -1);
    set({
      subtitles: prev.subtitles,
      canUndo: undoStack.length > 0,
      undoHistory: undoStack.map((e, i) => ({ label: e.label, index: i })),
      activeId: null,
      isDirty: true,
    });
  },

  undoTo: (index: number) => {
    if (index < 0 || index >= undoStack.length) return;
    const prev = undoStack[index];
    undoStack = undoStack.slice(0, index);
    set({
      subtitles: prev.subtitles,
      canUndo: undoStack.length > 0,
      undoHistory: undoStack.map((e, i) => ({ label: e.label, index: i })),
      activeId: null,
      isDirty: true,
    });
  },

  seekTarget: null,
  pinMode: false,
  setPinMode: (mode) => set(mode ? { pinMode: true } : { pinMode: false }),

  consumeSeekTarget: () => {
    const { seekTarget } = get();
    set({ seekTarget: null });
    return seekTarget;
  },

  setFileHandle: (handle, name) => set({ fileHandle: handle, fileName: name }),
  clearDirty: () => set({ isDirty: false }),
  videoDuration: null,
  setVideoDuration: (d) => {
    const prev = useSubtitleStore.getState().videoDuration;
    set({ videoDuration: d });
    if (d !== null && d !== prev) {
      const { subs, changed } = clampToDuration(useSubtitleStore.getState().subtitles, d);
      set({ subtitles: subs, ...(changed ? { isDirty: true } : {}) });
    }
  },
}));
