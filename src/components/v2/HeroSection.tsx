"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Project, SiteData } from "./types";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";
const FONT_KR = "'Noto Sans KR', 'JetBrains Mono', sans-serif";
const ACCENT = "#0524FF";

// Cards scattered across the hero — intentionally overlap with the title area
const SCATTER = [
  { left: "3vw",  top: "18vh", w: "18vw", rotate: -6  },
  { left: "60vw", top: "4vh",  w: "22vw", rotate: 4   },
  { left: "74vw", top: "38vh", w: "16vw", rotate: -3  },
  { left: "2vw",  top: "56vh", w: "14vw", rotate: 8   },
  { left: "46vw", top: "52vh", w: "19vw", rotate: -5  },
  { left: "28vw", top: "6vh",  w: "17vw", rotate: 3   },
  { left: "80vw", top: "60vh", w: "13vw", rotate: -9  },
  { left: "12vw", top: "62vh", w: "20vw", rotate: 7   },
  { left: "38vw", top: "22vh", w: "15vw", rotate: -4  },
  { left: "58vw", top: "30vh", w: "16vw", rotate: 6   },
];

interface HeroProps {
  projects: Project[];
  siteData: SiteData | null;
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (c: string | null) => void;
  onOpenProject: (p: Project) => void;
}

export default function HeroSection({
  projects, siteData, categories, activeCategory, onCategoryChange, onOpenProject,
}: HeroProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [zMap, setZMap] = useState<Record<number, number>>({});
  const zCounter = useRef(20);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const bringToFront = (id: number) => {
    zCounter.current += 1;
    setZMap(prev => ({ ...prev, [id]: zCounter.current }));
  };

  const title = siteData?.landingTitle || "Work Archive";
  const subtitle = siteData?.landingSubtitle || "2015–Present";
  const desc = siteData?.landingDescription || "";
  const allCats = ["All", ...categories];

  return (
    <section style={{
      position: "relative",
      width: "100%",
      height: "100vh",
      overflow: "hidden",
      background: "#0A0A0A",
    }}>

      {/* ── LAYER 1: Massive title (background) ── */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        padding: isMobile
          ? "clamp(64px, 12vh, 100px) clamp(16px, 4vw, 40px) 0"
          : "clamp(72px, 14vh, 120px) clamp(24px, 4vw, 56px) 0",
        zIndex: 1,
        pointerEvents: "none",
      }}>
        <motion.h1
          initial={{ filter: "blur(28px)", opacity: 0 }}
          animate={{ filter: "blur(0px)", opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: isMobile
              ? "clamp(52px, 16vw, 96px)"
              : "clamp(80px, 14.5vw, 220px)",
            letterSpacing: "-0.045em",
            lineHeight: 0.88,
            color: "#F0EDE8",
            margin: 0,
          }}
        >
          {title}
        </motion.h1>
      </div>

      {/* ── LAYER 2: Floating draggable cards (on top of title) ── */}
      {!isMobile && projects.slice(0, SCATTER.length).map((project, i) => {
        const pos = SCATTER[i % SCATTER.length];
        return (
          <motion.div
            key={project.id}
            drag
            dragMomentum={false}
            onDragStart={() => bringToFront(project.id)}
            initial={{ filter: "blur(20px)", opacity: 0, rotate: pos.rotate }}
            animate={{ filter: "blur(0px)", opacity: 1, rotate: pos.rotate }}
            transition={{ delay: 0.2 + i * 0.08, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              left: pos.left,
              top: pos.top,
              width: pos.w,
              minWidth: "100px",
              maxWidth: "280px",
              zIndex: zMap[project.id] ?? (10 + i),
              cursor: "grab",
              userSelect: "none",
            }}
          >
            <motion.div
              whileDrag={{ boxShadow: `0 0 0 1.5px ${ACCENT}, 0 16px 48px rgba(0,0,0,0.7)` }}
              style={{
                borderRadius: "2px",
                overflow: "hidden",
                boxShadow: "0 6px 28px rgba(0,0,0,0.55)",
              }}
            >
              <img
                src={project.img}
                alt={project.title}
                draggable={false}
                onClick={() => onOpenProject(project)}
                style={{ width: "100%", height: "auto", display: "block", cursor: "pointer" }}
              />
            </motion.div>

            {/* Hover label */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "5px 7px",
                background: "rgba(10,10,10,0.86)",
                fontFamily: FONT,
                fontWeight: 300,
                fontSize: "9px",
                letterSpacing: "0.04em",
                color: "rgba(240,237,232,0.65)",
                pointerEvents: "none",
              }}
            >
              {project.title}
            </motion.div>
          </motion.div>
        );
      })}

      {/* ── LAYER 3: Bottom info (subtitle + description) ── */}
      <div style={{
        position: "absolute",
        bottom: isMobile ? "72px" : "clamp(48px, 8vh, 80px)",
        left: isMobile ? "clamp(16px, 4vw, 32px)" : "clamp(24px, 4vw, 56px)",
        right: isMobile ? "clamp(16px, 4vw, 32px)" : "clamp(24px, 4vw, 56px)",
        zIndex: 2,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "flex-end",
        justifyContent: "space-between",
        gap: isMobile ? "12px" : "0",
        pointerEvents: "none",
      }}>
        <motion.span
          initial={{ filter: "blur(12px)", opacity: 0 }}
          animate={{ filter: "blur(0px)", opacity: 1 }}
          transition={{ delay: 0.2, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: "clamp(11px, 1.1vw, 14px)",
            letterSpacing: "0.16em",
            color: "rgba(240,237,232,0.3)",
          }}
        >
          {subtitle}
        </motion.span>

        <motion.p
          initial={{ filter: "blur(12px)", opacity: 0, y: 10 }}
          animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: FONT_KR,
            fontWeight: 300,
            fontSize: "clamp(11px, 0.82vw, 13px)",
            lineHeight: 1.85,
            color: "rgba(240,237,232,0.38)",
            maxWidth: isMobile ? "100%" : "380px",
            margin: 0,
            pointerEvents: "auto",
            wordBreak: "keep-all",
          }}
        >
          {desc}
        </motion.p>
      </div>

      {/* ── LAYER 4: Category filter (bottom) ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 1.0 }}
        style={{
          position: "absolute",
          bottom: isMobile ? "16px" : "clamp(16px, 2.5vh, 28px)",
          left: isMobile ? "clamp(16px, 4vw, 32px)" : "clamp(24px, 4vw, 56px)",
          right: isMobile ? "clamp(16px, 4vw, 32px)" : "clamp(24px, 4vw, 56px)",
          zIndex: 3,
          display: "flex",
          flexWrap: "wrap",
          gap: "clamp(10px, 1.6vw, 20px)",
          alignItems: "center",
        }}
      >
        {allCats.map(cat => {
          const isAll = cat === "All";
          const isActive = isAll ? activeCategory === null : activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(isAll ? null : cat)}
              style={{
                fontFamily: FONT,
                fontWeight: 300,
                fontSize: "10px",
                letterSpacing: "0.07em",
                color: isActive ? "#F0EDE8" : "rgba(240,237,232,0.22)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 0",
                transition: "color 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = "rgba(240,237,232,0.5)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = "rgba(240,237,232,0.22)"; }}
            >
              _{cat}
            </button>
          );
        })}
      </motion.div>

      {/* Mobile: show project thumbnails in a horizontal scroll strip */}
      {isMobile && projects.length > 0 && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          transform: "translateY(-50%)",
          zIndex: 5,
          display: "flex",
          gap: "10px",
          padding: "0 16px",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}>
          {projects.slice(0, 5).map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ filter: "blur(16px)", opacity: 0 }}
              animate={{ filter: "blur(0px)", opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 1.1 }}
              onClick={() => onOpenProject(project)}
              style={{
                flexShrink: 0,
                width: "140px",
                borderRadius: "2px",
                overflow: "hidden",
                cursor: "pointer",
              }}
            >
              <img src={project.img} alt={project.title} style={{ width: "100%", height: "auto", display: "block" }} />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
