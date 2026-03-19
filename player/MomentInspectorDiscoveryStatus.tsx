"use client";

export default function MomentInspectorDiscoveryStatus(props: {
  discoverySnapshot: {
    momentCount: number;
    clusterCount: number;
  } | null;
}) {
  const { discoverySnapshot } = props;

  if (!discoverySnapshot) return null;

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium text-purple-800">Discovery Runtime Status</div>
        <div className="text-[10px] text-purple-700">
          track moments {discoverySnapshot.momentCount} • clusters {discoverySnapshot.clusterCount}
        </div>
      </div>

      <div className="mt-1 text-[10px] text-purple-700">
        Runtime snapshot confirms this track is indexed inside the discovery engine and ready for
        search/debug analysis.
      </div>
    </div>
  );
}