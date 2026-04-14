import type { MetadataTargetType } from "../../../../../lib/metadata/metadataTypes";
import type {
  UniversalPanelRect,
  UniversalProtectedZone,
  UniversalViewportRect,
} from "./panelInstanceTypes";

export const PROJECT_WORKSPACE_METADATA_PANEL_INSTANCE_ID =
  "metadata_inspect__primary";

export const PROJECT_WORKSPACE_DEFAULT_VIEWPORT: UniversalViewportRect = {
  width: 1280,
  height: 720,
};

export function cleanProjectWorkspaceString(value: unknown): string {
  return String(value ?? "").trim();
}

export function cleanProjectWorkspaceNullableString(
  value: unknown
): string | null {
  const clean = cleanProjectWorkspaceString(value);
  return clean || null;
}

export function normalizeProjectWorkspaceViewport(
  value?: Partial<UniversalViewportRect> | null
): UniversalViewportRect {
  const width =
    typeof value?.width === "number" && value.width > 0
      ? value.width
      : PROJECT_WORKSPACE_DEFAULT_VIEWPORT.width;

  const height =
    typeof value?.height === "number" && value.height > 0
      ? value.height
      : PROJECT_WORKSPACE_DEFAULT_VIEWPORT.height;

  return {
    width,
    height,
  };
}

export function clampProjectWorkspaceNumber(
  value: number,
  min: number,
  max: number
): number {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function makeProjectWorkspaceRectPatch(input?: {
  left?: number | null;
  top?: number | null;
  width?: number | null;
  height?: number | null;
}): Partial<UniversalPanelRect> | undefined {
  if (!input) return undefined;

  const out: Partial<UniversalPanelRect> = {};

  if (typeof input.left === "number") out.left = input.left;
  if (typeof input.top === "number") out.top = input.top;
  if (typeof input.width === "number") out.width = input.width;
  if (typeof input.height === "number") out.height = input.height;

  return Object.keys(out).length ? out : undefined;
}

export function buildProjectWorkspaceMetadataLabel(input: {
  targetType: MetadataTargetType;
  targetId: string;
  explicitLabel?: string | null;
}): string {
  const explicitLabel = cleanProjectWorkspaceNullableString(input.explicitLabel);
  if (explicitLabel) return explicitLabel;

  const targetType = cleanProjectWorkspaceString(input.targetType);
  const targetId = cleanProjectWorkspaceString(input.targetId);

  if (!targetId) return targetType || "Metadata";

  const compactId =
    targetId.length > 36 ? `${targetId.slice(0, 36).trim()}…` : targetId;

  return `${targetType}:${compactId}`;
}

export function cloneProjectWorkspaceProtectedZones(
  zones: UniversalProtectedZone[]
): UniversalProtectedZone[] {
  return zones.map((zone) => ({
    ...zone,
  }));
}

export function isProjectWorkspaceProtectedZoneEqual(
  a: UniversalProtectedZone[],
  b: UniversalProtectedZone[]
): boolean {
  if (a.length !== b.length) return false;

  for (let index = 0; index < a.length; index += 1) {
    const left = a[index];
    const right = b[index];

    if (
      left.id !== right.id ||
      left.left !== right.left ||
      left.top !== right.top ||
      left.width !== right.width ||
      left.height !== right.height ||
      left.label !== right.label ||
      left.reason !== right.reason ||
      Boolean(left.strict) !== Boolean(right.strict)
    ) {
      return false;
    }
  }

  return true;
}