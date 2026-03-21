"use client";

import { useEffect } from "react";

export default function OldHomeRedirect() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "https://themuzesgarden-site-git-main-muzes-garden.vercel.app";
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="mx-auto max-w-2xl p-10 text-center">
      <h1 className="text-3xl font-semibold">The Muzes Garden</h1>

      <p className="mt-4 text-zinc-700">
        This page is out of date.
      </p>

      <p className="mt-2 text-zinc-700">
        The site has moved to a newer version.
      </p>

      <div className="mt-6">
        <a
          href="https://themuzesgarden-site-git-main-muzes-garden.vercel.app"
          className="text-lg underline"
        >
          → Go to the current version
        </a>
      </div>

      <p className="mt-6 text-sm text-zinc-500">
        Redirecting automatically...
      </p>
    </main>
  );
}
