export type MetadataEditPanelKey = "form" | "preview" | "update";

type MetadataEditPanel = {
  key: MetadataEditPanelKey;
  title: string;
  description: string;
};

const PANELS: MetadataEditPanel[] = [
  {
    key: "form",
    title: "Edit Form",
    description:
      "Change the record title, placement, summary, and relationship.",
  },
  {
    key: "preview",
    title: "Relationship Preview",
    description:
      "Check what the selected relationship means before updating.",
  },
  {
    key: "update",
    title: "Update Output",
    description:
      "Review the updated record output and save the edit.",
  },
];

type Props = {
  activePanel: MetadataEditPanelKey;
  onPanelChange: (panel: MetadataEditPanelKey) => void;
};

export default function MetadataEditPanelNavigator({
  activePanel,
  onPanelChange,
}: Props) {
  const active = PANELS.find((p) => p.key === activePanel);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
            Edit Workspace
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Choose One Edit Panel
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70 md:text-base">
            Use these buttons instead of scrolling through the whole edit page.
            Pick one panel, work on that section, then move to the next panel
            when you are ready.
          </p>

          {/* ✅ NEW: CURRENT PANEL INDICATOR */}
          <div className="mt-3 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm">
            <span className="text-white/50">Current Panel: </span>
            <span className="font-medium text-white">
              {active?.title ?? "Unknown"}
            </span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {PANELS.map((panel) => {
            const isActive = panel.key === activePanel;

            return (
              <button
                key={panel.key}
                type="button"
                onClick={() => onPanelChange(panel.key)}
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
      </div>
    </section>
  );
}