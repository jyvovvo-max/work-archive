"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Project, SiteData } from "./types";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";
const ACCENT = "#0524FF";

type ScatterPos = { left: string; top: string; w: string; rotate: number };

// ── Layout: 3 rows (3 + 4 + 3 = 10 cards), random variation per refresh ──
// Base positions keep adjacent-card overlap ≤ 30%.
// Random offset is bounded so the constraint isn't violated.
function generateRow(
  baseXs: number[],
  baseY: number,
  wBase: number,
): ScatterPos[] {
  return baseXs.map(bx => ({
    left: `${Math.max(1, bx + (Math.random() - 0.5) * 5)}vw`,
    top:  `${Math.max(8, baseY + (Math.random() - 0.5) * 7)}vh`,
    w:    `${Math.max(14, wBase + (Math.random() - 0.5) * 4)}vw`,
    rotate: (Math.random() - 0.5) * 14,
  }));
}

function makeScatter(): ScatterPos[] {
  return [
    // Row 1 (top, 3 cards) — Y ≈ 12vh, covers title-overlap zone
    ...generateRow([5, 30, 57], 12, 22),
    // Row 2 (middle, 4 cards) — Y ≈ 34vh
    ...generateRow([3, 25, 46, 67], 34, 19),
    // Row 3 (bottom, 3 cards) — Y ≈ 54vh
    ...generateRow([8, 36, 61], 54, 21),
  ];
}

interface HeroProps {
  projects: Project[];
  siteData: SiteData | null;
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (c: string | null) => void;
  onOpenProject: (p: Project) => void;
}

function DraggableCard({
  project, pos, zIndex, idx, onDragStart, onOpen,
}: {
  project: Project;
  pos: ScatterPos;
  zIndex: number;
  idx: number;
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
      // 툭툭툭: NO blur, just sharp opacity snap with stagger
      initial={{ opacity: 0, rotate: pos.rotate }}
      animate={{ opacity: 1, rotate: pos.rotate }}
      transition={{ delay: 0.3 + idx * 0.1, duration: 0.12, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: pos.left,
        top: pos.top,
        width: pos.w,
        minWidth: "100px",
        maxWidth: "420px",
        zIndex,
        cursor: "grab",
        userSelect: "none",
      }}
    >
      <motion.div
        whileDrag={{ boxShadow: `0 0 0 1.5px ${ACCENT}, 0 16px 40px rgba(0,0,0,0.2)` }}
        style={{
          position: "relative",
          borderRadius: "2px",
          overflow: "hidden",
          boxShadow: "0 4px 18px rgba(0,0,0,0.16)",
          isolation: "isolate",
        }}
      >
        {/* Image — no blur animation (툭) */}
        <img
          src={project.img}
          alt={project.title}
          draggable={false}
          style={{ width: "100%", height: "auto", display: "block" }}
        />

        {/* + button on hover */}
        <motion.button
          animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.75 }}
          transition={{ duration: 0.14 }}
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

// Word-by-word slide-up reveal for description text
function SlideUpText({ text, startDelay = 0.8, fontStyle }: {
  text: string;
  startDelay?: number;
  fontStyle: React.CSSProperties;
}) {
  const words = text.split(" ");
  return (
    <p style={{ ...fontStyle, margin: 0, lineHeight: 1.5 }}>
      {words.map((word, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            overflow: "hidden",
            verticalAlign: "bottom",
            marginRight: "0.28em",
          }}
        >
          <motion.span
            style={{ display: "inline-block" }}
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{
              delay: startDelay + i * 0.045,
              duration: 0.55,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </p>
  );
}

export default function HeroSection({ projects, siteData, onOpenProject }: HeroProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [zMap, setZMap] = useState<Record<number, number>>({});
  const zCounter = useRef(20);
  // Fresh random layout on every page mount/refresh
  const [scatter] = useState<ScatterPos[]>(makeScatter);

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
  const desc  = siteData?.landingDescription || "";
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

      {/* ── Title: blur-to-clean ── */}
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

        {/* Mobile: description immediately after title, no gap */}
        {isMobile && desc && (
          <div style={{ marginTop: "8px" }}>
            <SlideUpText
              text={desc}
              startDelay={0.8}
              fontStyle={{
                fontFamily: FONT,
                fontWeight: 300,
                fontSize: "clamp(12px, 3.5vw, 18px)",
                letterSpacing: "-0.01em",
                color: "rgba(10,10,10,0.38)",
                wordBreak: "keep-all",
              }}
            />
          </div>
        )}
      </div>

      {/* ── Description (desktop): slide-up words from bottom ── */}
      {!isMobile && desc && (
        <div style={{
          position: "absolute",
          bottom: "clamp(44px, 7vh, 72px)",
          left: hPad,
          right: hPad,
          zIndex: 1,
          pointerEvents: "none",
        }}>
          <SlideUpText
            text={desc}
            startDelay={0.7}
            fontStyle={{
              fontFamily: FONT,
              fontWeight: 300,
              fontSize: "clamp(14px, 1.8vw, 28px)",
              letterSpacing: "-0.01em",
              color: "rgba(10,10,10,0.38)",
              wordBreak: "keep-all",
            }}
          />
        </div>
      )}

      {/* ── 10 draggable cards (desktop): 3-row grid, randomized, no blur ── */}
      {!isMobile && heroProjects.map((project, i) => (
        <DraggableCard
          key={project.id}
          project={project}
          pos={scatter[i % scatter.length]}
          zIndex={zMap[project.id] ?? (10 + i)}
          idx={i}
          onDragStart={() => bringToFront(project.id)}
          onOpen={onOpenProject}
        />
      ))}
    </section>
  );
}
