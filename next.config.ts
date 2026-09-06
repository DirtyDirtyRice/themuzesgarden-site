import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingExcludes: {
    "/*": [
      "./code-map-reports/**/*",
      "./duplicate-reports/**/*",
      "./codex-session-notes/**/*",
      "./.codex-deploy*/**/*",
      "./.docx-qa/**/*",
      "./supabase/.temp/**/*",
      "./*.docx",
      "./*.zip",
    ],
  },
};

export default nextConfig;
