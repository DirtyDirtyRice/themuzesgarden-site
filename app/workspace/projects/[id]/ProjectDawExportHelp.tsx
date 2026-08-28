import { timelineDawExportHelpStorageKey, TIMELINE_DAW_EXPORT_HELP_STEPS } from "@/lib/timeline/TimelineDawExportHelpPolicy";
import ProjectDawBabyStepHelp from "./ProjectDawBabyStepHelp";

export default function ProjectDawExportHelp({ sessionId }: { sessionId: string }) {
  return <ProjectDawBabyStepHelp title="How do I export and verify my download?" steps={TIMELINE_DAW_EXPORT_HELP_STEPS} storageKey={timelineDawExportHelpStorageKey(sessionId)} />;
}
