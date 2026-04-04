import { ImageResponse } from "next/og";
import { logoBase64 } from "./_assets/logo-b64";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 120,
          background: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "12%",
        }}
      >
        <img
          src={logoBase64}
          alt="apple-icon"
          style={{ width: "90%", height: "90%", objectFit: "contain" }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
