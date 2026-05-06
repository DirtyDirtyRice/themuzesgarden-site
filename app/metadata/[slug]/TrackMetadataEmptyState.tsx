"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getMetadataRecords } from "@/lib/metadata/metadataLibrarySeed";

const TRACK_METADATA_KEY = "TMZ_TRACK_METADATA_LINKS";

type Props = {
  trackId: string;
};

type MetadataOption = {
  slug: string;
  title: string;
};

function readTrackMetadataMap(): Record<string, string[]> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(TRACK_METADATA_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeTrackMetadataMap(map: Record<string, string[]>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRACK_METADATA_KEY, JSON.stringify(map));
}

function getUniqueSlugs(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export default function TrackMetadataEmptyState({ trackId }: Props) {
  const [attachedMetadata, setAttachedMetadata] = useState<string[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");

  const metadataOptions = useMemo<MetadataOption[]>(() => {
    return getMetadataRecords().map((record) => ({
      slug: record.slug,
      title: record.title,
    }));
  }, []);

  const metadataOptionMap = useMemo(() => {
    return new Map(metadataOptions.map((option) => [option.slug, option]));
  }, [metadataOptions]);

  const attachedMetadataRecords = useMemo(() => {
    return attachedMetadata
      .map((slug) => {
        const option = metadataOptionMap.get(slug);
        if (!option) return null;
        return option;
      })
      .filter(Boolean) as MetadataOption[];
  }, [attachedMetadata, metadataOptionMap]);

  const availableOptions = useMemo(() => {
    const attachedSet = new Set(attachedMetadata);
    return metadataOptions.filter((option) => !attachedSet.has(option.slug));
  }, [attachedMetadata, metadataOptions]);

  const hasAttachedMetadata = attachedMetadataRecords.length > 0;

  useEffect(() => {
    const map = readTrackMetadataMap();
    const existing = Array.isArray(map[trackId])
      ? getUniqueSlugs(map[trackId])
      : [];
    setAttachedMetadata(existing);
  }, [trackId]);

  useEffect(() => {
    if (
      selectedSlug &&
      availableOptions.some((option) => option.slug === selectedSlug)
    ) {
      return;
    }

    setSelectedSlug(availableOptions[0]?.slug ?? "");
  }, [availableOptions, selectedSlug]);

  function attachMetadata() {
    if (!selectedSlug) return;

    const map = readTrackMetadataMap();
    const existing = Array.isArray(map[trackId])
      ? getUniqueSlugs(map[trackId])
      : [];

    if (existing.includes(selectedSlug)) {
      setAttachedMetadata(existing);
      return;
    }

    const next = [...existing, selectedSlug];
    map[trackId] = next;
    writeTrackMetadataMap(map);
    setAttachedMetadata(next);
  }

  return (
    <>
      <section className="rounded-2xl border border-white bg-black p-6">
        <p
          className="text-xs uppercase tracking-[0.2em]"
          style={{ color: "var(--text-normal)" }}
        >
          Track Metadata
        </p>

        <h1
          className="mt-2 text-3xl font-semibold"
          style={{ color: "var(--text-strong)" }}
        >
          {hasAttachedMetadata ? "Track Metadata" : "No Metadata Yet"}
        </h1>

        <p
          className="mt-3 text-sm"
          style={{ color: "var(--text-normal)" }}
        >
          {hasAttachedMetadata
            ? "This track already has metadata attached."
            : "This track does not have metadata attached yet."}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="rounded border border-white bg-black px-3 py-2 text-sm"
            style={{ color: "var(--text-normal)" }}
            disabled={availableOptions.length === 0}
          >
            {availableOptions.length === 0 ? (
              <option value="">All metadata attached</option>
            ) : (
              availableOptions.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.title}
                </option>
              ))
            )}
          </select>

          <button
            type="button"
            onClick={attachMetadata}
            disabled={!selectedSlug}
            className="rounded border border-white bg-black px-3 py-2 text-sm disabled:opacity-50"
            style={{ color: "var(--text-strong)" }}
          >
            Attach Metadata
          </button>

          <Link
            href="/metadata/create"
            className="rounded border border-white bg-black px-3 py-2 text-sm"
            style={{ color: "var(--text-normal)" }}
          >
            Create Metadata
          </Link>

          <Link
            href="/library"
            className="rounded border border-white bg-black px-3 py-2 text-sm"
            style={{ color: "var(--text-normal)" }}
          >
            Back to Library
          </Link>
        </div>
      </section>

      {attachedMetadataRecords.length > 0 && (
        <section className="rounded-2xl border border-white bg-black p-6">
          <div className="flex items-center justify-between">
            <h2
              className="text-2xl font-semibold"
              style={{ color: "var(--text-strong)" }}
            >
              Attached Metadata
            </h2>

            <span
              className="text-xs border border-white px-2 py-1 rounded"
              style={{ color: "var(--text-normal)" }}
            >
              {attachedMetadataRecords.length}
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {attachedMetadataRecords.map((record) => (
              <Link
                key={record.slug}
                href={`/metadata/${encodeURIComponent(record.slug)}`}
                className="block rounded-xl border border-white bg-black px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-strong)" }}
                  >
                    {record.title}
                  </div>
                </div>

                <div
                  className="mt-1 text-xs"
                  style={{ color: "var(--text-normal)" }}
                >
                  {record.slug}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}