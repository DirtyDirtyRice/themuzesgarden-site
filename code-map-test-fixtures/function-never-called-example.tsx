// @ts-nocheck

export default function BrokenFunctionNeverCalled() {
  function handleOpenTools() {
    return "open tools";
  }

  return (
    <section>
      <h1>Tools</h1>
      {/* BUG: handleOpenTools exists, but no button or UI calls it. */}
    </section>
  );
}
