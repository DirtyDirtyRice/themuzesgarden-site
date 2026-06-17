import { Suspense } from "react";

import LyricViewPageClient from "./LyricViewPageClient";

export default function LyricViewPage() {
  return (
    <Suspense fallback={null}>
      <LyricViewPageClient />
    </Suspense>
  );
}