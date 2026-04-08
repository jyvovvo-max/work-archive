"use client";
import { useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SiteData, Lang } from "./types";
import { GUTTER, GRID_GAP, SPACE_C, SPACE_D } from "./layout";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";

function BlurIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });
  return (
    <motion.div
      ref={ref}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

interface OverrideColors { bg: string; text: string; textHover: string; border: string; }

export default function Footer({ siteData, lang = "ko", overrideColors }: { siteData: SiteData | null; lang?: Lang; overrideColors?: OverrideColors }) {
  const headline = (lang === "en" && siteData?.footerHeadlineEn)
    ? siteData.footerHeadlineEn
    : siteData?.footerHeadline ?? "I would love to hear from you!";
  const location = siteData?.footerLocation ?? "Korea";
  const email = siteData?.footerEmail ?? "";
  const igHandle = siteData?.footerInstagramHandle ?? "";
  const igUrl = siteData?.footerInstagramUrl ?? "";
  const name = siteData?.footerName ?? "";

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString("ko-KR", {
        timeZone: "Asia/Seoul",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
      }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const textColor = overrideColors?.text ?? "rgba(0,0,0,0.6)";
  const textHover = overrideColors?.textHover ?? "#0A0A0A";
  const valueStyle: React.CSSProperties = {
    fontFamily: FONT, fontWeight: 300,
    fontSize: "13px",
    letterSpacing: "0.03em",
    color: textColor,
    lineHeight: 2.0,
  };
  const linkStyle: React.CSSProperties = {
    ...valueStyle, cursor: "pointer", textDecoration: "none", transition: "color 0.18s",
  };

  return (
    <footer style={{
      background: overrideColors?.bg ?? "#F0F0F0",
      borderTop: `1px solid ${overrideColors?.border ?? "rgba(0,0,0,0.08)"}`,
      padding: `${isMobile ? "clamp(16px, 2vh, 28px)" : "clamp(8px, 1vh, 14px)"} ${GUTTER} ${isMobile ? "clamp(10px, 1.2vh, 16px)" : "clamp(5px, 0.6vh, 8px)"}`,
    }}>
      {/* Headline */}
      <BlurIn>
        <div style={{ marginBottom: SPACE_C }}>
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            <span style={{
              fontFamily: FONT, fontWeight: 300,
              fontSize: "clamp(12px, 1.28vw, 16px)",
              letterSpacing: "0.01em", color: overrideColors ? "#F0EDE8" : "#0A0A0A",
              whiteSpace: "pre-line",
            }}>
              {headline}
            </span>
          </span>
        </div>
      </BlurIn>

      {/* Info */}
      {isMobile ? (
        <BlurIn delay={0.06} style={{ marginBottom: SPACE_D }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            columnGap: GRID_GAP,
          }}>
            <div style={{ gridColumn: "1 / 4", display: "flex", flexDirection: "column" }}>
              <div style={valueStyle}>{location}</div>
              <a
                href={`mailto:${email}`}
                style={linkStyle}
                onMouseEnter={e => (e.currentTarget.style.color = textHover)}
                onMouseLeave={e => (e.currentTarget.style.color = textColor)}
              >
                {email}
              </a>
              <a
                href={igUrl}
                target="_blank"
                rel="noreferrer"
                style={linkStyle}
                onMouseEnter={e => (e.currentTarget.style.color = textHover)}
                onMouseLeave={e => (e.currentTarget.style.color = textColor)}
              >
                {igHandle}
              </a>
              {/* Clock — below instagram on mobile */}
              <div style={valueStyle}>KST, {time}</div>
            </div>
          </div>
        </BlurIn>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          columnGap: "clamp(16px, 2vw, 32px)",
          marginBottom: SPACE_C,
        }}>
          <BlurIn delay={0.06} style={{ gridColumn: "1" }}>
            <div style={valueStyle}>{location}</div>
          </BlurIn>
          <BlurIn delay={0.12} style={{ gridColumn: "2" }}>
            <a
              href={`mailto:${email}`}
              style={linkStyle}
              onMouseEnter={e => (e.currentTarget.style.color = textHover)}
              onMouseLeave={e => (e.currentTarget.style.color = textColor)}
            >
              {email}
            </a>
          </BlurIn>
          <BlurIn delay={0.18} style={{ gridColumn: "3" }}>
            <a
              href={igUrl}
              target="_blank"
              rel="noreferrer"
              style={linkStyle}
              onMouseEnter={e => (e.currentTarget.style.color = textHover)}
              onMouseLeave={e => (e.currentTarget.style.color = textColor)}
            >
              {igHandle}
            </a>
          </BlurIn>
          {/* Clock — rightmost column on desktop, right-aligned */}
          <BlurIn delay={0.24} style={{ gridColumn: "7", display: "flex", justifyContent: "flex-end" }}>
            <div style={valueStyle}>KST, {time}</div>
          </BlurIn>
        </div>
      )}

      {/* Bottom bar — always visible */}
      <div style={{
        borderTop: `1px solid ${overrideColors?.border ?? "rgba(0,0,0,0.08)"}`,
        paddingTop: SPACE_C,
        paddingBottom: SPACE_C,
      }}>
        <span style={{
          fontFamily: FONT, fontWeight: 300,
          fontSize: "12px",
          letterSpacing: "0.04em", color: overrideColors ? "rgba(240,237,232,0.35)" : "rgba(0,0,0,0.45)",
        }}>
          {name}
        </span>
      </div>
    </footer>
  );
}
