"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";

interface HeaderProps {
  onViewAll: () => void;
  onAbout: () => void;
  onContact: () => void;
}

export default function Header({ onViewAll, onAbout, onContact }: HeaderProps) {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const onMove = (e: MouseEvent) => {
      if (e.clientY < 56) {
        clearTimeout(hideTimer.current);
        setVisible(true);
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [isMobile]);

  // Disappear immediately when mouse leaves header area
  const handleLeave = () => {
    if (isMobile) return;
    setVisible(false);
  };
  const handleEnter = () => clearTimeout(hideTimer.current);

  const show = isMobile || visible;

  return (
    <AnimatePresence>
      {show && (
        <motion.header
          key="header"
          initial={isMobile ? false : { y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 500,
            height: "52px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 clamp(20px, 4vw, 56px)",
            // Light acrylic with black outline
            background: "rgba(240,240,240,0.82)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(0,0,0,0.15)",
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
          }}
        >
          <span style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: "12px",
            letterSpacing: "0.06em",
            color: "#0A0A0A",
            userSelect: "none",
          }}>
            Jinyoung Hwang
          </span>

          <nav style={{ display: "flex", gap: "clamp(16px, 2.8vw, 40px)", alignItems: "center" }}>
            {[
              { label: "View all", action: onViewAll },
              { label: "About",    action: onAbout   },
              { label: "Contact",  action: onContact },
            ].map(({ label, action }) => (
              <button
                key={label}
                onClick={action}
                style={{
                  fontFamily: FONT,
                  fontWeight: 300,
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(0,0,0,0.4)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 0",
                  transition: "color 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#0A0A0A")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(0,0,0,0.4)")}
              >
                {label}
              </button>
            ))}
          </nav>
        </motion.header>
      )}
    </AnimatePresence>
  );
}
