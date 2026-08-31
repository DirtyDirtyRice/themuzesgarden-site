import ProjectDawBabyStepHelp from "./ProjectDawBabyStepHelp";
import { TIMELINE_DAW_ARRANGEMENT_HELP_STEPS, timelineDawArrangementHelpStorageKey } from "@/lib/timeline/TimelineDawArrangementHelpPolicy";

export default function ProjectDawArrangementHelp({ sessionId }: { sessionId: string }) {
  return <ProjectDawBabyStepHelp title="How do I arrange and edit the song?" steps={TIMELINE_DAW_ARRANGEMENT_HELP_STEPS} storageKey={timelineDawArrangementHelpStorageKey(sessionId)} />;
}
