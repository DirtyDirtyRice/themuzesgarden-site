import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { TimelineDawWorkspaceDocument } from "../../lib/timeline/TimelineDawWorkspaceService";
import {
  hashTimelineDawWorkspaceArchive,
  TimelineDawWorkspaceSupabaseStore,
} from "../../lib/timeline/TimelineDawWorkspaceSupabaseStore";

const document = (revision: number): TimelineDawWorkspaceDocument => ({
  revision,
  archive: { sessions: [], events: [] },
  updatedAt: `2026-07-26T0${revision}:00:00.000Z`,
});

function fakeClient() {
  const rows = new Map<string, Record<string, unknown>>();
  const client = {
    from: () => ({
      select: () => ({
        eq: (_field: string, ownerId: string) => ({
          maybeSingle: async () => ({ data: rows.get(ownerId) ?? null, error: null }),
        }),
      }),
    }),
    rpc: async (_name: string, input: Record<string, unknown>) => {
      const ownerId = String(input.p_owner_id);
      const current = rows.get(ownerId);
      if (_name === "repair_timeline_daw_workspace_archive_hash") {
        if (!current || current.revision !== input.p_revision) return { data: false, error: null };
        current.archive_hash = input.p_archive_hash;
        return { data: true, error: null };
      }
      if (Number(current?.revision ?? 0) !== input.p_expected_revision) {
        return { data: false, error: null };
      }
      rows.set(ownerId, {
        revision: input.p_next_revision,
        archive: input.p_archive,
        archive_hash: input.p_archive_hash,
        updated_at: input.p_updated_at,
      });
      return { data: true, error: null };
    },
  } as unknown as SupabaseClient;
  return { client, rows };
}

describe("TimelineDawWorkspaceSupabaseStore", () => {
  it("round-trips a private owner archive with integrity evidence", async () => {
    const { client } = fakeClient();
    const store = new TimelineDawWorkspaceSupabaseStore(client, "owner-1");
    expect(await store.load()).toBeNull();
    await store.save(document(1), 0);
    expect(await store.load()).toEqual(document(1));
    expect(hashTimelineDawWorkspaceArchive(document(1).archive)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("isolates archives by owner identity", async () => {
    const { client } = fakeClient();
    const first = new TimelineDawWorkspaceSupabaseStore(client, "owner-1");
    const second = new TimelineDawWorkspaceSupabaseStore(client, "owner-2");
    await first.save(document(1), 0);
    expect(await second.load()).toBeNull();
  });

  it("rejects a stale compare-and-swap write", async () => {
    const { client } = fakeClient();
    const store = new TimelineDawWorkspaceSupabaseStore(client, "owner-1");
    await store.save(document(1), 0);
    await expect(store.save(document(2), 0)).rejects.toThrow("storage conflict");
    expect((await store.load())?.revision).toBe(1);
  });

  it("detects archive data changed without a matching hash", async () => {
    const { client, rows } = fakeClient();
    const store = new TimelineDawWorkspaceSupabaseStore(client, "owner-1");
    await store.save(document(1), 0);
    rows.get("owner-1")!.archive = { sessions: [], events: [{ id: "tampered" }] };
    expect(await store.load()).toEqual({
      ...document(1),
      archive: { sessions: [], events: [{ id: "tampered" }] },
    });
    expect(rows.get("owner-1")!.archive_hash).toBe(
      hashTimelineDawWorkspaceArchive(rows.get("owner-1")!.archive as TimelineDawWorkspaceDocument["archive"]),
    );
  });

  it("hashes equivalent JSON objects identically after jsonb reorders keys", () => {
    const left = { sessions: [{ name: "Song", id: "session-1" }], events: [] };
    const right = { events: [], sessions: [{ id: "session-1", name: "Song" }] };
    expect(hashTimelineDawWorkspaceArchive(left as unknown as TimelineDawWorkspaceDocument["archive"]))
      .toBe(hashTimelineDawWorkspaceArchive(right as unknown as TimelineDawWorkspaceDocument["archive"]));
  });
});
