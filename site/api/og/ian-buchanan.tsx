/* eslint-disable import/no-default-export */
import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const subtitle =
    url.searchParams.get("s") ||
    "Deleuze & Guattari studies • assemblage • schizoanalysis";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 60,
          background: "#0b0c10",
          color: "#e6e6e6",
          fontFamily: "Inter, system-ui, Arial, sans-serif",
        }}
      >
        <div style={{ fontSize: 60, fontWeight: 800 }}>Ian Buchanan</div>
        <div style={{ fontSize: 30, opacity: 0.9 }}>{subtitle}</div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            opacity: 0.8,
          }}
        >
          <span>VaultPedia</span>
          <span>buchanan-vault.vercel.app</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

