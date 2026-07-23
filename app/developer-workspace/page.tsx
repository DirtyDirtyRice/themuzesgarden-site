import DeveloperWorkspace from "../tools/developer-workspace/DeveloperWorkspace";
import StandaloneReadiness from "./StandaloneReadiness";
import StandaloneProjectCreator from "./StandaloneProjectCreator";
import StandaloneProjectAdoption from "./StandaloneProjectAdoption";
import TesterSessionChecklist from "./TesterSessionChecklist";

export const metadata = {
  title: "Developer Workspace",
  description: "Standalone AI-assisted code intelligence, verification, and error prevention workspace.",
};

export default function StandaloneDeveloperWorkspacePage() {
  return (
    <>
      <TesterSessionChecklist />
      <div id="standalone-readiness"><StandaloneReadiness /></div>
      <div id="project-setup"><StandaloneProjectCreator /></div>
      <div id="project-adoption"><StandaloneProjectAdoption /></div>
      <DeveloperWorkspace />
    </>
  );
}
