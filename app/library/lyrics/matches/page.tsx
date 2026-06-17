import { Suspense } from "react";

import LyricsMatchSelectionClient from "./LyricsMatchSelectionClient";

export default function LyricsMatchSelectionPage() {
  return (
    <Suspense fallback={null}>
      <LyricsMatchSelectionClient />
    </Suspense>
  );
}