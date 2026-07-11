// @ts-nocheck

export default function BrokenUnusedStateSetter() {
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <section>
      <h1>Panel</h1>
      {/* BUG: setPanelOpen exists, but the UI never calls it. */}
      <div>{panelOpen ? "Open" : "Closed"}</div>
    </section>
  );
}
