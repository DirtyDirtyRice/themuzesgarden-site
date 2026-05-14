import Link from "next/link";

type MetadataMeaning = {
  title: string;
  excerpt: string;
  slug?: string;
};

type MeaningTone = "quiet" | "ready" | "partial";

type MeaningStatus = {
  label: string;
  message: string;
  tone: MeaningTone;
};

type MeaningAction = {
  id: string;
  label: string;
  helperText: string;
  href?: string;
  isPrimary: boolean;
  isAvailable: boolean;
  unavailableReason?: string;
};

function getMeaningStatus(
  metadataMeaning: MetadataMeaning | null,
): MeaningStatus {
  if (!metadataMeaning) {
    return {
      label: "No meaning match",
      message:
        "Find It does not have a matching metadata explanation for this target yet.",
      tone: "quiet",
    };
  }

  if (metadataMeaning.slug) {
    return {
      label: "Metadata match",
      message:
        "This target has a full metadata record you can open for deeper context.",
      tone: "ready",
    };
  }

  return {
    label: "Quick meaning",
    message:
      "This target has a short meaning explanation, but no full record page yet.",
    tone: "partial",
  };
}

function getMeaningActionLabel(metadataMeaning: MetadataMeaning) {
  if (metadataMeaning.slug) {
    return `Open ${metadataMeaning.title}`;
  }

  return "No full record yet";
}

function getMeaningHelperText(metadataMeaning: MetadataMeaning) {
  if (metadataMeaning.slug) {
    return "Use this when you want the larger explanation, relationships, and record details.";
  }

  return "This explanation can still help you understand why Find It picked this result.";
}

function getMeaningBadgeClasses(tone: MeaningTone) {
  if (tone === "ready") {
    return "border-sky-100/30 bg-sky-100/10 text-sky-50";
  }

  if (tone === "partial") {
    return "border-yellow-100/30 bg-yellow-100/10 text-yellow-50";
  }

  return "border-white/15 bg-white/5 text-white/60";
}

function getMeaningPanelTone(tone: MeaningTone) {
  if (tone === "ready") {
    return "border-sky-300/20 bg-sky-300/10";
  }

  if (tone === "partial") {
    return "border-yellow-300/25 bg-yellow-300/10";
  }

  return "border-white/10 bg-black/45";
}

function getMeaningTitle(metadataMeaning: MetadataMeaning | null) {
  if (metadataMeaning) {
    return metadataMeaning.title;
  }

  return "No metadata explanation found yet";
}

function getMeaningExcerpt(metadataMeaning: MetadataMeaning | null) {
  if (metadataMeaning) {
    return metadataMeaning.excerpt;
  }

  return "Find It can still guide the route, but this result does not have a richer meaning card connected yet.";
}

function buildMeaningActions(
  metadataMeaning: MetadataMeaning | null,
): MeaningAction[] {
  if (!metadataMeaning) {
    return [
      {
        id: "explain-route-only",
        label: "Use route guidance only",
        helperText:
          "Find It can still show where this target lives in the app tree.",
        isPrimary: true,
        isAvailable: false,
        unavailableReason: "No metadata record is connected yet.",
      },
      {
        id: "future-create-meaning",
        label: "Create meaning record later",
        helperText:
          "This slot is reserved for a future metadata creation shortcut.",
        isPrimary: false,
        isAvailable: false,
        unavailableReason: "Creation shortcut is not wired yet.",
      },
    ];
  }

  if (metadataMeaning.slug) {
    return [
      {
        id: "open-record",
        label: getMeaningActionLabel(metadataMeaning),
        helperText:
          "Open the full metadata page for the deeper explanation and related details.",
        href: `/metadata/${metadataMeaning.slug}`,
        isPrimary: true,
        isAvailable: true,
      },
      {
        id: "explore-relationships",
        label: "Explore relationships",
        helperText:
          "Use the metadata record to inspect how this idea connects to other records.",
        href: `/metadata/${metadataMeaning.slug}`,
        isPrimary: false,
        isAvailable: true,
      },
      {
        id: "use-explanation",
        label: "Use quick explanation",
        helperText:
          "Stay here and use this shorter explanation to understand the target.",
        isPrimary: false,
        isAvailable: false,
        unavailableReason: "This is already visible in the card.",
      },
    ];
  }

  return [
    {
      id: "read-quick-meaning",
      label: "Read quick meaning",
      helperText:
        "Use the explanation here even though no full record page exists yet.",
      isPrimary: true,
      isAvailable: false,
      unavailableReason: "Quick meaning is already shown below.",
    },
    {
      id: "future-full-record",
      label: "Open full record",
      helperText:
        "This will become available when this meaning is connected to a metadata slug.",
      isPrimary: false,
      isAvailable: false,
      unavailableReason: "No full record slug yet.",
    },
  ];
}

function getActionClasses(action: MeaningAction) {
  if (action.isAvailable && action.isPrimary) {
    return "border-white bg-white text-black hover:bg-sky-100";
  }

  if (action.isAvailable) {
    return "border-sky-100/25 bg-sky-100/10 text-sky-50 hover:bg-sky-100/15";
  }

  return "cursor-not-allowed border-white/10 bg-black/30 text-white/45";
}

function getActionBadge(action: MeaningAction) {
  if (action.isPrimary && action.isAvailable) {
    return "Primary";
  }

  if (action.isAvailable) {
    return "Available";
  }

  if (action.unavailableReason) {
    return "Waiting";
  }

  return "Info";
}

function getActionBadgeClasses(action: MeaningAction) {
  if (action.isPrimary && action.isAvailable) {
    return "border-emerald-100/30 bg-emerald-100/10 text-emerald-50";
  }

  if (action.isAvailable) {
    return "border-sky-100/30 bg-sky-100/10 text-sky-50";
  }

  return "border-white/10 bg-white/5 text-white/45";
}

function getMeaningReadinessItems(
  metadataMeaning: MetadataMeaning | null,
) {
  return [
    {
      label: "Meaning text",
      isReady: Boolean(metadataMeaning?.excerpt),
    },
    {
      label: "Full record",
      isReady: Boolean(metadataMeaning?.slug),
    },
    {
      label: "Relationship path",
      isReady: Boolean(metadataMeaning?.slug),
    },
  ];
}

function getReadinessClasses(isReady: boolean) {
  if (isReady) {
    return "border-emerald-200/25 bg-emerald-200/10 text-emerald-50";
  }

  return "border-white/10 bg-black/30 text-white/45";
}

function MeaningActionCard({
  action,
}: {
  action: MeaningAction;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">
            {action.label}
          </p>

          <p className="mt-1 text-xs leading-5 opacity-75">
            {action.helperText}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${getActionBadgeClasses(
            action,
          )}`}
        >
          {getActionBadge(action)}
        </span>
      </div>

      {action.unavailableReason ? (
        <p className="mt-2 text-[11px] leading-5 opacity-60">
          {action.unavailableReason}
        </p>
      ) : null}
    </>
  );

  if (action.href && action.isAvailable) {
    return (
      <Link
        href={action.href}
        className={`rounded-xl border px-3 py-2 text-left text-sm transition ${getActionClasses(
          action,
        )}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      className={`rounded-xl border px-3 py-2 text-sm ${getActionClasses(
        action,
      )}`}
    >
      {content}
    </div>
  );
}

export default function FindItTargetMeaning({
  metadataMeaning,
}: {
  metadataMeaning: MetadataMeaning | null;
}) {
  const status = getMeaningStatus(metadataMeaning);
  const actions = buildMeaningActions(metadataMeaning);
  const readinessItems = getMeaningReadinessItems(metadataMeaning);
  const panelTone = getMeaningPanelTone(status.tone);

  return (
    <div className={`rounded-xl border p-3 ${panelTone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-100">
            Meaning
          </p>

          <h3 className="mt-1 text-base font-semibold text-sky-50">
            {getMeaningTitle(metadataMeaning)}
          </h3>
        </div>

        <span
          className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${getMeaningBadgeClasses(
            status.tone,
          )}`}
        >
          {status.label}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-sky-50/85">
        {getMeaningExcerpt(metadataMeaning)}
      </p>

      <div className="mt-3 rounded-lg border border-sky-100/15 bg-black/25 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-100/75">
          Why this matters
        </p>

        <p className="mt-1 text-sm leading-6 text-sky-50/75">
          {status.message}
        </p>

        {metadataMeaning ? (
          <p className="mt-1 text-xs leading-5 text-sky-50/55">
            {getMeaningHelperText(metadataMeaning)}
          </p>
        ) : (
          <p className="mt-1 text-xs leading-5 text-sky-50/55">
            This is still useful because path guidance and meaning guidance are
            separate systems. Missing meaning should not block navigation.
          </p>
        )}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {readinessItems.map((item) => (
          <div
            key={item.label}
            className={`rounded-lg border px-3 py-2 ${getReadinessClasses(
              item.isReady,
            )}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.12em]">
              {item.isReady ? "Ready" : "Waiting"}
            </p>

            <p className="mt-1 text-xs leading-5">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
              Meaning actions
            </p>

            <p className="mt-1 text-sm leading-6 text-white/65">
              Use these actions when you want to move from route guidance into
              deeper explanation, metadata, or relationship exploration.
            </p>
          </div>

          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase text-white/55">
            {actions.length} actions
          </span>
        </div>

        <div className="mt-3 grid gap-2">
          {actions.map((action) => (
            <MeaningActionCard
              key={action.id}
              action={action}
            />
          ))}
        </div>
      </div>
    </div>
  );
}