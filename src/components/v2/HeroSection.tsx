"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Project, SiteData } from "./types";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";
const FONT_KR = "'Noto Sans KR', 'JetBrains Mono', sans-serif";
const ACCENT = "#0524FF";

// Cards scattered across the entire hero — overlap both title and description
const SCATTER = [
  { left: "2vw",  top: "8vh",  w: "17vw", rotate: -5  },
  { left: "63vw", top: "3vh",  w: "23vw", rotate: 4   },
  { left: "76vw", top: "42vh", w: "16vw", rotate: -3  },
  { left: "1vw",  top: "52vh", w: "15vw", rotate: 7   },
  { left: "44vw", top: "50vh", w: "20vw", rotate: -5  },
  { left: "27vw", top: "5vh",  w: "18vw", rotate: 3   },
  { left: "81vw", top: "64vh", w: "14vw", rotate: -9  },
  { left: "13vw", top: "60vh", w: "21vw", rotate: 6   },
  { left: "37vw", top: "20vh", w: "16vw", rotate: -4  },
  { left: "55vw", top: "28vh", w: "17vw", rotate: 5   },
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

      {/* ── LAYER 1: Typography (title top + description bottom) ── */}
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
        {/* Big title */}
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

        {/* Large description text at bottom */}
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

      {/* ── LAYER 2: Floating draggable cards (on top of everything) ── */}
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
            transition={{ delay: 0.2 + i * 0.07, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              left: pos.left,
              top: pos.top,
              width: pos.w,
              minWidth: "100px",
              maxWidth: "300px",
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
