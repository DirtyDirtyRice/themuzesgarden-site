"use client";

import { useRef, useState } from "react";

import MetadataCreateCreateBridgePanel from "./MetadataCreateCreateBridgePanel";
import MetadataCreateForm from "./MetadataCreateForm";
import MetadataCreateOutputPanel from "./MetadataCreateOutputPanel";
import MetadataCreateSidebar from "./MetadataCreateSidebar";
import {
  CREATE_PANELS,
  getPanelTitle,
  useMetadataCreatePageState,
} from "./useMetadataCreatePageState";

type MetadataCreatePanel = "form" | "preview" | "output" | "save";

type FlowBlockReason = {
  label: string;
  detail: string;
};

const REQUIRED_PANEL_BLOCK_MESSAGE =
  "Finish required fields first before moving to preview, output, or save.";

function StartCreatePanel({ onStart }: { onStart: () => void }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
            Metadata Create
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Create Record v3
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70 md:text-base">
            Start the guided record builder. The next screen replaces this intro
            and puts the first required field directly in front of you.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
            Creating record steps
          </p>

          <p className="mt-2 text-sm leading-6 text-white/70">
            * = mandatory step. Complete Title, Placement, Why it belongs here,
            and Description before saving. Relationship is optional.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black px-3 py-3">
              <p className="text-sm font-semibold text-white">1. Title *</p>
              <p className="mt-1 text-sm leading-6 text-white/60">
                Give the record a real name. This creates the slug.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black px-3 py-3">
              <p className="text-sm font-semibold text-white">
                2. Placement *
              </p>
              <p className="mt-1 text-sm leading-6 text-white/60">
                Choose shelf and section, then explain why it belongs there.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black px-3 py-3">
              <p className="text-sm font-semibold text-white">
                3. Description *
              </p>
              <p className="mt-1 text-sm leading-6 text-white/60">
                Explain what this record is so it can stand on its own.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="inline-flex w-full justify-center rounded-xl border border-white/10 bg-white px-5 py-4 text-base font-semibold text-black transition hover:opacity-85 hover:scale-[0.99] md:w-fit"
        >
          Start Creating Record
        </button>
      </div>
    </section>
  );
}

function getFlowBlockReasons(missingItems: string[]): FlowBlockReason[] {
  if (missingItems.length === 0) return [];

  return missingItems.map((item) => ({
    label: item,
    detail: `${item} is required before you can leave the form step.`,
  }));
}

function MissingRequiredFieldsAlert({
  reasons,
  onReturnToForm,
}: {
  reasons: FlowBlockReason[];
  onReturnToForm: () => void;
}) {
  if (reasons.length === 0) return null;

  return (
    <section className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-yellow-100">
            Finish required fields first
          </p>

          <p className="mt-2 text-sm leading-6 text-yellow-50/85">
            Complete the required fields marked with * before moving to Preview,
            Output, Save, or Create.
          </p>
        </div>

        <button
          type="button"
          onClick={onReturnToForm}
          className="rounded-xl border border-yellow-100/30 bg-black px-4 py-2 text-sm font-bold text-yellow-50 transition hover:opacity-85"
        >
          Return to required fields
        </button>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {reasons.map((reason) => (
          <div
            key={reason.label}
            className="rounded-xl border border-yellow-100/20 bg-black/50 px-3 py-3"
          >
            <p className="text-sm font-black text-yellow-50">
              {reason.label} *
            </p>
            <p className="mt-1 text-xs leading-5 text-yellow-50/70">
              {reason.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FlowGuardCard({
  canContinue,
  missingItems,
}: {
  canContinue: boolean;
  missingItems: string[];
}) {
  if (canContinue) {
    return (
      <section className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">
          Required fields complete
        </p>
        <p className="mt-1 text-sm leading-6 text-emerald-50/80">
          Preview, Output, Save, and Create are unlocked.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
        Required before next step
      </p>

      <p className="mt-1 text-sm leading-6 text-white/70">
        {REQUIRED_PANEL_BLOCK_MESSAGE}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {missingItems.map((item) => (
          <span
            key={item}
            className="rounded-full border border-white/15 bg-black px-3 py-1 text-xs font-bold text-white/80"
          >
            {item} *
          </span>
        ))}
      </div>
    </section>
  );
}

function CompactCreateToolbar({
  activePanel,
  canContinue,
  saveReady,
  isSubmitting,
  onPanelChange,
  onCreateRecord,
}: {
  activePanel: MetadataCreatePanel;
  canContinue: boolean;
  saveReady: boolean;
  isSubmitting: boolean;
  onPanelChange: (panel: MetadataCreatePanel) => void;
  onCreateRecord: () => void;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/85 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
            Create mode
          </p>
          <p className="text-sm text-white/70">{getPanelTitle(activePanel)}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {CREATE_PANELS.map((panel) => {
            const isActive = panel.key === activePanel;
            const isLocked = panel.key !== "form" && !canContinue;

            return (
              <button
                key={panel.key}
                type="button"
                onClick={() => onPanelChange(panel.key)}
                aria-disabled={isLocked}
                title={
                  isLocked ? REQUIRED_PANEL_BLOCK_MESSAGE : getPanelTitle(panel.key)
                }
                className={[
                  "rounded-lg border px-3 py-2 text-xs transition hover:opacity-85",
                  isActive
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-black/40 text-white",
                  isLocked ? "cursor-not-allowed opacity-45" : "",
                ].join(" ")}
              >
                {panel.title}
                {isLocked ? " 🔒" : ""}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onCreateRecord}
            disabled={!saveReady || isSubmitting}
            className={[
              "rounded-lg border px-3 py-2 text-xs font-medium transition",
              saveReady && !isSubmitting
                ? "border-white/10 bg-white text-black hover:opacity-85"
                : "cursor-not-allowed border-white/10 bg-white/5 text-white/35",
            ].join(" ")}
          >
            {isSubmitting ? "Creating..." : saveReady ? "Create" : "Blocked"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default function MetadataCreatePage() {
  const state = useMetadataCreatePageState();
  const [hasStarted, setHasStarted] = useState(false);
  const [blockedReasons, setBlockedReasons] = useState<FlowBlockReason[]>([]);
  const createStageRef = useRef<HTMLDivElement | null>(null);

  const missingItems = state.validation.missingItems;
  const flowBlockReasons = getFlowBlockReasons(missingItems);

  function scrollCreateStageIntoView() {
    window.requestAnimationFrame(() => {
      createStageRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function clearBlockedReasons() {
    if (blockedReasons.length > 0) {
      setBlockedReasons([]);
    }
  }

  function showBlockedReasons() {
    setBlockedReasons(flowBlockReasons);
    state.setActivePanel("form");
    scrollCreateStageIntoView();
  }

  function startCreateFlow() {
    setHasStarted(true);
    state.setActivePanel("form");
    clearBlockedReasons();
    scrollCreateStageIntoView();
  }

  function guardedPanelChange(panel: MetadataCreatePanel) {
    if (panel !== "form" && !state.validation.canContinue) {
      showBlockedReasons();
      return;
    }

    clearBlockedReasons();
    state.setActivePanel(panel);
    scrollCreateStageIntoView();
  }

  function guardedCreateRecord() {
    if (!state.validation.canContinue || !state.saveBridge.saveReady) {
      showBlockedReasons();
      return;
    }

    clearBlockedReasons();
    void state.handleCreateRecord();
  }

  function moveToSavePanel() {
    if (!state.validation.canContinue) {
      showBlockedReasons();
      return;
    }

    clearBlockedReasons();
    state.setActivePanel("save");
    scrollCreateStageIntoView();
  }

  return (
    <main className="min-h-screen bg-black px-4 py-4 text-white md:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        {!hasStarted ? (
          <StartCreatePanel onStart={startCreateFlow} />
        ) : (
          <div ref={createStageRef} className="flex flex-col gap-4">
            <CompactCreateToolbar
              activePanel={state.activePanel}
              canContinue={state.validation.canContinue}
              saveReady={state.saveBridge.saveReady}
              isSubmitting={state.isSubmitting}
              onPanelChange={guardedPanelChange}
              onCreateRecord={guardedCreateRecord}
            />

            <FlowGuardCard
              canContinue={state.validation.canContinue}
              missingItems={missingItems}
            />

            <MissingRequiredFieldsAlert
              reasons={blockedReasons}
              onReturnToForm={() => guardedPanelChange("form")}
            />

            {state.activePanel === "form" && (
              <MetadataCreateForm
                title={state.title}
                onTitleChange={state.setTitle}
                selectedShelfId={state.selectedShelfId}
                onShelfChange={state.handleShelfChange}
                selectedSectionId={state.selectedSectionId}
                onSectionChange={state.setSelectedSectionId}
                recordType={state.recordType}
                onRecordTypeChange={state.setRecordType}
                visibility={state.visibility}
                onVisibilityChange={state.setVisibility}
                summary={state.summary}
                onSummaryChange={state.setSummary}
                belongsReason={state.belongsReason}
                onBelongsReasonChange={state.setBelongsReason}
                relationshipType={state.relationshipType}
                onRelationshipTypeChange={state.setRelationshipType}
                relatedRecordId={state.relatedRecordId}
                onRelatedRecordChange={state.setRelatedRecordId}
                shelfOptions={state.shelfOptions}
                activeShelfDescription={state.activeShelf?.description ?? ""}
                activeSections={state.activeSections}
                generatedSlug={state.validation.generatedSlug}
                relationshipOptions={state.relationshipOptions}
                requiredReadyCount={state.validation.requiredReadyCount}
                hasRelationshipStarter={state.validation.hasRelationshipStarter}
                missingItems={missingItems}
                canContinue={state.validation.canContinue}
                titleReady={state.validation.titleReady}
                slugReady={state.validation.slugReady}
                summaryReady={state.validation.summaryReady}
                belongsReady={state.validation.belongsReady}
                activeShelfLabel={state.activeShelf?.label ?? ""}
                activeSectionLabel={state.activeSection?.label ?? ""}
                onFinishReview={moveToSavePanel}
              />
            )}

            {state.activePanel === "preview" && (
              <MetadataCreateSidebar
                activeShelfLabel={state.activeShelf?.label ?? ""}
                activeSectionLabel={state.activeSection?.label ?? ""}
                recordType={state.recordType}
                visibility={state.visibility}
                title={state.validation.trimmedTitle}
                generatedSlug={state.validation.generatedSlug}
                summary={state.validation.trimmedSummary}
                belongsReason={state.validation.trimmedBelongsReason}
                relationshipPreviewLabel={state.relationshipPreviewLabel}
                shelfOptions={state.shelfOptions}
              />
            )}

            {state.activePanel === "output" && (
              <MetadataCreateOutputPanel
                finalRecord={state.recordBuild.finalRecord}
                finalRecordJson={state.recordBuild.finalRecordJson}
              />
            )}

            {state.activePanel === "save" && (
              <MetadataCreateCreateBridgePanel
                saveReady={state.saveBridge.saveReady}
                saveBlockedReasons={state.saveBridge.saveBlockedReasons}
                savePayloadJson={state.saveBridge.savePayloadJson}
                isSubmitting={state.isSubmitting}
                submitMessage={state.submitMessage}
                submitError={state.submitError}
                createdSlug={state.createdSlug}
                onCreateRecord={guardedCreateRecord}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}