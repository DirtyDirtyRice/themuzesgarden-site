"use client";

export default function PlayerSearchHelpPanel(props: {
  compact: boolean;
  isSearchTab: boolean;
}) {
  const { compact, isSearchTab } = props;

  if (compact || !isSearchTab) return null;

  return (
    <div className="rounded-xl border bg-zinc-50 px-3 py-2 text-[11px] text-zinc-700">
      Search keys: <span className="font-medium">↑ ↓</span> select result •{" "}
      <span className="font-medium">Enter</span> play track •{" "}
      <span className="font-medium">Shift+Enter</span> play first moment •{" "}
      <span className="font-medium">M</span> play first moment
    </div>
  );
}