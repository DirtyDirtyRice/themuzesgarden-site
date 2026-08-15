"use client";

import Link from "next/link";

type Props = {
  title: string;
  message: string;
  actionLabel: string;
  buttonClassName: string;
  href?: string;
  onAction?: () => void;
};

export default function RecentSessionEmptyState({
  title,
  message,
  actionLabel,
  buttonClassName,
  href,
  onAction,
}: Props) {
  return (
    <section className="rounded-xl border border-dashed border-white/20 p-5">
      <h2 className="text-lg font-black text-white">{title}</h2>
      <p className="mt-1 text-sm text-white/55">{message}</p>
      {href ? (
        <Link className={`${buttonClassName} mt-4`} href={href}>
          {actionLabel}
        </Link>
      ) : (
        <button
          type="button"
          className={`${buttonClassName} mt-4`}
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </section>
  );
}
