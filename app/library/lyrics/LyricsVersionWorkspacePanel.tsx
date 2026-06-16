import type { LyricEntry } from "./lyricsTypes";
import type {
  LyricsVersionCandidate,
  LyricsVersionComparison,
  LyricsVersionEntry,
  LyricsVersionPanelSection,
  LyricsVersionWorkspaceModel,
} from "./LyricsVersionTypes";
import {
  buildLyricsVersionPanelSections,
  buildLyricsVersionWorkspaceModel,
  getLyricsVersionKindLabel,
  getLyricsVersionReadiness,
  getLyricsVersionStatusLabel,
} from "./LyricsVersionHelpers";

type LyricsVersionWorkspacePanelProps = {
  entries: LyricEntry[];
};

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black p-4">
      <p className="text-xs text-white/55">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-white/60">{detail}</p>
    </div>
  );
}

function SectionCard({ section }: { section: LyricsVersionPanelSection }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{section.title}</h3>
          <p className="mt-2 text-xs leading-5 text-white/60">{section.detail}</p>
        </div>

        <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">
          {section.count}
        </span>
      </div>
    </div>
  );
}

function VersionCard({ version }: { version: LyricsVersionEntry }) {
  const readiness = getLyricsVersionReadiness(version);

  return (
    <article className="rounded-xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">
            {getLyricsVersionKindLabel(version.kind)}
          </p>

          <h3 className="mt-2 text-lg font-semibold text-white">{version.title}</h3>

          <p className="mt-1 text-sm text-white/65">
            {version.artist || "Unknown artist"}
          </p>

          <p className="mt-2 text-xs leading-5 text-white/55">
            {version.changeSummary || "No change summary yet."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">
            {getLyricsVersionStatusLabel(version.status)}
          </span>

          <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">
            {readiness}
          </span>

          <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">
            {version.focus}
          </span>
        </div>
      </div>

      <pre className="mt-4 max-h-[140px] overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black p-3 text-sm leading-6 text-white/75">
        {version.body}
      </pre>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {version.sectionScores.slice(0, 3).map((score) => (
          <div
            key={`${version.id}-${score.section}`}
            className="rounded-lg border border-white/10 bg-black p-3"
          >
            <p className="text-xs text-white/55">{score.section}</p>
            <p className="mt-1 text-lg font-bold text-white">{score.score}</p>
            <p className="mt-1 text-xs leading-5 text-white/55">{score.reason}</p>
          </div>
        ))}
      </div>

      {version.notes ? (
        <p className="mt-4 text-xs leading-5 text-white/55">{version.notes}</p>
      ) : null}
    </article>
  );
}

function CandidateCard({ candidate }: { candidate: LyricsVersionCandidate }) {
  return (
    <article className="rounded-xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">
            {candidate.lyric.title}
          </h3>

          <p className="mt-1 text-sm text-white/65">
            {candidate.lyric.artist || "Unknown artist"}
          </p>

          <p className="mt-2 text-xs text-white/55">
            Tags: {candidate.lyric.tags || "None"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">
            {candidate.versions.length} versions
          </span>

          <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">
            {candidate.needsReviewCount} review
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black p-3">
          <p className="text-xs text-white/55">Active Version</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {candidate.activeVersion ? candidate.activeVersion.title : "None"}
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-black p-3">
          <p className="text-xs text-white/55">Keeper Version</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {candidate.keeperVersion ? candidate.keeperVersion.title : "None"}
          </p>
        </div>
      </div>
    </article>
  );
}

function ComparisonCard({
  comparison,
  versions,
}: {
  comparison: LyricsVersionComparison;
  versions: LyricsVersionEntry[];
}) {
  const leftVersion = versions.find(
    (version) => version.id === comparison.leftVersionId
  );
  const rightVersion = versions.find(
    (version) => version.id === comparison.rightVersionId
  );

  return (
    <article className="rounded-xl border border-white/10 bg-black p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">
            {leftVersion ? leftVersion.title : "Left Version"} →{" "}
            {rightVersion ? rightVersion.title : "Right Version"}
          </h3>

          <p className="mt-2 text-sm leading-6 text-white/65">
            {comparison.summary}
          </p>
        </div>

        <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">
          {comparison.verdict}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <StatCard
          label="Changed"
          value={comparison.changedLineCount}
          detail="Lines with different wording."
        />

        <StatCard
          label="Unchanged"
          value={comparison.unchangedLineCount}
          detail="Lines that stayed the same."
        />

        <StatCard
          label="Added"
          value={comparison.addedLineCount}
          detail="New lines in the right version."
        />

        <StatCard
          label="Removed"
          value={comparison.removedLineCount}
          detail="Lines removed from the left version."
        />
      </div>

      {comparison.warnings.length > 0 ? (
        <div className="mt-4 rounded-lg border border-white/10 bg-black p-3">
          {comparison.warnings.map((warning) => (
            <p key={warning} className="text-xs leading-5 text-white/60">
              {warning}
            </p>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function VersionWorkspaceBody({ model }: { model: LyricsVersionWorkspaceModel }) {
  const sections = buildLyricsVersionPanelSections(model);
  const versions = model.candidates.flatMap((candidate) => candidate.versions);

  return (
    <div className="mt-5 flex flex-col gap-5">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => (
          <SectionCard key={section.id} section={section} />
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Lyrics"
          value={model.stats.totalLyrics}
          detail="Lyrics currently mapped into version tracking."
        />

        <StatCard
          label="Versions"
          value={model.stats.totalVersions}
          detail="Original and rewrite versions detected."
        />

        <StatCard
          label="Keepers"
          value={model.stats.keepers}
          detail="Versions promoted as keeper candidates."
        />

        <StatCard
          label="Average"
          value={model.stats.averageVersionsPerLyric}
          detail="Average versions per lyric entry."
        />
      </div>

      <section className="rounded-xl border border-white/10 bg-black p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Version Candidates
            </h3>

            <p className="mt-1 text-sm text-white/60">
              Each lyric gets a starter original version so rewrites can be added later.
            </p>
          </div>

          <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">
            {model.candidates.length} candidates
          </span>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {model.candidates.map((candidate) => (
            <CandidateCard key={candidate.lyric.id} candidate={candidate} />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-black p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Active Version Cards
            </h3>

            <p className="mt-1 text-sm text-white/60">
              Current original versions created from locked Lyrics Library entries.
            </p>
          </div>

          <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">
            {versions.length} versions
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {versions.map((version) => (
            <VersionCard key={version.id} version={version} />
          ))}
        </div>
      </section>

      {model.comparisons.length > 0 ? (
        <section className="rounded-xl border border-white/10 bg-black p-4">
          <h3 className="text-lg font-semibold text-white">Comparisons</h3>

          <div className="mt-4 flex flex-col gap-4">
            {model.comparisons.map((comparison) => (
              <ComparisonCard
                key={comparison.id}
                comparison={comparison}
                versions={versions}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default function LyricsVersionWorkspacePanel({
  entries,
}: LyricsVersionWorkspacePanelProps) {
  const model = buildLyricsVersionWorkspaceModel(entries);

  return (
    <section className="rounded-2xl border border-white/15 bg-black p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/55">
            Lyrics Version Engine
          </p>

          <h2 className="mt-2 text-xl font-semibold text-white">
            Version tracking workspace
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">
            {model.summary}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">
            {model.stats.originals} originals
          </span>

          <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">
            {model.stats.rewrites} rewrites
          </span>

          <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">
            {model.stats.reviewCount} review
          </span>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-black p-4">
        {model.warnings.map((warning) => (
          <p key={warning} className="text-sm leading-6 text-white/65">
            {warning}
          </p>
        ))}
      </div>

      <VersionWorkspaceBody model={model} />
    </section>
  );
}
