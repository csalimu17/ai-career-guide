import { ImageResponse } from "next/og";
import { logoBase64 } from "./_assets/logo-b64";

export const runtime = "edge";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoBase64}
        alt="Mascot Logo"
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    ),
    {
      ...size,
    }
  );
}
