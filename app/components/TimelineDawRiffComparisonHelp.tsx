import ProjectDawBabyStepHelp from "@/app/workspace/projects/[id]/ProjectDawBabyStepHelp";
import { TIMELINE_DAW_RIFF_COMPARISON_HELP_STEPS, timelineDawRiffComparisonHelpStorageKey } from "@/lib/timeline/TimelineDawRiffComparisonHelpPolicy";

export default function TimelineDawRiffComparisonHelp({ sessionId }: { sessionId: string }) {
  return <ProjectDawBabyStepHelp title="How do I compare riffs across three song versions?" steps={TIMELINE_DAW_RIFF_COMPARISON_HELP_STEPS} storageKey={timelineDawRiffComparisonHelpStorageKey(sessionId)} />;
}
