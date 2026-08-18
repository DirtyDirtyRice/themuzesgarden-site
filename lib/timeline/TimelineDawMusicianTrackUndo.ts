export type TimelineDawTrackHistoryChoice = {
  id: string;
  label: string;
  state: string;
};

export function selectTimelineDawMusicianTrackUndo<T extends TimelineDawTrackHistoryChoice>(history: T[]): {
  undo: T | null;
  redo: T | null;
} {
  return {
    undo: history.find((entry) => entry.state === "applied") ?? null,
    redo: [...history].reverse().find((entry) => entry.state === "undone") ?? null,
  };
}
