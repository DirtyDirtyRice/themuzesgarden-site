"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import GlobalPlayer from "./GlobalPlayer";
import QuickLinkHelper from "./QuickLinkHelper";
import TitleBar from "./TitleBar";
import WorkspaceSyncListener from "./WorkspaceSyncListener";

export default function ApplicationChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const standaloneWorkspace = pathname === "/developer-workspace" || pathname.startsWith("/developer-workspace/");

  if (standaloneWorkspace) {
    return <>{children}</>;
  }

  return (
    <>
      <TitleBar />
      {children}
      <WorkspaceSyncListener />
      <QuickLinkHelper />
      <GlobalPlayer />
    </>
  );
}
