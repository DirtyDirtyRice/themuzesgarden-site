"use client";

type Props = {
  title?: string;
  subtitle?: string;
  rightContent?: React.ReactNode;

  // ✅ FIX: allow summary prop (loose type to pass build)
  summary?: any;
};

export default function MomentInspectorWorkspacePanelHeaderBlock(
  props: Props
) {
  return (
    <div className="flex items-center justify-between border-b px-3 py-2">
      <div>
        <div className="text-sm font-semibold text-zinc-900">
          {props.title ?? "Workspace"}
        </div>

        {props.subtitle ? (
          <div className="text-xs text-zinc-500">{props.subtitle}</div>
        ) : null}

        {/* ✅ SAFE: render summary if present (non-breaking) */}
        {props.summary ? (
          <div className="mt-1 text-[11px] text-zinc-500">
            {typeof props.summary === "string"
              ? props.summary
              : null}
          </div>
        ) : null}
      </div>

      {props.rightContent ? (
        <div className="flex items-center gap-2">
          {props.rightContent}
        </div>
      ) : null}
    </div>
  );
}
