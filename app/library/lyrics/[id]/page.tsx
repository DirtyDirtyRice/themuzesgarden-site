import { Suspense } from "react";

import LyricDirectPageClient from "./LyricDirectPageClient";

type LyricDirectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function LyricDirectPage({ params }: LyricDirectPageProps) {
  const resolvedParams = await params;

  return (
    <Suspense fallback={null}>
      <LyricDirectPageClient lyricId={resolvedParams.id} />
    </Suspense>
  );
}