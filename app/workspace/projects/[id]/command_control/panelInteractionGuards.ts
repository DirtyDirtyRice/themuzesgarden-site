import type { UniversalPanelInstance } from "./panelInstanceTypes";

const INTERACTIVE_TAG_NAMES = new Set([
  "A",
  "BUTTON",
  "INPUT",
  "SELECT",
  "TEXTAREA",
  "LABEL",
  "OPTION",
]);

function isHTMLElementLike(value: unknown): value is HTMLElement {
  return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}

function getClosestElementWithSelector(
  value: unknown,
  selector: string
): HTMLElement | null {
  if (!isHTMLElementLike(value)) return null;
  return value.closest(selector);
}

function eventTargetExplicitlyAllowsPanelDrag(
  target: EventTarget | null | undefined
): boolean {
  return Boolean(
    getClosestElementWithSelector(target ?? null, "[data-panel-allow-drag='true']")
  );
}

function eventTargetExplicitlyAllowsPanelResize(
  target: EventTarget | null | undefined
): boolean {
  return Boolean(
    getClosestElementWithSelector(
      target ?? null,
      "[data-panel-allow-resize='true']"
    )
  );
}

export function eventTargetShouldBlockPanelInteraction(
  target: EventTarget | null | undefined
): boolean {
  if (!isHTMLElementLike(target)) return false;

  if (INTERACTIVE_TAG_NAMES.has(target.tagName)) return true;

  if (target.isContentEditable) return true;

  if (getClosestElementWithSelector(target, "[data-panel-no-drag='true']")) {
    return true;
  }

  if (getClosestElementWithSelector(target, "[data-panel-no-resize='true']")) {
    return true;
  }

  if (
    getClosestElementWithSelector(
      target,
      "button, a, input, select, textarea, label"
    )
  ) {
    return true;
  }

  return false;
}

export function canStartUniversalPanelDrag(
  panel: UniversalPanelInstance,
  target?: EventTarget | null
): boolean {
  if (!panel.permissions.canDrag) return false;
  if (panel.locked) return false;
  if (eventTargetExplicitlyAllowsPanelDrag(target ?? null)) return true;
  if (eventTargetShouldBlockPanelInteraction(target ?? null)) return false;
  return true;
}

export function canStartUniversalPanelResize(
  panel: UniversalPanelInstance,
  target?: EventTarget | null
): boolean {
  if (!panel.permissions.canResize) return false;
  if (panel.locked) return false;
  if (eventTargetExplicitlyAllowsPanelResize(target ?? null)) return true;
  if (eventTargetShouldBlockPanelInteraction(target ?? null)) return false;
  return true;
}