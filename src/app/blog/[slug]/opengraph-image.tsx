import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/blog-data";

export const runtime = "edge";
export const alt = "AI Career Guide Blog";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0B0F19",
            color: "#fff",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ fontSize: 48, fontWeight: "bold" }}>AI Career Guide</div>
        </div>
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0B0F19",
          padding: "80px",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Background Gradients */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -200,
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0) 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -200,
            left: -200,
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(236,72,153,0) 70%)",
            display: "flex",
          }}
        />

        {/* Top Header Row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "0.05em",
              color: "#fff",
            }}
          >
            AI CAREER GUIDE
          </div>
          <div
            style={{
              backgroundColor: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              color: "#818CF8",
              padding: "8px 20px",
              borderRadius: "30px",
              fontSize: 16,
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {post.category}
          </div>
        </div>

        {/* Main Content Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            zIndex: 10,
            marginTop: "40px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              fontSize: 54,
              fontWeight: "bold",
              lineHeight: 1.15,
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            {post.title}
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#94A3B8",
              lineHeight: 1.4,
              maxHeight: "90px",
              overflow: "hidden",
            }}
          >
            {post.excerpt}
          </div>
        </div>

        {/* Footer Row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            paddingTop: "30px",
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: "bold", color: "#F1F5F9" }}>
                {post.author.name}
              </div>
              <div style={{ fontSize: 14, color: "#64748B" }}>{post.author.role}</div>
            </div>
          </div>
          <div
            style={{
              fontSize: 16,
              color: "#64748B",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {post.readingTime} &bull; {post.publishedAt}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
