"use client";
import { useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { SiteData } from "./types";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";

function BlurIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });
  return (
    <motion.div
      ref={ref}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Footer({ siteData }: { siteData: SiteData | null }) {
  const headline = siteData?.footerHeadline ?? "I would love to hear from you!";
  const location = siteData?.footerLocation ?? "Korea";
  const email = siteData?.footerEmail ?? "";
  const igHandle = siteData?.footerInstagramHandle ?? "";
  const igUrl = siteData?.footerInstagramUrl ?? "";
  const name = siteData?.footerName ?? "";

  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString("ko-KR", {
          timeZone: "Asia/Seoul",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const valueStyle: React.CSSProperties = {
    fontFamily: FONT,
    fontWeight: 300,
    fontSize: "12px",
    letterSpacing: "0.03em",
    color: "rgba(240,237,232,0.55)",
    lineHeight: 2.0,
  };

  const linkStyle: React.CSSProperties = {
    ...valueStyle,
    cursor: "pointer",
    textDecoration: "none",
    transition: "color 0.18s",
  };

  return (
    <footer style={{
      background: "#1A1A1A",
      borderTop: "1px solid rgba(240,237,232,0.06)",
      padding: "clamp(20px, 2.5vh, 35px) clamp(18px, 3.6vw, 50px) clamp(12px, 1.5vh, 20px)",
    }}>
      {/* Headline */}
      <BlurIn>
        <div style={{ marginBottom: "clamp(38px, 5.6vh, 64px)" }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
          }}>
            <span style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#F0EDE8",
              display: "inline-block",
              flexShrink: 0,
            }} />
            <span style={{
              fontFamily: FONT,
              fontWeight: 300,
              fontSize: "clamp(13px, 1.44vw, 18px)",
              letterSpacing: "0.01em",
              color: "#F0EDE8",
            }}>
              {headline}
            </span>
          </span>
        </div>
      </BlurIn>

      {/* Three columns — labels removed */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "clamp(32px, 4vw, 60px)",
        marginBottom: "clamp(38px, 5.6vh, 64px)",
      }}>
        <BlurIn delay={0.06}>
          <div style={valueStyle}>{location}</div>
        </BlurIn>

        <BlurIn delay={0.12}>
          <div>
            <a
              href={`mailto:${email}`}
              style={linkStyle}
              onMouseEnter={e => (e.currentTarget.style.color = "#F0EDE8")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,237,232,0.55)")}
            >
              → {email}
            </a>
          </div>
        </BlurIn>

        <BlurIn delay={0.18}>
          <div>
            <a
              href={igUrl}
              target="_blank"
              rel="noreferrer"
              style={linkStyle}
              onMouseEnter={e => (e.currentTarget.style.color = "#F0EDE8")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,237,232,0.55)")}
            >
              ↗ {igHandle}
            </a>
          </div>
        </BlurIn>
      </div>

      {/* Bottom bar */}
      <BlurIn delay={0.22}>
        <div style={{
          borderTop: "1px solid rgba(240,237,232,0.06)",
          paddingTop: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
        }}>
          <span style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: "13px",
            letterSpacing: "0.04em",
            color: "rgba(240,237,232,0.4)",
          }}>
            {name}
          </span>
          <span style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: "11px",
            letterSpacing: "0.08em",
            color: "rgba(240,237,232,0.2)",
          }}>
            KOR, {time}
          </span>
        </div>
      </BlurIn>
    </footer>
  );
}
