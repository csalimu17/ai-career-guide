/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { logoBase64 } from "./_assets/logo-b64";
export const runtime = "edge";

export const size = {
  width: 256,
  height: 256,
};

export const contentType = "image/png";

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <img
          src={logoBase64}
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
