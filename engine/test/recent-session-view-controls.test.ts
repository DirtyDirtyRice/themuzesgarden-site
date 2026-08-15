import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import RecentSessionViewControls from "../../app/workspace/daw/RecentSessionViewControls";

const result = {
  sessions: [],
  matchingCount: 0,
  totalOpenCount: 2,
};

type ControlProps = Parameters<typeof RecentSessionViewControls>[0];

function render(overrides: Partial<ControlProps> = {}) {
  const props: ControlProps = {
    loaded: true,
    query: "",
    stateFilter: "all",
    sort: "newest",
    result,
    searchLabel: "Search open sessions",
    searchId: "recent-search",
    searchPlaceholder: "Session, song, or project",
    buttonClassName: "button",
    inputClassName: "input",
    selectClassName: "select",
    statusClassName: "status",
    loadingClassName: "loading",
    onQueryChange: vi.fn(),
    onStateFilterChange: vi.fn(),
    onSortChange: vi.fn(),
    ...overrides,
  };

  return renderToStaticMarkup(createElement(RecentSessionViewControls, props));
}

describe("recent session view controls", () => {
  it("renders one shared accessible search, filter, sort, and result summary", () => {
    const markup = render();

    expect(markup).toContain('for="recent-search"');
    expect(markup).toContain('id="recent-search"');
    expect(markup).toContain('aria-label="Filter open sessions by state"');
    expect(markup).toContain('aria-label="Sort open sessions"');
    expect(markup).toContain('role="status"');
    expect(markup).toContain("2 total open");
    expect(markup).not.toContain("Reset view");
  });

  it("preserves project-specific labeling and exposes reset for a changed view", () => {
    const markup = render({
      query: "mix",
      searchLabel: undefined,
      searchId: undefined,
      searchPlaceholder: "Search open session or song",
      statusFirst: true,
    });

    expect(markup).toContain('aria-label="Search open session or song"');
    expect(markup).toContain("Reset view");
    expect(markup.indexOf('role="status"')).toBeLessThan(
      markup.indexOf('type="search"'),
    );
  });

  it("withholds controls until preference hydration completes", () => {
    const markup = render({ loaded: false });

    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("Restoring recent session view");
    expect(markup).not.toContain('type="search"');
  });
});
