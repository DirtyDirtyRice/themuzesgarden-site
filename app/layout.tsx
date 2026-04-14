import type { Metadata } from "next";
import TitleBar from "./components/TitleBar";
import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";
import QuickLinkHelper from "./components/QuickLinkHelper";
import WorkspaceSyncListener from "./components/WorkspaceSyncListener";
import GlobalPlayer from "./components/GlobalPlayer";

export const metadata: Metadata = {
  title: "The Muzes Garden",
  description: "The Muzes Garden – audio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
     <AuthProvider>

  {/* 🔹 GLOBAL TITLE BAR */}
  <TitleBar />

  {/* 🔹 PAGE CONTENT */}
  {children}

  {/* 🔹 SYSTEM HELPERS */}
  <WorkspaceSyncListener />
  <QuickLinkHelper />

  {/* 🔹 GLOBAL PLAYER */}
  <GlobalPlayer />

</AuthProvider>
      </body>
    </html>
  );
}