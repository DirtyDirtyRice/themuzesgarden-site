import Link from "next/link";
import type { ReactNode } from "react";

export type ManualRelatedLink = {
  label: string;
  href: string;
  note: string;
};

export function ManualStatusBanner({
  status,
  children,
}: {
  status: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-emerald-200/20 bg-emerald-300/[0.04] p-4">
      <p className="text-sm font-semibold text-emerald-100/85">Status</p>

      <p className="mt-1 text-sm leading-6 text-emerald-50/70">
        <span className="font-semibold text-emerald-50/85">{status}</span>{" "}
        {children}
      </p>
    </section>
  );
}

export function ManualInfoSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-2xl font-semibold text-white">{title}</h2>

      <div className="mt-4 space-y-4 text-sm leading-7 text-white/65">
        {children}
      </div>
    </section>
  );
}

export function ManualRelatedLinks({
  links,
}: {
  links: ManualRelatedLink[];
}) {
  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-2xl font-semibold text-white">Related pages</h2>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-white/10 bg-black/35 p-4 transition hover:border-white/30"
          >
            <p className="font-semibold text-white">{link.label}</p>
            <p className="mt-1 text-sm leading-6 text-white/55">
              {link.note}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ManualInlineLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="font-semibold text-white underline decoration-white/30 underline-offset-4 transition hover:text-white/75"
    >
      {children}
    </Link>
  );
}