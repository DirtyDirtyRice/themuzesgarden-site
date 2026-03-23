"use client";

import MomentInspectorWorkspacePanelQueueBlock from "./MomentInspectorWorkspacePanelQueueBlock";
import MomentInspectorWorkspacePanelSelectionBlock from "./MomentInspectorWorkspacePanelSelectionBlock";
import MomentInspectorWorkspacePanelToolbarBlock from "./MomentInspectorWorkspacePanelToolbarBlock";
import type { MomentInspectorWorkspacePanelContext } from "./momentInspectorWorkspacePanelContext";
import type { MomentInspectorWorkspacePanelActions } from "./momentInspectorWorkspacePanel.types";
import type { MomentInspectorWorkspacePanelLayoutSection } from "./momentInspectorWorkspacePanelLayout";

type MomentInspectorWorkspacePanelSectionRendererProps = {
  context: MomentInspectorWorkspacePanelContext;
  actions: MomentInspectorWorkspacePanelActions;
  section: MomentInspectorWorkspacePanelLayoutSection;
};

type LocalHeaderBlockProps = {
  title?: string | null;
  subtitle?: string | null;
  summary?: string | null;
};

function getDisplayText(value: unknown): string {
  if (typeof value === "string") return value.trim();

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (!value || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;

  const preferredKeys = [
    "summary",
    "label",
    "title",
    "description",
    "text",
    "value",
  ] as const;

  for (const key of preferredKeys) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return "";
}

function LocalMomentInspectorWorkspacePanelHeaderBlock(
  props: LocalHeaderBlockProps
) {
  const title = String(props.title ?? "").trim();
  const subtitle = String(props.subtitle ?? "").trim();
  const summary = String(props.summary ?? "").trim();

  if (!title && !subtitle && !summary) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3">
      {title ? (
        <div className="text-sm font-semibold text-zinc-900">{title}</div>
      ) : null}

      {subtitle ? (
        <div className="mt-1 text-xs text-zinc-600">{subtitle}</div>
      ) : null}

      {summary ? (
        <div className="mt-2 text-xs text-zinc-500">{summary}</div>
      ) : null}
    </div>
  );
}

export default function MomentInspectorWorkspacePanelSectionRenderer(
  props: MomentInspectorWorkspacePanelSectionRendererProps
) {
  const { context, actions, section } = props;

  const headerTitle = String(context.panelProps.title ?? "").trim();
  const headerSubtitle = String(context.panelProps.subtitle ?? "").trim();
  const headerSummary = getDisplayText(context.composer.summary);

  if (section === "header") {
    return (
      <LocalMomentInspectorWorkspacePanelHeaderBlock
        title={headerTitle}
        subtitle={headerSubtitle}
        summary={headerSummary}
      />
    );
  }

  if (section === "toolbar") {
    return (
      <MomentInspectorWorkspacePanelToolbarBlock
        laneSummaries={context.derivedState.laneSummaries}
        activeLane={context.runtime.activeLane}
        onLaneChange={actions.onLaneChange}
        searchQuery={context.runtime.searchQuery}
        onSearchQueryChange={actions.onSearchQueryChange}
        totalCount={context.derivedState.totalCount}
        filters={context.runtime.filters}
        onFiltersChange={actions.onFiltersChange}
        sortMode={context.runtime.sortMode}
        groupMode={context.runtime.groupMode}
        onSortModeChange={actions.onSortModeChange}
        onGroupModeChange={actions.onGroupModeChange}
        visibleCount={
          context.composer.viewModel.visibleStats.queueStats.visibleCount
        }
        selectedCount={context.composer.viewModel.selectionSummary.selectedCount}
      />
    );
  }

  if (section === "selection") {
    return (
      <MomentInspectorWorkspacePanelSelectionBlock
        label={context.composer.viewModel.selectionSummary.label}
        hasSelection={context.composer.viewModel.selectionSummary.hasSelection}
        onClearSelection={actions.onClearSelection}
      />
    );
  }

  return (
    <MomentInspectorWorkspacePanelQueueBlock
      lane={context.runtime.activeLane}
      searchQuery={context.runtime.searchQuery}
      viewModel={context.composer.viewModel}
      selectedFamilyIds={context.runtime.selection.selectedFamilyIds}
      onToggleSelected={actions.onToggleSelected}
    />
  );
}
