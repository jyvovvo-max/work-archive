"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Project } from "./types";
import { GUTTER, GRID_COLS } from "./layout";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtCode = (id: number, month: string, year: string) =>
  `${String(id).padStart(3, "0")}-${MONTHS[Math.max(0, parseInt(month, 10) - 1)]}-${year}`;

function seededRand(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

// ── Acrylic info panel (1 grid column wide) ──
function InfoPanel({ project, visible }: { project: Project; visible: boolean }) {
  const code = fmtCode(project.id, project.month, project.year);
  const desc = project.description || "";
  const truncated = desc.length > 120 ? desc.slice(0, 120) + "…" : desc;

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: `calc((100vw - ${GUTTER} - ${GUTTER}) / ${GRID_COLS} * 2 + ${GUTTER})`,
            background: "rgba(255,255,255,0.10)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            borderRight: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            padding: `clamp(32px, 4vh, 56px) clamp(16px, 1.5vw, 28px)`,
            zIndex: 5,
            overflow: "hidden",
          }}
        >
          {/* Title */}
          <h3 style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: "clamp(36px, 3.6vw, 60px)",
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
            color: "#FFFFFF",
            margin: "0 0 12px",
            wordBreak: "keep-all",
            overflowWrap: "break-word",
          }}>
            {project.title}
          </h3>

          {/* Code */}
          <span style={{
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: "clamp(13px, 1.2vw, 19px)",
            letterSpacing: "0.06em",
            color: "rgba(255,255,255,0.4)",
            marginBottom: "20px",
          }}>
            {code}
          </span>

          {/* Description */}
          <p style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: "clamp(14px, 1.25vw, 20px)",
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.5)",
            margin: "0 0 20px",
          }}>
            {truncated}
          </p>

          {/* Credits — pill outlines */}
          {project.coworkers.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {project.coworkers.map((name, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: FONT,
                    fontWeight: 400,
                    fontSize: "clamp(9px, 0.7vw, 11px)",
                    letterSpacing: "0.04em",
                    color: "rgba(255,255,255,0.35)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "100px",
                    padding: "4px 10px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Single card ──
function Card({
  project,
  onOpen,
  isActive,
  prevActive,
}: {
  project: Project;
  onOpen: (p: Project) => void;
  isActive: boolean;
  prevActive: boolean;
}) {
  // Show panel only after image has cleared blur
  const [panelVisible, setPanelVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      setPanelVisible(true);
    } else {
      setPanelVisible(false);
    }
  }, [isActive]);

  return (
    <div
      style={{
        flex: "0 0 100vw",
        height: "100%",
        position: "relative",
        cursor: "pointer",
        overflow: "hidden",
      }}
      onClick={() => onOpen(project)}
    >
      {/* Background fill for non-wide images */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "#0A0A0A",
      }} />

      {/* Image — fills card, cover crop */}
      <motion.img
        src={project.img}
        alt={project.title}
        initial={false}
        animate={isActive
          ? { filter: "blur(0px)", opacity: 1 }
          : prevActive
            ? { filter: "blur(0px)", opacity: 1 }
            : { filter: "blur(12px)", opacity: 0.7 }
        }
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
        }}
      />

      {/* Acrylic info panel — 1 grid column */}
      <InfoPanel project={project} visible={panelVisible} />

      {/* Index — bottom right */}
      <div style={{
        position: "absolute",
        bottom: "clamp(24px, 3vh, 40px)",
        right: GUTTER,
        fontFamily: FONT,
        fontWeight: 300,
        fontSize: "12px",
        letterSpacing: "0.08em",
        color: "rgba(255,255,255,0.3)",
        zIndex: 6,
      }}>
        {String(project.id).padStart(3, "0")}
      </div>
    </div>
  );
}

// ── Main ──
interface WorksHScrollProps {
  projects: Project[];
  onOpen: (p: Project) => void;
}

export default function WorksHScroll({ projects, onOpen }: WorksHScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(-1);

  const shuffled = useMemo(() => {
    const rand = seededRand(projects.reduce((s, p) => s + p.id * 31, 7));
    const arr = [...projects];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [projects]);

  // Vertical scroll → horizontal movement
  const { scrollY } = useScroll();
  const [xPx, setXPx] = useState(0);

  useMotionValueEvent(scrollY, "change", (v) => {
    const el = containerRef.current;
    if (!el) return;
    const top = el.offsetTop;
    const h = el.offsetHeight - window.innerHeight;
    if (h <= 0) return;
    const progress = Math.max(0, Math.min((v - top) / h, 1));
    const total = shuffled.length;
    setXPx(-progress * (total - 1) * window.innerWidth);
    const idx = Math.round(progress * (total - 1));
    const clamped = Math.max(0, Math.min(idx, total - 1));
    if (clamped !== activeIdx) {
      setPrevIdx(activeIdx);
      setActiveIdx(clamped);
    }
  });

  // Auto-advance timer: move to next card if idle for 5s
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvance = useCallback(() => {
    if (!containerRef.current) return;
    const total = shuffled.length;
    const nextIdx = activeIdx + 1;
    if (nextIdx >= total) return; // don't loop, let scroll continue down
    const targetProgress = nextIdx / (total - 1);
    const containerTop = containerRef.current.offsetTop;
    const containerH = containerRef.current.offsetHeight - window.innerHeight;
    const targetScroll = containerTop + containerH * targetProgress;
    window.scrollTo({ top: targetScroll, behavior: "smooth" });
  }, [activeIdx, shuffled.length]);

  // Reset timer on scroll or activeIdx change
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(autoAdvance, 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [activeIdx, autoAdvance]);

  if (projects.length === 0) return (
    <section style={{ background: "#0A0A0A", minHeight: "100vh" }} />
  );

  return (
    <section
      ref={containerRef}
      style={{
        height: `${(shuffled.length + 1) * 100}vh`,
        position: "relative",
      }}
    >
      {/* "Selected Work" label */}
      <div style={{
        position: "sticky",
        top: 0,
        height: "52px",
        display: "flex",
        alignItems: "center",
        padding: `0 ${GUTTER}`,
        background: "#F0F0F0",
        borderTop: "1px solid rgba(0,0,0,0.15)",
        borderBottom: "1px solid rgba(0,0,0,0.15)",
        zIndex: 10,
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

        {/* Dot indicators */}
        <div style={{
          marginLeft: "auto",
          display: "flex",
          gap: "8px",
          alignItems: "center",
        }}>
          {shuffled.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === activeIdx ? "20px" : "6px",
                height: "6px",
                borderRadius: "3px",
                background: i === activeIdx ? "#0A0A0A" : "rgba(10,10,10,0.2)",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* Sticky horizontal track */}
      <div style={{
        position: "sticky",
        top: "52px",
        height: "calc(100vh - 52px)",
        overflow: "hidden",
      }}>
        <div
          style={{
            display: "flex",
            height: "100%",
            transform: `translateX(${xPx}px)`,
            transition: "transform 0.1s linear",
          }}
        >
          {shuffled.map((p, i) => (
            <Card
              key={p.id}
              project={p}
              onOpen={onOpen}
              isActive={i === activeIdx}
              prevActive={i === prevIdx}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
