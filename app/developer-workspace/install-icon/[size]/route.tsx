import { ImageResponse } from "next/og";

export const runtime = "edge";

const supportedSizes = new Set([192, 512]);

export async function GET(_request: Request, context: { params: Promise<{ size: string }> }) {
  const { size: rawSize } = await context.params;
  const size = Number(rawSize);
  if (!supportedSizes.has(size)) return new Response("Unsupported icon size.", { status: 404 });

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(145deg, #071018 0%, #0d2430 55%, #102035 100%)",
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "rgba(34, 211, 238, 0.09)",
            border: `${Math.max(4, Math.round(size / 48))}px solid rgba(103, 232, 249, 0.72)`,
            borderRadius: `${Math.round(size * 0.19)}px`,
            boxShadow: "0 0 70px rgba(34, 211, 238, 0.24)",
            display: "flex",
            fontFamily: "Arial, sans-serif",
            fontSize: `${Math.round(size * 0.31)}px`,
            fontWeight: 900,
            height: "72%",
            justifyContent: "center",
            letterSpacing: "-0.07em",
            width: "72%",
          }}
        >
          <span style={{ color: "#a5f3fc", display: "flex", marginLeft: "-0.05em" }}>DW</span>
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
      headers: { "Cache-Control": "public, max-age=86400, immutable" },
    },
  );
}
