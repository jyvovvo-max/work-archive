"use client";
import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Project } from "./types";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtDate = (month: string, year: string) =>
  `${MONTHS[Math.max(0, parseInt(month, 10) - 1)]}, ${year}`;

function WorkCard({ project, onOpen, colIdx }: {
  project: Project;
  onOpen: (p: Project) => void;
  colIdx: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-6% 0px" });
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      onClick={() => onOpen(project)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: "pointer", position: "relative", overflow: "hidden" }}
    >
      {/* Image — blur-to-clean on scroll (no y-transform to avoid overflow clipping) */}
      <motion.div
        animate={inView
          ? { filter: "blur(0px)", opacity: 1 }
          : { filter: "blur(14px)", opacity: 0 }
        }
        initial={{ filter: "blur(14px)", opacity: 0 }}
        transition={{ duration: 1.1, delay: colIdx * 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.img
          src={project.img}
          alt={project.title}
          animate={{ scale: hovered ? 1.04 : 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }}
        />
      </motion.div>

      {/* White acrylic bar — slides down from top on hover (80% height padding) */}
      <motion.div
        animate={{ y: hovered ? "0%" : "-100%" }}
        initial={{ y: "-100%" }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "9px 16px",
          background: "rgba(255,255,255,0.30)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          pointerEvents: "none",
        }}
      >
        <span style={{
          fontFamily: FONT,
          fontWeight: 300,
          fontSize: "clamp(16px, 1.6vw, 24px)",
          letterSpacing: "-0.01em",
          color: "#0A0A0A",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {project.title}
        </span>
        <span style={{
          fontFamily: FONT,
          fontWeight: 300,
          fontSize: "clamp(11px, 0.9vw, 13px)",
          letterSpacing: "0.04em",
          color: "rgba(10,10,10,0.5)",
          flexShrink: 0,
        }}>
          {fmtDate(project.month, project.year)}
        </span>
      </motion.div>
    </div>
  );
}

interface WorksGridProps {
  projects: Project[];
  onOpen: (p: Project) => void;
}

export default function WorksGrid({ projects, onOpen }: WorksGridProps) {
  const [cols, setCols] = useState(2);

  useEffect(() => {
    const update = () => setCols(window.innerWidth < 640 ? 1 : 2);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (projects.length === 0) return null;

  return (
    <section style={{ background: "#F0F0F0" }}>
      {/* "Selected Work" label bar — sticky at header height */}
      <div style={{
        position: "sticky",
        top: "52px",
        zIndex: 10,
        height: "52px",
        display: "flex",
        alignItems: "center",
        padding: "0 clamp(20px, 4vw, 56px)",
        background: "rgba(240,240,240,0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(0,0,0,0.15)",
        borderBottom: "1px solid rgba(0,0,0,0.15)",
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

      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: "clamp(3px, 0.4vw, 6px)",
      }}>
        {projects.map((p, i) => (
          <WorkCard
            key={p.id}
            project={p}
            onOpen={onOpen}
            colIdx={i % cols}
          />
        ))}
      </div>
    </section>
  );
}
