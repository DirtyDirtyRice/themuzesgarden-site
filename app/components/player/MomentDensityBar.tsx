"use client";

import { useMemo, useState } from "react";
import type { SearchMatchedMoment } from "./searchTabHelpers";

type Cluster = {
  start: number;
  end: number;
  intensity: number;
  moments: SearchMatchedMoment[];
  targetMoment: SearchMatchedMoment;
};

function buildClusters(moments: SearchMatchedMoment[]): Cluster[] {
  if (!moments.length) return [];

  const clusters: Cluster[] = [];
  const sorted = [...moments].sort((a, b) => a.startTime - b.startTime);

  let clusterMoments: SearchMatchedMoment[] = [sorted[0]!];
  let clusterStart = sorted[0]!.startTime;
  let prev = clusterStart;

  for (let i = 1; i < sorted.length; i++) {
    const moment = sorted[i]!;
    const gap = moment.startTime - prev;

    if (gap < 5) {
      clusterMoments.push(moment);
      prev = moment.startTime;
      continue;
    }

    clusters.push({
      start: clusterStart,
      end: prev,
      intensity: clusterMoments.length,
      moments: [...clusterMoments],
      targetMoment: clusterMoments[0]!,
    });

    clusterMoments = [moment];
    clusterStart = moment.startTime;
    prev = moment.startTime;
  }

  clusters.push({
    start: clusterStart,
    end: prev,
    intensity: clusterMoments.length,
    moments: [...clusterMoments],
    targetMoment: clusterMoments[0]!,
  });

  return clusters;
}

function formatBarTime(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  if (safe < 60) return `${safe.toFixed(0)}s`;

  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function getHeatClass(intensity: number): string {
  if (intensity >= 4) return "bg-red-300";
  if (intensity >= 3) return "bg-orange-300";
  if (intensity >= 2) return "bg-yellow-300";
  return "bg-yellow-200";
}

export default function MomentDensityBar(props: {
  moments: SearchMatchedMoment[];
  onPlayMoment: (moment: SearchMatchedMoment) => void;
  selected?: boolean;
}) {
  const { moments, onPlayMoment, selected = false } = props;
  const [hoverText, setHoverText] = useState<string>("");

  const clusters = useMemo(() => buildClusters(moments), [moments]);

  if (!moments.length) return null;

  const maxTime =
    moments.reduce((max, moment) => Math.max(max, moment.startTime), 0) || 1;

  const topMoment = moments[0] ?? null;

  return (
    <div className="mt-1.5 w-full">
      <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-zinc-500">
        <span className={selected ? "text-blue-700" : ""}>Moment map</span>
        <span>{formatBarTime(maxTime)}</span>
      </div>

      <div
        className={[
          "relative h-3 w-full overflow-hidden rounded border",
          selected
            ? "border-blue-200 bg-blue-50"
            : "border-zinc-200 bg-zinc-200",
        ].join(" ")}
        onMouseLeave={() => setHoverText("")}
      >
        {clusters.map((cluster, i) => {
          const left = (cluster.start / maxTime) * 100;
          const right = (cluster.end / maxTime) * 100;
          const width = Math.max(1.5, right - left);
          const heatClass = getHeatClass(Math.min(5, cluster.intensity));

          return (
            <button
              key={`cluster-${i}`}
              type="button"
              className={`absolute top-0 h-full opacity-70 transition-opacity hover:opacity-100 ${heatClass}`}
              style={{
                left: `${left}%`,
                width: `${width}%`,
              }}
              title={`Hot zone: ${cluster.intensity} moments from ${formatBarTime(
                cluster.start
              )} to ${formatBarTime(cluster.end)} • click to play first moment`}
              onMouseEnter={() =>
                setHoverText(
                  `Hot zone: ${cluster.intensity} moments • ${formatBarTime(
                    cluster.start
                  )}–${formatBarTime(cluster.end)}`
                )
              }
              onClick={(e) => {
                e.stopPropagation();
                onPlayMoment(cluster.targetMoment);
              }}
            />
          );
        })}

        {moments.map((moment, i) => {
          const pct = (moment.startTime / maxTime) * 100;
          const isTopMoment =
            topMoment &&
            moment.sectionId === topMoment.sectionId &&
            moment.startTime === topMoment.startTime;

          return (
            <button
              key={`moment-${i}-${moment.sectionId}-${moment.startTime}`}
              type="button"
              className={[
                "absolute top-0 h-full transition-transform hover:scale-110",
                isTopMoment
                  ? selected
                    ? "w-[4px] bg-blue-900"
                    : "w-[4px] bg-zinc-900"
                  : "w-[3px] bg-yellow-700",
              ].join(" ")}
              style={{ left: `${pct}%` }}
              title={`${moment.label} @ ${formatBarTime(moment.startTime)}${
                isTopMoment ? " • top moment" : ""
              } • click to play`}
              onMouseEnter={() =>
                setHoverText(
                  `${moment.label} • ${formatBarTime(moment.startTime)}${
                    isTopMoment ? " • top moment" : ""
                  }`
                )
              }
              onClick={(e) => {
                e.stopPropagation();
                onPlayMoment(moment);
              }}
            />
          );
        })}
      </div>

      <div className="mt-1 min-h-[18px] text-[10px] text-zinc-600">
        {hoverText ? (
          <span
            className={[
              "rounded border px-1.5 py-0.5",
              selected ? "border-blue-200 bg-blue-50 text-blue-800" : "bg-white",
            ].join(" ")}
          >
            {hoverText}
          </span>
        ) : (
          <span className="rounded border bg-white px-1.5 py-0.5">
            Hover or click the map
          </span>
        )}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-zinc-500">
        <span className="rounded border bg-white px-1.5 py-0.5">0s</span>
        <span className="rounded border bg-white px-1.5 py-0.5">yellow = light</span>
        <span className="rounded border bg-white px-1.5 py-0.5">orange = cluster</span>
        <span className="rounded border bg-white px-1.5 py-0.5">red = hot zone</span>
        <span className="rounded border bg-white px-1.5 py-0.5">dark = top</span>

        {clusters.slice(0, 3).map((cluster, i) => (
          <button
            key={`cluster-chip-${i}`}
            type="button"
            className={[
              "rounded border px-1.5 py-0.5",
              selected
                ? "border-blue-200 bg-blue-50 text-blue-800"
                : "bg-white text-zinc-600",
            ].join(" ")}
            title={`Play hot zone with ${cluster.intensity} moments`}
            onClick={(e) => {
              e.stopPropagation();
              onPlayMoment(cluster.targetMoment);
            }}
          >
            Zone {i + 1}: {cluster.intensity}
          </button>
        ))}
      </div>
    </div>
  );
}