// @ts-nocheck

export default function BrokenProjectLibraryList() {
  const tracks = ["song one.mp3", "song two.mp3"];

  return (
    <div
      className={[
        "max-h-[520px] overflow-y-auto pr-1",
        viewMode === "compact" ? "space-y-1" : "space-y-2",
      ].join(" ")}
    >
      {tracks.map((track) => (
        <div key={track}>{track}</div>
      ))}
    </div>
  );
}
