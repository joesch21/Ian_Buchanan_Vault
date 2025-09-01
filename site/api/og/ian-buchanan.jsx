import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0b0c10",
          color: "#fff",
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <h1 style={{ fontSize: 72, color: "#fff" }}>Ian Buchanan</h1>
        <p style={{ fontSize: 36, color: "#d2b356" }}>VaultPedia | Deleuzian Studies</p>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
