import DeveloperWorkspace from "../tools/developer-workspace/DeveloperWorkspace";
import StandaloneReadiness from "./StandaloneReadiness";

export const metadata = {
  title: "Developer Workspace",
  description: "Standalone AI-assisted code intelligence, verification, and error prevention workspace.",
};

export default function StandaloneDeveloperWorkspacePage() {
  return (
    <>
      <StandaloneReadiness />
      <DeveloperWorkspace />
    </>
  );
}
