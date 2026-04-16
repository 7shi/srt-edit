import { create } from 'zustand';
import type { Subtitle } from '../types/subtitle';
import { parseSrt, serializeSrt, createSubtitle } from '../utils/srtParser';

interface SubtitleState {
  subtitles: Subtitle[];
  activeId: string | null;
  loadSrt: (content: string) => void;
  exportSrt: () => string;
  addSubtitle: (afterId?: string) => void;
  removeSubtitle: (id: string) => void;
  updateSubtitle: (id: string, updates: Partial<Pick<Subtitle, 'startTime' | 'endTime' | 'text'>>) => void;
  setActive: (id: string | null) => void;
  selectAndSeek: (id: string) => void;
  reorderSubtitles: () => void;
  splitAtTime: (currentTime: number) => void;
  seekTarget: number | null;
  consumeSeekTarget: () => number | null;
}

export const useSubtitleStore = create<SubtitleState>((set, get) => ({
  subtitles: [],
  activeId: null,

  loadSrt: (content: string) => {
    const subtitles = parseSrt(content);
    set({ subtitles, activeId: null });
  },

  exportSrt: () => {
    return serializeSrt(get().subtitles);
  },

  addSubtitle: (afterId?: string) => {
    const { subtitles } = get();
    let startTime = 0;
    let index = subtitles.length + 1;

    if (afterId) {
      const afterSub = subtitles.find((s) => s.id === afterId);
      if (afterSub) {
        startTime = afterSub.endTime;
        const afterIdx = subtitles.indexOf(afterSub);
        index = afterSub.index + 1;
        const newSub = createSubtitle(index, startTime, startTime + 2);
        const newSubs = [...subtitles];
        newSubs.splice(afterIdx + 1, 0, newSub);
        newSubs.forEach((s, i) => { s.index = i + 1; });
        set({ subtitles: newSubs, activeId: newSub.id });
        return;
      }
    }

    const newSub = createSubtitle(index, startTime, startTime + 2);
    set({ subtitles: [...subtitles, newSub], activeId: newSub.id });
  },

  removeSubtitle: (id: string) => {
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
    set({
      subtitles: get().subtitles.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    });
  },

  setActive: (id) => set({ activeId: id }),

  selectAndSeek: (id) => {
    const sub = get().subtitles.find((s) => s.id === id);
    if (sub) set({ activeId: id, seekTarget: sub.startTime });
  },

  reorderSubtitles: () => {
    set({
      subtitles: get()
        .subtitles
        .sort((a, b) => a.startTime - b.startTime)
        .map((s, i) => ({ ...s, index: i + 1 })),
    });
  },

  splitAtTime: (currentTime: number) => {
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

    set({ subtitles: updated });
  },

  seekTarget: null,

  consumeSeekTarget: () => {
    const { seekTarget } = get();
    set({ seekTarget: null });
    return seekTarget;
  },
}));
