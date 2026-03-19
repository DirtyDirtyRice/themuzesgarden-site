"use client";

export default function MomentInspectorHostEmptyState(props: {
  message?: string;
}) {
  const { message = "No tracks available to inspect." } = props;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 text-[10px] text-zinc-500">
      {message}
    </div>
  );
}