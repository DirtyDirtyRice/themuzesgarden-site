"use client";

import { useState } from "react";

export default function CreateBridgePayloadPanel({
  savePayloadJson,
}: {
  savePayloadJson: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Technical payload
          </p>

          <p className="mt-2 text-sm leading-6 text-white/65">
            Hidden by default. Open this only when we need to inspect the exact
            record being saved.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:opacity-85 active:scale-[0.98]"
        >
          {isOpen ? "Hide technical payload" : "Show technical payload"}
        </button>
      </div>

      {isOpen ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/50">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Create Payload JSON
            </p>
          </div>

          <pre className="max-h-[20rem] overflow-auto px-4 py-4 text-xs leading-6 text-white/85 md:text-sm">
            {savePayloadJson}
          </pre>
        </div>
      ) : null}
    </div>
  );
}