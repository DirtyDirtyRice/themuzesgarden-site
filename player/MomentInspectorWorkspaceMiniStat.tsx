"use client";

type MomentInspectorWorkspaceMiniStatProps = {
  label: string;
  value: number | string;
};

export default function MomentInspectorWorkspaceMiniStat(
  props: MomentInspectorWorkspaceMiniStatProps
) {
  return (
    <span className="rounded-full border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-600">
      {props.label}: {props.value}
    </span>
  );
}