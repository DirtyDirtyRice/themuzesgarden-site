export type TimelineDawTrackShortcutAction = "toggle-lock" | "toggle-preview";

export function resolveTimelineDawTrackShortcut(input: {
  key: string;
  selectedCount: number;
  editableTarget: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
}): TimelineDawTrackShortcutAction | null {
  if (input.editableTarget || input.selectedCount !== 1 || input.altKey || input.ctrlKey || input.metaKey) return null;
  const key = input.key.toLowerCase();
  if (key === "l") return "toggle-lock";
  if (key === "h") return "toggle-preview";
  return null;
}
