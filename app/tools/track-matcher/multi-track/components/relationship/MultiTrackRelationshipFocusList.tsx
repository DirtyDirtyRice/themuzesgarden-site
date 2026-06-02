"use client";

import type { MultiTrackEngineRelationshipFocus } from "../../engine/multiTrackEngineRelationshipTypes";
import {
  relationshipCardClass,
  relationshipEyebrowClass,
  relationshipPillClass,
  relationshipSoftTextClass,
} from "./multiTrackRelationshipPanelStyles";

type Props = {
  focusItems: MultiTrackEngineRelationshipFocus[];
};

export function MultiTrackRelationshipFocusList({ focusItems }: Props) {
  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className={relationshipEyebrowClass}>Focus Queue</p>
          <h3 className="mt-1 text-lg font-black text-white">Next Relationship Checks</h3>
        </div>
        <span className={relationshipPillClass}>{focusItems.length} item(s)</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {focusItems.map((item) => (
          <article key={item.id} className={relationshipCardClass}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-black text-white">{item.label}</h4>
                <p className={`mt-2 ${relationshipSoftTextClass}`}>{item.detail}</p>
              </div>
              <span className={relationshipPillClass}>P{item.priority}</span>
            </div>
            <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-white/70">
              Track target: {item.trackSlotId}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}