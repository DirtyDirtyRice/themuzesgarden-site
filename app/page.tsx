"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // send user directly into workspace instead of showing old page
    router.replace("/workspace/projects");
  }, [router]);

  return null;
}