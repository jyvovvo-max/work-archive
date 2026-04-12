"use client";
import { useState, useEffect, useRef } from "react";
import { GUTTER, RIGHT_OPT_SUBTITLE, RIGHT_OPT_TITLE } from "./layout";
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

type ScatterPos = { left: string; top: string; w: string; span: number };

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
      span: c.span,
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

// ── Depth system (desktop hero) ──
// Images are sized by span (SCATTER_MIN_SPAN..SCATTER_MAX_SPAN columns).
// Size encodes depth for TILT only (large = near plane tilts more, small = far tilts less).
// Blur is uniform across all images at BLUR_UNIFORM — depth weighting on blur was too
// mushy on the far plane. Hover pulls the target forward to a fixed target size while
// nearby images also pull forward slightly (scale up), creating a depth-coherent field.
const SCATTER_MIN_SPAN = 2;
const SCATTER_MAX_SPAN = 5;
const BLUR_UNIFORM = 1;      // px — baseline blur for every image
const TILT_BASE    = 8;      // max tilt degrees for the largest image
const SCALE_SETTLED = 0.95;  // baseline scale after initial settle
// Hover target: any hovered image scales up to this visual width (vw). Small images grow
// more (larger scale factor), large images grow less — but all end up the same "front plane"
// width, guaranteed to exceed the largest baseline image. Depth-equalized focus zoom.
const HOVER_TARGET_VW = 25;
// Minimum multiplier so every image — even the one already close to target — still has
// a perceptible "come forward" gesture on hover.
const HOVER_SCALE_MIN = 1.05;
// Proximity pull — images near the hovered one scale UP slightly (come forward on Z),
// producing a local depth field around the focus. Far images stay at baseline.
const LENS_RADIUS_PX = 550;  // how far the pull field extends
const PROXIMITY_PULL_SCALE = 0.05; // max scale boost for the nearest neighbour
// Gather: near non-hovered images also drift slightly toward the focal point, weighted
// by their proximity factor (near = most drift, far = no drift). This is the initial snap.
const GATHER_MAX_PX = 40;
// Sustained drift — after the initial gather snap, all images keep slowly gravitating
// toward the hovered centre as long as hover is held. Weight by distance so near images
// drift faster than far ones, and cap total pull so motion plateaus.
const DRIFT_SPEED_PX_PER_SEC = 8;
const DRIFT_RADIUS_PX = 1400;
const MAX_PULL_PX = 140;
// Edge-clip compensation: when a hovered image would extend past the viewport edge, nudge
// it toward the centre. Allow up to CLIP_ALLOWED_FRACTION of the scaled width to clip;
// only the excess is compensated.
const CLIP_ALLOWED_FRACTION = 1 / 6;

// Sequence:
//  1. Images fade in clean (staggered, 0.1s gap, 1.0s each)
//  2. Once all images in (2.65s) → depth-weighted blur + scale 0.95 (1.0s settle)
//  3. After settle, hover interactions drive blur/scale changes in concert
//  4. Title appears (4.0s delay, 1.5s)
//  5. Desc appears (5.0s delay, 1.5s)
// Images sit behind text (zIndex 2); text zIndex 5/20
type Center = { x: number; y: number };

function CollageImage({
  project,
  pos,
  idx,
  mousePxX,
  mousePxY,
  scrollOpacity,
  scrollTranslateY,
  allImagesIn,
  isHovered,
  anyHovered,
  hoveredCenter,
  screenW,
  onHoverChange,
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
  isHovered: boolean;
  anyHovered: boolean;
  hoveredCenter: Center | null;
  screenW: number;
  onHoverChange: (hover: boolean, center?: Center) => void;
  onOpen: (p: Project) => void;
}) {
  const imgRef = useRef<HTMLDivElement>(null);
  const idleRef = useRef<HTMLDivElement>(null);
  const [hasSettled, setHasSettled] = useState(false);
  const [proximityFactor, setProximityFactor] = useState(0);
  // Drift vector toward the hovered image's centre (0,0 when nobody is hovered or
  // when this image IS the hovered one). Weighted by proximity so near neighbours
  // gather while distant ones stay put.
  const [pull, setPull] = useState({ x: 0, y: 0 });
  // Actual rendered image aspect (height / width). Captured onLoad so the label
  // offset can follow the real image corner, not a hard-coded 4:3 assumption.
  const [imgAspect, setImgAspect] = useState(IMG_RATIO);

  // Depth from span: 0 = smallest (far), 1 = largest (near). Used for tilt weighting.
  const depth = (pos.span - SCATTER_MIN_SPAN) / (SCATTER_MAX_SPAN - SCATTER_MIN_SPAN);
  const maxTilt = TILT_BASE * (0.4 + 0.6 * depth);
  const baseBlurPx = BLUR_UNIFORM; // uniform across all images — no depth weighting

  // Proximity tilt — depth-weighted, 650px radius, quadratic weighting
  const localRotateX = useMotionValue(0);
  const localRotateY = useMotionValue(0);
  const springRotateX = useSpring(localRotateX, { stiffness: 50, damping: 20 });
  const springRotateY = useSpring(localRotateY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    if (!allImagesIn) return;   // tilt only after images have appeared
    const maxDist = 650;

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
  }, [allImagesIn, mousePxX, mousePxY, localRotateX, localRotateY, maxTilt]);

  // After initial settle completes (~1.0s after allImagesIn), switch to snappier
  // transitions so hover responses feel quick.
  useEffect(() => {
    if (!allImagesIn) return;
    const t = setTimeout(() => setHasSettled(true), 1050);
    return () => clearTimeout(t);
  }, [allImagesIn]);

  // ── Idle sine float — each image drifts with unique rhythm after settle ──
  useEffect(() => {
    if (!hasSettled) return;
    const el = idleRef.current;
    if (!el) return;
    // Deterministic per-image params from idx
    const seed = (n: number) => ((n * 9301 + 49297) % 233280) / 233280;
    const freqX = 0.3 + seed(idx * 7 + 1) * 0.5;       // ~0.3-0.8 rad/s (8-20s period)
    const freqY = 0.25 + seed(idx * 7 + 2) * 0.45;
    const ampX  = 3 + seed(idx * 7 + 3) * 3;            // 3-6px
    const ampY  = 3 + seed(idx * 7 + 4) * 3;
    const phaseX = seed(idx * 7 + 5) * Math.PI * 2;
    const phaseY = seed(idx * 7 + 6) * Math.PI * 2;
    let raf: number;
    const startTime = performance.now();
    const loop = () => {
      const t = (performance.now() - startTime) / 1000;
      const x = Math.sin(t * freqX + phaseX) * ampX;
      const y = Math.sin(t * freqY + phaseY) * ampY;
      el.style.transform = `translate(${x}px, ${y}px)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [hasSettled, idx]);

  // Convex-lens proximity + sustained drift:
  //  1. Compute proximity factor (for blur/scale bulge, based on LENS_RADIUS_PX).
  //  2. Set an initial "gather snap" pull toward the focal point (factor × GATHER_MAX_PX).
  //  3. While hover remains, accumulate a slow drift on top so all images keep creeping
  //     toward the hovered centre. Drift speed is weighted by a wider-radius distance
  //     metric so EVERY image participates, just at different speeds.
  useEffect(() => {
    if (!anyHovered || isHovered || !hoveredCenter) {
      setProximityFactor(0);
      setPull({ x: 0, y: 0 });
      return;
    }
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const myX = rect.left + rect.width / 2;
    const myY = rect.top + rect.height / 2;
    const dx = hoveredCenter.x - myX;   // toward focal point
    const dy = hoveredCenter.y - myY;
    const dist = Math.hypot(dx, dy);
    if (dist === 0) {
      setProximityFactor(0);
      setPull({ x: 0, y: 0 });
      return;
    }
    const proxFactor  = Math.max(0, 1 - dist / LENS_RADIUS_PX);
    const driftFactor = Math.max(0, 1 - dist / DRIFT_RADIUS_PX);
    setProximityFactor(proxFactor);

    const unitX = dx / dist;
    const unitY = dy / dist;
    const initialMag = proxFactor * GATHER_MAX_PX;

    // 1. Initial snap
    setPull({ x: unitX * initialMag, y: unitY * initialMag });

    // 2. Sustained drift (only if this image is within the drift radius)
    if (driftFactor === 0) return;
    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000;
      const driftMag = driftFactor * DRIFT_SPEED_PX_PER_SEC * elapsed;
      const totalMag = Math.min(initialMag + driftMag, MAX_PULL_PX);
      setPull({ x: unitX * totalMag, y: unitY * totalMag });
    }, 80);
    return () => clearInterval(interval);
  }, [anyHovered, isHovered, hoveredCenter]);

  // Hover scale is depth-equalized: every hovered image lands at HOVER_TARGET_VW wide,
  // so small images grow a lot more than large ones. The HOVER_SCALE_MIN floor ensures
  // even the largest images still show a perceptible "come forward" gesture.
  const hoverScale = Math.max(HOVER_SCALE_MIN, HOVER_TARGET_VW / (pos.span * COL_W));

  // Target blur/scale based on interaction state
  let targetBlurPx: number;
  let targetScale: number;
  if (!allImagesIn) {
    targetBlurPx = 0;
    targetScale = 1;
  } else if (isHovered) {
    targetBlurPx = 0;
    targetScale = hoverScale;
  } else if (anyHovered) {
    // Proximity pull: nearby images come forward (scale up) instead of receding.
    // Smaller images (low depth) get a bigger boost — they "travel further" on Z,
    // reinforcing the sense that the hovered image is pulling its neighbourhood forward.
    const depthWeight = 1.4 - depth * 0.8;  // small(far)=1.4×, large(near)=0.6×
    const pullForward = proximityFactor * PROXIMITY_PULL_SCALE * depthWeight;
    targetBlurPx = baseBlurPx;
    targetScale  = SCALE_SETTLED + pullForward;
  } else {
    targetBlurPx = baseBlurPx;
    targetScale = SCALE_SETTLED;
  }

  // Asymmetric timing: grow-in on hover is snappy, release-out is a slow exhale.
  // `anyHovered` reflects the target state — true means we're transitioning TO a hover
  // configuration (fast), false means we're transitioning BACK to baseline (slow).
  // Edge-clip compensation — only for the currently hovered image. When its scaled
  // width would extend past the viewport edge by more than CLIP_ALLOWED_FRACTION of
  // the scaled width, nudge the image toward the centre by exactly the excess. Near
  // middle-of-screen images compensate by 0.
  let compX = 0;
  if (isHovered && screenW > 0) {
    const vwPx = screenW / 100;
    const w = parseFloat(pos.w) * vwPx;
    const left = parseFloat(pos.left) * vwPx;
    const centerX = left + w / 2;
    const halfScaled = (w * hoverScale) / 2;
    const allowed = (w * hoverScale) * CLIP_ALLOWED_FRACTION;
    const leftOver  = Math.max(0, halfScaled - centerX);             // positive = clipping left
    const rightOver = Math.max(0, (centerX + halfScaled) - screenW); // positive = clipping right
    if (leftOver > allowed) compX = leftOver - allowed;
    else if (rightOver > allowed) compX = -(rightOver - allowed);
  }

  // Effective translate for the image wrapper: compensation wins for the hovered image,
  // gather pull wins for non-hovered images.
  const effectiveX = isHovered ? compX : pull.x;
  const effectiveY = isHovered ? 0    : pull.y;

  // Asymmetric easing:
  // - Hover-in (anyHovered): snappy pull with standard ease
  // - Hover-out (!anyHovered): fast initial return (~80%), then slow settle (~20%)
  //   cubic-bezier [0.05, 0.85, 0.25, 1.0] = steep drop then plateau
  const duration = !hasSettled ? 1.0 : anyHovered ? 0.35 : 1.0;
  const ease: [number, number, number, number] | string = !hasSettled
    ? [0.16, 1, 0.3, 1]
    : anyHovered
      ? [0.16, 1, 0.3, 1]          // in: standard snappy
      : [0.05, 0.85, 0.25, 1.0];   // out: 80% fast → 20% slow settle
  const blurTransition = {
    filter: { duration, ease },
    scale:  { duration, ease },
    x:      { duration, ease },
    y:      { duration, ease },
  };
  const blurAnimate = {
    filter: `blur(${targetBlurPx}px)`,
    scale: targetScale,
    x: effectiveX,
    y: effectiveY,
  };

  // Label tracks the image's visual top-right corner as it scales AND the current
  // translate (gather pull OR edge compensation). Uses the real image aspect captured
  // on load — a 16:9 image would otherwise overshoot with IMG_RATIO=0.75.
  // translateZ lifts the label slightly forward in the preserve-3d stacking context so
  // the scaled image (same Z=0) never paints over it, regardless of DOM sibling order.
  const posWvw = parseFloat(pos.w);
  const labelShiftXvw = (targetScale - 1) * 0.5 * posWvw;
  const labelShiftYvw = -labelShiftXvw * imgAspect;
  const labelTransform =
    `translate(${labelShiftXvw}vw, ${labelShiftYvw}vw) translate(${effectiveX}px, ${effectiveY}px) translateZ(1px)`;

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
        // Hovered image floats above its neighbours so its scale-up isn't clipped
        zIndex: isHovered ? 4 : 2,
        perspective: "600px",
        cursor: "pointer",
        y: scrollTranslateY,
      }}
    >
      {/* Idle float wrapper — sine-driven ambient drift after settle */}
      <div ref={idleRef} style={{ willChange: "transform" }}>
      {/* Tilt + opacity wrapper — contains both ID and image */}
      <motion.div
        ref={imgRef}
        onMouseEnter={() => {
          const rect = imgRef.current?.getBoundingClientRect();
          const center = rect
            ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
            : undefined;
          onHoverChange(true, center);
        }}
        onMouseLeave={() => onHoverChange(false)}
        style={{
          opacity: scrollOpacity,
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformStyle: "preserve-3d",
          position: "relative",
        }}
      >
        {/* ID label — top-right, outside image. Tracks scaled image corner via CSS transform. */}
        <span
          style={{
            position: "absolute",
            top: "-13px",
            right: "1px",
            zIndex: 1,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10.8px",
            fontWeight: 300,
            letterSpacing: "0.1em",
            color: "rgba(10,10,10,0.3)",
            pointerEvents: "none",
            lineHeight: 1,
            transform: labelTransform,
            transition: `transform ${duration}s ease-in-out`,
            willChange: "transform",
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
            onLoad={e => {
              const el = e.currentTarget;
              if (el.naturalWidth > 0 && el.naturalHeight > 0) {
                setImgAspect(el.naturalHeight / el.naturalWidth);
              }
            }}
            style={{ width: "100%", height: "auto", display: "block" }}
            placeholderStyle={{ aspectRatio: "4/3" }}
          />
        </motion.div>
      </motion.div>
      </div>
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
  const desc = siteData?.landingDescriptionEn || siteData?.landingDescription || "";
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
  const [screenW, setScreenW] = useState(0);
  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768);
      setScreenW(window.innerWidth);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Phase control:
  // Image 10 done at 1.05 + 1.0 = 2.05s → 0.5s pause → blur starts at 2.65s
  const [allImagesIn, setAllImagesIn] = useState(false);
  // Shared hover state — drives the "one forward, rest recede" interaction
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  // Screen-space centre of the hovered image, captured when hover starts. Used by
  // non-hovered images to compute their lens proximity factor.
  const [hoveredCenter, setHoveredCenter] = useState<Center | null>(null);

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
  const titleH1Ref = useRef<HTMLHeadingElement>(null);
  const [titleFontSize, setTitleFontSize] = useState("calc((100vw - clamp(40px, 8vw, 112px)) / 7)");
  const [latchScrollY, setLatchScrollY] = useState(1000);
  const latchRef = useRef(1000);
  useEffect(() => { latchRef.current = latchScrollY; }, [latchScrollY]);

  // Fit title font size: measure via hidden span to avoid display:block scrollWidth issue
  const measureSpanRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const fit = () => {
      const span = measureSpanRef.current;
      const container = titleContainerRef.current;
      if (!span || !container) return;
      const textW = span.getBoundingClientRect().width;
      const containerW = container.offsetWidth;
      if (textW === 0 || containerW === 0) return;
      setTitleFontSize(`${(containerW / textW) * 100}px`);
    };
    document.fonts.ready.then(fit);
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [siteData]);

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
  const desc = siteData?.landingDescriptionEn || siteData?.landingDescription || "";
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
          top: "67px",
          left: GUTTER,
          right: `calc(${GUTTER} - ${RIGHT_OPT_TITLE}px)`,
          zIndex: 20,
          pointerEvents: "none",
          mixBlendMode: "difference",
          y: titleY,
        }}
      >
        <div style={{ position: "relative" }}>
          {/* Hidden measurement span — same font settings at 100px base */}
          <span
            ref={measureSpanRef}
            aria-hidden="true"
            style={{
              position: "absolute",
              visibility: "hidden",
              whiteSpace: "nowrap",
              fontFamily: FONT,
              fontWeight: 300,
              fontSize: "100px",
              letterSpacing: "-0.045em",
              pointerEvents: "none",
            }}
          >
            {title}
          </span>
          <motion.h1
            ref={titleH1Ref}
            initial={{ filter: "blur(28px)", opacity: 0 }}
            animate={titleControls}
            style={{
              fontFamily: FONT,
              fontWeight: 300,
              fontSize: titleFontSize,
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
              right: `${-RIGHT_OPT_SUBTITLE}px`,
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
          isHovered={hoveredIdx === i}
          anyHovered={hoveredIdx !== null}
          hoveredCenter={hoveredCenter}
          screenW={screenW}
          onHoverChange={(hover, center) => {
            setHoveredIdx(hover ? i : null);
            setHoveredCenter(hover ? (center ?? null) : null);
          }}
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
