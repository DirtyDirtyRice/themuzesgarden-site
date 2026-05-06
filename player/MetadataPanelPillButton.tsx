"use client";

type Props = {
  label: string;
  onClick?: () => void;
  title?: string;
  rounded?: "md" | "full";
  className?: string;
};

export default function MetadataPanelPillButton({
  label,
  onClick,
  title,
  rounded = "md",
  className = "",
}: Props) {
  const displayLabel = label.trim() || "Untitled";
  const isInteractive = typeof onClick === "function";

  return (
    <button
      type="button"
      className={[
        "!border !bg-black !px-2.5 !py-1 !text-[11px] !font-medium !transition-opacity",
        rounded === "full" ? "!rounded-full" : "!rounded-md",
        isInteractive
          ? "!cursor-pointer !border-white/20 !text-[color:var(--text-normal)] hover:!opacity-80 focus:!outline-none"
          : "!cursor-default !border-white/10 !text-[color:var(--text-normal)] !opacity-80",
        className,
      ].join(" ")}
      onClick={onClick}
      title={title}
      disabled={!isInteractive}
    >
      {displayLabel}
    </button>
  );
}