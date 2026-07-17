import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  ArrowRight,
  Bot,
  Briefcase,
  Check,
  Download,
  FileText,
  LayoutTemplate,
  MessageSquare,
  Mic,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";

export const FPS = 30;
export const SEGMENT_DURATION_IN_FRAMES = 7 * FPS;
export const MAIN_DURATION_IN_FRAMES = 18 * FPS;

const colors = {
  ink: "#07111f",
  slate: "#475569",
  muted: "#94a3b8",
  line: "#e2e8f0",
  paper: "#ffffff",
  surface: "#f8fafc",
  violet: "#6b4cff",
  blue: "#00a7e8",
  orange: "#ff7f50",
  green: "#10b981",
  amber: "#f59e0b",
};

const fontFamily =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const enter = (frame: number, start: number, duration = 24) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: easeOut,
  });

const exit = (frame: number, start: number, duration = 18) =>
  interpolate(frame, [start, start + duration], [1, 0], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });

const fadeWindow = (
  frame: number,
  start: number,
  end: number,
  fadeIn = 18,
  fadeOut = 18,
) => enter(frame, start, fadeIn) * exit(frame, end - fadeOut, fadeOut);

const progress = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    ...clamp,
    easing: easeInOut,
  });

const px = (value: number) => `${value}px`;

const BrandMark = ({ compact = false }: { compact?: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: compact ? 10 : 14 }}>
    <div
      style={{
        width: compact ? 44 : 58,
        height: compact ? 44 : 58,
        position: "relative",
      }}
    >
      <Img
        src={staticFile("brand-resume-transparent.png")}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
    <div>
      <div
        style={{
          fontSize: compact ? 18 : 26,
          fontWeight: 900,
          letterSpacing: -0.7,
          lineHeight: 1,
          background: `linear-gradient(135deg, ${colors.violet}, ${colors.blue} 48%, ${colors.orange})`,
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        AI Career Guide.
      </div>
      <div
        style={{
          marginTop: 5,
          fontSize: compact ? 8 : 11,
          color: colors.muted,
          fontWeight: 900,
          letterSpacing: 2.2,
          textTransform: "uppercase",
        }}
      >
        Build. Match. Apply.
      </div>
    </div>
  </div>
);

const MeshBackground = ({ mode = "wide" }: { mode?: "wide" | "mobile" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drift = Math.sin((frame / fps) * Math.PI * 0.38);
  const slow = Math.sin((frame / fps) * Math.PI * 0.24 + 1.4);

  return (
    <AbsoluteFill
      style={{
        background:
          mode === "mobile"
            ? "linear-gradient(180deg, #f8fbff 0%, #eef5ff 48%, #fff8f4 100%)"
            : "linear-gradient(135deg, #fbfdff 0%, #f0f6ff 44%, #fff4ef 100%)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: mode === "mobile" ? 700 : 980,
          height: mode === "mobile" ? 700 : 980,
          left: mode === "mobile" ? -250 + drift * 30 : -150 + drift * 55,
          top: mode === "mobile" ? 60 + slow * 28 : -230 + slow * 35,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(107,76,255,0.22), transparent 68%)",
          filter: "blur(42px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: mode === "mobile" ? 620 : 820,
          height: mode === "mobile" ? 620 : 820,
          right: mode === "mobile" ? -230 + slow * 26 : -90 + slow * 44,
          top: mode === "mobile" ? 520 + drift * 24 : 40 + drift * 36,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,167,232,0.18), transparent 70%)",
          filter: "blur(46px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: mode === "mobile" ? 560 : 760,
          height: mode === "mobile" ? 560 : 760,
          right: mode === "mobile" ? -200 : 70,
          bottom: mode === "mobile" ? -120 + slow * 20 : -290 + drift * 42,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,127,80,0.16), transparent 70%)",
          filter: "blur(48px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(15,23,42,0.06) 1px, transparent 1px)",
          backgroundSize: mode === "mobile" ? "34px 34px" : "42px 42px",
          opacity: 0.55,
        }}
      />
    </AbsoluteFill>
  );
};

const TitleLockup = ({
  eyebrow,
  title,
  subtitle,
  align = "left",
  scale = 1,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  align?: "left" | "center";
  scale?: number;
}) => (
  <div style={{ textAlign: align, fontFamily, transform: `scale(${scale})`, transformOrigin: align === "center" ? "center" : "left top" }}>
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        border: "1px solid rgba(107,76,255,0.18)",
        borderRadius: 999,
        padding: "9px 14px",
        color: colors.violet,
        background: "rgba(255,255,255,0.72)",
        fontSize: 13,
        fontWeight: 900,
        letterSpacing: 2,
        textTransform: "uppercase",
      }}
    >
      <Sparkles size={15} />
      {eyebrow}
    </div>
    <div
      style={{
        marginTop: 18,
        maxWidth: 760,
        fontSize: 64,
        lineHeight: 0.92,
        fontWeight: 950,
        letterSpacing: -3.6,
        color: colors.ink,
      }}
    >
      {title}
    </div>
    <div
      style={{
        marginTop: 20,
        maxWidth: 670,
        fontSize: 24,
        lineHeight: 1.35,
        fontWeight: 650,
        color: colors.slate,
      }}
    >
      {subtitle}
    </div>
  </div>
);

const DesktopChrome = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      width: 1260,
      height: 760,
      borderRadius: 32,
      border: "1px solid rgba(255,255,255,0.9)",
      background: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(245,248,255,0.84))",
      boxShadow: "0 55px 130px -70px rgba(15,23,42,0.65)",
      padding: 12,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        height: 46,
        borderRadius: 22,
        background: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(226,232,240,0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px",
      }}
    >
      <div style={{ display: "flex", gap: 9 }}>
        {["#fb7185", "#f59e0b", "#10b981"].map((color) => (
          <span key={color} style={{ width: 11, height: 11, borderRadius: "50%", background: color }} />
        ))}
      </div>
      <div
        style={{
          height: 24,
          width: 280,
          borderRadius: 999,
          background: "#f1f5f9",
          color: colors.muted,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 1.1,
          textTransform: "uppercase",
        }}
      >
        app.aicareerguide.co/editor
      </div>
      <div style={{ width: 48 }} />
    </div>
    <div
      style={{
        height: 678,
        marginTop: 10,
        borderRadius: 26,
        overflow: "hidden",
        background: "linear-gradient(180deg,#ffffff 0%,#f8fbff 100%)",
        border: "1px solid rgba(226,232,240,0.78)",
      }}
    >
      {children}
    </div>
  </div>
);

const ToolButton = ({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  active?: boolean;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: 42,
      borderRadius: 16,
      padding: "0 14px",
      background: active ? "rgba(107,76,255,0.1)" : "transparent",
      color: active ? colors.violet : colors.slate,
      fontSize: 13,
      fontWeight: 850,
    }}
  >
    <Icon size={16} strokeWidth={2.7} />
    {label}
  </div>
);

const LeftRail = () => (
  <div
    style={{
      width: 250,
      borderRight: `1px solid ${colors.line}`,
      background: "rgba(255,255,255,0.72)",
      padding: "22px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 18,
    }}
  >
    <BrandMark compact />
    <div style={{ height: 1, background: colors.line }} />
    <div style={{ fontSize: 10, fontWeight: 950, letterSpacing: 2.3, color: colors.muted, textTransform: "uppercase" }}>
      CV Workspace
    </div>
    <ToolButton icon={FileText} label="Profile" active />
    <ToolButton icon={Wand2} label="AI Summary" />
    <ToolButton icon={Briefcase} label="Experience" />
    <ToolButton icon={ShieldCheck} label="ATS Match" />
    <ToolButton icon={LayoutTemplate} label="Templates" />
    <div style={{ marginTop: "auto", borderRadius: 20, background: "#f8fafc", padding: 14, border: `1px solid ${colors.line}` }}>
      <div style={{ color: colors.muted, fontSize: 10, fontWeight: 950, letterSpacing: 1.8, textTransform: "uppercase" }}>
        Live sync
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, color: colors.green, fontWeight: 900, fontSize: 13 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors.green }} />
        Active
      </div>
    </div>
  </div>
);

const ResumePaper = ({ frame, compact = false }: { frame: number; compact?: boolean }) => {
  const highlight = fadeWindow(frame, 55, 130, 12, 20);
  const bulletShift = interpolate(highlight, [0, 1], [0, -10]);
  const score = Math.round(interpolate(progress(frame, 96, 132), [0, 1], [67, 92]));

  return (
    <div
      style={{
        width: compact ? 286 : 410,
        height: compact ? 400 : 575,
        borderRadius: compact ? 16 : 22,
        background: "#ffffff",
        boxShadow: "0 30px 70px -48px rgba(15,23,42,0.55)",
        border: `1px solid ${colors.line}`,
        padding: compact ? 18 : 28,
        fontFamily,
        color: colors.ink,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ fontSize: compact ? 21 : 31, fontWeight: 950, letterSpacing: -1.4 }}>Maya Chen</div>
      <div style={{ marginTop: 4, color: colors.violet, fontWeight: 850, fontSize: compact ? 9 : 13 }}>
        Product Designer | Career Storyteller
      </div>
      <div style={{ marginTop: compact ? 16 : 24, height: 1, background: colors.line }} />
      <SectionLine title="Summary" compact={compact} />
      <TextLine width="92%" compact={compact} />
      <TextLine width="76%" compact={compact} />
      <div style={{ height: compact ? 9 : 14 }} />
      <SectionLine title="Experience" compact={compact} />
      {[
        "Led hiring dashboard redesign across recruiter workflow",
        "Improved candidate handoff clarity and interview prep",
        "Shipped data-backed templates for faster applications",
      ].map((text, index) => (
        <div
          key={text}
          style={{
            display: "flex",
            gap: compact ? 7 : 10,
            alignItems: "flex-start",
            marginTop: compact ? 8 : 12,
            transform: index === 1 ? `translateY(${px(bulletShift)})` : "none",
          }}
        >
          <span
            style={{
              marginTop: compact ? 5 : 7,
              width: compact ? 4 : 5,
              height: compact ? 4 : 5,
              borderRadius: "50%",
              background: index === 1 ? colors.orange : colors.violet,
              flex: "0 0 auto",
            }}
          />
          <span
            style={{
              fontSize: compact ? 8.5 : 12,
              lineHeight: 1.45,
              color: colors.slate,
              fontWeight: index === 1 ? 850 : 650,
              maxWidth: compact ? 225 : 330,
            }}
          >
            {text}
          </span>
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          right: compact ? 14 : 22,
          bottom: compact ? 14 : 22,
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderRadius: 999,
          padding: compact ? "6px 9px" : "8px 12px",
          background: "rgba(16,185,129,0.1)",
          color: colors.green,
          fontSize: compact ? 9 : 13,
          fontWeight: 950,
          opacity: enter(frame, 104, 16),
        }}
      >
        <ShieldCheck size={compact ? 12 : 16} />
        {score}% ATS
      </div>
    </div>
  );
};

const SectionLine = ({ title, compact = false }: { title: string; compact?: boolean }) => (
  <div style={{ marginTop: compact ? 14 : 22, fontSize: compact ? 8 : 11, color: colors.ink, fontWeight: 950, letterSpacing: 1.5, textTransform: "uppercase" }}>
    {title}
  </div>
);

const TextLine = ({ width, compact = false }: { width: string; compact?: boolean }) => (
  <div
    style={{
      marginTop: compact ? 7 : 10,
      width,
      height: compact ? 6 : 8,
      borderRadius: 99,
      background: "#eaf0f8",
    }}
  />
);

const EditorPanel = ({ frame }: { frame: number }) => {
  const aiReveal = enter(frame, 45, 22);
  const atsReveal = enter(frame, 95, 20);
  const downloadReveal = enter(frame, 145, 20);

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: "grid",
        gridTemplateColumns: "1fr 456px",
        background: "linear-gradient(180deg,#fcfdff,#f8fbff)",
      }}
    >
      <div style={{ padding: "26px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 950, letterSpacing: 2.1, color: colors.muted, textTransform: "uppercase" }}>
              Section Workspace
            </div>
            <div style={{ marginTop: 8, fontSize: 26, fontWeight: 950, color: colors.ink, letterSpacing: -1.1 }}>
              Experience
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Pill icon={MessageSquare} text="Ask Dan" color={colors.orange} active={aiReveal > 0.1} />
            <Pill icon={Download} text="Export PDF" color={colors.ink} active={downloadReveal > 0.1} dark />
          </div>
        </div>

        <div style={{ marginTop: 28, display: "grid", gap: 16 }}>
          <EditorCard title="Role target" value="Senior Product Designer" icon={Search} />
          <EditorCard title="Impact bullet" value="Improved recruiter handoff clarity across the end-to-end hiring workflow." icon={Briefcase} active={aiReveal > 0.2} />
          <div
            style={{
              borderRadius: 24,
              background: "#ffffff",
              border: `1px solid ${colors.line}`,
              padding: 20,
              boxShadow: "0 22px 48px -42px rgba(15,23,42,0.42)",
              opacity: aiReveal,
              transform: `translateY(${px(interpolate(aiReveal, [0, 1], [24, 0]))})`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: colors.violet, fontSize: 13, fontWeight: 950 }}>
              <Bot size={18} />
              Dan rewrote this for measurable impact
            </div>
            <div style={{ marginTop: 14, color: colors.ink, fontSize: 18, lineHeight: 1.35, fontWeight: 800 }}>
              Increased application response quality by clarifying scope, outcomes, and cross-functional ownership.
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "rgba(241,245,249,0.72)",
          borderLeft: `1px solid ${colors.line}`,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <ResumePaper frame={frame} />
        <div
          style={{
            position: "absolute",
            top: 38,
            right: 34,
            width: 210,
            borderRadius: 24,
            background: "#0f172a",
            color: "#ffffff",
            padding: 18,
            opacity: atsReveal,
            transform: `translate(${px(interpolate(atsReveal, [0, 1], [42, 0]))}, ${px(interpolate(atsReveal, [0, 1], [-12, 0]))})`,
            boxShadow: "0 28px 55px -35px rgba(15,23,42,0.78)",
          }}
        >
          <div style={{ color: "#93c5fd", fontSize: 10, fontWeight: 950, letterSpacing: 1.9, textTransform: "uppercase" }}>ATS result</div>
          <div style={{ marginTop: 10, fontSize: 39, lineHeight: 1, fontWeight: 950 }}>92%</div>
          <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.4, color: "#cbd5e1", fontWeight: 700 }}>Strong alignment for target role and recruiter keywords.</div>
        </div>
      </div>
    </div>
  );
};

const Pill = ({
  icon: Icon,
  text,
  color,
  active,
  dark,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  text: string;
  color: string;
  active?: boolean;
  dark?: boolean;
}) => (
  <div
    style={{
      height: 38,
      borderRadius: 999,
      padding: "0 14px",
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: dark ? color : active ? color : "#ffffff",
      color: dark ? "#ffffff" : active ? "#ffffff" : color,
      border: dark ? "none" : `1px solid ${active ? color : colors.line}`,
      fontSize: 12,
      fontWeight: 950,
      boxShadow: active || dark ? "0 18px 34px -25px rgba(15,23,42,0.5)" : "none",
    }}
  >
    <Icon size={15} strokeWidth={2.8} />
    {text}
  </div>
);

const EditorCard = ({
  title,
  value,
  icon: Icon,
  active,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  active?: boolean;
}) => (
  <div
    style={{
      borderRadius: 24,
      background: "#ffffff",
      border: `1px solid ${active ? "rgba(255,127,80,0.38)" : colors.line}`,
      padding: 20,
      display: "flex",
      alignItems: "center",
      gap: 16,
      boxShadow: active ? "0 25px 46px -36px rgba(255,127,80,0.55)" : "0 18px 42px -40px rgba(15,23,42,0.38)",
    }}
  >
    <div
      style={{
        width: 46,
        height: 46,
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: active ? "rgba(255,127,80,0.12)" : "#f1f5f9",
        color: active ? colors.orange : colors.slate,
      }}
    >
      <Icon size={19} />
    </div>
    <div>
      <div style={{ fontSize: 10, color: colors.muted, fontWeight: 950, letterSpacing: 1.8, textTransform: "uppercase" }}>{title}</div>
      <div style={{ marginTop: 6, color: colors.ink, fontSize: 18, fontWeight: 850 }}>{value}</div>
    </div>
  </div>
);

const Cursor = ({ frame, mobile = false }: { frame: number; mobile?: boolean }) => {
  const x = mobile
    ? interpolate(frame, [20, 80, 130, 175], [260, 270, 170, 310], { ...clamp, easing: easeInOut })
    : interpolate(frame, [15, 55, 105, 152], [430, 505, 920, 1090], { ...clamp, easing: easeInOut });
  const y = mobile
    ? interpolate(frame, [20, 80, 130, 175], [1240, 890, 1340, 1110], { ...clamp, easing: easeInOut })
    : interpolate(frame, [15, 55, 105, 152], [360, 510, 178, 106], { ...clamp, easing: easeInOut });
  const tap = Math.max(enter(frame, 54, 5) * exit(frame, 64, 8), enter(frame, 104, 5) * exit(frame, 114, 8), enter(frame, 152, 5) * exit(frame, 162, 8));

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: mobile ? 44 : 34,
        height: mobile ? 44 : 34,
        transform: "translate(-50%, -50%)",
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: mobile ? 2 : 0,
          borderRadius: "50%",
          border: `3px solid ${mobile ? colors.violet : colors.orange}`,
          opacity: tap,
          transform: `scale(${interpolate(tap, [0, 1], [0.7, 1.55])})`,
        }}
      />
      <div
        style={{
          width: mobile ? 28 : 24,
          height: mobile ? 28 : 24,
          borderRadius: "50%",
          background: mobile ? colors.violet : colors.orange,
          boxShadow: "0 10px 26px -12px rgba(15,23,42,0.7)",
          border: "3px solid #ffffff",
        }}
      />
    </div>
  );
};

export const DesktopAppDemo = () => {
  const frame = useCurrentFrame();
  const intro = enter(frame, 0, 32);
  const tilt = Math.sin(frame / 70) * 1.6;

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <MeshBackground />
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 62,
          opacity: intro,
          transform: `translateY(${px(interpolate(intro, [0, 1], [28, 0]))})`,
        }}
      >
        <BrandMark />
      </div>
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 180,
          opacity: intro,
        }}
      >
        <TitleLockup
          eyebrow="Desktop workflow"
          title="Build, tune, match, and export from one focused workspace."
          subtitle="The desktop editor shows CV sections, Dan's assistant, ATS feedback, template controls, and export actions side by side."
          scale={0.64}
        />
      </div>
      <div
        style={{
          position: "absolute",
          right: 76,
          top: 150,
          transform: `rotateY(${tilt}deg) rotateX(${-tilt * 0.45}deg)`,
          transformOrigin: "center",
          opacity: intro,
        }}
      >
        <DesktopChrome>
          <div style={{ display: "flex", height: "100%" }}>
            <LeftRail />
            <EditorPanel frame={frame} />
          </div>
        </DesktopChrome>
        <Cursor frame={frame} />
      </div>
      <CalloutStack frame={frame} />
    </AbsoluteFill>
  );
};

const CalloutStack = ({ frame }: { frame: number }) => {
  const items = [
    { start: 35, icon: Upload, label: "Imported CV", detail: "Your existing content becomes editable sections." },
    { start: 72, icon: Wand2, label: "AI rewrite", detail: "Dan sharpens bullets for impact and clarity." },
    { start: 115, icon: ShieldCheck, label: "ATS matched", detail: "Missing keywords turn into clear next steps." },
    { start: 157, icon: Download, label: "PDF ready", detail: "Export a polished CV when the score is strong." },
  ];

  return (
    <div style={{ position: "absolute", left: 92, bottom: 76, display: "grid", gap: 12 }}>
      {items.map((item) => {
        const show = fadeWindow(frame, item.start, item.start + 76, 12, 18);
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            style={{
              width: 390,
              borderRadius: 22,
              border: "1px solid rgba(255,255,255,0.8)",
              background: "rgba(255,255,255,0.82)",
              boxShadow: "0 26px 60px -45px rgba(15,23,42,0.55)",
              padding: "15px 17px",
              display: "flex",
              gap: 13,
              opacity: show,
              transform: `translateX(${px(interpolate(show, [0, 1], [-26, 0]))})`,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 15,
                background: "linear-gradient(135deg, rgba(107,76,255,0.13), rgba(0,167,232,0.13), rgba(255,127,80,0.15))",
                color: colors.violet,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "0 0 auto",
              }}
            >
              <Icon size={18} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 950, color: colors.ink }}>{item.label}</div>
              <div style={{ marginTop: 3, fontSize: 13, lineHeight: 1.35, color: colors.slate, fontWeight: 650 }}>{item.detail}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PhoneFrame = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      width: 430,
      height: 884,
      borderRadius: 58,
      background: "#0f172a",
      padding: 12,
      boxShadow: "0 52px 110px -62px rgba(15,23,42,0.72)",
      position: "relative",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 24,
        left: "50%",
        transform: "translateX(-50%)",
        width: 132,
        height: 30,
        borderRadius: 999,
        background: "#0f172a",
        zIndex: 3,
      }}
    />
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 48,
        overflow: "hidden",
        background: "#ffffff",
      }}
    >
      {children}
    </div>
  </div>
);

const MobileScreen = ({ frame }: { frame: number }) => {
  const ats = enter(frame, 42, 18);
  const advisor = fadeWindow(frame, 80, 150, 16, 20);
  const preview = enter(frame, 142, 18);
  const score = Math.round(interpolate(progress(frame, 42, 80), [0, 1], [58, 91]));

  return (
    <div style={{ width: "100%", height: "100%", fontFamily, background: "#ffffff", position: "relative", overflow: "hidden" }}>
      <div
        style={{
          height: 78,
          borderBottom: `1px solid ${colors.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 18px",
          background: "rgba(255,255,255,0.94)",
        }}
      >
        <div>
          <div style={{ fontSize: 9, color: colors.muted, fontWeight: 950, letterSpacing: 1.7, textTransform: "uppercase" }}>
            Smart editor
          </div>
          <div style={{ marginTop: 5, fontSize: 15, fontWeight: 950, color: colors.ink }}>Maya Chen CV</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <MiniIcon icon={ShieldCheck} active={ats > 0.4} />
          <MiniIcon icon={Download} dark />
        </div>
      </div>

      <div
        style={{
          height: 48,
          borderBottom: `1px solid ${colors.line}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 14px",
          background: "#f8fafc",
        }}
      >
        {["Goal", "Header", "Summary", "Experience"].map((item, index) => (
          <div
            key={item}
            style={{
              borderRadius: 999,
              padding: "8px 10px",
              background: index === 3 ? colors.ink : "#ffffff",
              color: index === 3 ? "#ffffff" : colors.slate,
              fontSize: 9,
              fontWeight: 950,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              border: `1px solid ${index === 3 ? colors.ink : colors.line}`,
              flex: "0 0 auto",
            }}
          >
            {item}
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          inset: "126px 0 86px",
          padding: 18,
          overflow: "hidden",
          background: preview > 0.5 ? "linear-gradient(180deg,#eef2ff,#e2e8f0)" : "#ffffff",
        }}
      >
        {preview < 0.55 ? (
          <div style={{ display: "grid", gap: 14 }}>
            <MobileInput title="Target role" value="Senior Product Designer" />
            <MobileTextarea title="Job description" />
            <div
              style={{
                borderRadius: 24,
                border: `1px solid ${ats > 0.2 ? "rgba(16,185,129,0.36)" : colors.line}`,
                background: ats > 0.2 ? "rgba(16,185,129,0.08)" : "#f8fafc",
                padding: 18,
                opacity: enter(frame, 34, 16),
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 19,
                    background: "#ffffff",
                    color: colors.green,
                    border: "1px solid rgba(16,185,129,0.22)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 19,
                    fontWeight: 950,
                  }}
                >
                  {score}%
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 950, color: colors.ink, textTransform: "uppercase", letterSpacing: 0.8 }}>
                    Strong job match
                  </div>
                  <div style={{ marginTop: 5, fontSize: 11, lineHeight: 1.35, color: colors.slate, fontWeight: 650 }}>
                    Add two product analytics keywords and tighten your second bullet.
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ResumePaper frame={frame} compact />
          </div>
        )}

        <div
          style={{
            position: "absolute",
            left: 18,
            right: 18,
            bottom: 18,
            borderRadius: 24,
            background: "#0f172a",
            color: "#ffffff",
            padding: 18,
            opacity: advisor,
            transform: `translateY(${px(interpolate(advisor, [0, 1], [36, 0]))})`,
            boxShadow: "0 34px 70px -46px rgba(15,23,42,0.8)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#bfdbfe", fontSize: 12, fontWeight: 950 }}>
            <MessageSquare size={16} />
            Dan is ready
          </div>
          <div style={{ marginTop: 10, fontSize: 17, lineHeight: 1.28, fontWeight: 850 }}>
            "Use this version for product roles, then generate a tailored cover letter."
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 86,
          padding: "12px 14px 18px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
          background: "linear-gradient(180deg,rgba(255,255,255,0.85),#ffffff)",
        }}
      >
        <MobileTab icon={FileText} label="Content" active={frame < 78} />
        <MobileTab icon={Sparkles} label="Advisor" active={frame >= 78 && frame < 142} />
        <MobileTab icon={FileText} label="Preview" active={frame >= 142} />
      </div>
    </div>
  );
};

const MiniIcon = ({
  icon: Icon,
  active,
  dark,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  active?: boolean;
  dark?: boolean;
}) => (
  <div
    style={{
      width: 40,
      height: 40,
      borderRadius: 14,
      background: dark ? colors.ink : active ? colors.violet : "#ffffff",
      color: dark || active ? "#ffffff" : colors.slate,
      border: dark ? "none" : `1px solid ${active ? colors.violet : colors.line}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Icon size={16} strokeWidth={2.8} />
  </div>
);

const MobileInput = ({ title, value }: { title: string; value: string }) => (
  <div style={{ borderRadius: 20, border: `1px solid ${colors.line}`, background: "#ffffff", padding: 16 }}>
    <div style={{ fontSize: 9, color: colors.muted, fontWeight: 950, letterSpacing: 1.8, textTransform: "uppercase" }}>{title}</div>
    <div style={{ marginTop: 9, color: colors.ink, fontSize: 15, fontWeight: 850 }}>{value}</div>
  </div>
);

const MobileTextarea = ({ title }: { title: string }) => (
  <div style={{ borderRadius: 20, border: `1px solid ${colors.line}`, background: "#ffffff", padding: 16 }}>
    <div style={{ fontSize: 9, color: colors.muted, fontWeight: 950, letterSpacing: 1.8, textTransform: "uppercase" }}>{title}</div>
    <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
      <TextLine width="92%" compact />
      <TextLine width="86%" compact />
      <TextLine width="74%" compact />
    </div>
  </div>
);

const MobileTab = ({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  active?: boolean;
}) => (
  <div
    style={{
      borderRadius: 18,
      border: `1px solid ${active ? colors.ink : colors.line}`,
      background: active ? colors.ink : "#ffffff",
      color: active ? "#ffffff" : colors.slate,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      fontSize: 9,
      fontWeight: 950,
      letterSpacing: 1,
      textTransform: "uppercase",
    }}
  >
    <Icon size={14} strokeWidth={2.8} />
    {label}
  </div>
);

export const MobileAppDemo = () => {
  const frame = useCurrentFrame();
  const intro = enter(frame, 0, 30);
  const bob = Math.sin(frame / 46) * 10;

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <MeshBackground mode="mobile" />
      <div
        style={{
          position: "absolute",
          top: 74,
          left: 86,
          right: 86,
          opacity: intro,
          transform: `translateY(${px(interpolate(intro, [0, 1], [34, 0]))})`,
        }}
      >
        <BrandMark />
        <div style={{ marginTop: 46 }}>
          <TitleLockup
            eyebrow="Mobile workflow"
            title="Keep moving from edit to match to export."
            subtitle="The mobile experience keeps ATS checks, assistant advice, and CV preview within thumb reach."
            scale={0.84}
          />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 96,
          transform: `translateX(-50%) translateY(${px(bob)})`,
          opacity: intro,
        }}
      >
        <PhoneFrame>
          <MobileScreen frame={frame} />
        </PhoneFrame>
        <Cursor frame={frame} mobile />
      </div>
    </AbsoluteFill>
  );
};

const IntroScene = () => {
  const frame = useCurrentFrame();
  const show = enter(frame, 0, 36);
  const desktop = enter(frame, 42, 30);
  const mobile = enter(frame, 66, 30);

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <MeshBackground />
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 88,
          opacity: show,
          transform: `translateY(${px(interpolate(show, [0, 1], [28, 0]))})`,
        }}
      >
        <BrandMark />
      </div>
      <div style={{ position: "absolute", left: 120, top: 246, opacity: show }}>
        <TitleLockup
          eyebrow="Product demo"
          title="The career workspace in motion."
          subtitle="A fast look at AI Career Guide across desktop and mobile: CV editing, ATS matching, assistant guidance, jobs, and export."
        />
      </div>
      <div
        style={{
          position: "absolute",
          right: 118,
          bottom: 102,
          display: "flex",
          alignItems: "flex-end",
          gap: 28,
        }}
      >
        <div
          style={{
            opacity: desktop,
            transform: `translateY(${px(interpolate(desktop, [0, 1], [40, 0]))}) rotate(-3deg) scale(0.55)`,
            transformOrigin: "bottom right",
          }}
        >
          <DesktopChrome>
            <div style={{ display: "flex", height: "100%" }}>
              <LeftRail />
              <EditorPanel frame={84} />
            </div>
          </DesktopChrome>
        </div>
        <div
          style={{
            opacity: mobile,
            transform: `translateY(${px(interpolate(mobile, [0, 1], [50, 0]))}) rotate(5deg) scale(0.72)`,
            transformOrigin: "bottom left",
          }}
        >
          <PhoneFrame>
            <MobileScreen frame={116} />
          </PhoneFrame>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const OutroScene = () => {
  const frame = useCurrentFrame();
  const show = enter(frame, 0, 28);
  const icons = [
    { icon: FileText, label: "CV Builder" },
    { icon: ShieldCheck, label: "ATS Checker" },
    { icon: Search, label: "Live Jobs" },
    { icon: MessageSquare, label: "Dan Assistant" },
    { icon: Mic, label: "Interview Prep" },
    { icon: Download, label: "Export PDF" },
  ];

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <MeshBackground />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          textAlign: "center",
          opacity: show,
          transform: `scale(${interpolate(show, [0, 1], [0.96, 1])})`,
        }}
      >
        <BrandMark />
        <div
          style={{
            marginTop: 48,
            maxWidth: 1030,
            fontSize: 72,
            lineHeight: 0.95,
            fontWeight: 950,
            letterSpacing: -4.2,
            color: colors.ink,
          }}
        >
          Build the CV, match the role, and keep the job search moving.
        </div>
        <div
          style={{
            marginTop: 36,
            display: "grid",
            gridTemplateColumns: "repeat(6, auto)",
            gap: 13,
          }}
        >
          {icons.map((item, index) => {
            const Icon = item.icon;
            const reveal = enter(frame, 28 + index * 5, 18);
            return (
              <div
                key={item.label}
                style={{
                  height: 52,
                  borderRadius: 999,
                  padding: "0 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  background: "rgba(255,255,255,0.78)",
                  border: "1px solid rgba(255,255,255,0.86)",
                  color: colors.slate,
                  fontSize: 14,
                  fontWeight: 900,
                  opacity: reveal,
                  transform: `translateY(${px(interpolate(reveal, [0, 1], [18, 0]))})`,
                }}
              >
                <Icon size={17} color={index % 3 === 0 ? colors.violet : index % 3 === 1 ? colors.blue : colors.orange} />
                {item.label}
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 46,
            height: 62,
            borderRadius: 999,
            padding: "0 26px",
            background: colors.ink,
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 18,
            fontWeight: 950,
          }}
        >
          See the app in action
          <ArrowRight size={21} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const AppActionVideo = () => {
  return (
    <AbsoluteFill style={{ background: "#f8fbff" }}>
      <Sequence from={0} durationInFrames={4 * FPS} premountFor={FPS}>
        <IntroScene />
      </Sequence>
      <Sequence from={3 * FPS + 12} durationInFrames={SEGMENT_DURATION_IN_FRAMES} premountFor={FPS}>
        <DesktopAppDemo />
      </Sequence>
      <Sequence from={10 * FPS} durationInFrames={SEGMENT_DURATION_IN_FRAMES} premountFor={FPS}>
        <MobileAppDemo />
      </Sequence>
      <Sequence from={15 * FPS + 18} durationInFrames={3 * FPS} premountFor={FPS}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
