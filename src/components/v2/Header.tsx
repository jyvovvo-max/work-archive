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
      if (e.clientY < 72) {
        clearTimeout(hideTimer.current);
        setVisible(true);
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [isMobile]);

  const handleLeave = () => {
    if (isMobile) return;
    hideTimer.current = setTimeout(() => setVisible(false), 250);
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
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
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
            background: "rgba(10,10,10,0.72)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderBottom: "1px solid rgba(240,237,232,0.07)",
          }}
        >
          {/* Name */}
          <span style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: "12px",
            letterSpacing: "0.06em",
            color: "#F0EDE8",
            userSelect: "none",
          }}>
            Jinyoung Hwang
          </span>

          {/* Nav */}
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
                  color: "rgba(240,237,232,0.45)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 0",
                  transition: "color 0.18s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#F0EDE8")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,237,232,0.45)")}
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
