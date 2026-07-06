"use client";

import { useState } from "react";

type TitleBarLink = {
  label: string;
  href: string;
};

const TOOLS_CHILD_LINKS: TitleBarLink[] = [
  {
    label: "Code Map",
    href: "/tools/code-map",
  },
];

export default function BrokenTitleBarExample() {
  const toolsActive = true;
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);

  return (
    <nav>
      <button onClick={() => setToolsMenuOpen(!toolsMenuOpen)}>
        Home
      </button>

      {/* BUG: TOOLS_CHILD_LINKS, toolsActive, and toolsMenuOpen exist,
          but no Tools dropdown is rendered. */}
    </nav>
  );
}
