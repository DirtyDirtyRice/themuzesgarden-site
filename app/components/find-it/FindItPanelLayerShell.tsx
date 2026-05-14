import type {
  FindItLayerShellProps,
  FindItLayerTone,
} from "./FindItPanelTypes";

function getLayerToneClasses(tone: FindItLayerTone) {
  if (tone === "emerald") {
    return "border-emerald-300/25 bg-emerald-300/[0.04]";
  }

  if (tone === "indigo") {
    return "border-indigo-300/25 bg-indigo-300/[0.05]";
  }

  if (tone === "amber") {
    return "border-amber-300/25 bg-amber-300/[0.05]";
  }

  return "border-white/10 bg-black/30";
}

function getBadgeToneClasses(tone: FindItLayerTone) {
  if (tone === "emerald") {
    return "border-emerald-100/15 bg-black/25 text-emerald-100/65";
  }

  if (tone === "indigo") {
    return "border-indigo-100/15 bg-black/25 text-indigo-100/65";
  }

  if (tone === "amber") {
    return "border-amber-100/15 bg-black/25 text-amber-100/65";
  }

  return "border-white/10 bg-black/45 text-white/55";
}

function getTitleToneClasses(tone: FindItLayerTone) {
  if (tone === "emerald") {
    return "text-emerald-100/80";
  }

  if (tone === "indigo") {
    return "text-indigo-100/75";
  }

  if (tone === "amber") {
    return "text-amber-100/75";
  }

  return "text-white/45";
}

function getDescriptionToneClasses(tone: FindItLayerTone) {
  if (tone === "emerald") {
    return "text-emerald-100/65";
  }

  if (tone === "indigo") {
    return "text-indigo-100/65";
  }

  if (tone === "amber") {
    return "text-amber-100/65";
  }

  return "text-white/60";
}

export default function FindItPanelLayerShell({
  badge,
  children,
  description,
  title,
  tone = "default",
}: FindItLayerShellProps) {
  return (
    <section
      className={[
        "rounded-2xl border p-3",
        getLayerToneClasses(tone),
      ].join(" ")}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p
            className={[
              "text-xs font-bold uppercase tracking-[0.18em]",
              getTitleToneClasses(tone),
            ].join(" ")}
          >
            {title}
          </p>

          <p
            className={[
              "mt-1 text-xs leading-5",
              getDescriptionToneClasses(tone),
            ].join(" ")}
          >
            {description}
          </p>
        </div>

        {badge ? (
          <span
            className={[
              "rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
              getBadgeToneClasses(tone),
            ].join(" ")}
          >
            {badge}
          </span>
        ) : null}
      </div>

      {children}
    </section>
  );
}