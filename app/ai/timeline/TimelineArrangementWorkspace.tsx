"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  TimelineSongArrangementBranchEngine,
  type TimelineArrangementArchive,
  type TimelineArrangementBranch,
  type TimelineArrangementMerge,
} from "@/lib/timeline/TimelineSongArrangementBranchEngine";

type Props = {
  projectId: string;
  projectTitle: string;
};

type Resolution = "source" | "target";

const emptyArchive: TimelineArrangementArchive = {
  branches: [],
  commits: [],
  merges: [],
};

function storageKey(userId: string, projectId: string): string {
  return `muzes:timeline-arrangements:v1:${userId}:${projectId}`;
}

function branchLabel(
  branchId: string,
  branches: TimelineArrangementBranch[],
): string {
  return branches.find((branch) => branch.id === branchId)?.name ?? branchId;
}

export default function TimelineArrangementWorkspace({
  projectId,
  projectTitle,
}: Props) {
  const [archive, setArchive] =
    useState<TimelineArrangementArchive>(emptyArchive);
  const [userId, setUserId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [forkName, setForkName] = useState("");
  const [trackId, setTrackId] = useState("");
  const [revisionId, setRevisionId] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [mergeSourceId, setMergeSourceId] = useState("");
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [resolutions, setResolutions] = useState<
    Record<string, Record<string, Resolution>>
  >({});
  const [message, setMessage] = useState("");

  const branches = archive.branches;
  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.id === selectedBranchId) ?? null,
    [branches, selectedBranchId],
  );
  const openMerges = useMemo(
    () => archive.merges.filter((merge) => merge.status === "conflicted"),
    [archive.merges],
  );

  const save = useCallback(
    (next: TimelineArrangementArchive) => {
      localStorage.setItem(storageKey(userId, projectId), JSON.stringify(next));
      setArchive(next);
    },
    [projectId, userId],
  );

  const mutate = useCallback(
    (
      action: (engine: TimelineSongArrangementBranchEngine) => string | void,
    ) => {
      if (!userId) {
        setMessage("Sign in before changing song arrangements.");
        return;
      }
      try {
        const engine = new TimelineSongArrangementBranchEngine();
        engine.restoreArchive(archive);
        const outcome = action(engine);
        save(engine.exportArchive());
        setMessage(outcome || "Arrangement workspace saved.");
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Arrangement action failed.",
        );
      }
    },
    [archive, save, userId],
  );

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setUserId(data.user?.id ?? "");
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!projectId || !userId) {
      setArchive(emptyArchive);
      setSelectedBranchId("");
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(userId, projectId));
      const restored = raw
        ? (JSON.parse(raw) as TimelineArrangementArchive)
        : emptyArchive;
      const engine = new TimelineSongArrangementBranchEngine();
      engine.restoreArchive(restored);
      const verified = engine.exportArchive();
      setArchive(verified);
      setSelectedBranchId(verified.branches[0]?.id ?? "");
      setMessage(
        raw
          ? "Saved arrangement history restored."
          : "Create the first arrangement for this project.",
      );
    } catch {
      setArchive(emptyArchive);
      setSelectedBranchId("");
      setMessage(
        "The saved arrangement archive was invalid and was not activated.",
      );
    }
  }, [projectId, userId]);

  const createMain = () =>
    mutate((engine) => {
      const branch = engine.createRoot({
        songId: projectId,
        name: "Main arrangement",
        createdBy: userId,
      });
      setSelectedBranchId(branch.id);
      setMergeTargetId(branch.id);
      return "Main arrangement created.";
    });

  const fork = () => {
    if (!selectedBranch) return;
    mutate((engine) => {
      const branch = engine.fork({
        sourceBranchId: selectedBranch.id,
        name: forkName,
        createdBy: userId,
      });
      setSelectedBranchId(branch.id);
      setMergeSourceId(branch.id);
      setForkName("");
      return `${branch.name} created without copying audio files.`;
    });
  };

  const commit = (kind: "set" | "remove") => {
    if (!selectedBranch || !trackId.trim()) return;
    mutate((engine) => {
      engine.commit({
        branchId: selectedBranch.id,
        expectedHead: selectedBranch.head,
        message: commitMessage,
        changes:
          kind === "set"
            ? [
                {
                  kind: "set",
                  trackId: trackId.trim(),
                  revisionId: revisionId.trim(),
                },
              ]
            : [{ kind: "remove", trackId: trackId.trim() }],
        committedBy: userId,
      });
      setTrackId("");
      setRevisionId("");
      setCommitMessage("");
      return kind === "set"
        ? "Track revision committed to this arrangement."
        : "Track removed from this arrangement.";
    });
  };

  const merge = () => {
    if (!mergeSourceId || !mergeTargetId) return;
    mutate((engine) => {
      const result = engine.merge({
        sourceBranchId: mergeSourceId,
        targetBranchId: mergeTargetId,
        mergedBy: userId,
      });
      return result.status === "merged"
        ? "Branches merged safely."
        : `${result.conflicts.length} track conflict(s) held for review.`;
    });
  };

  const resolve = (mergeRecord: TimelineArrangementMerge) =>
    mutate((engine) => {
      engine.resolveMerge({
        mergeId: mergeRecord.id,
        resolutions: resolutions[mergeRecord.id] ?? {},
        resolvedBy: userId,
      });
      setResolutions((current) => {
        const next = { ...current };
        delete next[mergeRecord.id];
        return next;
      });
      return "Every conflict was resolved and the merge was completed.";
    });

  return (
    <section className="mt-6 rounded-3xl border border-violet-300/30 bg-violet-300/[0.04] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.25em] text-violet-200">
            Song Arrangement Branch Engine
          </div>
          <h2 className="mt-2 text-2xl font-black">
            Arrangement Branches &amp; Safe Merges
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
            Build a radio edit, acoustic version, live arrangement, or AI
            experiment without copying the song. Only track revision references
            change. Conflicting edits are held until you choose the correct
            version.
          </p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-right text-xs">
          <div className="font-black">{projectTitle}</div>
          <div className="mt-1 text-white/45">
            {branches.length} branches Â· {archive.commits.length} commits Â·{" "}
            {openMerges.length} held merges
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/35 p-3 text-sm text-white/70">
        {message}
      </div>

      {!branches.length ? (
        <button
          type="button"
          disabled={!userId}
          onClick={createMain}
          className="mt-5 rounded-xl bg-white px-5 py-3 font-black text-black disabled:opacity-40"
        >
          Create Main Arrangement
        </button>
      ) : (
        <>
          <div className="mt-6 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-2xl border border-white/15 bg-black/35 p-4">
              <label className="text-sm font-bold text-white/70">
                Active branch
              </label>
              <select
                value={selectedBranchId}
                onChange={(event) => setSelectedBranchId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/20 bg-black p-3"
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} Â· head {branch.head}
                  </option>
                ))}
              </select>
              <div className="mt-4 flex gap-2">
                <input
                  value={forkName}
                  onChange={(event) => setForkName(event.target.value)}
                  placeholder="Acoustic version"
                  className="min-w-0 flex-1 rounded-xl border border-white/20 bg-black p-3"
                />
                <button
                  type="button"
                  onClick={fork}
                  className="rounded-xl border border-violet-300/40 px-4 font-black"
                >
                  Fork
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-black/35 p-4">
              <div className="font-black">Commit a track decision</div>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <input
                  value={trackId}
                  onChange={(event) => setTrackId(event.target.value)}
                  placeholder="Track ID"
                  className="rounded-xl border border-white/20 bg-black p-3"
                />
                <input
                  value={revisionId}
                  onChange={(event) => setRevisionId(event.target.value)}
                  placeholder="Revision ID"
                  className="rounded-xl border border-white/20 bg-black p-3"
                />
                <input
                  value={commitMessage}
                  onChange={(event) => setCommitMessage(event.target.value)}
                  placeholder="Why this changed"
                  className="rounded-xl border border-white/20 bg-black p-3"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!trackId.trim() || !revisionId.trim()}
                  onClick={() => commit("set")}
                  className="rounded-xl bg-white px-4 py-2 font-black text-black disabled:opacity-35"
                >
                  Set Revision
                </button>
                <button
                  type="button"
                  disabled={!trackId.trim()}
                  onClick={() => commit("remove")}
                  className="rounded-xl border border-rose-300/40 px-4 py-2 font-black text-rose-100 disabled:opacity-35"
                >
                  Remove Track
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/15">
            <div className="border-b border-white/10 bg-white/5 px-4 py-3 font-black">
              {selectedBranch?.name ?? "Arrangement"} track state
            </div>
            {!selectedBranch || !Object.keys(selectedBranch.state).length ? (
              <div className="p-5 text-sm text-white/45">
                No track revisions have been committed to this arrangement.
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {Object.entries(selectedBranch.state)
                  .sort(([left], [right]) => left.localeCompare(right))
                  .map(([track, revision]) => (
                    <div
                      key={track}
                      className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-2"
                    >
                      <span className="font-bold">{track}</span>
                      <span className="font-mono text-violet-100">
                        {revision}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {branches.length > 1 ? (
            <div className="mt-5 rounded-2xl border border-white/15 bg-black/35 p-4">
              <div className="font-black">Merge arrangements</div>
              <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_1fr_auto]">
                <select
                  value={mergeSourceId}
                  onChange={(event) => setMergeSourceId(event.target.value)}
                  className="rounded-xl border border-white/20 bg-black p-3"
                >
                  <option value="">Source branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                <div className="self-center text-center text-white/40">
                  into
                </div>
                <select
                  value={mergeTargetId}
                  onChange={(event) => setMergeTargetId(event.target.value)}
                  className="rounded-xl border border-white/20 bg-black p-3"
                >
                  <option value="">Target branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={
                    !mergeSourceId ||
                    !mergeTargetId ||
                    mergeSourceId === mergeTargetId
                  }
                  onClick={merge}
                  className="rounded-xl bg-violet-200 px-5 py-3 font-black text-black disabled:opacity-35"
                >
                  Merge
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {openMerges.map((mergeRecord) => (
        <div
          key={mergeRecord.id}
          className="mt-5 rounded-2xl border border-amber-300/40 bg-amber-300/[0.06] p-4"
        >
          <div className="font-black text-amber-100">
            Merge held: {branchLabel(mergeRecord.sourceBranchId, branches)} into{" "}
            {branchLabel(mergeRecord.targetBranchId, branches)}
          </div>
          <div className="mt-3 space-y-3">
            {mergeRecord.conflicts.map((conflict) => (
              <div
                key={conflict.trackId}
                className="grid gap-3 rounded-xl border border-white/10 bg-black/40 p-3 md:grid-cols-[1fr_1fr_1fr]"
              >
                <div>
                  <div className="text-xs text-white/45">Track</div>
                  <div className="font-bold">{conflict.trackId}</div>
                </div>
                <label className="flex cursor-pointer gap-2">
                  <input
                    type="radio"
                    name={`${mergeRecord.id}:${conflict.trackId}`}
                    checked={
                      resolutions[mergeRecord.id]?.[conflict.trackId] ===
                      "source"
                    }
                    onChange={() =>
                      setResolutions((current) => ({
                        ...current,
                        [mergeRecord.id]: {
                          ...current[mergeRecord.id],
                          [conflict.trackId]: "source",
                        },
                      }))
                    }
                  />
                  <span>
                    <span className="block text-xs text-white/45">Source</span>
                    {conflict.sourceRevisionId ?? "Remove track"}
                  </span>
                </label>
                <label className="flex cursor-pointer gap-2">
                  <input
                    type="radio"
                    name={`${mergeRecord.id}:${conflict.trackId}`}
                    checked={
                      resolutions[mergeRecord.id]?.[conflict.trackId] ===
                      "target"
                    }
                    onChange={() =>
                      setResolutions((current) => ({
                        ...current,
                        [mergeRecord.id]: {
                          ...current[mergeRecord.id],
                          [conflict.trackId]: "target",
                        },
                      }))
                    }
                  />
                  <span>
                    <span className="block text-xs text-white/45">Target</span>
                    {conflict.targetRevisionId ?? "Remove track"}
                  </span>
                </label>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => resolve(mergeRecord)}
            className="mt-4 rounded-xl bg-amber-100 px-5 py-3 font-black text-black"
          >
            Resolve Every Conflict
          </button>
        </div>
      ))}
    </section>
  );
}
