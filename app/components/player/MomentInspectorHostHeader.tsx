"use client";

export default function MomentInspectorHostHeader(props: {
  open: boolean;
  onToggleOpen: () => void;
}) {
  const { open, onToggleOpen } = props;

  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <div className="text-[11px] font-medium text-zinc-700">
          Moment Index Inspector
        </div>
        <div className="text-[10px] text-zinc-500">
          Discovery index verification layer
        </div>
      </div>

      <button
        type="button"
        className="rounded border bg-white px-2 py-1 text-[10px] text-zinc-700 hover:bg-zinc-100"
        onClick={onToggleOpen}
        title={open ? "Hide inspector" : "Show inspector"}
      >
        {open ? "Hide" : "Show"}
      </button>
    </div>
  );
}