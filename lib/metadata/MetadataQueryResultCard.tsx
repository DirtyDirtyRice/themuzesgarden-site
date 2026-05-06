"use client";

import Link from "next/link";
import { useState } from "react";
import {
  asRecord,
  buildDisplayRow,
  getSourceBadge,
  getTagList,
  getPreviewValue,
  highlightText,
  truncatePreview,
} from "./metadataQueryResultsHelpers";

type MetadataQueryResultCardProps = {
  item: unknown;
  index: number;
  query: string;
};

export default function MetadataQueryResultCard({
  item,
  index,
  query,
}: MetadataQueryResultCardProps) {
  const [isOpen, setIsOpen] = useState(index === 0);

  const row = buildDisplayRow(item, index);
  const record = asRecord(item);
  const slug =
    record && typeof record.slug === "string" ? record.slug : undefined;

  const previewValue = truncatePreview(getPreviewValue(row));
  const tags = getTagList(row);
  const sourceBadge = getSourceBadge(row);

  const linkedMainContent = (
    <>
      <div>
        <div className="text-base font-semibold text-white">
          {highlightText(row.title, query)}
        </div>

        {sourceBadge ? (
          <div className="mt-1 text-xs uppercase tracking-[0.12em] text-white">
            {highlightText(sourceBadge, query)}
          </div>
        ) : null}
      </div>

      {previewValue ? (
        <div className="text-sm leading-6 text-white">
          {highlightText(previewValue, query)}
        </div>
      ) : null}
    </>
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] text-white">
      <div className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          {slug ? (
            <Link
              href={`/metadata/${slug}`}
              className="block rounded-lg transition hover:opacity-90"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                {linkedMainContent}
              </div>
            </Link>
          ) : (
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              {linkedMainContent}
            </div>
          )}

          {tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={`${row.title}-${tag}`}
                  href={`/metadata/results?query=${encodeURIComponent(tag)}`}
                  className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[11px] text-white transition hover:bg-white/10"
                >
                  {highlightText(tag, query)}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {slug ? (
            <Link
              href={`/metadata/${slug}`}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
            >
              Open Record
            </Link>
          ) : null}

          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
          >
            {isOpen ? "Hide Details" : "Show Details"}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="border-t border-white/10 px-4 pb-4 pt-4">
          <div className="grid gap-3 md:grid-cols-2">
            {row.fields.map((field) => (
              <div
                key={`${index}-${field.label}`}
                className="rounded-xl border border-white/10 bg-black/30 p-3 text-white"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                  {field.label}
                </div>
                <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-white">
                  {highlightText(field.value, query)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}