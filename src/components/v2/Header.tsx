"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SiteData, Lang } from "./types";
import { GUTTER, RIGHT_OPT_PILL } from "./layout";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";

interface HeaderProps {
  onHome: () => void;
  onViewAll: () => void;
  onAbout: () => void;
  onContact: () => void;
  dark?: boolean;
  zIndex?: number;
  alwaysVisible?: boolean;
  siteData?: SiteData | null;
  lang?: Lang;
}

export default function Header({
  onHome, onViewAll, onAbout, onContact, dark = false, zIndex = 500, alwaysVisible = false, siteData,
  lang = "ko",
}: HeaderProps) {
  const siteName = siteData?.siteName || "Jinyoung Hwang";
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

  const show = isMobile || visible;

  const bg      = dark ? "rgba(6,6,6,0.58)"        : "rgba(240,240,240,0.48)";
  const border  = dark ? "rgba(240,237,232,0.10)"   : "rgba(0,0,0,0.12)";
  const nameColor  = dark ? "rgba(240,237,232,0.60)" : "rgba(10,10,10,0.75)";
  const navColor   = dark ? "rgba(240,237,232,0.38)" : "rgba(0,0,0,0.38)";
  const navHover   = dark ? "#F0EDE8"                : "#0A0A0A";

  return (
    <AnimatePresence>
      {show && (
        <motion.header
          key="header"
          initial={isMobile || alwaysVisible ? false : { y: -60, opacity: 0 }}
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
            padding: `0 ${GUTTER}`,
          }}
        >
          {/* Left: site name */}
          <span
            onClick={onHome}
            style={{
              fontFamily: FONT,
              fontWeight: 300,
              fontSize: "clamp(12px, 1.7vw, 25px)",
              letterSpacing: "-0.01em",
              color: nameColor,
              userSelect: "none",
              cursor: "pointer",
            }}
          >
            {siteName}
          </span>

          {/* Right nav */}
          <nav style={{
            display: "flex",
            gap: "clamp(16px, 2.8vw, 40px)",
            alignItems: "center",
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
                  fontSize: "clamp(12px, 1.7vw, 25px)",
                  letterSpacing: "0.01em",
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
