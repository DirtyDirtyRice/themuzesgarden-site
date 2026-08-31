import ProjectDawBabyStepHelp from "@/app/workspace/projects/[id]/ProjectDawBabyStepHelp";
import { TIMELINE_DAW_SESSION_VIEW_HELP_STEPS, timelineDawSessionViewHelpStorageKey } from "@/lib/timeline/TimelineDawSessionViewHelpPolicy";

export default function TimelineDawSessionViewHelp({ sessionId }: { sessionId: string }) {
  return <ProjectDawBabyStepHelp title="How do I perform with clips and scenes?" steps={TIMELINE_DAW_SESSION_VIEW_HELP_STEPS} storageKey={timelineDawSessionViewHelpStorageKey(sessionId)} />;
}
