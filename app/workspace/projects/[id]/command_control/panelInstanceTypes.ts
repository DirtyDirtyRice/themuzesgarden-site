export type UniversalPanelKind =
  | "metadata_inspect"
  | "explanation_text"
  | "cosmetics_editor"
  | "admin_toolbar"
  | "member_toolbox"
  | "custom";

export type UniversalPanelAccessLevel = "member" | "admin" | "system";

export type UniversalPanelEdge =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type UniversalPanelVisibilityState = "open" | "closed" | "hidden";

export type UniversalPanelRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type UniversalPanelPoint = {
  left: number;
  top: number;
};

export type UniversalPanelSize = {
  width: number;
  height: number;
};

export type UniversalViewportRect = {
  width: number;
  height: number;
};

export type UniversalProtectedZone = UniversalPanelRect & {
  id: string;
  label?: string;
  reason?:
    | "global_player"
    | "reserved_ui"
    | "member_locked"
    | "admin_locked"
    | "unsafe_overlap"
    | "custom";
  strict?: boolean;
};

export type UniversalCollisionResult = {
  hasCollision: boolean;
  collidedWithIds: string[];
};

export type UniversalPanelConstraintSet = {
  minWidth: number;
  minHeight: number;
  maxWidth?: number | null;
  maxHeight?: number | null;
};

export type UniversalPanelPermissions = {
  canClose: boolean;
  canResize: boolean;
  canDrag: boolean;
  canPersist: boolean;
  canAdminOverrideProtectedZones: boolean;
};

export type UniversalPanelCosmetics = {
  backgroundClassName?: string;
  borderClassName?: string;
  textClassName?: string;
  shadowClassName?: string;
  radiusClassName?: string;
  fontFamily?: string | null;
  fontSizePx?: number | null;
};

export type UniversalPanelDefinition = {
  panelType: string;
  kind: UniversalPanelKind;
  title: string;
  defaultRect: UniversalPanelRect;
  constraints?: Partial<UniversalPanelConstraintSet>;
  defaultVisibilityState?: UniversalPanelVisibilityState;
  accessLevel?: UniversalPanelAccessLevel;
  permissions?: Partial<UniversalPanelPermissions>;
  cosmetics?: UniversalPanelCosmetics;
  metadata?: Record<string, unknown>;
};

export type UniversalPanelInstance = {
  instanceId: string;
  panelType: string;
  kind: UniversalPanelKind;
  title: string;
  rect: UniversalPanelRect;
  defaultRect: UniversalPanelRect;
  previousRect: UniversalPanelRect | null;
  visibilityState: UniversalPanelVisibilityState;
  accessLevel: UniversalPanelAccessLevel;
  permissions: UniversalPanelPermissions;
  constraints: UniversalPanelConstraintSet;
  cosmetics: UniversalPanelCosmetics;
  protectedZoneOverride: boolean;
  locked: boolean;
  order: number;
  metadata: Record<string, unknown>;
};

export type UniversalPanelLayoutSnapshot = {
  viewport: UniversalViewportRect;
  panels: Record<string, UniversalPanelInstance>;
  protectedZones: UniversalProtectedZone[];
  updatedAt: number;
};

export type UniversalPanelOpenRequest = {
  instanceId?: string;
  focus?: boolean;
  requestedRect?: Partial<UniversalPanelRect>;
  protectedZoneOverride?: boolean;
  metadataPatch?: Record<string, unknown>;
};

export type UniversalPanelCloseRequest = {
  instanceId: string;
};

export type UniversalPanelMoveRequest = {
  instanceId: string;
  left: number;
  top: number;
  protectedZoneOverride?: boolean;
};

export type UniversalPanelResizeRequest = {
  instanceId: string;
  edge: UniversalPanelEdge;
  nextRect: UniversalPanelRect;
  protectedZoneOverride?: boolean;
};

export type UniversalPanelFocusRequest = {
  instanceId: string;
};

export type UniversalPanelToggleRequest = {
  instanceId: string;
  focus?: boolean;
};

export type UniversalPanelRegistrySeed =
  | UniversalPanelDefinition
  | (UniversalPanelDefinition & { instanceId: string });

export type UniversalPanelLayoutSolveRequest = {
  movingInstanceId?: string | null;
  candidateRect: UniversalPanelRect;
  existingPanels: UniversalPanelInstance[];
  protectedZones: UniversalProtectedZone[];
  viewport: UniversalViewportRect;
  allowProtectedZoneOverride?: boolean;
};

export type UniversalPanelLayoutSolveResult = {
  rect: UniversalPanelRect;
  collision: UniversalCollisionResult;
  protectedZoneHitIds: string[];
  changed: boolean;
};

export const UNIVERSAL_PANEL_DEFAULT_CONSTRAINTS: UniversalPanelConstraintSet = {
  minWidth: 260,
  minHeight: 160,
  maxWidth: null,
  maxHeight: null,
};

export const UNIVERSAL_PANEL_DEFAULT_PERMISSIONS: UniversalPanelPermissions = {
  canClose: true,
  canResize: true,
  canDrag: true,
  canPersist: true,
  canAdminOverrideProtectedZones: true,
};

export function cloneUniversalPanelRect(
  rect: UniversalPanelRect
): UniversalPanelRect {
  return {
    left: Number(rect.left) || 0,
    top: Number(rect.top) || 0,
    width: Number(rect.width) || 0,
    height: Number(rect.height) || 0,
  };
}

export function makeUniversalPanelRect(
  left = 0,
  top = 0,
  width = 320,
  height = 220
): UniversalPanelRect {
  return { left, top, width, height };
}

export function getUniversalPanelRight(rect: UniversalPanelRect): number {
  return rect.left + rect.width;
}

export function getUniversalPanelBottom(rect: UniversalPanelRect): number {
  return rect.top + rect.height;
}

export function isUniversalPanelOpen(
  panel: Pick<UniversalPanelInstance, "visibilityState">
): boolean {
  return panel.visibilityState === "open";
}

export function isUniversalPanelVisible(
  panel: Pick<UniversalPanelInstance, "visibilityState">
): boolean {
  return panel.visibilityState !== "hidden";
}