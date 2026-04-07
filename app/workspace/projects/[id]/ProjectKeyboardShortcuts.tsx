"use client";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ProjectKeyboardShortcuts(props: Props) {
  const { open, onClose } = props;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <div className="w-[min(42rem,calc(100vw-2rem))] rounded-2xl border bg-white p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-medium">Performance Shortcuts</div>
          <button className="rounded border px-2 py-1 text-xs" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="text-sm text-zinc-700">
          Use these anywhere on Overview when you are not typing in an input.
        </div>

        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div className="rounded border p-2">
            <div className="mb-1 text-xs font-medium text-zinc-600">Playback</div>
            <div>Space: Play / Pause</div>
            <div>J or ←: Previous</div>
            <div>K or →: Next</div>
            <div>M: Mute</div>
          </div>

          <div className="rounded border p-2">
            <div className="mb-1 text-xs font-medium text-zinc-600">Modes</div>
            <div>S: Shuffle</div>
            <div>L: Loop (Off → Track → Setlist)</div>
            <div>H or ?: Toggle this help</div>
            <div>Esc: Close help</div>
          </div>
        </div>

        <div className="text-xs text-zinc-500">
          Tip: These do not change Global Library. They only control Project playback.
        </div>
      </div>
    </div>
  );
}