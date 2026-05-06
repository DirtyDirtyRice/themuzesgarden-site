"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRecordAction } from "./deleteRecordAction";

type MetadataRecordDeleteButtonProps = {
  recordId: string;
  recordTitle?: string | null;
};

export default function MetadataRecordDeleteButton({
  recordId,
  recordTitle,
}: MetadataRecordDeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (isPending) return;

    const label =
      String(recordTitle ?? "this record").trim() || "this record";

    const confirmed = window.confirm(
      `Delete ${label}? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteRecordAction(recordId);

        // 🔥 CRITICAL — redirect after delete
        router.push("/metadata/library");
      } catch (error) {
        console.error("Delete failed:", error);
        alert("Delete failed. Please try again.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      aria-label="Delete metadata record"
      className="inline-flex items-center justify-center rounded-md border border-white/20 bg-black px-3 py-2 text-sm font-medium text-white transition
      hover:opacity-85 hover:scale-[0.99]
      active:scale-[0.98]
      disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}