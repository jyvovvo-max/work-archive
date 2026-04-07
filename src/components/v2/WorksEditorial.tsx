"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { Project } from "./types";
import { GUTTER, GRID_COLS } from "./layout";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtCode = (id: number, month: string, year: string) =>
  `${String(id).padStart(3, "0")}-${MONTHS[Math.max(0, parseInt(month, 10) - 1)]}-${year}`;

// Seeded random for stable left/right alternation + image span
function seededRand(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

type ImgSlot = {
  span: number;   // columns this image occupies
  start: number;  // 1-based grid-column-start
  srcIdx: number; // 0=cover, 1=images[1], 2=images[2]
};

type CardLayout = {
  images: ImgSlot[];
  codeSide: "left" | "right";
  parallaxSpeed: number; // 0~1, multiplied against scroll offset
};

function pickLayouts(projects: Project[]): CardLayout[] {
  const rand = seededRand(projects.reduce((s, p) => s + p.id, 0));
  const results: CardLayout[] = [];
  const recentSpans: number[][] = [];
  // Track all image start columns from previous card
  let lastImgStarts: number[] = [];

  for (const project of projects) {
    const hasExtra = project.images && project.images.length > 1;

    // Pick 1~2 images (2 only if project has extra images)
    const imgCount = hasExtra && rand() > 0.45 ? 2 : 1;

    // Generate spans (2~3 cols each), with adjacency dedup
    const MAX_TRIES = 30;
    let bestSpans: number[] = [];
    let bestImgStart = 1;
    let bestCodeSide: "left" | "right" = "left";

    for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
      const spans: number[] = [];
      let remaining = GRID_COLS - 1; // reserve 1 col for code
      for (let i = 0; i < imgCount; i++) {
        const isLast = i === imgCount - 1;
        if (isLast) {
          spans.push(Math.min(Math.max(remaining, 2), 3));
        } else {
          const span = rand() > 0.5 ? 3 : 2;
          spans.push(span);
          remaining -= span;
        }
      }

      const totalImgCols = spans.reduce((a, b) => a + b, 0);
      // Code takes 1 col, images take totalImgCols
      // Randomly place the image block within the 7-col grid, snapped to columns
      const maxStart = GRID_COLS - totalImgCols; // code can go before or after
      // Pick a random starting column for images (1-based), ensuring code has at least 1 col
      const possibleStarts: number[] = [];
      for (let s = 1; s <= maxStart + 1; s++) {
        // Code must fit: either before images (s > 1) or after (s + totalImgCols <= 7)
        const spaceLeft = s - 1;
        const spaceRight = GRID_COLS - (s - 1 + totalImgCols);
        if (spaceLeft >= 1 || spaceRight >= 1) {
          possibleStarts.push(s);
        }
      }
      const imgStart = possibleStarts[Math.floor(rand() * possibleStarts.length)];
      const codeSide: "left" | "right" = (imgStart - 1) >= 1 ? "left" : "right";

      // Adjacency rule: same span value appears < 3 times in 3 consecutive cards
      const window3 = recentSpans.slice(-2);
      const allSpansInWindow = [...window3.flat(), ...spans];
      const count2 = allSpansInWindow.filter(s => s === 2).length;
      const count3 = allSpansInWindow.filter(s => s === 3).length;
      const spanOk = count2 < 3 && count3 < 3;

      // Anti-clustering: no image in this card starts at same column as any image in previous card
      const curStarts: number[] = [];
      let c = imgStart;
      for (const sp of spans) { curStarts.push(c); c += sp; }
      const posOk = curStarts.every(s => !lastImgStarts.includes(s));

      if (spanOk && posOk) {
        bestSpans = spans;
        bestImgStart = imgStart;
        bestCodeSide = codeSide;
        break;
      }
      // Keep as fallback
      bestSpans = spans;
      bestImgStart = imgStart;
      bestCodeSide = codeSide;
    }

    // Position images snapped to grid columns
    const images: ImgSlot[] = [];
    let col = bestImgStart;
    for (let i = 0; i < bestSpans.length; i++) {
      images.push({
        span: bestSpans[i],
        start: col,
        srcIdx: i,
      });
      col += bestSpans[i];
    }

    lastImgStarts = images.map(img => img.start);
    recentSpans.push(bestSpans);
    // Random parallax speed: 0.0 ~ 0.35
    const parallaxSpeed = rand() * 0.35;
    results.push({ images, codeSide: bestCodeSide, parallaxSpeed });
  }
  return results;
}

// ── Grid lines background ──
function GridLines() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        left: GUTTER,
        right: GUTTER,
        bottom: 0,
        display: "grid",
        gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
        gap: "clamp(4px, 0.5vw, 8px)",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {Array.from({ length: GRID_COLS }).map((_, i) => (
        <div
          key={i}
          style={{
            borderLeft: "1px solid rgba(0,0,0,0.06)",
            ...(i === GRID_COLS - 1 ? { borderRight: "1px solid rgba(0,0,0,0.06)" } : {}),
          }}
        />
      ))}
    </div>
  );
}

// ── Parallax image slot ──
function ParallaxSlot({
  src, alt, slot, speed, inView, idx, hovered,
  onHover, onClick,
}: {
  src: string; alt: string; slot: ImgSlot; speed: number;
  inView: boolean; idx: number; hovered: boolean;
  onHover: (h: boolean) => void; onClick: () => void;
}) {
  const slotRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: slotRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 80, -speed * 80]);

  return (
    <div
      ref={slotRef}
      style={{
        gridColumn: `${slot.start} / span ${slot.span}`,
        gridRow: 1,
        overflow: "hidden",
        cursor: "pointer",
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onClick}
    >
      <motion.div
        style={{ y }}
      >
        <motion.div
          animate={inView
            ? { filter: "blur(0px)", opacity: 1 }
            : { filter: "blur(14px)", opacity: 0 }
          }
          initial={{ filter: "blur(14px)", opacity: 0 }}
          transition={{ duration: 1.1, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <img
            src={src}
            alt={alt}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── Single card ──
function EditorialCard({
  project,
  layout,
  onOpen,
  isMobile,
}: {
  project: Project;
  layout: CardLayout;
  onOpen: (p: Project) => void;
  isMobile: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-6% 0px" });
  const [hovered, setHovered] = useState(false);

  const code = fmtCode(project.id, project.month, project.year);

  // ── Mobile: simple stack ──
  if (isMobile) {
    return (
      <div
        ref={ref}
        style={{
          padding: `0 ${GUTTER}`,
          marginBottom: "40px",
        }}
      >
        {/* Code above image on mobile */}
        <div style={{
          fontFamily: FONT,
          fontWeight: 400,
          fontSize: "12px",
          letterSpacing: "0.06em",
          color: "rgba(10,10,10,0.35)",
          marginBottom: "8px",
        }}>
          {code}
        </div>

        {/* Image + hover title */}
        <div
          style={{ position: "relative", overflow: "hidden", cursor: "pointer" }}
          onClick={() => onOpen(project)}
        >
          <motion.div
            animate={inView
              ? { filter: "blur(0px)", opacity: 1 }
              : { filter: "blur(14px)", opacity: 0 }
            }
            initial={{ filter: "blur(14px)", opacity: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src={project.img}
              alt={project.title}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
              }}
            />
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Desktop: 7-col grid ──
  return (
    <div
      ref={ref}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
        gap: "clamp(4px, 0.5vw, 8px)",
        padding: `0 ${GUTTER}`,
        marginBottom: "clamp(56px, 7vw, 100px)",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* Code — flush against image edge, top-aligned */}
      <div
        style={{
          gridColumn: layout.codeSide === "left"
            ? `1 / ${layout.images[0].start}`
            : `${layout.images[layout.images.length - 1].start + layout.images[layout.images.length - 1].span} / -1`,
          gridRow: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: layout.codeSide === "left" ? "flex-end" : "flex-start",
          paddingTop: "2px",
        }}
      >
        <span style={{
          fontFamily: FONT,
          fontWeight: 400,
          fontSize: "clamp(11px, 1.02vw, 16px)",
          letterSpacing: "0.05em",
          color: "rgba(10,10,10,0.32)",
          whiteSpace: "nowrap",
        }}>
          {code}
        </span>

        {/* Title — blur-to-clean under code on hover */}
        <motion.span
          animate={hovered
            ? { opacity: 1, filter: "blur(0px)" }
            : { opacity: 0, filter: "blur(8px)" }
          }
          initial={{ opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: "clamp(25px, 2.24vw, 35px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: "#0A0A0A",
            marginTop: "8px",
            display: "block",
            textAlign: layout.codeSide === "left" ? "right" : "left",
            wordBreak: "keep-all",
            overflowWrap: "break-word",
          }}
        >
          {project.title}
        </motion.span>
      </div>

      {/* Images — each slot has its own parallax speed */}
      {layout.images.map((slot, idx) => {
        const src = slot.srcIdx === 0
          ? project.img
          : project.images && project.images[slot.srcIdx]
            ? project.images[slot.srcIdx]
            : project.img;
        // Each slot gets a different speed derived from card speed + slot index
        const slotSpeed = layout.parallaxSpeed + (idx + 1) * 0.15;
        return (
          <ParallaxSlot
            key={idx}
            src={src}
            alt={project.title}
            slot={slot}
            speed={slotSpeed}
            inView={inView}
            idx={idx}
            hovered={hovered}
            onHover={setHovered}
            onClick={() => onOpen(project)}
          />
        );
      })}

    </div>
  );
}

// ── Main ──
interface WorksEditorialProps {
  projects: Project[];
  onOpen: (p: Project) => void;
}

export default function WorksEditorial({ projects, onOpen }: WorksEditorialProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Shuffle projects once on mount (seeded for stable order)
  const shuffled = useMemo(() => {
    const rand = seededRand(projects.reduce((s, p) => s + p.id * 31, 7));
    const arr = [...projects];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [projects]);

  const layouts = useMemo(() => pickLayouts(shuffled), [shuffled]);

  if (projects.length === 0) return (
    <section style={{ background: "#F0F0F0", minHeight: "100vh" }} />
  );

  return (
    <section style={{ background: "#F0F0F0", position: "relative" }}>
      {/* GridLines disabled */}

      {/* "Selected Work" label */}
      <div style={{
        height: "52px",
        display: "flex",
        alignItems: "center",
        padding: `0 ${GUTTER}`,
        borderTop: "1px solid rgba(0,0,0,0.15)",
        borderBottom: "1px solid rgba(0,0,0,0.15)",
        marginBottom: isMobile ? "32px" : "clamp(48px, 6vw, 80px)",
        position: "relative",
        zIndex: 1,
      }}>
        <span style={{
          fontFamily: FONT,
          fontWeight: 300,
          fontSize: "clamp(24px, 2.8vw, 38px)",
          letterSpacing: "-0.02em",
          color: "#0A0A0A",
        }}>
          Selected Work
        </span>
      </div>

      {shuffled.map((p, i) => (
        <EditorialCard
          key={p.id}
          project={p}
          layout={layouts[i]}
          onOpen={onOpen}
          isMobile={isMobile}
        />
      ))}
    </section>
  );
}
