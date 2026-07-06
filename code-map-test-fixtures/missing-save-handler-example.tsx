// @ts-nocheck
type ProjectOverviewHeaderProps = {
  onSaveProjectDescription: (description: string) => Promise<boolean>;
};

function ProjectOverviewHeader({
  onSaveProjectDescription,
}: ProjectOverviewHeaderProps) {
  async function saveProjectContents() {
    const ok = await onSaveProjectDescription("test description");
    return ok;
  }

  return <button onClick={saveProjectContents}>Save</button>;
}

export default function BrokenProjectOverviewPage() {
  return (
    <section>
      {/* BUG: parent renders the child but does not pass onSaveProjectDescription */}
      <ProjectOverviewHeader />
    </section>
  );
}
