// api/og/ian-buchanan.js
import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "Ian Buchanan Vault";
  const subtitle =
    searchParams.get("subtitle") ||
    "Assemblage • Schizoanalysis • Deleuzian Studies";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px",
          background: "#0b0c10",
          color: "#e6e6e6",
          fontSize: 48,
          fontFamily: "Inter, ui-sans-serif, system-ui, Arial",
        }}
      >
        <div style={{ fontSize: 58, fontWeight: 800, marginBottom: 12 }}>
          {title}
        </div>
        <div style={{ fontSize: 30, color: "#d2b356" }}>{subtitle}</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

