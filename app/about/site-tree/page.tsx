"use client";

import ManualShell from "../components/ManualShell";
import { ManualInfoSection, ManualInlineLink } from "../components/ManualCards";

const TREE = [
  {
    label: "DONE",
    tone: "border-emerald-200/20 bg-emerald-300/[0.04]",
    items: [
      "Home page exists and no longer redirects to Projects",
      "TitleBar Home and Project routes are fixed",
      "Find It opens clean with Clear / Reset",
      "Find It highlights results and shows selected/top result clarity",
      "Find It can show Navigation and Metadata source chips",
      "Metadata seed records exist",
      "Manual system has reusable layout components",
      "Core manual pages are being upgraded into a unified format",
    ],
  },
  {
    label: "DOING",
    tone: "border-amber-200/20 bg-amber-300/[0.04]",
    items: [
      "Build the in-app manual / encyclopedia",
      "Connect metadata records deeper into Find It",
      "Separate app-section links from More Info explanation pages",
      "Keep files split before they grow too large",
      "Turn flat explanation pages into connected manual pages",
    ],
  },
  {
    label: "STILL TO DO",
    tone: "border-white/10 bg-white/[0.03]",
    items: [
      "Create deeper child manual pages for important words and features",
      "Add relationship-aware metadata search",
      "Improve project pages and connect projects to metadata",
      "Build the future AI music generator architecture",
      "Create a full navigation tree view that users can browse visually",
      "Add manual search results into Find It",
      "Add project-aware playback context",
    ],
  },
];

const SYSTEM_FLOW = [
  "Home",
  "Manual",
  "Projects",
  "Metadata",
  "Find It",
  "Global Player",
  "AI Music Generator",
  "Site Tree",
];

export default function SiteTreePage() {
  return (
    <ManualShell
      eyebrow="Roadmap"
      title="Site Tree / Roadmap"
      description="This page is the map for where The Muzes Garden is now and where it is going. It tracks done, doing, and still-to-do work so the app can grow without losing the plot."
    >
      <section className="grid gap-4 lg:grid-cols-3">
        {TREE.map((group) => (
          <article
            key={group.label}
            className={[
              "rounded-2xl border p-5",
              group.tone,
            ].join(" ")}
          >
            <h2 className="text-2xl font-semibold text-white">
              {group.label}
            </h2>

            <ul className="mt-4 space-y-3 text-sm leading-6 text-white/65">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-white/10 bg-black/30 p-3"
                >
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <ManualInfoSection title="Current big-picture structure">
        <p>
          The app is becoming a connected creative operating system. The current
          structure starts with{" "}
          <ManualInlineLink href="/">
            Home
          </ManualInlineLink>
          , then branches into working tools and manual explanations.
        </p>

        <div className="grid gap-2 rounded-xl border border-white/10 bg-black/35 p-4 md:grid-cols-4">
          {SYSTEM_FLOW.map((item, index) => (
            <div
              key={item}
              className="rounded-xl border border-white/10 bg-white/[0.025] p-3"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
                Step {index + 1}
              </p>

              <p className="mt-1 text-sm font-semibold text-white/75">
                {item}
              </p>
            </div>
          ))}
        </div>
      </ManualInfoSection>

      <ManualInfoSection title="Future tree idea">
        <p>
          The final version should let users click through a tree like:
        </p>

        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <p className="text-sm leading-7 text-white/70">
            Home → Metadata → Library → Record → Relationships → More Info →
            Related Concept → Project → Player
          </p>
        </div>

        <p>
          That same tree should help{" "}
          <ManualInlineLink href="/about/find-it">
            Find It
          </ManualInlineLink>{" "}
          explain exactly how to get from the current page to the target page.
        </p>
      </ManualInfoSection>

      <ManualInfoSection title="Why this roadmap matters">
        <p>
          The Muzes Garden is already deep enough that a roadmap is not optional.
          Without a clear tree, the app would turn into scattered features.
        </p>

        <p>
          The roadmap keeps the build honest. It shows what already works, what
          is actively being shaped, and what should not be pretended to be done
          yet.
        </p>

        <p>
          This page should eventually become both a developer map and a user map.
          Users should be able to see where features live, while development can
          use the same tree to avoid duplicating systems.
        </p>
      </ManualInfoSection>
    </ManualShell>
  );
}