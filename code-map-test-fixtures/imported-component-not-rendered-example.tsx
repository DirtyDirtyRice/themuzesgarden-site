// @ts-nocheck

import MissingPanel from "../app/tools/code-map/CodeMapDashboard";

export default function BrokenImportedButNotRendered() {
  return (
    <section>
      <h1>Dashboard</h1>
      {/* BUG: MissingPanel is imported but never rendered. */}
    </section>
  );
}
