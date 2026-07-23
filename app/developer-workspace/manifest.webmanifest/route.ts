const manifest = {
  id: "/developer-workspace",
  name: "AI Developer Workspace",
  short_name: "Dev Workspace",
  description: "Local AI-assisted code intelligence, verification, error prevention, and project history workspace.",
  start_url: "/developer-workspace",
  scope: "/",
  display: "standalone",
  orientation: "any",
  background_color: "#071018",
  theme_color: "#071018",
  categories: ["developer", "productivity", "utilities"],
  icons: [
    {
      src: "/developer-workspace/install-icon/192",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/developer-workspace/install-icon/512",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable",
    },
  ],
} as const;

export function GET() {
  return Response.json(manifest, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "application/manifest+json",
    },
  });
}