import Link from "next/link";

import MetadataQueryPanel from "../../../lib/metadata/MetadataQueryPanel";
import { buildMetadataFromTracks } from "../../../lib/metadata/metadataLibraryBridge";
import { getSupabaseTracks } from "../../../lib/getSupabaseTracks";
import { TRACKS_SEED } from "../../../lib/tracksSeed";
import { buildLibraryGroundworkTracks } from "../../library/libraryTrackGroundwork";
import type { TrackLike } from "../../library/libraryTypes";
import { mergeTrackLists, normalizeTrack } from "../../library/libraryUtils";

function isTrackLike(track: TrackLike | null): track is TrackLike {
  return track !== null;
}

function DetailCard({
  eyebrow,
  title,
  children,
  defaultOpen = false,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="rounded-2xl border border-white/10 bg-white/[0.03]"
    >
      <summary className="cursor-pointer list-none px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white md:text-2xl">
              {title}
            </h2>
          </div>

          <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-white/45">
            Open / Close
          </span>
        </div>
      </summary>

      <div className="border-t border-white/10 px-5 pb-5 pt-4">{children}</div>
    </details>
  );
}

export default async function MetadataSystemPage() {
  const supabaseTracksRaw = await getSupabaseTracks();

  const normalizedSupabaseTracks = (Array.isArray(supabaseTracksRaw)
    ? supabaseTracksRaw
    : []
  )
    .map((track) => normalizeTrack(track as Record<string, unknown>))
    .filter(isTrackLike);

  const normalizedSeedTracks = (Array.isArray(TRACKS_SEED) ? TRACKS_SEED : [])
    .map((track) => normalizeTrack(track as Record<string, unknown>))
    .filter(isTrackLike);

  const mergedTracks = mergeTrackLists(
    normalizedSupabaseTracks,
    normalizedSeedTracks
  );

  const groundworkTracks = buildLibraryGroundworkTracks(
    mergedTracks as Record<string, unknown>[]
  );

  const visibleTracks = groundworkTracks.filter((track) => {
    const visibility = String(
      (track as Record<string, unknown>)?.libraryAccess &&
        typeof (track as Record<string, unknown>).libraryAccess === "object"
        ? ((track as Record<string, unknown>).libraryAccess as Record<
            string,
            unknown
          >).visibility ?? ""
        : ""
    )
      .trim()
      .toLowerCase();

    return visibility !== "private";
  });

  const { entries, links } = buildMetadataFromTracks(
    visibleTracks as Record<string, unknown>[]
  );

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white md:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white/10 px-2 py-1 text-white/70">
                  Metadata
                </span>
                <span className="rounded-full border border-white/10 px-2 py-1 text-white/70">
                  System
                </span>
                <span className="rounded-full border border-white/10 px-2 py-1 text-white/70">
                  Foundation
                </span>
                <span className="rounded-full border border-white/10 px-2 py-1 text-white/70">
                  Query
                </span>
              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                Metadata System
              </p>

              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Metadata Control Surface
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70 md:text-base">
                This page is now meant to stay tighter and more usable. The
                query system stays near the top. The deeper explanations stay
                available below in collapsible sections instead of stretching the
                whole page into a giant scroll.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/metadata"
                className="inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Back to Metadata Library
              </Link>

              <Link
                href="/metadata/system/more"
                className="inline-flex rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                More Information
              </Link>

              <Link
                href="/create"
                className="inline-flex rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Create
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_340px]">
          <div className="min-w-0">
            <MetadataQueryPanel entries={entries} links={links} />
          </div>

          <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              Quick Notes
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Use This Page Fast
            </h2>

            <div className="mt-4 space-y-3 text-sm leading-6 text-white/70">
              <p>
                Run a query first. Results should appear much closer to the top
                now instead of feeling buried far down the page.
              </p>

              <p>
                The long theory and system explanation blocks are now collapsed
                below so this page stays tighter.
              </p>

              <p>
                Use <span className="text-white">More Information</span> for
                deeper reading and <span className="text-white">Create</span> as
                the future expansion path for build tools and child systems.
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
                  Visible metadata entries
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {entries.length}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
                  Visible metadata links
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {links.length}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
                  Visible tracks feeding system
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {visibleTracks.length}
                </div>
              </div>
            </div>
          </aside>
        </section>

        <div className="grid gap-4">
          <DetailCard
            eyebrow="Core Principle"
            title="Deep Underneath, Clean on the Surface"
            defaultOpen={true}
          >
            <div className="space-y-4 text-sm leading-7 text-white/75 md:text-base">
              <p>
                The system is being designed so that important things can have
                parent-child structure, related records, deeper pages, examples,
                and future tutorial branches. At the same time, the visible page
                should not overwhelm the user with too many buttons, links, or
                distractions.
              </p>

              <p>
                This means the architecture can be deep even when the page looks
                simple. A user who wants only the basics can stay near the top.
                A user who wants to explore can keep going deeper through more
                information pages, relationship links, context actions, or
                future create tools.
              </p>
            </div>
          </DetailCard>

          <DetailCard eyebrow="Structure Model" title="Shared Parenthood Ability">
            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  Parent
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  A page, term, control, record, or future create item can
                  become a parent when it leads to child concepts, deeper
                  examples, advanced explanations, or related branches.
                </p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  Child
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  A child can be a deeper explanation page, a practical example,
                  a tutorial branch, a system note, a music concept, or a future
                  create-system record.
                </p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  Related
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Not everything has to be parent and child. Some records should
                  connect sideways through relationships so users can move across
                  the knowledge network instead of only down a single chain.
                </p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  Depth
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  The rabbit hole can go as deep as needed. The important rule
                  is that the UI should only expose that depth when it helps the
                  user instead of cluttering the surface.
                </p>
              </article>
            </div>
          </DetailCard>

          <DetailCard eyebrow="Entry Paths" title="Ways Users Can Go Deeper">
            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  More Information Buttons
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Major pages and important records can expose a visible More
                  Information button when a deeper explanation makes sense.
                </p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  Hover Help
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Short help text can appear on hover for quick explanations.
                  This keeps the interface friendly for beginners without
                  forcing them into long pages immediately.
                </p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  Right-Click Context Actions
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Advanced users can use right-click or future context menus to
                  go deeper directly from the thing they are interacting with.
                </p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  Top-Bar Systems
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Top-bar areas like Metadata and the future Create tab can act
                  as clean entry points into the deeper knowledge structure.
                </p>
              </article>
            </div>
          </DetailCard>

          <DetailCard eyebrow="Create Connection" title="Future Create-System Expansion">
            <div className="space-y-4 text-sm leading-7 text-white/75 md:text-base">
              <p>
                The future Create system can use this same structure. A create
                item can have a short explanation, a beginner example, a More
                Information page, and future child pages beneath it. That means
                the create layer and the metadata layer do not need separate
                help systems.
              </p>

              <p>
                This allows the app to grow without becoming inconsistent.
                Buttons, records, controls, pages, and future create items can
                all plug into the same deeper knowledge model.
              </p>
            </div>
          </DetailCard>

          <DetailCard eyebrow="Future Slots" title="What Can Grow Here Later">
            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  Tutorials
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Step-by-step walkthroughs for beginners and advanced users.
                </p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  Examples
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Practical musical and interface examples that show how
                  concepts work in real situations.
                </p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  Help Records
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Dedicated system explanations for controls, labels, tabs, and
                  future create actions.
                </p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  Media
                </p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Later this can grow into embedded demos, screenshots, and
                  video guidance.
                </p>
              </article>
            </div>
          </DetailCard>
        </div>
      </div>
    </main>
  );
}