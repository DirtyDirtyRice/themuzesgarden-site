import { timelineDawRecordingHelpStorageKey, TIMELINE_DAW_RECORDING_HELP_STEPS } from "@/lib/timeline/TimelineDawRecordingHelpPolicy";
import ProjectDawBabyStepHelp from "./ProjectDawBabyStepHelp";

export default function ProjectDawRecordingHelp({ sessionId }: { sessionId: string }) {
  return <ProjectDawBabyStepHelp title="How do I record and save a take?" steps={TIMELINE_DAW_RECORDING_HELP_STEPS} storageKey={timelineDawRecordingHelpStorageKey(sessionId)} />;
}
