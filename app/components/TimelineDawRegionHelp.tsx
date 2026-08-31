import ProjectDawBabyStepHelp from "@/app/workspace/projects/[id]/ProjectDawBabyStepHelp";
import { TIMELINE_DAW_REGION_HELP_STEPS, timelineDawRegionHelpStorageKey } from "@/lib/timeline/TimelineDawRegionHelpPolicy";

export default function TimelineDawRegionHelp({ sessionId }: { sessionId: string }) {
  return <ProjectDawBabyStepHelp title="How do I create and check song regions?" steps={TIMELINE_DAW_REGION_HELP_STEPS} storageKey={timelineDawRegionHelpStorageKey(sessionId)} />;
}
