"use client";
import { forwardRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SiteData, Lang } from "./types";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";

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
  lang?: Lang;
}

const AboutSection = forwardRef<HTMLElement, AboutProps>(({ siteData, lang = "ko" }, ref) => {
  const bio = (lang === "en" && siteData?.aboutBioEn?.length)
    ? siteData.aboutBioEn
    : siteData?.aboutBio ?? [];
  const services = siteData?.services ?? [];
  const experience = siteData?.experience ?? [];
  const awards = siteData?.awards ?? [];
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
        padding: "clamp(80px, 10vh, 140px) clamp(20px, 4vw, 56px) clamp(80px, 10vh, 140px)",
        background: "#F0F0F0",
        borderTop: "1px solid rgba(0,0,0,0.1)",
      }}
    >
      {/* Headline — full width, 80% of previous size */}
      <BlurIn>
        <h2 style={{
          fontFamily: FONT,
          fontWeight: 300,
          fontSize: "clamp(18px, 2.56vw, 35px)",
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
          color: "#0A0A0A",
          margin: isMobile ? "0 0 clamp(34px, 4.9vh, 62px) 0" : "0 0 clamp(48px, 7vh, 88px) 0",
          wordBreak: "keep-all",
        }}>
          {(siteData?.aboutHeadline ?? "Brand Designer at\nSHINSEGAE.").split("\n").map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
          ))}
        </h2>
      </BlurIn>

      {/* 7-column grid: col 1-3 = Bio, col 4-5 = gap, col 6 = Services, col 7 = Experience */}
      {/* Mobile: Bio full 7 cols, Services col 1-2, Experience col 3-4 (stacked below) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(8, 1fr)" : "repeat(7, 1fr)",
        rowGap: isMobile ? "clamp(34px, 4.9vh, 62px)" : "clamp(16px, 2vw, 32px)",
        columnGap: "clamp(16px, 2vw, 32px)",
        alignItems: "start",
      }}>
        {/* Bio — desktop: 1–3 / mobile: 1–8 (full) */}
        <div style={{ gridColumn: isMobile ? "1 / 9" : "1 / 4", display: "flex", flexDirection: "column", gap: "20px" }}>
          {bio.map((p, i) => (
            <BlurIn key={i} delay={i * 0.06}>
              <p style={{
                fontFamily: FONT,
                fontWeight: 300,
                fontSize: "clamp(15px, 1.3vw, 19px)",
                lineHeight: 1.8,
                color: "rgba(0,0,0,0.6)",
                margin: 0,
                wordBreak: "keep-all",
              }}>
                {p}
              </p>
            </BlurIn>
          ))}
        </div>

        {/* Columns 4–5: intentional gap — no content (desktop only) */}

        {/* Services — desktop: col 6 / mobile: col 1-3 */}
        <BlurIn delay={0.08} style={{ gridColumn: isMobile ? "1 / 4" : "6" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {services.map(s => (
              <div key={s} style={{
                fontFamily: FONT,
                fontWeight: 300,
                fontSize: "clamp(12px, 1.0vw, 15px)",
                letterSpacing: "0.02em",
                color: "rgba(0,0,0,0.55)",
                lineHeight: 2.0,
              }}>{s}</div>
            ))}
          </div>
        </BlurIn>

        {/* Experience — desktop: col 7 / mobile: col 4-6 */}
        <BlurIn delay={0.12} style={{ gridColumn: isMobile ? "4 / 7" : "7" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {experience.map(s => (
              <div key={s} style={{
                fontFamily: FONT,
                fontWeight: 300,
                fontSize: "clamp(12px, 1.0vw, 15px)",
                letterSpacing: "0.02em",
                color: "rgba(0,0,0,0.55)",
                lineHeight: 2.0,
              }}>{s}</div>
            ))}
          </div>
        </BlurIn>
      </div>

      {/* Awards — below grid, shown only when data exists */}
      {awards.length > 0 && (
        <BlurIn delay={0.06}>
          <div style={{
            marginTop: "clamp(48px, 7vh, 88px)",
            display: "flex",
            flexWrap: "wrap",
            gap: "0 clamp(24px, 4vw, 60px)",
          }}>
            {awards.map(a => (
              <div key={a} style={{
                fontFamily: FONT,
                fontWeight: 300,
                fontSize: "clamp(12px, 1.0vw, 15px)",
                letterSpacing: "0.02em",
                color: "rgba(0,0,0,0.55)",
                lineHeight: 2.0,
              }}>{a}</div>
            ))}
          </div>
        </BlurIn>
      )}
    </section>
  );
});

AboutSection.displayName = "AboutSection";
export default AboutSection;
