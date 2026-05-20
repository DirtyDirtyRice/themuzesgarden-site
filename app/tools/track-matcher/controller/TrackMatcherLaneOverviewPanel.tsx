"use client";

import { DEFAULT_TRACK_MATCHER_LANE_RELATIONSHIPS } from "./trackMatcherControllerConstants";
import TrackMatcherLanePanelHeader from "./TrackMatcherLanePanelHeader";
import TrackMatcherLaneRelationshipSection from "./TrackMatcherLaneRelationshipSection";
import TrackMatcherLaneSection from "./TrackMatcherLaneSection";
import { getTrackMatcherLaneGroups } from "./trackMatcherLaneOverviewGroups";
import { getTrackMatcherLaneSectionConfigs } from "./trackMatcherLaneSectionConfigs";

export default function TrackMatcherLaneOverviewPanel() {
  const laneGroups = getTrackMatcherLaneGroups();
  const sectionConfigs = getTrackMatcherLaneSectionConfigs();

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <TrackMatcherLanePanelHeader />

      {sectionConfigs.map((section) => (
        <TrackMatcherLaneSection
          key={section.key}
          title={section.title}
          subtitle={section.subtitle}
          lanes={laneGroups[section.key]}
          columns={section.columns}
        />
      ))}

      <TrackMatcherLaneRelationshipSection
        title="Lane Relationships"
        subtitle="Audio Intelligence Graph"
        relationships={DEFAULT_TRACK_MATCHER_LANE_RELATIONSHIPS}
      />
    </section>
  );
}