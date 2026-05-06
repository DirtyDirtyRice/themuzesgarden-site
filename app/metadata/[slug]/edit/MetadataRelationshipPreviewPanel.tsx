"use client";

import { useState } from "react";

type PreviewPanelKey = "meaning" | "connection" | "next";

type Props = {
  relationshipPreviewDescription: string;
  relationshipMeaning: string;
  sourceTitle: string;
  targetTitle: string;
  hasSelectedRelatedRecord: boolean;
  canGoToUpdate: boolean;
  onGoToForm: () => void;
  onGoToUpdate: () => void;
};

const PREVIEW_PANELS: {
  key: PreviewPanelKey;
  title: string;
  description: string;
}[] = [
  {
    key: "meaning",
    title: "Meaning",
    description: "Explains what this relationship means.",
  },
  {
    key: "connection",
    title: "Connection",
    description: "Shows what two records will be linked.",
  },
  {
    key: "next",
    title: "Next Step",
    description: "Go back to edit or continue to update.",
  },
];

export default function MetadataRelationshipPreviewPanel({
  relationshipPreviewDescription,
  relationshipMeaning,
  sourceTitle,
  targetTitle,
  hasSelectedRelatedRecord,
  canGoToUpdate,
  onGoToForm,
  onGoToUpdate,
}: Props) {
  const [activePreviewPanel, setActivePreviewPanel] =
    useState<PreviewPanelKey>("meaning");

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
            Relationship Preview
          </span>

          <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Relationship Preview Context
          </h2>

          <p className="max-w-3xl text-sm leading-6 text-white/70 md:text-base">
            Use these buttons instead of scrolling. Pick one preview part at a
            time so the relationship is easier to understand.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {PREVIEW_PANELS.map((panel) => {
            const isActive = panel.key === activePreviewPanel;

            return (
              <button
                key={panel.key}
                type="button"
                onClick={() => setActivePreviewPanel(panel.key)}
                className={[
                  "rounded-2xl border p-4 text-left transition",
                  isActive
                    ? "scale-[1.01] border-white bg-white text-black shadow-[0_0_0_1px_rgba(255,255,255,0.6)]"
                    : "border-white/10 bg-black/40 text-white hover:bg-white/[0.06]",
                ].join(" ")}
              >
                <span
                  className={[
                    "block text-base font-semibold",
                    isActive ? "text-black" : "text-white",
                  ].join(" ")}
                >
                  {panel.title}
                </span>

                <span
                  className={[
                    "mt-2 block text-sm leading-6",
                    isActive ? "text-black/75" : "text-white/70",
                  ].join(" ")}
                >
                  {panel.description}
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          {activePreviewPanel === "meaning" ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Meaning
              </p>

              <p className="mt-3 text-base font-semibold text-white">
                {relationshipPreviewDescription}
              </p>

              <p className="mt-3 text-sm leading-6 text-white/75">
                {relationshipMeaning}
              </p>
            </>
          ) : null}

          {activePreviewPanel === "connection" ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Connection
              </p>

              {hasSelectedRelatedRecord ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/70">
                  This will connect{" "}
                  <span className="font-medium text-white">{sourceTitle}</span>{" "}
                  to{" "}
                  <span className="font-medium text-white">{targetTitle}</span>.
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/70">
                  You need to pick a relationship first before this preview can
                  guide the update.
                </div>
              )}
            </>
          ) : null}

          {activePreviewPanel === "next" ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Next Step
              </p>

              <p className="mt-3 text-sm leading-6 text-white/70">
                Go back to the form if you need to change the relationship, or
                continue to the update panel when this looks correct.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onGoToForm}
                  className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Go to Form
                </button>

                <button
                  type="button"
                  onClick={onGoToUpdate}
                  disabled={!canGoToUpdate}
                  className={[
                    "rounded-md px-4 py-2 text-sm font-medium transition",
                    canGoToUpdate
                      ? "border border-white/10 bg-white text-black hover:bg-white/90"
                      : "cursor-not-allowed border border-white/10 bg-white/5 text-white/35",
                  ].join(" ")}
                >
                  Looks Good → Go to Update
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}