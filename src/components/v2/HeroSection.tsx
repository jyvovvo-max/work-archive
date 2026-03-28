"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Project, SiteData } from "./types";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";
const ACCENT = "#0524FF";

// 10 cards — dense horizontal-rectangle cluster, 1.15x of previous sizes
const SCATTER = [
  { left: "18vw", top: "22vh", w: "23vw", rotate: -5 },
  { left: "33vw", top: "14vh", w: "25vw", rotate:  4 },
  { left: "52vw", top: "18vh", w: "21vw", rotate: -3 },
  { left: "66vw", top: "22vh", w: "24vw", rotate:  6 },
  { left: "22vw", top: "42vh", w: "22vw", rotate:  7 },
  { left: "40vw", top: "38vh", w: "25vw", rotate: -6 },
  { left: "60vw", top: "36vh", w: "23vw", rotate:  3 },
  { left: "28vw", top: "56vh", w: "24vw", rotate: -4 },
  { left: "50vw", top: "54vh", w: "21vw", rotate:  5 },
  { left: "67vw", top: "50vh", w: "22vw", rotate: -2 },
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
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      initial={{ opacity: 0, rotate: pos.rotate }}
      animate={{ opacity: 1, rotate: pos.rotate }}
      transition={{ delay, duration: 0.3, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: pos.left,
        top: pos.top,
        width: pos.w,
        minWidth: "100px",
        maxWidth: "400px",
        zIndex,
        cursor: "grab",
        userSelect: "none",
      }}
    >
      <motion.div
        whileDrag={{ boxShadow: `0 0 0 1.5px ${ACCENT}, 0 16px 40px rgba(0,0,0,0.25)` }}
        style={{
          position: "relative",
          borderRadius: "2px",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
          isolation: "isolate",
        }}
      >
        <motion.img
          src={project.img}
          alt={project.title}
          draggable={false}
          initial={{ filter: "blur(20px)", opacity: 0 }}
          animate={{ filter: "blur(0px)", opacity: 1 }}
          transition={{ delay, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: "100%", height: "auto", display: "block" }}
        />

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
            background: "rgba(240,240,240,0.88)",
            border: "1px solid rgba(0,0,0,0.2)",
            color: "#0A0A0A",
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
  const heroProjects = projects.slice(0, 10);

  const hPad = isMobile ? "clamp(16px, 4vw, 32px)" : "clamp(24px, 4vw, 56px)";

  return (
    <section style={{
      position: "relative",
      width: "100%",
      height: "100vh",
      overflow: "hidden",
      background: "#F0F0F0",
    }}>
      {/* Title */}
      <div style={{
        position: "absolute",
        top: isMobile ? "clamp(56px, 10vh, 80px)" : "clamp(54px, 7vh, 66px)",
        left: hPad,
        right: hPad,
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
      </div>

      {/* Description */}
      <div style={{
        position: "absolute",
        bottom: isMobile ? "clamp(36px, 6vh, 60px)" : "clamp(44px, 7vh, 72px)",
        left: hPad,
        right: hPad,
        zIndex: 1,
        pointerEvents: "none",
      }}>
        <motion.p
          initial={{ filter: "blur(18px)", opacity: 0 }}
          animate={{ filter: "blur(0px)", opacity: 1 }}
          transition={{ delay: 0.25, duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: isMobile ? "clamp(12px, 3.5vw, 20px)" : "clamp(14px, 1.8vw, 28px)",
            lineHeight: 1.45,
            letterSpacing: "-0.01em",
            color: "rgba(10,10,10,0.38)",
            margin: 0,
            wordBreak: "keep-all",
          }}
        >
          {desc}
        </motion.p>
      </div>

      {/* 10 draggable cards (desktop) */}
      {!isMobile && heroProjects.map((project, i) => (
        <DraggableCard
          key={project.id}
          project={project}
          pos={SCATTER[i % SCATTER.length]}
          zIndex={zMap[project.id] ?? (10 + i)}
          delay={0.05 + i * 0.14}
          onDragStart={() => bringToFront(project.id)}
          onOpen={onOpenProject}
        />
      ))}
    </section>
  );
}
