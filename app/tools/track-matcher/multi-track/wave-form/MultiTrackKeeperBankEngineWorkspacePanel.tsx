import {
  calculateMultiTrackKeeperBankAssetScore,
  getMultiTrackKeeperBankDecisionLabel,
  getMultiTrackKeeperBankReadinessLabel,
  getMultiTrackKeeperBankRecommendedDecision,
  getMultiTrackKeeperBankWorkspaceSummary,
  sortMultiTrackKeeperBankAssets,
} from "./MultiTrackKeeperBankEngineHelpers";
import { multiTrackKeeperBankWorkspaceSeed } from "./MultiTrackKeeperBankEngineSeed";
import type {
  MultiTrackKeeperBankAsset,
  MultiTrackKeeperBankCollection,
  MultiTrackKeeperBankWorkspaceState,
} from "./MultiTrackKeeperBankEngineTypes";

type MultiTrackKeeperBankEngineWorkspacePanelProps = {
  workspace?: MultiTrackKeeperBankWorkspaceState;
};

function MultiTrackKeeperBankStatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black p-4">
      <div className="text-xs uppercase tracking-[0.24em] text-white/70">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-white/70">{detail}</div>
    </div>
  );
}

function MultiTrackKeeperBankAssetCard({ asset }: { asset: MultiTrackKeeperBankAsset }) {
  const calculatedScore = calculateMultiTrackKeeperBankAssetScore(asset);
  const recommendedDecision = getMultiTrackKeeperBankRecommendedDecision(asset);

  return (
    <article className="rounded-2xl border border-white/15 bg-black p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-white/70">
            {asset.sectionLabel} · bars {asset.startBar}-{asset.endBar}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-white">{asset.title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Source: {asset.sourceCandidateId} · Versions: {asset.sourceVersionIds.join(", ")}
          </p>
        </div>

        <div className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
          {getMultiTrackKeeperBankDecisionLabel(asset.decision)}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-xs uppercase tracking-[0.2em] text-white/70">Score</div>
          <div className="mt-1 text-xl font-semibold text-white">{calculatedScore}</div>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-xs uppercase tracking-[0.2em] text-white/70">Emotion</div>
          <div className="mt-1 text-xl font-semibold text-white">{asset.emotionalScore}</div>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-xs uppercase tracking-[0.2em] text-white/70">Reuse</div>
          <div className="mt-1 text-xl font-semibold text-white">{asset.reuseScore}</div>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-xs uppercase tracking-[0.2em] text-white/70">Recommended</div>
          <div className="mt-1 text-xl font-semibold text-white">
            {getMultiTrackKeeperBankDecisionLabel(recommendedDecision)}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {asset.qualityFlags.map((flag) => (
          <span
            key={flag}
            className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70"
          >
            {flag}
          </span>
        ))}
      </div>

      <div className="mt-4 text-sm leading-6 text-white/70">
        Readiness: {getMultiTrackKeeperBankReadinessLabel(asset.readiness)}
      </div>
    </article>
  );
}

function MultiTrackKeeperBankCollectionCard({
  collection,
}: {
  collection: MultiTrackKeeperBankCollection;
}) {
  return (
    <article className="rounded-2xl border border-white/15 bg-black p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{collection.title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/70">{collection.description}</p>
        </div>

        <div className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
          {getMultiTrackKeeperBankReadinessLabel(collection.readiness)}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-xs uppercase tracking-[0.2em] text-white/70">Accepted</div>
          <div className="mt-1 text-xl font-semibold text-white">
            {collection.acceptedAssetIds.length}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-xs uppercase tracking-[0.2em] text-white/70">Pending</div>
          <div className="mt-1 text-xl font-semibold text-white">
            {collection.pendingAssetIds.length}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-xs uppercase tracking-[0.2em] text-white/70">Rejected</div>
          <div className="mt-1 text-xl font-semibold text-white">
            {collection.rejectedAssetIds.length}
          </div>
        </div>
      </div>
    </article>
  );
}

export function MultiTrackKeeperBankEngineWorkspacePanel({
  workspace = multiTrackKeeperBankWorkspaceSeed,
}: MultiTrackKeeperBankEngineWorkspacePanelProps) {
  const sortedAssets = sortMultiTrackKeeperBankAssets(workspace.assets);
  const acceptedCount = workspace.assets.filter((asset) => asset.decision === "accept").length;
  const reviewCount = workspace.assets.filter(
    (asset) => asset.decision === "review" || asset.readiness === "needs-review",
  ).length;

  return (
    <section className="rounded-3xl border border-white/15 bg-black p-5 text-white">
      <div className="text-xs uppercase tracking-[0.28em] text-white/70">Preserved Engine</div>
      <h2 className="mt-2 text-2xl font-semibold text-white">{workspace.engineTitle}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">{workspace.enginePurpose}</p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <MultiTrackKeeperBankStatCard
          label="Summary"
          value={`${workspace.assets.length}`}
          detail={getMultiTrackKeeperBankWorkspaceSummary(workspace)}
        />
        <MultiTrackKeeperBankStatCard
          label="Accepted"
          value={`${acceptedCount}`}
          detail="Keeper assets strong enough to preserve for later arrangement building."
        />
        <MultiTrackKeeperBankStatCard
          label="Review"
          value={`${reviewCount}`}
          detail="Keeper assets that should stay pending until human listening confirms value."
        />
      </div>

      <div className="mt-6 grid gap-4">
        {sortedAssets.map((asset) => (
          <MultiTrackKeeperBankAssetCard key={asset.id} asset={asset} />
        ))}
      </div>

      <div className="mt-6 grid gap-4">
        {workspace.collections.map((collection) => (
          <MultiTrackKeeperBankCollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    </section>
  );
}