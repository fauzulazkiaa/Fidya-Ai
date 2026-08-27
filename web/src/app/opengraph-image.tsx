import { ImageResponse } from "next/og";

export const alt = "Fidya — Master anything. Finish everything.";
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
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(to bottom, #0f172a, #1e1b4b)",
          color: "#ffffff",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: -180,
            left: 300,
            width: 600,
            height: 600,
            borderRadius: 9999,
            background: "rgba(99,102,241,0.35)",
            filter: "blur(120px)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 9999,
              background: "#4f46e5",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            F
          </div>
          <span style={{ fontSize: 34, fontWeight: 700 }}>Fidya</span>
        </div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 800, letterSpacing: -2 }}>
          Master anything. Finish everything.
        </div>
        <div
          style={{
            marginTop: 32,
            display: "flex",
            gap: 28,
            fontSize: 26,
            color: "rgba(255,255,255,0.65)",
          }}
        >
          <span>Deadline-driven curricula</span>
          <span>·</span>
          <span>100% cited claims</span>
          <span>·</span>
          <span>7 specialized agents</span>
        </div>
      </div>
    ),
    size
  );
}
