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

const MAX_UNDO = 50;

let undoStack: Subtitle[][] = [];

function pushUndo(subtitles: Subtitle[]): void {
  undoStack = [...undoStack.slice(-(MAX_UNDO - 1)), subtitles.map((s) => ({ ...s }))];
  useSubtitleStore.setState({ canUndo: true });
}

interface SubtitleState {
  subtitles: Subtitle[];
  activeId: string | null;
  canUndo: boolean;
  loadSrt: (content: string) => void;
  exportSrt: () => string;
  addSubtitle: (afterId?: string) => void;
  removeSubtitle: (id: string) => void;
  updateSubtitle: (id: string, updates: Partial<Pick<Subtitle, 'startTime' | 'endTime' | 'text'>>) => void;
  setActive: (id: string | null) => void;
  selectAndSeek: (id: string) => void;
  reorderSubtitles: () => void;
  splitAtTime: (currentTime: number) => void;
  undo: () => void;
  seekTarget: number | null;
  consumeSeekTarget: () => number | null;
}

export const useSubtitleStore = create<SubtitleState>((set, get) => ({
  subtitles: [],
  activeId: null,
  canUndo: false,

  loadSrt: (content: string) => {
    const subtitles = parseSrt(content);
    undoStack = [];
    set({ subtitles, activeId: null, canUndo: false });
  },

  exportSrt: () => {
    return serializeSrt(get().subtitles);
  },

  addSubtitle: (afterId?: string) => {
    pushUndo(get().subtitles);
    const { subtitles } = get();
    const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);

    if (afterId) {
      const afterIdx = sorted.findIndex((s) => s.id === afterId);
      if (afterIdx === -1) {
        const newSub = createSubtitle(sorted.length + 1, 0, 2);
        set({ subtitles: [...sorted, newSub], activeId: newSub.id });
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
      set({ subtitles: reindexed, activeId: newSub.id });
      return;
    }

    const newSub = createSubtitle(sorted.length + 1, 0, 2);
    set({ subtitles: [...sorted, newSub], activeId: newSub.id });
  },

  removeSubtitle: (id: string) => {
    pushUndo(get().subtitles);
    const { subtitles, activeId } = get();
    const newSubs = subtitles
      .filter((s) => s.id !== id)
      .map((s, i) => ({ ...s, index: i + 1 }));
    set({
      subtitles: newSubs,
      activeId: activeId === id ? null : activeId,
    });
  },

  updateSubtitle: (id, updates) => {
    const updated = get().subtitles.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );
    set({ subtitles: fixOverlaps(updated) });
  },

  setActive: (id) => set({ activeId: id }),

  selectAndSeek: (id) => {
    const sub = get().subtitles.find((s) => s.id === id);
    if (sub) set({ activeId: id, seekTarget: sub.startTime });
  },

  reorderSubtitles: () => {
    pushUndo(get().subtitles);
    set({
      subtitles: get()
        .subtitles
        .sort((a, b) => a.startTime - b.startTime)
        .map((s, i) => ({ ...s, index: i + 1 })),
    });
  },

  splitAtTime: (currentTime: number) => {
    pushUndo(get().subtitles);
    const { subtitles } = get();
    const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);
    const currentIdx = sorted.findIndex(
      (s) => currentTime >= s.startTime && currentTime <= s.endTime,
    );
    if (currentIdx === -1) return;

    const updated = sorted.map((s, i) => {
      if (i === currentIdx) return { ...s, endTime: currentTime };
      if (i === currentIdx + 1) return { ...s, startTime: currentTime };
      return s;
    }).map((s, i) => ({ ...s, index: i + 1 }));

    set({ subtitles: fixOverlaps(updated).map((s, i) => ({ ...s, index: i + 1 })) });
  },

  undo: () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    undoStack = undoStack.slice(0, -1);
    set({
      subtitles: prev,
      canUndo: undoStack.length > 0,
      activeId: null,
    });
  },

  seekTarget: null,

  consumeSeekTarget: () => {
    const { seekTarget } = get();
    set({ seekTarget: null });
    return seekTarget;
  },
}));
