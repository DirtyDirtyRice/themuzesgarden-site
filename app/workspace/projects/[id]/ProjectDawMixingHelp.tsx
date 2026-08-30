import ProjectDawBabyStepHelp from "./ProjectDawBabyStepHelp";
import { TIMELINE_DAW_MIXING_HELP_STEPS, timelineDawMixingHelpStorageKey } from "@/lib/timeline/TimelineDawMixingHelpPolicy";

export default function ProjectDawMixingHelp({ sessionId }: { sessionId: string }) {
  return <ProjectDawBabyStepHelp title="How do I make a clear basic mix?" steps={TIMELINE_DAW_MIXING_HELP_STEPS} storageKey={timelineDawMixingHelpStorageKey(sessionId)} />;
}
