"use client";

import { useState } from "react";

type Props = {
  recordId: string;
};

export default function MetadataRelationshipsToggle({ recordId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded border border-white bg-black px-3 py-2 text-sm text-white transition hover:bg-white hover:text-black"
      >
        Relationships
      </button>

      {open ? (
        <div className="mt-6 rounded-2xl border border-white bg-black p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">
            Relationship System
          </p>

          <h3 className="mt-2 text-lg font-semibold text-white">
            Relationships panel entry point connected
          </h3>

          <p className="mt-2 text-sm leading-6 text-white/70">
            Record ID: {recordId}
          </p>

          <p className="mt-3 text-sm leading-6 text-white/70">
            The entry point is now mounted safely. Next step is wiring this to
            the real relationship intelligence panel after we verify its exact
            file name and path.
          </p>
        </div>
      ) : null}
    </div>
  );
}