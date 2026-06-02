"use client";

import {
  relationshipCardClass,
  relationshipEyebrowClass,
  relationshipSoftTextClass,
} from "./multiTrackRelationshipPanelStyles";

type Props = {
  label: string;
  value: string;
  detail: string;
};

export function MultiTrackRelationshipStatCard({ label, value, detail }: Props) {
  return (
    <article className={relationshipCardClass}>
      <p className={relationshipEyebrowClass}>{label}</p>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
      <p className={`mt-2 ${relationshipSoftTextClass}`}>{detail}</p>
    </article>
  );
}