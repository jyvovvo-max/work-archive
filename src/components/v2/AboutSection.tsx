"use client";
import { forwardRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SiteData, Lang } from "./types";
import { GUTTER, GRID_GAP, SPACE_A, SPACE_B, FONT_SECTION_TITLE, FONT_HEADLINE, FONT_BODY, FONT_LIST, FONT_LABEL } from "./layout";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";

function HoverIn({
  children,
  delay = 0,
  style,
  ready = true,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
  ready?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  const show = ready && inView;
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={show
        ? { opacity: 1, y: 0 }
        : { opacity: 0, y: 14 }
      }
      transition={{ duration: 0.7, delay: show ? delay : 0, ease: [0.16, 1, 0.3, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

interface AboutProps {
  siteData: SiteData | null;
  lang?: Lang;
  skipAnimation?: boolean;
  ready?: boolean;
}

const AboutSection = forwardRef<HTMLElement, AboutProps>(({ siteData, lang = "ko", skipAnimation = false, ready = true }, ref) => {
  const bioKo = siteData?.aboutBio ?? [];
  const bioEn = siteData?.aboutBioEn ?? [];
  const services = siteData?.services ?? [];
  const experience = siteData?.experience ?? [];
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <section
      ref={ref}
      style={{
        background: "#F0F0F0",
        borderTop: "1px solid rgba(0,0,0,0.1)",
      }}
    >
      {/* "About" label bar */}
      <HoverIn ready={ready} delay={0}>
        <div style={{
          height: "52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: `0 ${GUTTER}`,
          borderBottom: "1px solid rgba(0,0,0,0.15)",
        }}>
          <span style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: FONT_SECTION_TITLE,
            letterSpacing: "-0.02em",
            color: "#0A0A0A",
          }}>
            About
          </span>
        </div>
      </HoverIn>

      <div style={{ padding: `${SPACE_A} ${GUTTER} ${SPACE_B}` }}>
      {/* Headline */}
      <HoverIn ready={ready} delay={0.05}>
        <h2 style={{
          fontFamily: FONT,
          fontWeight: 300,
          fontSize: FONT_HEADLINE,
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
          color: "#0A0A0A",
          margin: `0 0 ${SPACE_A} 0`,
          wordBreak: "keep-all",
        }}>
          {(siteData?.aboutHeadline ?? "Brand Designer at\nSHINSEGAE.").split("\n").map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
          ))}
        </h2>
      </HoverIn>

      {/* 7-column grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(8, 1fr)" : "repeat(7, 1fr)",
        rowGap: isMobile ? "clamp(34px, 4.9vh, 62px)" : "clamp(16px, 2vw, 32px)",
        columnGap: GRID_GAP,
        alignItems: "start",
      }}>
        {/* Bio */}
        <div style={{ gridColumn: isMobile ? "1 / 9" : "1 / 5", display: "flex", flexDirection: "column", gap: "20px" }}>
          {bioKo.map((p, i) => (
            <HoverIn key={`ko-${i}`} delay={0.1 + i * 0.06} ready={ready}>
              <p style={{
                fontFamily: FONT,
                fontWeight: 300,
                fontSize: FONT_BODY,
                lineHeight: 1.8,
                color: "rgba(0,0,0,0.6)",
                margin: 0,
                wordBreak: "keep-all",
              }}>
                {p}
              </p>
            </HoverIn>
          ))}
          {bioEn.map((p, i) => (
            <HoverIn key={`en-${i}`} delay={0.1 + (bioKo.length + i) * 0.06} ready={ready}>
              <p style={{
                fontFamily: FONT,
                fontWeight: 300,
                fontSize: FONT_BODY,
                lineHeight: 1.8,
                color: "rgba(0,0,0,0.6)",
                margin: 0,
              }}>
                {p}
              </p>
            </HoverIn>
          ))}
        </div>

        {/* Services */}
        <HoverIn delay={0.18} ready={ready} style={{ gridColumn: isMobile ? "1 / 4" : "6" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{
              fontFamily: FONT,
              fontWeight: 400,
              fontSize: FONT_LABEL,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: "rgba(0,0,0,0.35)",
              marginBottom: "12px",
            }}>Services</div>
            {services.map(s => (
              <div key={s} style={{
                fontFamily: FONT,
                fontWeight: 300,
                fontSize: FONT_LIST,
                letterSpacing: "0.02em",
                color: "rgba(0,0,0,0.55)",
                lineHeight: 2.0,
              }}>{s}</div>
            ))}
          </div>
        </HoverIn>

        {/* Experience */}
        <HoverIn delay={0.22} ready={ready} style={{ gridColumn: isMobile ? "4 / 7" : "7" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{
              fontFamily: FONT,
              fontWeight: 400,
              fontSize: FONT_LABEL,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: "rgba(0,0,0,0.35)",
              marginBottom: "12px",
            }}>Experience</div>
            {experience.map(s => (
              <div key={s} style={{
                fontFamily: FONT,
                fontWeight: 300,
                fontSize: FONT_LIST,
                letterSpacing: "0.02em",
                color: "rgba(0,0,0,0.55)",
                lineHeight: 2.0,
              }}>{s}</div>
            ))}
          </div>
        </HoverIn>
      </div>

      </div>
    </section>
  );
});

AboutSection.displayName = "AboutSection";
export default AboutSection;
