import { ImageResponse } from "next/og";

export const alt = "Perform. Performance Management Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px", background: "#163366", color: "white", fontFamily: "Arial" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: 34, fontWeight: 700 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "#ffffff", color: "#163366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42 }}>P</div>
          Perform.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ fontSize: 64, fontWeight: 700 }}>People & performance</div>
          <div style={{ fontSize: 30, color: "#dce7f7" }}>Align goals. Measure progress. Grow together.</div>
        </div>
        <div style={{ display: "flex", width: "100%", height: 8, background: "#ffffff33", borderRadius: 8 }}>
          <div style={{ width: "34%", background: "#58d3b1", borderRadius: 8 }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
