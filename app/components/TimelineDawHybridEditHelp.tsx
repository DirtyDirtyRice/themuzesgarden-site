import ProjectDawBabyStepHelp from "@/app/workspace/projects/[id]/ProjectDawBabyStepHelp";
import { TIMELINE_DAW_HYBRID_EDIT_HELP_STEPS, timelineDawHybridEditHelpStorageKey } from "@/lib/timeline/TimelineDawHybridEditHelpPolicy";

export default function TimelineDawHybridEditHelp({ sessionId }: { sessionId: string }) {
  return <ProjectDawBabyStepHelp title="How do I build a Hybrid Edit from the best riffs?" steps={TIMELINE_DAW_HYBRID_EDIT_HELP_STEPS} storageKey={timelineDawHybridEditHelpStorageKey(sessionId)} />;
}
