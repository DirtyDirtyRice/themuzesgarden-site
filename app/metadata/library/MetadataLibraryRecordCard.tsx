"use client";

import Link from "next/link";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

import { formatLabel, highlightText } from "./metadataLibraryHelpers";
import type { MetadataLibraryRecordSummary } from "./MetadataLibraryPageTypes";

type MetadataLibraryRecordCardProps = {
  activeQuery: string;
  isActive: boolean;
  record: MetadataLibraryRecordSummary;
  onOpenRecord: () => void;
  onPreviewRecord: () => void;
};

type ButtonTone = "primary" | "active";

type CardButtonProps = {
  children: ReactNode;
  tone?: ButtonTone;
  title: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
};

type CardLinkProps = {
  children: ReactNode;
  href: string;
  tone?: ButtonTone;
  title: string;
};

type RecordActionHandler = {
  onOpenRecord: () => void;
  onPreviewRecord: () => void;
};

const CARD_SURFACE_CLASS =
  "border-white/18 bg-black text-white shadow-[0_14px_40px_rgba(0,0,0,0.25)]";

const CARD_ACTIVE_CLASS =
  "border-white/60 bg-black text-white ring-1 ring-white/45 shadow-[0_16px_45px_rgba(255,255,255,0.08)]";

const BUTTON_BASE_CLASS =
  "inline-flex min-h-9 items-center justify-center rounded-md border px-2.5 py-1.5 text-xs font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black hover:scale-[0.99] hover:opacity-85 active:scale-[0.98]";

function getButtonClass(tone: ButtonTone = "primary") {
  return [
    BUTTON_BASE_CLASS,
    tone === "active"
      ? "border-white bg-black text-white"
      : "border-white bg-white text-black",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ].join(" ");
}

function getCardClass(isActive: boolean) {
  return [
    "flex h-full cursor-pointer flex-col gap-2 rounded-2xl border p-3 outline-none transition duration-150",
    "focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black",
    "hover:scale-[0.998] hover:opacity-95 active:scale-[0.995]",
    isActive ? CARD_ACTIVE_CLASS : CARD_SURFACE_CLASS,
  ].join(" ");
}

function getChipClass(isActive: boolean) {
  return [
    "rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none",
    isActive
      ? "border-white bg-white text-black"
      : "border-white/24 bg-white/[0.07] text-white",
  ].join(" ");
}

function stopCardClick(event: MouseEvent<HTMLElement>) {
  event.stopPropagation();
}

function openRecordFromAction(
  event: MouseEvent<HTMLButtonElement>,
  handlers: RecordActionHandler,
) {
  event.stopPropagation();
  handlers.onPreviewRecord();
  handlers.onOpenRecord();
}

function CardButton({
  children,
  tone = "primary",
  title,
  onClick,
}: CardButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={getButtonClass(tone)}
    >
      {children}
    </button>
  );
}

function CardLink({ children, href, tone = "primary", title }: CardLinkProps) {
  return (
    <Link
      href={href}
      title={title}
      onClick={stopCardClick}
      className={getButtonClass(tone)}
    >
      {children}
    </Link>
  );
}

function LocationChips({
  isActive,
  record,
}: {
  isActive: boolean;
  record: MetadataLibraryRecordSummary;
}) {
  const chips = [
    formatLabel(record.shelf),
    formatLabel(record.section),
    formatLabel(record.visibility),
  ];

  return (
    <div className="flex min-w-0 flex-wrap gap-1">
      {chips.map((chip) => (
        <span key={chip} className={getChipClass(isActive)}>
          {chip}
        </span>
      ))}
    </div>
  );
}

function SelectedPill() {
  return (
    <span className="shrink-0 rounded-full border border-white bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-black">
      Selected
    </span>
  );
}

function CardHeader({
  activeQuery,
  isActive,
  record,
}: {
  activeQuery: string;
  isActive: boolean;
  record: MetadataLibraryRecordSummary;
}) {
  return (
    <div className="min-w-0">
      <p
        className={[
          "text-[9px] font-semibold uppercase tracking-[0.16em]",
          isActive ? "text-white" : "text-white/60",
        ].join(" ")}
      >
        Metadata
      </p>

      <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-5 text-white">
        {highlightText(record.title, activeQuery)}
      </h3>
    </div>
  );
}

function CardDescription({
  activeQuery,
  record,
}: {
  activeQuery: string;
  record: MetadataLibraryRecordSummary;
}) {
  return (
    <p className="line-clamp-2 text-xs leading-5 text-white/70">
      {highlightText(record.excerpt, activeQuery)}
    </p>
  );
}

function CardActions({
  record,
  onOpenRecord,
  onPreviewRecord,
}: {
  record: MetadataLibraryRecordSummary;
} & RecordActionHandler) {
  return (
    <div className="mt-auto grid gap-1 pt-1">
      <div className="flex flex-wrap gap-1">
        <CardButton
          title="Preview"
          onClick={(event) =>
            openRecordFromAction(event, { onOpenRecord, onPreviewRecord })
          }
        >
          Meta
        </CardButton>

        <CardLink
          href={`/metadata/library?panel=records&shelf=${encodeURIComponent(
            record.shelf,
          )}`}
          title="Filter"
        >
          Tags
        </CardLink>

        <CardLink href={`/metadata/${record.slug}`} title="Open">
          Desc
        </CardLink>
      </div>

      <div className="flex flex-wrap gap-1">
        <CardButton
          tone="active"
          title="Open"
          onClick={(event) =>
            openRecordFromAction(event, { onOpenRecord, onPreviewRecord })
          }
        >
          Open
        </CardButton>

        <CardLink href={`/metadata/${record.slug}`} title="More">
          Info
        </CardLink>

        <CardLink href={`/metadata/${record.slug}/edit`} title="Edit">
          Edit
        </CardLink>
      </div>
    </div>
  );
}

export default function MetadataLibraryRecordCard({
  activeQuery,
  isActive,
  record,
  onOpenRecord,
  onPreviewRecord,
}: MetadataLibraryRecordCardProps) {
  function handleKeyboardOpen(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onPreviewRecord();
    onOpenRecord();
  }

  return (
    <article
      tabIndex={0}
      role="button"
      aria-label={`Open ${record.title}`}
      onFocus={onPreviewRecord}
      onMouseEnter={onPreviewRecord}
      onClick={onOpenRecord}
      onKeyDown={handleKeyboardOpen}
      className={getCardClass(isActive)}
    >
      <div className="flex items-start justify-between gap-2">
        <LocationChips isActive={isActive} record={record} />
        {isActive && <SelectedPill />}
      </div>

      <CardHeader
        activeQuery={activeQuery}
        isActive={isActive}
        record={record}
      />

      <CardDescription activeQuery={activeQuery} record={record} />

      <CardActions
        record={record}
        onOpenRecord={onOpenRecord}
        onPreviewRecord={onPreviewRecord}
      />
    </article>
  );
}