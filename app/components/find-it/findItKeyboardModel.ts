import { PAGE_JUMP_SIZE } from "./FindItSearchControllerConstants";

export type FindItKeyboardCommand =
  | { type: "clear" }
  | { type: "jump"; amount: number }
  | { type: "first" }
  | { type: "last" }
  | { type: "confirm_without_navigation" }
  | { type: "none" };

export function getFindItKeyboardCommand(key: string): FindItKeyboardCommand {
  if (key === "Escape") {
    return { type: "clear" };
  }

  if (key === "ArrowDown") {
    return { type: "jump", amount: 1 };
  }

  if (key === "ArrowUp") {
    return { type: "jump", amount: -1 };
  }

  if (key === "PageDown") {
    return { type: "jump", amount: PAGE_JUMP_SIZE };
  }

  if (key === "PageUp") {
    return { type: "jump", amount: -PAGE_JUMP_SIZE };
  }

  if (key === "Home") {
    return { type: "first" };
  }

  if (key === "End") {
    return { type: "last" };
  }

  if (key === "Enter") {
    return { type: "confirm_without_navigation" };
  }

  return { type: "none" };
}