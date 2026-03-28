"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Project, SiteData } from "./types";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";
const FONT_KR = "'Noto Sans KR', 'JetBrains Mono', sans-serif";
const ACCENT = "#0524FF";

// Centered stack — cards cluster around the screen center, 1.5x bigger
const SCATTER = [
  { left: "22vw", top: "16vh", w: "27vw", rotate: -6  },
  { left: "40vw", top: "8vh",  w: "32vw", rotate:  4  },
  { left: "50vw", top: "26vh", w: "25vw", rotate: -3  },
  { left: "18vw", top: "42vh", w: "22vw", rotate:  8  },
  { left: "44vw", top: "44vh", w: "28vw", rotate: -5  },
  { left: "30vw", top: "6vh",  w: "26vw", rotate:  3  },
  { left: "56vw", top: "32vh", w: "21vw", rotate: -9  },
  { left: "10vw", top: "50vh", w: "28vw", rotate:  7  },
  { left: "36vw", top: "24vh", w: "23vw", rotate: -4  },
  { left: "52vw", top: "12vh", w: "24vw", rotate:  5  },
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
  project,
  pos,
  zIndex,
  onDragStart,
  onOpen,
}: {
  project: Project;
  pos: typeof SCATTER[number];
  zIndex: number;
  onDragStart: () => void;
  onOpen: (p: Project) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={onDragStart}
      initial={{ filter: "blur(20px)", opacity: 0, rotate: pos.rotate }}
      animate={{ filter: "blur(0px)", opacity: 1, rotate: pos.rotate }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        position: "absolute",
        left: pos.left,
        top: pos.top,
        width: pos.w,
        minWidth: "140px",
        maxWidth: "480px",
        zIndex,
        cursor: "grab",
        userSelect: "none",
      }}
    >
      <motion.div
        whileDrag={{ boxShadow: `0 0 0 1.5px ${ACCENT}, 0 20px 56px rgba(0,0,0,0.75)` }}
        style={{
          position: "relative",
          borderRadius: "2px",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        }}
      >
        <img
          src={project.img}
          alt={project.title}
          draggable={false}
          style={{ width: "100%", height: "auto", display: "block" }}
        />

        {/* + button — top right on hover */}
        <motion.button
          animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.7 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => { e.stopPropagation(); onOpen(project); }}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            background: "rgba(10,10,10,0.88)",
            border: "1px solid rgba(240,237,232,0.35)",
            color: "#F0EDE8",
            fontFamily: FONT,
            fontSize: "18px",
            lineHeight: 1,
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

export default function HeroSection({
  projects, siteData, onOpenProject,
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
  const desc = siteData?.landingDescription || "";

  return (
    <section style={{
      position: "relative",
      width: "100%",
      height: "100vh",
      overflow: "hidden",
      background: "#0A0A0A",
    }}>

      {/* ── LAYER 1: Typography ── */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: isMobile
          ? "clamp(56px, 11vh, 90px) clamp(16px, 4vw, 32px) clamp(40px, 7vh, 72px)"
          : "clamp(64px, 11vh, 110px) clamp(24px, 4vw, 56px) clamp(48px, 8vh, 88px)",
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
              ? "clamp(52px, 17vw, 100px)"
              : "clamp(96px, 17.5vw, 300px)",
            letterSpacing: "-0.045em",
            lineHeight: 0.88,
            color: "#F0EDE8",
            margin: 0,
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ filter: "blur(18px)", opacity: 0 }}
          animate={{ filter: "blur(0px)", opacity: 1 }}
          transition={{ delay: 0.25, duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: FONT_KR,
            fontWeight: 300,
            fontSize: isMobile
              ? "clamp(15px, 4.5vw, 26px)"
              : "clamp(22px, 3.2vw, 48px)",
            lineHeight: 1.35,
            color: "rgba(240,237,232,0.32)",
            margin: 0,
            maxWidth: isMobile ? "100%" : "80vw",
            wordBreak: "keep-all",
          }}
        >
          {desc}
        </motion.p>
      </div>

      {/* ── LAYER 2: Draggable cards (centered stack) ── */}
      {!isMobile && projects.slice(0, SCATTER.length).map((project, i) => {
        const pos = SCATTER[i % SCATTER.length];
        return (
          <DraggableCard
            key={project.id}
            project={project}
            pos={pos}
            zIndex={zMap[project.id] ?? (10 + i)}
            onDragStart={() => bringToFront(project.id)}
            onOpen={onOpenProject}
          />
        );
      })}

      {/* Mobile: horizontal scroll strip */}
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
