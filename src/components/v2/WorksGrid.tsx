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
      style={{ cursor: "pointer" }}
    >
      {/* Image */}
      <div style={{ overflow: "hidden", position: "relative" }}>
        <motion.div
          animate={inView
            ? { filter: "blur(0px)", opacity: 1, y: 0 }
            : { filter: "blur(14px)", opacity: 0, y: 32 }
          }
          initial={{ filter: "blur(14px)", opacity: 0, y: 32 }}
          transition={{
            duration: 1.1,
            delay: colIdx * 0.1,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <motion.img
            src={project.img}
            alt={project.title}
            animate={{ scale: hovered ? 1.03 : 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </motion.div>
      </div>

      {/* Meta row */}
      <motion.div
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{
          duration: 0.65,
          delay: 0.15 + colIdx * 0.1,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{
          padding: "12px 0 8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "8px",
        }}
      >
        {/* Title — flip on hover */}
        <div style={{ overflow: "hidden", flex: 1 }}>
          <motion.span
            animate={{ y: hovered ? "-100%" : "0%" }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{
              display: "block",
              fontFamily: FONT,
              fontWeight: 300,
              fontSize: "13px",
              letterSpacing: "0.01em",
              color: "#F0EDE8",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {project.title}
          </motion.span>
          <motion.span
            animate={{ y: hovered ? "-100%" : "0%" }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{
              display: "block",
              fontFamily: FONT,
              fontWeight: 300,
              fontSize: "13px",
              letterSpacing: "0.01em",
              color: "rgba(240,237,232,0.55)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginTop: "-1.4em",
            }}
          >
            {project.category}
          </motion.span>
        </div>

        <span style={{
          fontFamily: FONT,
          fontWeight: 300,
          fontSize: "11px",
          letterSpacing: "0.05em",
          color: "rgba(240,237,232,0.26)",
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
  const [cols, setCols] = useState(3);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setCols(w >= 1024 ? 3 : w >= 640 ? 2 : 1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (projects.length === 0) return null;

  return (
    <section style={{
      padding: "clamp(72px, 10vh, 140px) clamp(20px, 4vw, 56px) clamp(80px, 10vh, 140px)",
      background: "#0A0A0A",
    }}>
      {/* Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: `clamp(48px, 6vh, 88px) clamp(16px, 2.5vw, 32px)`,
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
