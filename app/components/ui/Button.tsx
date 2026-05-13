"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
};

export function Button({
  children,
  href,
  variant = "primary",
}: ButtonProps) {
  const baseClassName =
    "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition active:scale-[0.98]";

  const variantClassName =
    variant === "primary"
      ? "border border-white bg-white text-black hover:bg-white/85"
      : "border border-white/20 bg-white/10 text-white hover:bg-white/20";

  const className = `${baseClassName} ${variantClassName}`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return <button className={className}>{children}</button>;
}