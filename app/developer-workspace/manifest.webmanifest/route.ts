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
      src: "/favicon.ico",
      sizes: "any",
      type: "image/x-icon",
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