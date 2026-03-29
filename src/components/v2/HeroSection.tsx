"use client";
import { useState, useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useAnimationControls,
  useScroll,
  useTransform,
  MotionValue,
} from "framer-motion";
import { Project, SiteData } from "./types";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";

type ScatterPos = { left: string; top: string; w: string };

// 16-col × 8-row grid
// Each image: left edge snaps to column, top edge snaps to row (2 sides aligned)
// Rules: no cell overlap, adjacent images in same row must differ in span
// Retries up to 30×; fallback relaxes adjacency rule
type Placement = { row: number; startCol: number; span: number };

const GRID_COLS = 16;
const GRID_ROWS = 8;
const COL_W = 100 / GRID_COLS;   // 6.25vw
const ROW_H = 55 / GRID_ROWS;    // 6.875vh
const ROW_START = 20;             // vh — images start at 20vh (below title)

function runScatterAttempt(enforceAdjacency: boolean): ScatterPos[] {
  // 2D cell map: [row][col]
  const usedCells = Array.from({ length: GRID_ROWS }, () =>
    new Array(GRID_COLS).fill(false)
  );
  const placedInRow: Array<Array<{ startCol: number; span: number }>> =
    Array.from({ length: GRID_ROWS }, () => []);
  const positions: ScatterPos[] = [];

  const allPlacements: Placement[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let startCol = 0; startCol < GRID_COLS; startCol++) {
      for (let span = 2; span <= 5; span++) {
        if (startCol + span <= GRID_COLS) {
          allPlacements.push({ row, startCol, span });
        }
      }
    }
  }
  allPlacements.sort(() => Math.random() - 0.5);

  for (const p of allPlacements) {
    if (positions.length >= 10) break;

    // Rule 1: no cell overlap
    let cellFree = true;
    for (let c = p.startCol; c < p.startCol + p.span; c++) {
      if (usedCells[p.row][c]) { cellFree = false; break; }
    }
    if (!cellFree) continue;

    // Rule 2: horizontal neighbours in same row must differ in span
    if (enforceAdjacency) {
      let spanConflict = false;
      for (const placed of placedInRow[p.row]) {
        const rightOf = placed.startCol + placed.span === p.startCol;
        const leftOf  = p.startCol + p.span === placed.startCol;
        if ((rightOf || leftOf) && placed.span === p.span) {
          spanConflict = true;
          break;
        }
      }
      if (spanConflict) continue;
    }

    for (let c = p.startCol; c < p.startCol + p.span; c++) {
      usedCells[p.row][c] = true;
    }
    placedInRow[p.row].push({ startCol: p.startCol, span: p.span });

    positions.push({
      left: `${p.startCol * COL_W}vw`,
      top: `${ROW_START + p.row * ROW_H}vh`,  // top snaps to row grid line
      w: `${p.span * COL_W}vw`,
    });
  }

  return positions;
}

function makeScatter(): ScatterPos[] {
  for (let i = 0; i < 30; i++) {
    const result = runScatterAttempt(true);
    if (result.length >= 10) return result;
  }
  return runScatterAttempt(false);
}

// Sequence:
//  1. Images fade in clean (staggered)
//  2. Once all images in → blur 5px + scale 0.95 simultaneously
//  3. Title appears
//  4. Desc appears
// Hover always clears blur.
function CollageImage({
  src,
  pos,
  idx,
  mousePxX,
  mousePxY,
  scrollOpacity,
  allImagesIn,
}: {
  src: string;
  pos: ScatterPos;
  idx: number;
  mousePxX: MotionValue<number>;
  mousePxY: MotionValue<number>;
  scrollOpacity: MotionValue<number>;
  allImagesIn: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Proximity tilt — 650px radius, quadratic weighting
  const localRotateX = useMotionValue(0);
  const localRotateY = useMotionValue(0);
  const springRotateX = useSpring(localRotateX, { stiffness: 50, damping: 20 });
  const springRotateY = useSpring(localRotateY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const maxDist = 650;
    const maxTilt = 8;

    const update = () => {
      const rect = imgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = mousePxX.get();
      const my = mousePxY.get();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
      const t = Math.max(0, 1 - dist / maxDist);
      const factor = t * t;
      localRotateX.set((cy - my) / Math.max(rect.height / 2, 1) * maxTilt * factor);
      localRotateY.set((mx - cx) / Math.max(rect.width / 2, 1) * maxTilt * factor);
    };

    const unsubX = mousePxX.onChange(update);
    const unsubY = mousePxY.onChange(update);
    return () => { unsubX(); unsubY(); };
  }, [mousePxX, mousePxY, localRotateX, localRotateY]);

  const blurred = allImagesIn && !hovered;

  return (
    // Outer: staggered clean fade-in
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: 0.15 + idx * 0.1,   // 80% speed: 0.08→0.1s gap
        duration: 0.78,             // 80% speed: 0.62→0.78s
        ease: [0.55, 0, 1, 0.6],   // ease-in: slow start → fast finish
      }}
      style={{
        position: "absolute",
        left: pos.left,
        top: pos.top,
        width: pos.w,
        minWidth: "80px",
        maxWidth: "440px",
        zIndex: 10,
        perspective: "600px",
      }}
    >
      {/* Inner: clean on entrance, blur+shrink after allImagesIn */}
      <motion.div
        ref={imgRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        animate={{
          filter: blurred ? "blur(3px)" : "blur(0px)",
          scale: blurred ? 0.95 : 1,
        }}
        transition={{
          filter: { duration: 0.6, ease: "easeInOut" },
          scale: { duration: 0.6, ease: "easeInOut" },
        }}
        style={{
          opacity: scrollOpacity,
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformStyle: "preserve-3d",
          borderRadius: "2px",
          overflow: "hidden",
          boxShadow: "0 4px 18px rgba(0,0,0,0.16)",
        }}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </motion.div>
    </motion.div>
  );
}

function DescriptionText({
  text,
  scrollOpacity,
}: {
  text: string;
  scrollOpacity: MotionValue<number>;
}) {
  const controls = useAnimationControls();

  useEffect(() => {
    controls.start({
      filter: "blur(0px)",
      opacity: 1,
      transition: { duration: 1.4, delay: 4.3, ease: [0.16, 1, 0.3, 1] },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      style={{
        position: "absolute",
        top: "74vh",
        left: "clamp(20px, 4vw, 56px)",
        right: "clamp(20px, 4vw, 56px)",
        zIndex: 5,
        pointerEvents: "none",
        opacity: scrollOpacity,
      }}
    >
      <motion.p
        initial={{ filter: "blur(20px)", opacity: 0 }}
        animate={controls}
        style={{
          fontFamily: FONT,
          fontWeight: 300,
          fontSize: "clamp(10px, 2.5vw, 40px)",
          color: "rgba(10,10,10,0.42)",
          lineHeight: 1.36,
          margin: 0,
        }}
      >
        {text}
      </motion.p>
    </motion.div>
  );
}

interface HeroProps {
  projects: Project[];
  siteData: SiteData | null;
}

export default function HeroSection({ projects, siteData }: HeroProps) {
  const [scatter] = useState<ScatterPos[]>(() => makeScatter());

  // Phase control:
  // ~1.5s → all 10 images have entered → trigger simultaneous blur+shrink
  // ~2.0s → title starts appearing (after blur settles)
  // ~3.1s → description starts appearing
  const [allImagesIn, setAllImagesIn] = useState(false);

  useEffect(() => {
    // Last image done at ~1.83s + 0.5s pause = 2.33s
    const t = setTimeout(() => setAllImagesIn(true), 2350);
    return () => clearTimeout(t);
  }, []);

  // Global scroll → hero fades 0–400px
  const { scrollY } = useScroll();
  const scrollOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  // Pixel-based mouse for proximity tilt
  const rawMousePxX = useMotionValue(0);
  const rawMousePxY = useMotionValue(0);
  const mousePxX = useSpring(rawMousePxX, { stiffness: 50, damping: 20 });
  const mousePxY = useSpring(rawMousePxY, { stiffness: 50, damping: 20 });

  // Title + subtitle: appear after images blur (delay 2.0s)
  const titleControls = useAnimationControls();

  useEffect(() => {
    // blur starts at 2.35s, duration 0.6s → done at 2.95s → title at 3.1s
    titleControls.start({
      filter: "blur(0px)",
      opacity: 1,
      transition: { duration: 1.4, delay: 3.1, ease: [0.16, 1, 0.3, 1] },
    });

    const handleMouseMove = (e: MouseEvent) => {
      rawMousePxX.set(e.clientX);
      rawMousePxY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = siteData?.landingTitle || "Work Archive";
  const subtitle = siteData?.landingSubtitle || "2015–Present";
  const desc = siteData?.landingDescription || "";
  const heroProjects = projects.slice(0, 10);
  const scatterLen = Math.max(scatter.length, 1);

  return (
    <section
      style={{
        position: "absolute",
        inset: 0,
        background: "#F0F0F0",
        overflow: "hidden",
      }}
    >
      {/* ── Title area — appears after images blur ── */}
      <div
        style={{
          position: "absolute",
          top: "clamp(56px, 7vh, 80px)",
          left: "clamp(20px, 4vw, 56px)",
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <div style={{ position: "relative", display: "inline-block" }}>
          <motion.h1
            initial={{ filter: "blur(28px)", opacity: 0 }}
            animate={titleControls}
            style={{
              fontFamily: FONT,
              fontWeight: 300,
              fontSize: "calc((100vw - clamp(48px, 8vw, 112px)) / 7)",
              letterSpacing: "-0.045em",
              lineHeight: 0.88,
              color: "#0A0A0A",
              margin: 0,
              whiteSpace: "nowrap",
              display: "block",
            }}
          >
            {title}
          </motion.h1>

          {/* 2015–Present — same font as title, responsive, top-right */}
          <motion.p
            initial={{ filter: "blur(20px)", opacity: 0 }}
            animate={titleControls}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              margin: 0,
              fontFamily: FONT,
              fontWeight: 300,
              fontStyle: "normal",
              fontSize: "clamp(13px, 1.8vw, 26px)",
              lineHeight: 0.88,
              color: "rgba(10,10,10,0.35)",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </motion.p>
        </div>
      </div>

      {/* ── Collage images — appear first, clean ── */}
      {heroProjects.map((project, i) => (
        <CollageImage
          key={project.id}
          src={project.img}
          pos={scatter[i % scatterLen]}
          idx={i}
          mousePxX={mousePxX}
          mousePxY={mousePxY}
          scrollOpacity={scrollOpacity}
          allImagesIn={allImagesIn}
        />
      ))}

      {/* ── Description — appears last ── */}
      {desc && (
        <DescriptionText text={desc} scrollOpacity={scrollOpacity} />
      )}
    </section>
  );
}
