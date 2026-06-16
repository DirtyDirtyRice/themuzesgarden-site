import { Suspense } from "react";

import LyricsLibraryClient from "./LyricsLibraryClient";

export default function LyricsLibraryPage() {
  return (
    <Suspense fallback={null}>
      <LyricsLibraryClient />
    </Suspense>
  );
}