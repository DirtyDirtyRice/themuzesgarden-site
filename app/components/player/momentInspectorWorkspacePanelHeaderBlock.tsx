"use client";

type Props = {
  title?: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
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
      </div>

      {props.rightContent ? (
        <div className="flex items-center gap-2">
          {props.rightContent}
        </div>
      ) : null}
    </div>
  );
}
