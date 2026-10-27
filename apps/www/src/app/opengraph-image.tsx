import { ImageResponse } from "next/og";

export const alt = "IFCWise — From drawings to IFC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#0c0a09",
          color: "#f5f5f4",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>
          IFC<span style={{ color: "#2dd4bf" }}>Wise</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -2 }}>From drawings to IFC.</div>
          <div style={{ fontSize: 34, color: "#a8a29e" }}>
            CAD, PDF plans, sketches or text in. A BIM model you can open anywhere out.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
