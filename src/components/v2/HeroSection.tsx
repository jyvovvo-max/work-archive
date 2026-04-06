"use client";
import { useState, useEffect, useRef } from "react";
import { GUTTER } from "./layout";
import {
  motion,
  useMotionValue,
  useSpring,
  useAnimationControls,
  useScroll,
  useTransform,
  useMotionValueEvent,
  MotionValue,
} from "framer-motion";
import { Project, SiteData, Lang } from "./types";
import { RetryImg } from "./RetryImg";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";

// ── Mobile scatter (B+C hybrid) ──
// 6-column grid with runtime container dimensions for accurate overlap detection
const M_COLS = 6;
const M_COL_W_PCT = 100 / M_COLS; // 16.67%
const M_Y_LEVELS = [24, 39, 54, 67, 79]; // % of scatter container height
const M_GAP_PCT = 4;   // min gap between images (% of container)
const M_IMG_RATIO = 0.75; // 4:3 crop applied to 16:9 source
const M_SPAN_MIN = 2;
const M_SPAN_MAX = 4;

type MPos = { leftPct: number; topPct: number; widthPct: number };

function makeMobileScatter(containerW: number, containerH: number): MPos[] {
  function imgH(span: number): number {
    // height as % of container, using actual pixel dimensions
    return (span * M_COL_W_PCT / 100 * containerW * M_IMG_RATIO) / containerH * 100;
  }
  type Box = { x1: number; x2: number; y1: number; y2: number };
  const placed: Box[] = [];
  const positions: MPos[] = [];
  const candidates: { col: number; span: number; topPct: number }[] = [];
  for (const topPct of M_Y_LEVELS) {
    for (let col = 0; col < M_COLS; col++) {
      for (let span = M_SPAN_MIN; span <= M_SPAN_MAX; span++) {
        if (col + span <= M_COLS) candidates.push({ col, span, topPct });
      }
    }
  }
  candidates.sort(() => Math.random() - 0.5);
  for (const c of candidates) {
    if (positions.length >= 8) break;
    const h = imgH(c.span);
    const box: Box = {
      x1: c.col * M_COL_W_PCT,              // no x-gap: column boundaries are precise
      x2: (c.col + c.span) * M_COL_W_PCT,
      y1: c.topPct - M_GAP_PCT,             // gap only on y-axis
      y2: c.topPct + h + M_GAP_PCT,
    };
    if (placed.some(p => !(box.x2 <= p.x1 || p.x2 <= box.x1 || box.y2 <= p.y1 || p.y2 <= box.y1))) continue;
    placed.push(box);
    positions.push({ leftPct: c.col * M_COL_W_PCT, topPct: c.topPct, widthPct: c.span * M_COL_W_PCT });
  }
  return positions;
}

type ScatterPos = { left: string; top: string; w: string };

// Y-quantized grid: 16 columns × 6 discrete Y levels
// Bounding box collision detection with estimated image heights (4:3 ratio)
const GRID_COLS = 16;
const COL_W = 100 / GRID_COLS; // 6.25vw
const QUANTIZED_Y = [23, 31, 39, 47, 55, 62]; // vh top positions
const VW_TO_VH = 1.6; // at 1440×900: 1vw = 1.6vh
const IMG_RATIO = 0.75; // assumed 4:3 aspect ratio → height = width * 0.75
const GAP_VH = 2; // minimum vertical gap between images

type Box = { x1: number; x2: number; y1: number; y2: number };

function estimatedHeightVh(span: number): number {
  return span * COL_W * VW_TO_VH * IMG_RATIO;
}

function boxesOverlap(a: Box, b: Box): boolean {
  return !(a.x2 <= b.x1 || b.x2 <= a.x1 || a.y2 <= b.y1 || b.y2 <= a.y1);
}

function runScatterAttempt(enforceAdjacency: boolean): ScatterPos[] {
  type PlacedItem = { box: Box; col: number; span: number; yVh: number };
  const placed: PlacedItem[] = [];
  const positions: ScatterPos[] = [];

  type Candidate = { yVh: number; startCol: number; span: number };
  const candidates: Candidate[] = [];
  for (const yVh of QUANTIZED_Y) {
    for (let startCol = 0; startCol < GRID_COLS; startCol++) {
      for (let span = 2; span <= 5; span++) {
        if (startCol + span <= GRID_COLS) {
          candidates.push({ yVh, startCol, span });
        }
      }
    }
  }
  candidates.sort(() => Math.random() - 0.5);

  for (const c of candidates) {
    if (positions.length >= 10) break;

    const h = estimatedHeightVh(c.span);
    const newBox: Box = {
      x1: c.startCol * COL_W,
      x2: (c.startCol + c.span) * COL_W,
      y1: c.yVh - GAP_VH,
      y2: c.yVh + h + GAP_VH,
    };

    // Rule 1: no bounding box overlap
    let hasOverlap = false;
    for (const p of placed) {
      if (boxesOverlap(newBox, p.box)) { hasOverlap = true; break; }
    }
    if (hasOverlap) continue;

    // Rule 2: same-Y horizontal neighbours must differ in span
    if (enforceAdjacency) {
      let spanConflict = false;
      for (const p of placed) {
        if (p.yVh !== c.yVh) continue;
        const rightOf = p.col + p.span === c.startCol;
        const leftOf = c.startCol + c.span === p.col;
        if ((rightOf || leftOf) && p.span === c.span) {
          spanConflict = true;
          break;
        }
      }
      if (spanConflict) continue;
    }

    placed.push({ box: newBox, col: c.startCol, span: c.span, yVh: c.yVh });
    positions.push({
      left: `${c.startCol * COL_W}vw`,
      top: `${c.yVh}vh`,
      w: `${c.span * COL_W}vw`,
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
//  1. Images fade in clean (staggered, 0.1s gap, 1.0s each)
//  2. Once all images in (2.65s) → blur 3px + scale 0.95 simultaneously (1.0s)
//  3. Title appears (4.0s delay, 1.5s)
//  4. Desc appears (5.0s delay, 1.5s)
// Images sit behind text (zIndex 2); text zIndex 5/20
function CollageImage({
  project,
  pos,
  idx,
  mousePxX,
  mousePxY,
  scrollOpacity,
  scrollTranslateY,
  allImagesIn,
  onOpen,
}: {
  project: Project;
  pos: ScatterPos;
  idx: number;
  mousePxX: MotionValue<number>;
  mousePxY: MotionValue<number>;
  scrollOpacity: MotionValue<number>;
  scrollTranslateY: MotionValue<number>;
  allImagesIn: boolean;
  onOpen: (p: Project) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Proximity tilt — 650px radius, quadratic weighting
  const localRotateX = useMotionValue(0);
  const localRotateY = useMotionValue(0);
  const springRotateX = useSpring(localRotateX, { stiffness: 50, damping: 20 });
  const springRotateY = useSpring(localRotateY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    if (!allImagesIn) return;   // tilt only after images have appeared
    const maxDist = 650;
    const maxTilt = 12;

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
  }, [allImagesIn, mousePxX, mousePxY, localRotateX, localRotateY]);

  const blurred = allImagesIn && !hovered;

  const blurTransition = {
    filter: { duration: blurred ? 1.0 : 0.1, ease: "easeInOut" as const },
    scale:  { duration: blurred ? 1.0 : 0.1, ease: "easeInOut" as const },
  };
  const blurAnimate = { filter: blurred ? "blur(3px)" : "blur(0px)", scale: blurred ? 0.95 : 1 };

  return (
    // Outer: staggered clean fade-in — sits behind text (zIndex 2)
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        delay: 0.15 + idx * 0.1,
        duration: 1.0,
        ease: [0.55, 0, 1, 0.6],
      }}
      onClick={() => onOpen(project)}
      style={{
        position: "absolute",
        left: pos.left,
        top: pos.top,
        width: pos.w,
        minWidth: "80px",
        maxWidth: "440px",
        zIndex: 2,
        perspective: "600px",
        cursor: "pointer",
        y: scrollTranslateY,
      }}
    >
      {/* Tilt + opacity wrapper — contains both ID and image */}
      <motion.div
        ref={imgRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          opacity: scrollOpacity,
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformStyle: "preserve-3d",
          position: "relative",
        }}
      >
        {/* ID label — top-right, outside image. tilt only (no blur) */}
        <span
          style={{
            position: "absolute",
            top: "-13px",
            right: "1px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10.8px",
            fontWeight: 300,
            letterSpacing: "0.1em",
            color: "rgba(10,10,10,0.3)",
            pointerEvents: "none",
            lineHeight: 1,
          }}
        >
          {String(project.id).padStart(3, "0")}
        </span>

        {/* Image */}
        <motion.div
          animate={blurAnimate}
          transition={blurTransition}
          style={{
            borderRadius: "2px",
            overflow: "hidden",
            boxShadow: "0 4px 18px rgba(0,0,0,0.16)",
          }}
        >
          <RetryImg
            src={project.img}
            alt={project.title}
            draggable={false}
            style={{ width: "100%", height: "auto", display: "block" }}
            placeholderStyle={{ aspectRatio: "4/3" }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function MobileGrid({
  projects,
  scrollOpacity,
  onOpen,
}: {
  projects: Project[];
  scrollOpacity: MotionValue<number>;
  onOpen: (p: Project) => void;
}) {
  return (
    <motion.div
      style={{
        position: "absolute",
        top: "136px",
        left: "20px",
        right: "20px",
        bottom: 0,
        overflow: "hidden",
        zIndex: 2,
        opacity: scrollOpacity,
        columnCount: 2,
        columnGap: "8px",
      }}
    >
      {projects.map((project, i) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.15 + i * 0.08, duration: 0.9, ease: [0.55, 0, 1, 0.6] }}
          onClick={() => onOpen(project)}
          style={{
            breakInside: "avoid",
            marginBottom: "8px",
            cursor: "pointer",
            position: "relative",
          }}
        >
          <span style={{
            position: "absolute",
            top: "-11px",
            right: "1px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            fontWeight: 300,
            letterSpacing: "0.1em",
            color: "rgba(10,10,10,0.3)",
            lineHeight: 1,
          }}>
            {String(project.id).padStart(3, "0")}
          </span>
          <RetryImg
            src={project.img}
            alt={project.title}
            draggable={false}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              borderRadius: "2px",
              boxShadow: "0 3px 12px rgba(0,0,0,0.14)",
            }}
            placeholderStyle={{ aspectRatio: "4/3" }}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

function ScatterCard({ project, pos, idx, allImagesIn, scrollTranslateY, onOpen }: {
  project: Project;
  pos: MPos;
  idx: number;
  allImagesIn: boolean;
  scrollTranslateY: MotionValue<number>;
  onOpen: (p: Project) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15 + idx * 0.1, duration: 1.0, ease: [0.55, 0, 1, 0.6] }}
      onClick={() => onOpen(project)}
      style={{
        position: "absolute",
        left: `${pos.leftPct}%`,
        top: `${pos.topPct}%`,
        width: `${pos.widthPct}%`,
        cursor: "pointer",
        y: scrollTranslateY,
      }}
    >
      {/* ID label */}
      <span style={{
        position: "absolute", top: "-11px", right: "1px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "9px", fontWeight: 300,
        letterSpacing: "0.1em", color: "rgba(10,10,10,0.3)",
        lineHeight: 1, pointerEvents: "none",
      }}>
        {String(project.id).padStart(3, "0")}
      </span>

      <motion.img
        src={project.img}
        alt={project.title}
        draggable={false}
        animate={{
          filter: allImagesIn ? "blur(3px)" : "blur(0px)",
          scale:  allImagesIn ? 0.95 : 1,
        }}
        transition={{ duration: allImagesIn ? 1.0 : 0.1, ease: "easeInOut" }}
        style={{
          width: "100%",
          aspectRatio: "4/3",
          objectFit: "cover",
          display: "block",
          borderRadius: "2px",
          boxShadow: "0 4px 18px rgba(0,0,0,0.16)",
        }}
      />
    </motion.div>
  );
}

// ── Mobile Hero Layout ──
// Flow order: Title → Subtitle → Description → Scatter images (B+C hybrid scatter)
function MobileHeroLayout({ projects, siteData, scrollOpacity, scrollTranslateY, onOpen }: {
  projects: Project[];
  siteData: SiteData | null;
  scrollOpacity: MotionValue<number>;
  scrollTranslateY: MotionValue<number>;
  onOpen: (p: Project) => void;
}) {
  const [positions, setPositions] = useState<MPos[]>([]);
  const [allImagesIn, setAllImagesIn] = useState(false);
  const scatterRef = useRef<HTMLDivElement>(null);
  const titleControls = useAnimationControls();

  useEffect(() => {
    titleControls.start({
      filter: "blur(0px)", opacity: 1,
      transition: { duration: 1.5, delay: 4.0, ease: [0.16, 1, 0.3, 1] },
    });
    const t = setTimeout(() => setAllImagesIn(true), 2650);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate scatter once layout settles (actual container dimensions)
  useEffect(() => {
    const calc = () => {
      const el = scatterRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) setPositions(makeMobileScatter(width, height));
    };
    const t = setTimeout(calc, 200);
    return () => clearTimeout(t);
  }, []);

  const title    = siteData?.landingTitle || "Work Archive";
  const subtitle = siteData?.landingSubtitle || "2015–Present";
  const desc = siteData?.landingDescription || "";
  const heroProjects = projects.slice(0, 8);

  return (
    <section style={{
      position: "absolute", inset: 0,
      background: "#F0F0F0",
      overflow: "hidden",
    }}>
      {/* ── Scatter images — fill entire section, behind text ── */}
      <motion.div
        ref={scatterRef}
        style={{
          position: "absolute", inset: 0,
          opacity: scrollOpacity,
          zIndex: 2,
        }}
      >
        {heroProjects.map((project, i) => {
          const pos = positions[i];
          if (!pos) return null;
          return (
            <ScatterCard
              key={project.id}
              project={project}
              pos={pos}
              idx={i}
              allImagesIn={allImagesIn}
              scrollTranslateY={scrollTranslateY}
              onOpen={onOpen}
            />
          );
        })}
      </motion.div>

      {/* ── Text — absolute, on top of images ── */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        padding: "62px 20px 20px",
        zIndex: 20,
        pointerEvents: "none",
        mixBlendMode: "difference",
      }}>
        <motion.h1
          initial={{ filter: "blur(28px)", opacity: 0 }}
          animate={titleControls}
          style={{
            fontFamily: FONT, fontWeight: 300,
            fontSize: "calc((100vw - 40px) / 7.2)",
            letterSpacing: "-0.045em", lineHeight: 0.88,
            color: "#FFFFFF", margin: "0 0 8px",
            whiteSpace: "nowrap", display: "block",
          }}
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ filter: "blur(20px)", opacity: 0 }}
          animate={titleControls}
          style={{
            fontFamily: FONT, fontWeight: 300,
            fontSize: "clamp(10px, 3vw, 13px)",
            lineHeight: 0.88, color: "rgba(255,255,255,0.5)",
            margin: "0 0 18px", display: "block",
          }}
        >
          {subtitle}
        </motion.p>
        {desc && (
          <motion.p
            initial={{ filter: "blur(20px)", opacity: 0 }}
            animate={titleControls}
            style={{
              fontFamily: FONT, fontWeight: 300,
              fontSize: "clamp(13px, 3.70vw, 19px)",
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.4, margin: 0,
            }}
          >
            {desc}
          </motion.p>
        )}
      </div>
    </section>
  );
}

function DescriptionText({ text, y }: { text: string; y: MotionValue<number> }) {
  const controls = useAnimationControls();

  useEffect(() => {
    controls.start({
      filter: "blur(0px)",
      opacity: 1,
      transition: { duration: 1.5, delay: 5.0, ease: [0.16, 1, 0.3, 1] },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      style={{
        position: "absolute",
        top: "74vh",
        left: GUTTER,
        right: GUTTER,
        zIndex: 5,
        pointerEvents: "none",
        mixBlendMode: "difference",
        y,
      }}
    >
      <motion.p
        initial={{ filter: "blur(20px)", opacity: 0 }}
        animate={controls}
        style={{
          fontFamily: FONT,
          fontWeight: 300,
          fontSize: "clamp(10px, 2.5vw, 40px)",
          color: "#FFFFFF",
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
  onOpen: (p: Project) => void;
  lang?: Lang;
}

export default function HeroSection({ projects, siteData, onOpen, lang = "ko" }: HeroProps) {
  const [scatter] = useState<ScatterPos[]>(() => makeScatter());
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Phase control:
  // Image 10 done at 1.05 + 1.0 = 2.05s → 0.5s pause → blur starts at 2.65s
  const [allImagesIn, setAllImagesIn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAllImagesIn(true), 2650);
    return () => clearTimeout(t);
  }, []);

  // Global scroll
  const { scrollY } = useScroll();
  const scrollOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const scrollTranslateY = useTransform(scrollY, [0, 200], [0, -160]);

  // Scroll-linked title + desc motion
  const titleY = useMotionValue(0);
  const descY  = useMotionValue(0);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const [latchScrollY, setLatchScrollY] = useState(1000);
  const latchRef = useRef(1000);
  useEffect(() => { latchRef.current = latchScrollY; }, [latchScrollY]);

  // Latch: scroll Y where title + desc start moving up together.
  // Should fire well before works section (vh + 550) slides over hero.
  useEffect(() => {
    const calc = () => {
      setLatchScrollY(Math.max(600, Math.round(window.innerHeight * 0.85)));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  // Scroll handler: drive titleY and descY
  useMotionValueEvent(scrollY, "change", (v) => {
    const vh    = window.innerHeight;
    const latch = latchRef.current;
    const maxD  = -0.44 * vh; // desc phase-1 max offset

    // Title: static until latch, then follows scroll 1:1
    titleY.set(v > latch ? -(v - latch) : 0);

    // Desc: phase-1 (80→500), hold, then follows scroll 1:1 after latch
    if (v <= 80) {
      descY.set(0);
    } else if (v <= 500) {
      descY.set(((v - 80) / 420) * maxD);
    } else if (v > latch) {
      descY.set(maxD - (v - latch));
    } else {
      descY.set(maxD);
    }
  });

  // Pixel-based mouse for proximity tilt
  const rawMousePxX = useMotionValue(0);
  const rawMousePxY = useMotionValue(0);
  const mousePxX = useSpring(rawMousePxX, { stiffness: 50, damping: 20 });
  const mousePxY = useSpring(rawMousePxY, { stiffness: 50, damping: 20 });

  // Title + subtitle: appear at 4.0s (after blur settles at ~3.65s)
  const titleControls = useAnimationControls();

  useEffect(() => {
    titleControls.start({
      filter: "blur(0px)",
      opacity: 1,
      transition: { duration: 1.5, delay: 4.0, ease: [0.16, 1, 0.3, 1] },
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

  // ── Mobile: separate layout with flow text + B+C hybrid scatter ──
  if (isMobile) {
    return (
      <MobileHeroLayout
        projects={projects}
        siteData={siteData}
        scrollOpacity={scrollOpacity}
        scrollTranslateY={scrollTranslateY}
        onOpen={onOpen}
      />
    );
  }

  return (
    <section
      style={{
        position: "absolute",
        inset: 0,
        background: "#F0F0F0",
        overflow: "hidden",
      }}
    >
      {/* ── Title area — zIndex 20, scroll-linked translateY after latch ── */}
      <motion.div
        ref={titleContainerRef}
        style={{
          position: "absolute",
          top: "62px",
          left: GUTTER,
          zIndex: 20,
          pointerEvents: "none",
          mixBlendMode: "difference",
          y: titleY,
        }}
      >
        <div style={{ position: "relative", display: "inline-block" }}>
          <motion.h1
            initial={{ filter: "blur(28px)", opacity: 0 }}
            animate={titleControls}
            style={{
              fontFamily: FONT,
              fontWeight: 300,
              fontSize: "calc((100vw - clamp(40px, 8vw, 112px)) / 7)",
              letterSpacing: "-0.045em",
              lineHeight: 0.88,
              color: "#FFFFFF",
              margin: 0,
              whiteSpace: "nowrap",
              display: "block",
            }}
          >
            {title}
          </motion.h1>

          {/* 2015–Present — top-right corner */}
          <motion.p
            initial={{ filter: "blur(20px)", opacity: 0 }}
            animate={titleControls}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              display: "block",
              margin: 0,
              fontFamily: FONT,
              fontWeight: 300,
              fontStyle: "normal",
              fontSize: "clamp(13px, 1.8vw, 26px)",
              lineHeight: 0.88,
              color: "rgba(255,255,255,0.5)",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </motion.p>
        </div>
      </motion.div>

      {/* ── Collage images — zIndex 2, behind text ── */}
      {heroProjects.map((project, i) => (
        <CollageImage
          key={project.id}
          project={project}
          pos={scatter[i % scatterLen]}
          idx={i}
          mousePxX={mousePxX}
          mousePxY={mousePxY}
          scrollOpacity={scrollOpacity}
          scrollTranslateY={scrollTranslateY}
          allImagesIn={allImagesIn}
          onOpen={onOpen}
        />
      ))}

      {/* ── Description — zIndex 5, above images ── */}
      {desc && (
        <DescriptionText text={desc} y={descY} />
      )}
    </section>
  );
}
