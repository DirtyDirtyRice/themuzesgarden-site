export type TimelineDawClipKeyboardCommand =
  | "undo"
  | "redo"
  | "copy"
  | "paste"
  | "duplicate"
  | "move-left"
  | "move-right"
  | "trim-start-left"
  | "trim-start-right"
  | "trim-end-left"
  | "trim-end-right"
  | "split"
  | "archive";

export function isTimelineDawEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function resolveTimelineDawClipKeyboardCommand(input: {
  key: string;
  repeat?: boolean;
  editableTarget: boolean;
  selectedCount: number;
  clipboardCount: number;
  canUndo: boolean;
  canRedo: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}): TimelineDawClipKeyboardCommand | null {
  if (input.editableTarget || input.repeat) return null;
  const primary = Boolean(input.ctrlKey || input.metaKey);
  const key = input.key.toLowerCase();
  if (primary) {
    if (key === "z") return input.shiftKey
      ? (input.canRedo ? "redo" : null)
      : (input.canUndo ? "undo" : null);
    if (key === "y") return input.canRedo ? "redo" : null;
    if (key === "c") return input.selectedCount ? "copy" : null;
    if (key === "v") return input.clipboardCount ? "paste" : null;
    if (key === "d") return input.selectedCount ? "duplicate" : null;
    return null;
  }
  if (!input.selectedCount) return null;
  if (input.key === "ArrowLeft" || input.key === "ArrowRight") {
    const side = input.key === "ArrowLeft" ? "left" : "right";
    if (input.altKey) return `trim-start-${side}`;
    if (input.shiftKey) return `trim-end-${side}`;
    return `move-${side}`;
  }
  if (key === "s" && !input.altKey && !input.shiftKey) return "split";
  if (input.key === "Delete" || input.key === "Backspace") return "archive";
  return null;
}

export function describeTimelineDawClipKeyboardCommand(
  command: TimelineDawClipKeyboardCommand,
  selectedCount: number,
): string {
  const clips = `${selectedCount || 1} selected clip${selectedCount === 1 ? "" : "s"}`;
  const descriptions: Record<TimelineDawClipKeyboardCommand, string> = {
    undo: "Clip edit undone.",
    redo: "Clip edit redone.",
    copy: `${clips} copied.`,
    paste: "Copied clips pasted at the playhead.",
    duplicate: `${clips} duplicated.`,
    "move-left": `${clips} moved left.`,
    "move-right": `${clips} moved right.`,
    "trim-start-left": "Selected clip start extended left.",
    "trim-start-right": "Selected clip start trimmed right.",
    "trim-end-left": "Selected clip end trimmed left.",
    "trim-end-right": "Selected clip end extended right.",
    split: "Selected clip split at the playhead.",
    archive: `${clips} moved to the clip archive.`,
  };
  return descriptions[command];
}
