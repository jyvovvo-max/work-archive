"use client";
import { useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

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

export default function Footer() {
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

  const labelStyle: React.CSSProperties = {
    fontFamily: FONT,
    fontWeight: 300,
    fontSize: "10px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(240,237,232,0.28)",
    marginBottom: "20px",
    display: "block",
  };

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
      background: "#050505",
      borderTop: "1px solid rgba(240,237,232,0.06)",
      padding: "clamp(56px, 7vh, 96px) clamp(20px, 4vw, 56px) clamp(32px, 4vh, 56px)",
    }}>
      {/* Headline */}
      <BlurIn>
        <div style={{ marginBottom: "clamp(48px, 7vh, 80px)" }}>
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
              fontSize: "clamp(14px, 1.6vw, 20px)",
              letterSpacing: "0.01em",
              color: "#F0EDE8",
            }}>
              I would love to hear from you!
            </span>
          </span>
        </div>
      </BlurIn>

      {/* Three columns */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "clamp(32px, 4vw, 60px)",
        marginBottom: "clamp(48px, 7vh, 80px)",
      }}>
        {/* Visit */}
        <BlurIn delay={0.06}>
          <span style={labelStyle}>Visit;</span>
          <div style={valueStyle}>Korea</div>
        </BlurIn>

        {/* Say hello */}
        <BlurIn delay={0.12}>
          <span style={labelStyle}>Say hello;</span>
          <div>
            <a
              href="mailto:jyvovvo@gmail.com"
              style={linkStyle}
              onMouseEnter={e => (e.currentTarget.style.color = "#F0EDE8")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,237,232,0.55)")}
            >
              → jyvovvo@gmail.com
            </a>
          </div>
        </BlurIn>

        {/* Follow */}
        <BlurIn delay={0.18}>
          <span style={labelStyle}>Follow me;</span>
          <div>
            <a
              href="https://instagram.com/jyvovvo"
              target="_blank"
              rel="noreferrer"
              style={linkStyle}
              onMouseEnter={e => (e.currentTarget.style.color = "#F0EDE8")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,237,232,0.55)")}
            >
              ↗ @jyvovvo
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
            Jinyoung Hwang.
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
