"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";

interface HeaderProps {
  onHome: () => void;
  onViewAll: () => void;
  onAbout: () => void;
  onContact: () => void;
  onBack?: () => void;
  zIndex?: number;
  alwaysVisible?: boolean;  // true = stays visible, no hover-reveal needed
}

export default function Header({
  onHome, onViewAll, onAbout, onContact, onBack, zIndex = 500, alwaysVisible = false,
}: HeaderProps) {
  const [visible, setVisible] = useState(alwaysVisible);
  const [isMobile, setIsMobile] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const suppressRef = useRef(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Reset visibility when alwaysVisible changes
  useEffect(() => {
    if (alwaysVisible) setVisible(true);
  }, [alwaysVisible]);

  useEffect(() => {
    if (isMobile || alwaysVisible) return;
    const onMove = (e: MouseEvent) => {
      if (e.clientY < 52 && !suppressRef.current) {
        clearTimeout(hideTimer.current);
        setVisible(true);
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [isMobile, alwaysVisible]);

  const handleLeave = () => {
    if (isMobile || alwaysVisible) return;
    suppressRef.current = true;
    setVisible(false);
    hideTimer.current = setTimeout(() => { suppressRef.current = false; }, 500);
  };

  const handleEnter = () => {
    if (alwaysVisible) return;
    clearTimeout(hideTimer.current);
    suppressRef.current = false;
  };

  // Brief reveal on mount when onBack is set (detail view context)
  useEffect(() => {
    if (!onBack || isMobile || alwaysVisible) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(t);
  }, [onBack, isMobile, alwaysVisible]);

  const show = isMobile || visible;

  // Dark theme when in detail view (onBack + dark zIndex)
  const isDark = !!onBack && zIndex >= 600;
  // More transparent backgrounds with stronger blur
  const bg      = isDark ? "rgba(6,6,6,0.58)"        : "rgba(240,240,240,0.48)";
  const border  = isDark ? "rgba(240,237,232,0.10)"   : "rgba(0,0,0,0.12)";
  const nameColor  = isDark ? "rgba(240,237,232,0.60)" : "rgba(10,10,10,0.75)";
  const navColor   = isDark ? "rgba(240,237,232,0.38)" : "rgba(0,0,0,0.38)";
  const navHover   = isDark ? "#F0EDE8"                : "#0A0A0A";
  const arrowColor = isDark ? "#F0EDE8"                : "#0A0A0A";
  const arrowBg    = isDark ? "rgba(240,237,232,0.07)" : "rgba(0,0,0,0.04)";
  const arrowBorder= isDark ? "rgba(240,237,232,0.10)" : "rgba(0,0,0,0.12)";

  return (
    <AnimatePresence>
      {show && (
        <motion.header
          key="header"
          initial={isMobile ? false : { y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={alwaysVisible ? undefined : { y: -60, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0,
            zIndex,
            height: "52px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: bg,
            backdropFilter: "blur(36px) saturate(180%)",
            WebkitBackdropFilter: "blur(36px) saturate(180%)",
            border: `1px solid ${border}`,
            borderTop: "none",
            borderRadius: 0,
            padding: onBack ? "0" : "0 clamp(20px, 4vw, 56px)",
          }}
        >
          {/* Left: optional back arrow + site name */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {onBack && (
              <button
                onClick={onBack}
                style={{
                  width: "52px", height: "52px",
                  flexShrink: 0,
                  border: "none",
                  borderRight: `1px solid ${arrowBorder}`,
                  background: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = arrowBg)}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                  <line x1="8" y1="2" x2="2" y2="8" stroke={arrowColor} strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="2" y1="8" x2="8" y2="14" stroke={arrowColor} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
            <span
              onClick={onHome}
              style={{
                fontFamily: FONT,
                fontWeight: 300,
                fontSize: "12px",
                letterSpacing: "0.06em",
                color: nameColor,
                userSelect: "none",
                cursor: "pointer",
                paddingLeft: onBack ? "clamp(16px, 2vw, 28px)" : "0",
              }}
            >
              Jinyoung Hwang
            </span>
          </div>

          {/* Right nav */}
          <nav style={{
            display: "flex",
            gap: "clamp(16px, 2.8vw, 40px)",
            alignItems: "center",
            paddingRight: onBack ? "clamp(20px, 4vw, 56px)" : "0",
          }}>
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
                  color: navColor,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 0",
                  transition: "color 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = navHover)}
                onMouseLeave={e => (e.currentTarget.style.color = navColor)}
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
