import {
  getSectionDescriptionSafe,
  getSectionQualityLabel,
  getSectionTagsSafe,
  normalizeStart,
} from "./momentInspectorHelpers";
import { formatMomentTime } from "./playerUtils";
import type { TrackSection } from "./playerTypes";

type SectionIssueFlag =
  | "missing-start"
  | "missing-description"
  | "missing-tags"
  | "out-of-order"
  | "dense-tags";

type SectionAnalysis = {
  section: TrackSection;
  index: number;
  tags: string[];
  description: string;
  start: number | null;
  hasDescription: boolean;
  hasTags: boolean;
  hasStart: boolean;
  isOutOfOrder: boolean;
  issueFlags: SectionIssueFlag[];
  completenessScore: number;
  gapFromPrevious: number | null;
};

function clamp100(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function buildSectionIssueFlags(params: {
  hasDescription: boolean;
  hasTags: boolean;
  hasStart: boolean;
  isOutOfOrder: boolean;
  tagsLength: number;
}): SectionIssueFlag[] {
  const flags: SectionIssueFlag[] = [];

  if (!params.hasStart) flags.push("missing-start");
  if (!params.hasDescription) flags.push("missing-description");
  if (!params.hasTags) flags.push("missing-tags");
  if (params.isOutOfOrder) flags.push("out-of-order");
  if (params.tagsLength >= 5) flags.push("dense-tags");

  return flags;
}

function getIssueLabel(flag: SectionIssueFlag): string {
  if (flag === "missing-start") return "Missing Start";
  if (flag === "missing-description") return "Missing Description";
  if (flag === "missing-tags") return "Missing Tags";
  if (flag === "out-of-order") return "Out of Order";
  return "Dense Tags";
}

function getIssueClass(flag: SectionIssueFlag): string {
  if (flag === "out-of-order") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    flag === "missing-start" ||
    flag === "missing-description" ||
    flag === "missing-tags"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function buildSectionCompletenessScore(params: {
  hasDescription: boolean;
  hasTags: boolean;
  hasStart: boolean;
  isOutOfOrder: boolean;
  tagsLength: number;
}): number {
  let score = 100;

  if (!params.hasStart) score -= 35;
  if (!params.hasDescription) score -= 25;
  if (!params.hasTags) score -= 25;
  if (params.isOutOfOrder) score -= 20;
  if (params.tagsLength >= 5) score -= 5;

  return Math.round(clamp100(score));
}

function getCompletenessTone(score: number): string {
  if (score >= 85) return "text-emerald-700";
  if (score >= 65) return "text-sky-700";
  if (score >= 45) return "text-amber-700";
  return "text-red-700";
}

function formatGapFromPrevious(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "n/a";
  return `${value.toFixed(2)} sec`;
}

function analyzeSections(sections: TrackSection[]): SectionAnalysis[] {
  return sections.map((section, index) => {
    const tags = getSectionTagsSafe(section);
    const description = getSectionDescriptionSafe(section);
    const start = normalizeStart(section.start);

    const prevSection = sections[index - 1];
    const prevStart = prevSection === undefined ? null : normalizeStart(prevSection.start);

    const hasDescription = Boolean(description);
    const hasTags = tags.length > 0;
    const hasStart = start !== null;
    const isOutOfOrder = prevStart !== null && start !== null ? start < prevStart : false;

    const issueFlags = buildSectionIssueFlags({
      hasDescription,
      hasTags,
      hasStart,
      isOutOfOrder,
      tagsLength: tags.length,
    });

    const completenessScore = buildSectionCompletenessScore({
      hasDescription,
      hasTags,
      hasStart,
      isOutOfOrder,
      tagsLength: tags.length,
    });

    const gapFromPrevious = prevStart !== null && start !== null ? start - prevStart : null;

    return {
      section,
      index,
      tags,
      description,
      start,
      hasDescription,
      hasTags,
      hasStart,
      isOutOfOrder,
      issueFlags,
      completenessScore,
      gapFromPrevious,
    };
  });
}

function StatCard(props: {
  label: string;
  value: string | number;
}) {
  const { label, value } = props;

  return (
    <div className="rounded border bg-zinc-50 px-2 py-2">
      <div className="text-[10px] text-zinc-500">{label}</div>
      <div className="text-[12px] font-medium text-zinc-800">{value}</div>
    </div>
  );
}

function SectionIssueChips(props: {
  sectionId: string;
  issueFlags: SectionIssueFlag[];
}) {
  const { sectionId, issueFlags } = props;

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {issueFlags.length > 0 ? (
        issueFlags.map((flag) => (
          <span
            key={`${sectionId}:${flag}`}
            className={["rounded border px-2 py-0.5 text-[10px]", getIssueClass(flag)].join(" ")}
          >
            {getIssueLabel(flag)}
          </span>
        ))
      ) : (
        <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
          No Active Issues
        </span>
      )}
    </div>
  );
}

function SectionTagChips(props: {
  sectionId: string;
  tags: string[];
}) {
  const { sectionId, tags } = props;

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {tags.length > 0 ? (
        tags.map((tag) => (
          <span
            key={`${sectionId}:${tag}`}
            className="rounded border bg-white px-2 py-0.5 text-[10px] text-zinc-700"
            title={`Moment tag: ${tag}`}
          >
            {tag}
          </span>
        ))
      ) : (
        <span className="text-[10px] text-zinc-500">(no moment tags)</span>
      )}
    </div>
  );
}

export default function MomentInspectorSectionRows(props: {
  filteredSections: TrackSection[];
  trimmedFilter: string;
  filteredWithStart: number;
  filteredOutOfOrderCount: number;
  sectionsWithStart: number;
  outOfOrderCount: number;
  sectionsLength: number;
}) {
  const {
    filteredSections,
    trimmedFilter,
    filteredWithStart,
    filteredOutOfOrderCount,
    sectionsWithStart,
    outOfOrderCount,
    sectionsLength,
  } = props;

  const activeSections = filteredSections;
  const analyzedSections = analyzeSections(activeSections);

  const activeSectionCount = analyzedSections.length;
  const missingDescriptions = analyzedSections.filter((item) => !item.hasDescription).length;
  const missingTags = analyzedSections.filter((item) => !item.hasTags).length;
  const missingStarts = analyzedSections.filter((item) => !item.hasStart).length;
  const denseTagSections = analyzedSections.filter((item) => item.tags.length >= 5).length;
  const criticalIssueSections = analyzedSections.filter(
    (item) => !item.hasDescription || !item.hasTags || !item.hasStart || item.isOutOfOrder
  ).length;

  return (
    <div className="rounded-lg border bg-white px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium text-zinc-700">Section Rows</div>
        <div className="text-[10px] text-zinc-500">
          {trimmedFilter ? "filtered inspector view" : "full inspector view"}
        </div>
      </div>

      <div className="mt-1 text-[10px] text-zinc-500">
        {trimmedFilter ? `${filteredSections.length} matching sections` : `${sectionsLength} total sections`}{" "}
        • Starts found: {trimmedFilter ? filteredWithStart : sectionsWithStart} • Ordering
        issues: {trimmedFilter ? filteredOutOfOrderCount : outOfOrderCount}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 xl:grid-cols-3">
        <StatCard label="Visible Sections" value={activeSectionCount} />
        <StatCard label="Critical Issues" value={criticalIssueSections} />
        <StatCard label="Missing Starts" value={missingStarts} />
        <StatCard label="Missing Descriptions" value={missingDescriptions} />
        <StatCard label="Missing Tags" value={missingTags} />
        <StatCard label="Dense Tag Sections" value={denseTagSections} />
      </div>

      <div className="mt-2 space-y-2">
        {analyzedSections.length > 0 ? (
          analyzedSections.map((item) => {
            const quality = getSectionQualityLabel(item.section);
            const sectionId = String(item.section.id);

            return (
              <div key={`${sectionId}:${item.index}`} className="rounded border bg-zinc-50 px-2 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-medium text-zinc-800">{sectionId}</div>
                    <div className="mt-0.5 text-[10px] text-zinc-500">
                      Tag count: {item.tags.length} • completeness{" "}
                      <span className={getCompletenessTone(item.completenessScore)}>
                        {item.completenessScore}%
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-1">
                    <span
                      className={["rounded border px-2 py-0.5 text-[10px]", quality.chipClass].join(
                        " "
                      )}
                    >
                      {quality.label}
                    </span>

                    <span
                      className={[
                        "rounded border px-2 py-0.5 text-[10px]",
                        item.hasStart
                          ? "border-zinc-200 bg-white text-zinc-700"
                          : "border-amber-200 bg-amber-50 text-amber-800",
                      ].join(" ")}
                    >
                      {item.hasStart ? formatMomentTime(item.start) : "No Start"}
                    </span>
                  </div>
                </div>

                <SectionIssueChips sectionId={sectionId} issueFlags={item.issueFlags} />

                <div className="mt-2 text-[10px] text-zinc-600">
                  {item.description || "(no description)"}
                </div>

                <div className="mt-2 text-[10px] text-zinc-500">
                  previous gap {formatGapFromPrevious(item.gapFromPrevious)}
                </div>

                <SectionTagChips sectionId={sectionId} tags={item.tags} />
              </div>
            );
          })
        ) : (
          <div className="text-[10px] text-zinc-500">
            {trimmedFilter ? "No matching sections for this filter." : "No sections available."}
          </div>
        )}
      </div>
    </div>
  );
}