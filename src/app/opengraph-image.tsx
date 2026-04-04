/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logoData = await fetch(new URL("./_assets/logo.png", import.meta.url)).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background:
            "radial-gradient(circle at top left, rgba(8,145,178,0.18), transparent 32%), radial-gradient(circle at right center, rgba(249,115,22,0.14), transparent 28%), linear-gradient(135deg, #f8fafc 0%, #eff6ff 48%, #ffffff 100%)",
          padding: "48px",
          color: "#0f172a",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            borderRadius: "36px",
            background: "rgba(255,255,255,0.84)",
            border: "1px solid rgba(148,163,184,0.2)",
            boxShadow: "0 32px 80px -48px rgba(15,23,42,0.45)",
            padding: "48px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: "-0.04em",
            }}
          >
            <img
              src={logoData as any}
              alt="Mascot"
              style={{
                height: "64px",
                width: "64px",
              }}
            />
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ color: "#5D69F6" }}>Ai</span>
              <span style={{ color: "#3958D8", marginLeft: "2px" }}>Career</span>
              <span style={{ color: "#C58745", marginLeft: "2px" }}>Guide.</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "860px" }}>
            <div
              style={{
                fontSize: 72,
                lineHeight: 1,
                letterSpacing: "-0.06em",
                fontWeight: 800,
              }}
            >
              Build sharper resumes. Win better interviews.
            </div>
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.35,
                color: "#475569",
              }}
            >
              AI-powered resume building, ATS scoring, tailored cover letters, and job search tracking in one premium workspace.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "14px",
              alignItems: "center",
              color: "#0f172a",
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            <div
              style={{
                display: "flex",
                borderRadius: "999px",
                background: "rgba(15,23,42,0.05)",
                padding: "12px 18px",
              }}
            >
              Resume builder
            </div>
            <div
              style={{
                display: "flex",
                borderRadius: "999px",
                background: "rgba(8,145,178,0.08)",
                padding: "12px 18px",
              }}
            >
              ATS optimization
            </div>
            <div
              style={{
                display: "flex",
                borderRadius: "999px",
                background: "rgba(249,115,22,0.1)",
                padding: "12px 18px",
              }}
            >
              Career workspace
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
