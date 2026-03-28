"use client";
import { forwardRef } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SiteData } from "./types";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";
const FONT_KR = "'Noto Sans KR', 'JetBrains Mono', sans-serif";

function BlurIn({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  return (
    <motion.div
      ref={ref}
      animate={inView
        ? { filter: "blur(0px)", opacity: 1, y: 0 }
        : { filter: "blur(10px)", opacity: 0, y: 16 }
      }
      initial={{ filter: "blur(10px)", opacity: 0, y: 16 }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

interface AboutProps {
  siteData: SiteData | null;
}

const AboutSection = forwardRef<HTMLElement, AboutProps>(({ siteData }, ref) => {
  const bio = siteData?.aboutBio ?? [];
  const services = siteData?.services ?? [];
  const experience = siteData?.experience ?? [];

  // Split lists in half for two-column display
  const half = (arr: string[]) => [arr.slice(0, Math.ceil(arr.length / 2)), arr.slice(Math.ceil(arr.length / 2))];
  const [svcA, svcB] = half(services);
  const [expA, expB] = half(experience);

  const labelStyle: React.CSSProperties = {
    fontFamily: FONT,
    fontWeight: 300,
    fontSize: "10px",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "rgba(240,237,232,0.25)",
    marginBottom: "24px",
  };

  const listItemStyle: React.CSSProperties = {
    fontFamily: FONT,
    fontWeight: 300,
    fontSize: "12px",
    letterSpacing: "0.02em",
    color: "rgba(240,237,232,0.55)",
    lineHeight: 2.0,
  };

  return (
    <section
      ref={ref}
      style={{
        padding: "clamp(80px, 10vh, 140px) clamp(20px, 4vw, 56px) clamp(80px, 10vh, 140px)",
        background: "#0A0A0A",
        borderTop: "1px solid rgba(240,237,232,0.06)",
      }}
    >
      {/* Top row: label + headline */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "clamp(80px, 12vw, 160px) 1fr",
        gap: "clamp(20px, 4vw, 60px)",
        marginBottom: "clamp(56px, 8vh, 100px)",
        alignItems: "start",
      }}>
        <BlurIn>
          <span style={labelStyle}>About</span>
        </BlurIn>
        <BlurIn delay={0.08}>
          <h2 style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: "clamp(22px, 3.2vw, 44px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            color: "#F0EDE8",
            margin: 0,
            wordBreak: "keep-all",
          }}>
            Brand Designer at<br />SHINSEGAE.
          </h2>
        </BlurIn>
      </div>

      {/* Bio */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "clamp(80px, 12vw, 160px) 1fr",
        gap: "clamp(20px, 4vw, 60px)",
        marginBottom: "clamp(48px, 7vh, 88px)",
        alignItems: "start",
      }}>
        <BlurIn>
          <span style={labelStyle}>Bio</span>
        </BlurIn>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {bio.map((p, i) => (
            <BlurIn key={i} delay={i * 0.06}>
              <p style={{
                fontFamily: FONT_KR,
                fontWeight: 300,
                fontSize: "clamp(13px, 1.1vw, 16px)",
                lineHeight: 1.8,
                color: "rgba(240,237,232,0.6)",
                margin: 0,
                wordBreak: "keep-all",
              }}>
                {p}
              </p>
            </BlurIn>
          ))}
        </div>
      </div>

      {/* Services */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "clamp(80px, 12vw, 160px) 1fr",
        gap: "clamp(20px, 4vw, 60px)",
        marginBottom: "clamp(48px, 7vh, 88px)",
        alignItems: "start",
      }}>
        <BlurIn>
          <span style={labelStyle}>Services</span>
        </BlurIn>
        <BlurIn delay={0.06}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0 clamp(24px, 4vw, 60px)",
          }}>
            <div>{svcA.map(s => <div key={s} style={listItemStyle}>{s}</div>)}</div>
            <div>{svcB.map(s => <div key={s} style={listItemStyle}>{s}</div>)}</div>
          </div>
        </BlurIn>
      </div>

      {/* Experience */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "clamp(80px, 12vw, 160px) 1fr",
        gap: "clamp(20px, 4vw, 60px)",
        alignItems: "start",
      }}>
        <BlurIn>
          <span style={labelStyle}>Experience</span>
        </BlurIn>
        <BlurIn delay={0.06}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0 clamp(24px, 4vw, 60px)",
          }}>
            <div>{expA.map(s => <div key={s} style={listItemStyle}>{s}</div>)}</div>
            <div>{expB.map(s => <div key={s} style={listItemStyle}>{s}</div>)}</div>
          </div>
        </BlurIn>
      </div>
    </section>
  );
});

AboutSection.displayName = "AboutSection";
export default AboutSection;
