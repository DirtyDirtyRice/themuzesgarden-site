"use client";

export default function MomentInspectorSelectedFamilyPinBar(props: {
  selectedPhraseFamilyId: string;
  isSelectedFamilyPinned: boolean;
  onToggleSelectedFamilyPin: () => void;
}) {
  const {
    selectedPhraseFamilyId,
    isSelectedFamilyPinned,
    onToggleSelectedFamilyPin,
  } = props;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/90 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggleSelectedFamilyPin}
          disabled={!selectedPhraseFamilyId}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
            !selectedPhraseFamilyId
              ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
              : isSelectedFamilyPinned
              ? "border-violet-300 bg-violet-50 text-violet-800"
              : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
          }`}
        >
          {!selectedPhraseFamilyId
            ? "Select Family To Pin"
            : isSelectedFamilyPinned
            ? "Unpin Selected Family"
            : "Pin Selected Family"}
        </button>

        <div className="text-xs text-zinc-600">
          Selected family:{" "}
          <span className="font-semibold text-zinc-900">
            {selectedPhraseFamilyId || "none"}
          </span>
        </div>
      </div>
    </div>
  );
}