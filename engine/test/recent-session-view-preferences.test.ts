import { describe, expect, it } from "vitest";
import {
  readRecentSessionViewPreferences,
  writeRecentSessionViewPreferences,
} from "../../app/workspace/daw/useRecentSessionViewPreferences";

describe("recent session view preference storage", () => {
  it("restores only allowlisted filter and sort values", () => {
    const storage = {
      getItem: () =>
        '{"stateFilter":"active","sort":"project-name","query":"private"}',
      setItem: () => undefined,
    };

    expect(readRecentSessionViewPreferences(storage, "global")).toEqual({
      stateFilter: "active",
      sort: "project-name",
    });
  });

  it("falls back safely when browser storage cannot be read", () => {
    const storage = {
      getItem: () => {
        throw new Error("storage disabled");
      },
      setItem: () => undefined,
    };

    expect(readRecentSessionViewPreferences(storage, "global")).toEqual({
      stateFilter: "all",
      sort: "newest",
    });
  });

  it("writes only filter and sort and treats write failures as non-blocking", () => {
    let saved = "";
    const storage = {
      getItem: () => null,
      setItem: (_key: string, value: string) => {
        saved = value;
      },
    };

    expect(
      writeRecentSessionViewPreferences(
        storage,
        "project-key",
        "suspended",
        "session-name",
      ),
    ).toBe(true);
    expect(JSON.parse(saved)).toEqual({
      stateFilter: "suspended",
      sort: "session-name",
    });
    expect(saved).not.toContain("query");

    expect(
      writeRecentSessionViewPreferences(
        { getItem: () => null, setItem: () => { throw new Error("full"); } },
        "global",
        "all",
        "newest",
      ),
    ).toBe(false);
  });
});
