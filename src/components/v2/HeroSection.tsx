"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Project, SiteData } from "./types";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";
const ACCENT = "#0524FF";

// 9 cards spread evenly across the full screen
// Between title (top ~7-20vh) and description (bottom ~72-90vh)
// Cards can overlap text up to 30%
const SCATTER = [
  { left: "2vw",  top: "22vh", w: "19vw", rotate: -5 },
  { left: "22vw", top: "15vh", w: "22vw", rotate:  4 },
  { left: "46vw", top: "20vh", w: "18vw", rotate: -2 },
  { left: "68vw", top: "13vh", w: "21vw", rotate:  6 },
  { left: "5vw",  top: "52vh", w: "20vw", rotate: -7 },
  { left: "28vw", top: "44vh", w: "18vw", rotate:  3 },
  { left: "50vw", top: "48vh", w: "22vw", rotate: -5 },
  { left: "72vw", top: "42vh", w: "19vw", rotate:  8 },
  { left: "16vw", top: "68vh", w: "20vw", rotate: -3 },
];

interface HeroProps {
  projects: Project[];
  siteData: SiteData | null;
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (c: string | null) => void;
  onOpenProject: (p: Project) => void;
}

function DraggableCard({
  project, pos, zIndex, delay, onDragStart, onOpen,
}: {
  project: Project;
  pos: typeof SCATTER[number];
  zIndex: number;
  delay: number;
  onDragStart: () => void;
  onOpen: (p: Project) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={onDragStart}
      initial={{ filter: "blur(24px)", opacity: 0, rotate: pos.rotate }}
      animate={{ filter: "blur(0px)", opacity: 1, rotate: pos.rotate }}
      transition={{ delay, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        position: "absolute",
        left: pos.left,
        top: pos.top,
        width: pos.w,
        minWidth: "100px",
        maxWidth: "360px",
        zIndex,
        cursor: "grab",
        userSelect: "none",
      }}
    >
      <motion.div
        whileDrag={{ boxShadow: `0 0 0 1.5px ${ACCENT}, 0 20px 56px rgba(0,0,0,0.35)` }}
        style={{
          position: "relative",
          borderRadius: "2px",
          overflow: "hidden",
          boxShadow: "0 6px 24px rgba(0,0,0,0.22)",
        }}
      >
        <img
          src={project.img}
          alt={project.title}
          draggable={false}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
        {/* + button top-right on hover */}
        <motion.button
          animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.75 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => { e.stopPropagation(); onOpen(project); }}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "rgba(10,10,10,0.8)",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "#fff",
            fontFamily: FONT,
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            pointerEvents: hovered ? "auto" : "none",
          }}
        >
          +
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export default function HeroSection({ projects, siteData, onOpenProject }: HeroProps) {
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
  const desc = siteData?.landingDescription || "";
  const heroProjects = projects.slice(0, 9);

  return (
    <section style={{
      position: "relative",
      width: "100%",
      height: "100vh",
      overflow: "hidden",
      background: "#F0F0F0",
    }}>

      {/* ── Typography layer ── */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: isMobile
          ? "clamp(56px, 10vh, 80px) clamp(16px, 4vw, 32px) clamp(36px, 6vh, 60px)"
          : "clamp(54px, 7vh, 66px) clamp(24px, 4vw, 56px) clamp(44px, 7vh, 72px)",
        zIndex: 1,
        pointerEvents: "none",
      }}>
        {/* Title — sized to fit one line */}
        <motion.h1
          initial={{ filter: "blur(28px)", opacity: 0 }}
          animate={{ filter: "blur(0px)", opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: FONT,
            fontWeight: 300,
            // calc fits "Work Archive" (~6.7em) within padded viewport
            fontSize: isMobile
              ? "clamp(44px, 14vw, 80px)"
              : "calc((100vw - clamp(48px, 8vw, 112px)) / 6.9)",
            letterSpacing: "-0.045em",
            wordSpacing: "-0.3em",
            lineHeight: 0.88,
            color: "#0A0A0A",
            margin: 0,
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </motion.h1>

        {/* Description — same font as title */}
        <motion.p
          initial={{ filter: "blur(18px)", opacity: 0 }}
          animate={{ filter: "blur(0px)", opacity: 1 }}
          transition={{ delay: 0.25, duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: isMobile ? "clamp(12px, 3.5vw, 20px)" : "clamp(16px, 2vw, 32px)",
            lineHeight: 1.4,
            letterSpacing: "-0.01em",
            color: "rgba(10,10,10,0.38)",
            margin: 0,
            maxWidth: isMobile ? "100%" : "76vw",
            wordBreak: "keep-all",
          }}
        >
          {desc}
        </motion.p>
      </div>

      {/* ── 9 draggable cards (desktop only) ── */}
      {!isMobile && heroProjects.map((project, i) => (
        <DraggableCard
          key={project.id}
          project={project}
          pos={SCATTER[i % SCATTER.length]}
          zIndex={zMap[project.id] ?? (10 + i)}
          delay={0.1 + i * 0.18}
          onDragStart={() => bringToFront(project.id)}
          onOpen={onOpenProject}
        />
      ))}
    </section>
  );
}
