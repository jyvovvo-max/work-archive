"use client";
import { useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SiteData, Lang } from "./types";
import { GUTTER, GRID_GAP } from "./layout";

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

export default function Footer({ siteData, lang = "ko" }: { siteData: SiteData | null; lang?: Lang }) {
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

  const valueStyle: React.CSSProperties = {
    fontFamily: FONT, fontWeight: 300,
    fontSize: "13px",
    letterSpacing: "0.03em",
    color: "rgba(240,237,232,0.55)",
    lineHeight: 2.0,
  };
  const linkStyle: React.CSSProperties = {
    ...valueStyle, cursor: "pointer", textDecoration: "none", transition: "color 0.18s",
  };

  return (
    <footer style={{
      background: "#1A1A1A",
      borderTop: "1px solid rgba(240,237,232,0.06)",
      padding: `clamp(16px, 2vh, 28px) ${GUTTER} clamp(10px, 1.2vh, 16px)`,
    }}>
      {/* Headline */}
      <BlurIn>
        <div style={{ marginBottom: "clamp(38px, 5.6vh, 64px)" }}>
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            <span style={{
              fontFamily: FONT, fontWeight: 300,
              fontSize: "clamp(12px, 1.28vw, 16px)",
              letterSpacing: "0.01em", color: "#F0EDE8",
              whiteSpace: "pre-line",
            }}>
              {headline}
            </span>
          </span>
        </div>
      </BlurIn>

      {/* Info */}
      {isMobile ? (
        <BlurIn delay={0.06} style={{ marginBottom: "clamp(38px, 5.6vh, 64px)" }}>
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
                onMouseEnter={e => (e.currentTarget.style.color = "#F0EDE8")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,237,232,0.55)")}
              >
                {email}
              </a>
              <a
                href={igUrl}
                target="_blank"
                rel="noreferrer"
                style={linkStyle}
                onMouseEnter={e => (e.currentTarget.style.color = "#F0EDE8")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,237,232,0.55)")}
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
          marginBottom: "clamp(38px, 5.6vh, 64px)",
        }}>
          <BlurIn delay={0.06} style={{ gridColumn: "1" }}>
            <div style={valueStyle}>{location}</div>
          </BlurIn>
          <BlurIn delay={0.12} style={{ gridColumn: "2" }}>
            <a
              href={`mailto:${email}`}
              style={linkStyle}
              onMouseEnter={e => (e.currentTarget.style.color = "#F0EDE8")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,237,232,0.55)")}
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
              onMouseEnter={e => (e.currentTarget.style.color = "#F0EDE8")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,237,232,0.55)")}
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
        borderTop: "1px solid rgba(240,237,232,0.06)",
        paddingTop: "20px",
      }}>
        <span style={{
          fontFamily: FONT, fontWeight: 300,
          fontSize: "12px",
          letterSpacing: "0.04em", color: "rgba(240,237,232,0.4)",
        }}>
          {name}
        </span>
      </div>
    </footer>
  );
}
