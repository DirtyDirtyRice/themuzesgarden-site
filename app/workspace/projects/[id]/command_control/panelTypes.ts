export type PanelMode = "modal" | "page" | "dock";

export type PanelKind =
  | "metadata-inspect"
  | "notes"
  | "activity"
  | "custom";

export type PanelSizePreset = "sm" | "md" | "lg" | "xl" | "full";

export type PanelOwnerScope = "member" | "project" | "admin" | "system";

export type PanelPermissionLevel =
  | "view"
  | "edit"
  | "owner"
  | "admin";

export type PanelBounds = {
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  maxWidth?: number;
  maxHeight?: number;
};

export type PanelPosition = {
  x: number;
  y: number;
};

export type PanelCollisionPolicy =
  | "none"
  | "contain"
  | "avoid-overlap"
  | "snap-away";

export type PanelResizePolicy = {
  resizable: boolean;
  draggable: boolean;
  collisionPolicy: PanelCollisionPolicy;
  clampToViewport: boolean;
  stopAtOtherPanels: boolean;
};

export type PanelPermissions = {
  canView: boolean;
  canEdit: boolean;
  canResize: boolean;
  canMove: boolean;
  canClose: boolean;
  canPromoteToPage: boolean;
  adminOverride: boolean;
};

export type PanelTarget = {
  projectId?: string | null;
  trackId?: string | null;
  memberId?: string | null;
  metadataTargetType?: string | null;
  metadataTargetId?: string | null;
};

export type PanelState = {
  id: string;
  kind: PanelKind;
  mode: PanelMode;
  title: string;
  subtitle?: string | null;
  isOpen: boolean;
  sizePreset: PanelSizePreset;
  bounds: PanelBounds;
  position: PanelPosition;
  resizePolicy: PanelResizePolicy;
  permissions: PanelPermissions;
  ownerScope: PanelOwnerScope;
  target: PanelTarget;
};

export type OpenPanelInput = {
  id: string;
  kind: PanelKind;
  mode?: PanelMode;
  title: string;
  subtitle?: string | null;
  sizePreset?: PanelSizePreset;
  ownerScope?: PanelOwnerScope;
  target?: PanelTarget;
};

export type UpdatePanelPatch = Partial<
  Omit<PanelState, "id" | "kind">
>;

export type PanelActionResult = {
  next: PanelState;
};

export type PanelViewport = {
  width: number;
  height: number;
};

export type PanelCollisionBox = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type EditableUiType =
  | "button"
  | "panel"
  | "text"
  | "page"
  | "section"
  | "font"
  | "custom";

export type EditableUiPermissions = {
  memberCanEdit: boolean;
  ownerCanEdit: boolean;
  adminCanEdit: boolean;
  adminOverride: boolean;
};

export type EditableUiNode = {
  id: string;
  type: EditableUiType;
  label: string;
  ownerScope: PanelOwnerScope;
  projectId?: string | null;
  memberId?: string | null;
  editableStyleKeys: string[];
  editableLayoutKeys: string[];
  permissions: EditableUiPermissions;
};

export type ContextInspectorMode = "hidden" | "readonly" | "edit" | "admin";