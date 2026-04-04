import { ImageResponse } from "next/og";
import { logoBase64 } from "./_assets/logo-b64";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: "transparent",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
        }}
      >
        <img
          src={logoBase64}
          alt="icon"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
