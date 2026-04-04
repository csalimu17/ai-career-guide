/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
export const runtime = "edge";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default async function AppleIcon() {
  const logoData = await fetch(new URL("./_assets/logo.png", import.meta.url)).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          borderRadius: "40px",
          padding: "20px",
        }}
      >
        <img
          src={logoData as any}
          alt="Mascot"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>
    ),
    size
  );
}
