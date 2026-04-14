import {
  UNIVERSAL_PANEL_DEFAULT_CONSTRAINTS,
  UNIVERSAL_PANEL_DEFAULT_PERMISSIONS,
  cloneUniversalPanelRect,
  type UniversalPanelCosmetics,
  type UniversalPanelDefinition,
  type UniversalPanelInstance,
  type UniversalPanelPermissions,
  type UniversalPanelRect,
  type UniversalPanelRegistrySeed,
  type UniversalPanelVisibilityState,
} from "./panelInstanceTypes";

function toSafeString(value: unknown, fallback: string): string {
  const clean = String(value ?? "").trim();
  return clean || fallback;
}

function cloneCosmetics(
  cosmetics?: UniversalPanelCosmetics
): UniversalPanelCosmetics {
  return {
    backgroundClassName: cosmetics?.backgroundClassName,
    borderClassName: cosmetics?.borderClassName,
    textClassName: cosmetics?.textClassName,
    shadowClassName: cosmetics?.shadowClassName,
    radiusClassName: cosmetics?.radiusClassName,
    fontFamily: cosmetics?.fontFamily ?? null,
    fontSizePx:
      typeof cosmetics?.fontSizePx === "number" ? cosmetics.fontSizePx : null,
  };
}

function mergePermissions(
  permissions?: Partial<UniversalPanelPermissions>
): UniversalPanelPermissions {
  return {
    ...UNIVERSAL_PANEL_DEFAULT_PERMISSIONS,
    ...(permissions ?? {}),
  };
}

function mergeConstraints(
  constraints?: Partial<UniversalPanelInstance["constraints"]>
): UniversalPanelInstance["constraints"] {
  return {
    ...UNIVERSAL_PANEL_DEFAULT_CONSTRAINTS,
    ...(constraints ?? {}),
  };
}

function buildDefaultInstanceId(
  definition: Pick<UniversalPanelDefinition, "panelType" | "kind">,
  index: number
): string {
  const baseType = toSafeString(definition.panelType, "panel");
  const kind = toSafeString(definition.kind, "custom");
  return `${baseType}__${kind}__${index + 1}`;
}

export function createUniversalPanelInstance(
  definition: UniversalPanelDefinition,
  options?: {
    instanceId?: string;
    order?: number;
    visibilityState?: UniversalPanelVisibilityState;
    rectOverride?: Partial<UniversalPanelRect>;
  }
): UniversalPanelInstance {
  const defaultRect = cloneUniversalPanelRect(definition.defaultRect);
  const rect = {
    ...defaultRect,
    ...(options?.rectOverride ?? {}),
  };

  return {
    instanceId: toSafeString(
      options?.instanceId,
      `${toSafeString(definition.panelType, "panel")}__instance`
    ),
    panelType: toSafeString(definition.panelType, "panel"),
    kind: definition.kind,
    title: toSafeString(definition.title, "Panel"),
    rect,
    defaultRect,
    previousRect: null,
    visibilityState:
      options?.visibilityState ??
      definition.defaultVisibilityState ??
      "closed",
    accessLevel: definition.accessLevel ?? "member",
    permissions: mergePermissions(definition.permissions),
    constraints: mergeConstraints(definition.constraints),
    cosmetics: cloneCosmetics(definition.cosmetics),
    protectedZoneOverride: false,
    locked: false,
    order: typeof options?.order === "number" ? options.order : 0,
    metadata: { ...(definition.metadata ?? {}) },
  };
}

export function buildUniversalPanelRegistry(
  seeds: UniversalPanelRegistrySeed[]
): Record<string, UniversalPanelInstance> {
  const out: Record<string, UniversalPanelInstance> = {};

  seeds.forEach((seed, index) => {
    const instanceId =
      "instanceId" in seed && typeof seed.instanceId === "string"
        ? seed.instanceId
        : buildDefaultInstanceId(seed, index);

    const instance = createUniversalPanelInstance(seed, {
      instanceId,
      order: index,
      visibilityState: seed.defaultVisibilityState ?? "closed",
    });

    out[instance.instanceId] = instance;
  });

  return out;
}

export function cloneUniversalPanelInstance(
  panel: UniversalPanelInstance
): UniversalPanelInstance {
  return {
    ...panel,
    rect: cloneUniversalPanelRect(panel.rect),
    defaultRect: cloneUniversalPanelRect(panel.defaultRect),
    previousRect: panel.previousRect
      ? cloneUniversalPanelRect(panel.previousRect)
      : null,
    permissions: { ...panel.permissions },
    constraints: { ...panel.constraints },
    cosmetics: cloneCosmetics(panel.cosmetics),
    metadata: { ...(panel.metadata ?? {}) },
  };
}

export function cloneUniversalPanelRegistry(
  panels: Record<string, UniversalPanelInstance>
): Record<string, UniversalPanelInstance> {
  const out: Record<string, UniversalPanelInstance> = {};

  Object.values(panels).forEach((panel) => {
    out[panel.instanceId] = cloneUniversalPanelInstance(panel);
  });

  return out;
}

export function getOrderedUniversalPanels(
  panels: Record<string, UniversalPanelInstance>
): UniversalPanelInstance[] {
  return Object.values(panels).sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.instanceId.localeCompare(b.instanceId);
  });
}

export function getTopUniversalPanelOrder(
  panels: Record<string, UniversalPanelInstance>
): number {
  const list = Object.values(panels);
  if (!list.length) return 0;
  return Math.max(...list.map((panel) => panel.order));
}

export function bringUniversalPanelToFront(
  panels: Record<string, UniversalPanelInstance>,
  instanceId: string
): Record<string, UniversalPanelInstance> {
  if (!panels[instanceId]) return cloneUniversalPanelRegistry(panels);

  const next = cloneUniversalPanelRegistry(panels);
  const topOrder = getTopUniversalPanelOrder(next);

  next[instanceId] = {
    ...next[instanceId],
    order: topOrder + 1,
  };

  return next;
}

export function updateUniversalPanelInRegistry(
  panels: Record<string, UniversalPanelInstance>,
  instanceId: string,
  patch: Partial<UniversalPanelInstance>
): Record<string, UniversalPanelInstance> {
  if (!panels[instanceId]) return cloneUniversalPanelRegistry(panels);

  const next = cloneUniversalPanelRegistry(panels);
  const current = next[instanceId];

  next[instanceId] = {
    ...current,
    ...patch,
    rect: patch.rect
      ? cloneUniversalPanelRect(patch.rect)
      : cloneUniversalPanelRect(current.rect),
    defaultRect: patch.defaultRect
      ? cloneUniversalPanelRect(patch.defaultRect)
      : cloneUniversalPanelRect(current.defaultRect),
    previousRect:
      patch.previousRect === null
        ? null
        : patch.previousRect
        ? cloneUniversalPanelRect(patch.previousRect)
        : current.previousRect
        ? cloneUniversalPanelRect(current.previousRect)
        : null,
    permissions: {
      ...current.permissions,
      ...(patch.permissions ?? {}),
    },
    constraints: {
      ...current.constraints,
      ...(patch.constraints ?? {}),
    },
    cosmetics: {
      ...current.cosmetics,
      ...(patch.cosmetics ?? {}),
    },
    metadata: {
      ...(current.metadata ?? {}),
      ...(patch.metadata ?? {}),
    },
  };

  return next;
}

export function openUniversalPanelInRegistry(
  panels: Record<string, UniversalPanelInstance>,
  instanceId: string
): Record<string, UniversalPanelInstance> {
  return updateUniversalPanelInRegistry(panels, instanceId, {
    visibilityState: "open",
  });
}

export function closeUniversalPanelInRegistry(
  panels: Record<string, UniversalPanelInstance>,
  instanceId: string
): Record<string, UniversalPanelInstance> {
  return updateUniversalPanelInRegistry(panels, instanceId, {
    visibilityState: "closed",
  });
}