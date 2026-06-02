"use client";

import { syncCardClass, syncEyebrowClass, syncSoftTextClass } from "./multiTrackSyncPanelStyles";

type Props = {
  label: string;
  value: string;
  detail: string;
};

export function MultiTrackSyncStatCard({ label, value, detail }: Props) {
  return (
    <article className={syncCardClass}>
      <p className={syncEyebrowClass}>{label}</p>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
      <p className={`mt-2 ${syncSoftTextClass}`}>{detail}</p>
    </article>
  );
}