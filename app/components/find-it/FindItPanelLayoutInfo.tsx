import type {
  FindItPanelLayoutModel,
  FindItPanelSectionState,
} from "./FindItPanelTypes";

function getSectionClasses(isActive: boolean) {
  return [
    "rounded-xl border px-3 py-2",
    isActive
      ? "border-emerald-300/25 bg-emerald-300/[0.07]"
      : "border-white/10 bg-white/[0.03]",
  ].join(" ");
}

function getSectionLabelClasses(isActive: boolean) {
  return isActive
    ? "text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-100/70"
    : "text-[11px] font-bold uppercase tracking-[0.16em] text-white/40";
}

function getSectionDetailClasses(isActive: boolean) {
  return isActive
    ? "mt-1 text-xs leading-5 text-emerald-100/65"
    : "mt-1 text-xs leading-5 text-white/45";
}

export default function FindItPanelLayoutInfo({
  cleanSearchValue,
  layout,
  sectionStates,
}: {
  cleanSearchValue: string;
  layout: FindItPanelLayoutModel;
  sectionStates: FindItPanelSectionState[];
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
            Panel order
          </p>

          <p className="mt-1 text-sm font-semibold text-white">
            {layout.label}
          </p>
        </div>

        <p className="max-w-3xl text-xs leading-5 text-white/60">
          {layout.copy}
        </p>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {sectionStates.map((section) => (
          <div key={section.name} className={getSectionClasses(section.isActive)}>
            <p className={getSectionLabelClasses(section.isActive)}>
              {section.label}
            </p>

            <p className={getSectionDetailClasses(section.isActive)}>
              {section.detail}
            </p>
          </div>
        ))}
      </div>

      {cleanSearchValue ? (
        <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-white/35">
          Active search: {cleanSearchValue}
        </p>
      ) : null}
    </section>
  );
}