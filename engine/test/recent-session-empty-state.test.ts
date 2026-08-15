import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import RecentSessionEmptyState from "../../app/workspace/daw/RecentSessionEmptyState";

describe("recent session empty-state actions", () => {
  it("renders one local recovery action for filtered-zero results", () => {
    const markup = renderToStaticMarkup(
      createElement(RecentSessionEmptyState, {
        title: "No matching open sessions",
        message: "Clear the current search and state filter.",
        actionLabel: "Clear Search and State Filter",
        buttonClassName: "button",
        onAction: vi.fn(),
      }),
    );

    expect(markup).toContain("No matching open sessions");
    expect(markup).toContain("Clear Search and State Filter");
    expect(markup.match(/<button/g)).toHaveLength(1);
    expect(markup).not.toContain("href=");
  });

  it("routes a global no-project state to Projects", () => {
    const markup = renderToStaticMarkup(
      createElement(RecentSessionEmptyState, {
        title: "Create your first project",
        message: "Start from an owner project.",
        actionLabel: "Open Projects",
        buttonClassName: "button",
        href: "/workspace/projects",
      }),
    );

    expect(markup).toContain('href="/workspace/projects"');
    expect(markup.match(/<a /g)).toHaveLength(1);
  });

  it("routes a project no-session state to the existing song starter", () => {
    const markup = renderToStaticMarkup(
      createElement(RecentSessionEmptyState, {
        title: "No DAW sessions yet",
        message: "Choose linked music above.",
        actionLabel: "Choose a Song Above",
        buttonClassName: "button",
        href: "#project-song-start",
      }),
    );

    expect(markup).toContain('href="#project-song-start"');
    expect(markup).toContain("Choose a Song Above");
  });
});
