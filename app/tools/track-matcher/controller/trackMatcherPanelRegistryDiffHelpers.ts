import type {
  TrackMatcherPanelRegistryCapability,
  TrackMatcherPanelRegistryId,
  TrackMatcherPanelRegistryItem,
} from "./trackMatcherPanelRegistryTypes";
import type {
  TrackMatcherPanelRegistryDiffEntry,
  TrackMatcherPanelRegistryDiffKind,
  TrackMatcherPanelRegistryDiffPanelSnapshot,
  TrackMatcherPanelRegistryDiffResult,
  TrackMatcherPanelRegistryDiffSeverity,
  TrackMatcherPanelRegistryDiffSnapshotLike,
  TrackMatcherPanelRegistryDiffSummary,
  TrackMatcherPanelRegistryDiffValue,
} from "./trackMatcherPanelRegistryDiffTypes";

function getIsoNow() {
  return new Date().toISOString();
}

function normalizeString(value: string | undefined) {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeStringArray(values: readonly string[] | undefined) {
  return [...(values ?? [])]
    .map((value) => value.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function normalizeCapabilities(
  capabilities: readonly TrackMatcherPanelRegistryCapability[] | undefined,
) {
  return [...(capabilities ?? [])].sort((a, b) => a.localeCompare(b));
}

function areStringArraysEqual(a: readonly string[], b: readonly string[]) {
  if (a.length !== b.length) return false;

  return a.every((value, index) => value === b[index]);
}

function hasCapability(
  capabilities: readonly TrackMatcherPanelRegistryCapability[],
  capability: TrackMatcherPanelRegistryCapability,
) {
  return capabilities.includes(capability);
}

function createEntry({
  kind,
  severity,
  panelId,
  field,
  before,
  after,
  message,
}: {
  kind: TrackMatcherPanelRegistryDiffKind;
  severity: TrackMatcherPanelRegistryDiffSeverity;
  panelId: TrackMatcherPanelRegistryId;
  field: string;
  before: TrackMatcherPanelRegistryDiffValue;
  after: TrackMatcherPanelRegistryDiffValue;
  message: string;
}): TrackMatcherPanelRegistryDiffEntry {
  return {
    kind,
    severity,
    panelId,
    field,
    before,
    after,
    message,
  };
}

function addScalarChange(
  entries: TrackMatcherPanelRegistryDiffEntry[],
  options: {
    kind: TrackMatcherPanelRegistryDiffKind;
    severity: TrackMatcherPanelRegistryDiffSeverity;
    panelId: TrackMatcherPanelRegistryId;
    field: string;
    before: TrackMatcherPanelRegistryDiffValue;
    after: TrackMatcherPanelRegistryDiffValue;
    label: string;
  },
) {
  if (options.before === options.after) return;

  entries.push(
    createEntry({
      kind: options.kind,
      severity: options.severity,
      panelId: options.panelId,
      field: options.field,
      before: options.before,
      after: options.after,
      message: `${options.label} changed for ${options.panelId}.`,
    }),
  );
}

function createPanelMap(
  panels: readonly TrackMatcherPanelRegistryDiffPanelSnapshot[],
) {
  const map = new Map<
    TrackMatcherPanelRegistryId,
    TrackMatcherPanelRegistryDiffPanelSnapshot
  >();

  for (const panel of panels) {
    map.set(panel.id, panel);
  }

  return map;
}

function getSortedPanelIds(
  panelIds: Iterable<TrackMatcherPanelRegistryId>,
): TrackMatcherPanelRegistryId[] {
  return [...panelIds].sort((a, b) => String(a).localeCompare(String(b)));
}

function getChangedPanelIds(entries: readonly TrackMatcherPanelRegistryDiffEntry[]) {
  return getSortedPanelIds(new Set(entries.map((entry) => entry.panelId)));
}

function countBySeverity(
  entries: readonly TrackMatcherPanelRegistryDiffEntry[],
  severity: TrackMatcherPanelRegistryDiffSeverity,
) {
  return entries.filter((entry) => entry.severity === severity).length;
}

function countByKind(
  entries: readonly TrackMatcherPanelRegistryDiffEntry[],
  kind: TrackMatcherPanelRegistryDiffKind,
) {
  return entries.filter((entry) => entry.kind === kind).length;
}

export function createTrackMatcherPanelRegistryDiffPanelSnapshot(
  panel: TrackMatcherPanelRegistryItem,
): TrackMatcherPanelRegistryDiffPanelSnapshot {
  return {
    id: panel.id,
    zone: panel.zone,
    status: panel.status,
    displayMode: panel.displayMode,
    title: panel.title,
    subtitle: panel.subtitle,
    description: panel.description,
    order: panel.order,
    visibility: panel.visibility ?? null,
    source: panel.source ?? null,
    capabilities: normalizeCapabilities(panel.capabilities),
    defaultCollapsed:
      typeof panel.defaultCollapsed === "boolean" ? panel.defaultCollapsed : null,
    canUserHide: typeof panel.canUserHide === "boolean" ? panel.canUserHide : null,
    canUserCollapse:
      typeof panel.canUserCollapse === "boolean" ? panel.canUserCollapse : null,
    pluginSlot: normalizeString(panel.pluginSlot),
    notes: normalizeStringArray(panel.notes),
  };
}

export function createTrackMatcherPanelRegistryDiffSnapshot(
  registry: readonly TrackMatcherPanelRegistryItem[],
  label = "Track Matcher panel registry diff snapshot",
): TrackMatcherPanelRegistryDiffSnapshotLike {
  const createdAtIso = getIsoNow();
  const panels = registry
    .map(createTrackMatcherPanelRegistryDiffPanelSnapshot)
    .sort((a, b) => {
      if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
      if (a.order !== b.order) return a.order - b.order;
      return a.id.localeCompare(b.id);
    });

  return {
    snapshotId: `track-matcher-panel-registry-diff-${createdAtIso}-${panels.length}`,
    createdAtIso,
    label,
    panels,
  };
}

export function getTrackMatcherPanelRegistryAddedPanelIds(
  beforeSnapshot: TrackMatcherPanelRegistryDiffSnapshotLike,
  afterSnapshot: TrackMatcherPanelRegistryDiffSnapshotLike,
) {
  const beforeIds = new Set(beforeSnapshot.panels.map((panel) => panel.id));

  return getSortedPanelIds(
    afterSnapshot.panels
      .map((panel) => panel.id)
      .filter((panelId) => !beforeIds.has(panelId)),
  );
}

export function getTrackMatcherPanelRegistryRemovedPanelIds(
  beforeSnapshot: TrackMatcherPanelRegistryDiffSnapshotLike,
  afterSnapshot: TrackMatcherPanelRegistryDiffSnapshotLike,
) {
  const afterIds = new Set(afterSnapshot.panels.map((panel) => panel.id));

  return getSortedPanelIds(
    beforeSnapshot.panels
      .map((panel) => panel.id)
      .filter((panelId) => !afterIds.has(panelId)),
  );
}

export function diffTrackMatcherPanelRegistryCapabilities(
  beforePanel: TrackMatcherPanelRegistryDiffPanelSnapshot,
  afterPanel: TrackMatcherPanelRegistryDiffPanelSnapshot,
): TrackMatcherPanelRegistryDiffEntry[] {
  const entries: TrackMatcherPanelRegistryDiffEntry[] = [];

  for (const capability of afterPanel.capabilities) {
    if (!hasCapability(beforePanel.capabilities, capability)) {
      entries.push(
        createEntry({
          kind: "capability-added",
          severity: "info",
          panelId: afterPanel.id,
          field: "capabilities",
          before: beforePanel.capabilities,
          after: afterPanel.capabilities,
          message: `Capability ${capability} was added to ${afterPanel.id}.`,
        }),
      );
    }
  }

  for (const capability of beforePanel.capabilities) {
    if (!hasCapability(afterPanel.capabilities, capability)) {
      entries.push(
        createEntry({
          kind: "capability-removed",
          severity: "warning",
          panelId: afterPanel.id,
          field: "capabilities",
          before: beforePanel.capabilities,
          after: afterPanel.capabilities,
          message: `Capability ${capability} was removed from ${afterPanel.id}.`,
        }),
      );
    }
  }

  return entries;
}

export function diffTrackMatcherPanelRegistryPanel(
  beforePanel: TrackMatcherPanelRegistryDiffPanelSnapshot,
  afterPanel: TrackMatcherPanelRegistryDiffPanelSnapshot,
): TrackMatcherPanelRegistryDiffEntry[] {
  const entries: TrackMatcherPanelRegistryDiffEntry[] = [];

  addScalarChange(entries, {
    kind: "zone-changed",
    severity: "warning",
    panelId: afterPanel.id,
    field: "zone",
    before: beforePanel.zone,
    after: afterPanel.zone,
    label: "Zone",
  });

  addScalarChange(entries, {
    kind: "status-changed",
    severity: afterPanel.status === "hidden" ? "warning" : "info",
    panelId: afterPanel.id,
    field: "status",
    before: beforePanel.status,
    after: afterPanel.status,
    label: "Status",
  });

  addScalarChange(entries, {
    kind: "display-mode-changed",
    severity: "info",
    panelId: afterPanel.id,
    field: "displayMode",
    before: beforePanel.displayMode,
    after: afterPanel.displayMode,
    label: "Display mode",
  });

  addScalarChange(entries, {
    kind: "visibility-changed",
    severity: afterPanel.visibility === "hidden-from-stack" ? "warning" : "info",
    panelId: afterPanel.id,
    field: "visibility",
    before: beforePanel.visibility,
    after: afterPanel.visibility,
    label: "Visibility",
  });

  addScalarChange(entries, {
    kind: "source-changed",
    severity: "info",
    panelId: afterPanel.id,
    field: "source",
    before: beforePanel.source,
    after: afterPanel.source,
    label: "Source",
  });

  addScalarChange(entries, {
    kind: "order-changed",
    severity: "info",
    panelId: afterPanel.id,
    field: "order",
    before: beforePanel.order,
    after: afterPanel.order,
    label: "Order",
  });

  addScalarChange(entries, {
    kind: "title-changed",
    severity: "info",
    panelId: afterPanel.id,
    field: "title",
    before: beforePanel.title,
    after: afterPanel.title,
    label: "Title",
  });

  addScalarChange(entries, {
    kind: "subtitle-changed",
    severity: "info",
    panelId: afterPanel.id,
    field: "subtitle",
    before: beforePanel.subtitle,
    after: afterPanel.subtitle,
    label: "Subtitle",
  });

  addScalarChange(entries, {
    kind: "description-changed",
    severity: "info",
    panelId: afterPanel.id,
    field: "description",
    before: beforePanel.description,
    after: afterPanel.description,
    label: "Description",
  });

  addScalarChange(entries, {
    kind: "default-collapsed-changed",
    severity: "info",
    panelId: afterPanel.id,
    field: "defaultCollapsed",
    before: beforePanel.defaultCollapsed,
    after: afterPanel.defaultCollapsed,
    label: "Default collapsed",
  });

  addScalarChange(entries, {
    kind: "user-hideable-changed",
    severity: "info",
    panelId: afterPanel.id,
    field: "canUserHide",
    before: beforePanel.canUserHide,
    after: afterPanel.canUserHide,
    label: "User hideable",
  });

  addScalarChange(entries, {
    kind: "user-collapsible-changed",
    severity: "info",
    panelId: afterPanel.id,
    field: "canUserCollapse",
    before: beforePanel.canUserCollapse,
    after: afterPanel.canUserCollapse,
    label: "User collapsible",
  });

  addScalarChange(entries, {
    kind: "plugin-slot-changed",
    severity: "warning",
    panelId: afterPanel.id,
    field: "pluginSlot",
    before: beforePanel.pluginSlot,
    after: afterPanel.pluginSlot,
    label: "Plugin slot",
  });

  entries.push(...diffTrackMatcherPanelRegistryCapabilities(beforePanel, afterPanel));

  if (!areStringArraysEqual(beforePanel.notes, afterPanel.notes)) {
    entries.push(
      createEntry({
        kind: "notes-changed",
        severity: "info",
        panelId: afterPanel.id,
        field: "notes",
        before: beforePanel.notes,
        after: afterPanel.notes,
        message: `Notes changed for ${afterPanel.id}.`,
      }),
    );
  }

  return entries;
}

export function diffTrackMatcherPanelRegistrySnapshots(
  beforeSnapshot: TrackMatcherPanelRegistryDiffSnapshotLike,
  afterSnapshot: TrackMatcherPanelRegistryDiffSnapshotLike,
): TrackMatcherPanelRegistryDiffResult {
  const entries: TrackMatcherPanelRegistryDiffEntry[] = [];
  const beforeMap = createPanelMap(beforeSnapshot.panels);
  const afterMap = createPanelMap(afterSnapshot.panels);
  const addedPanelIds = getTrackMatcherPanelRegistryAddedPanelIds(
    beforeSnapshot,
    afterSnapshot,
  );
  const removedPanelIds = getTrackMatcherPanelRegistryRemovedPanelIds(
    beforeSnapshot,
    afterSnapshot,
  );

  for (const panelId of addedPanelIds) {
    const panel = afterMap.get(panelId);
    if (!panel) continue;

    entries.push(
      createEntry({
        kind: "panel-added",
        severity: "info",
        panelId,
        field: "id",
        before: null,
        after: panelId,
        message: `Panel ${panelId} was added to the registry.`,
      }),
    );
  }

  for (const panelId of removedPanelIds) {
    entries.push(
      createEntry({
        kind: "panel-removed",
        severity: "breaking",
        panelId,
        field: "id",
        before: panelId,
        after: null,
        message: `Panel ${panelId} was removed from the registry.`,
      }),
    );
  }

  for (const [panelId, beforePanel] of beforeMap.entries()) {
    const afterPanel = afterMap.get(panelId);
    if (!afterPanel) continue;

    entries.push(...diffTrackMatcherPanelRegistryPanel(beforePanel, afterPanel));
  }

  return {
    beforeSnapshotId: beforeSnapshot.snapshotId,
    afterSnapshotId: afterSnapshot.snapshotId,
    comparedAtIso: getIsoNow(),
    entries,
  };
}

export function summarizeTrackMatcherPanelRegistryDiffResult(
  result: TrackMatcherPanelRegistryDiffResult,
): TrackMatcherPanelRegistryDiffSummary {
  return {
    beforeSnapshotId: result.beforeSnapshotId,
    afterSnapshotId: result.afterSnapshotId,
    comparedAtIso: result.comparedAtIso,
    totalChanges: result.entries.length,
    addedPanels: countByKind(result.entries, "panel-added"),
    removedPanels: countByKind(result.entries, "panel-removed"),
    breakingChanges: countBySeverity(result.entries, "breaking"),
    warningChanges: countBySeverity(result.entries, "warning"),
    infoChanges: countBySeverity(result.entries, "info"),
    capabilityChanges:
      countByKind(result.entries, "capability-added") +
      countByKind(result.entries, "capability-removed"),
    visibilityChanges: countByKind(result.entries, "visibility-changed"),
    pluginSlotChanges: countByKind(result.entries, "plugin-slot-changed"),
    changedPanelIds: getChangedPanelIds(result.entries),
  };
}

export function getTrackMatcherPanelRegistryDiffEntriesByPanelId(
  result: TrackMatcherPanelRegistryDiffResult,
  panelId: TrackMatcherPanelRegistryId,
) {
  return result.entries.filter((entry) => entry.panelId === panelId);
}

export function getTrackMatcherPanelRegistryDiffEntriesByKind(
  result: TrackMatcherPanelRegistryDiffResult,
  kind: TrackMatcherPanelRegistryDiffKind,
) {
  return result.entries.filter((entry) => entry.kind === kind);
}

export function hasTrackMatcherPanelRegistryBreakingDiffs(
  result: TrackMatcherPanelRegistryDiffResult,
) {
  return result.entries.some((entry) => entry.severity === "breaking");
}
