"use client";

import TrackMatcherLanePanelHeader from "./TrackMatcherLanePanelHeader";
import TrackMatcherLaneSection from "./TrackMatcherLaneSection";
import TrackMatcherRegisteredPanelStack from "./TrackMatcherRegisteredPanelStack";
import { getTrackMatcherLaneGroups } from "./trackMatcherLaneOverviewGroups";
import { getTrackMatcherLaneSectionConfigs } from "./trackMatcherLaneSectionConfigs";

export default function TrackMatcherLaneOverviewPanel() {
  const laneGroups = getTrackMatcherLaneGroups();
  const sectionConfigs = getTrackMatcherLaneSectionConfigs();

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
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

      <TrackMatcherRegisteredPanelStack />
    </section>
  );
}
