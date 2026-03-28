"use client";
import { useState, useRef } from "react";
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
      {/* Image */}
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

      {/* Hover overlay — title + date appear on hover */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.22 }}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "40px 16px 14px",
          background: "linear-gradient(transparent, rgba(10,10,10,0.82))",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "12px",
          pointerEvents: "none",
        }}
      >
        <span style={{
          fontFamily: FONT,
          fontWeight: 300,
          fontSize: "15px",
          letterSpacing: "0.01em",
          color: "#F0EDE8",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {project.title}
        </span>
        <span style={{
          fontFamily: FONT,
          fontWeight: 300,
          fontSize: "13px",
          letterSpacing: "0.05em",
          color: "rgba(240,237,232,0.55)",
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
  if (projects.length === 0) return null;

  return (
    <section style={{
      padding: "clamp(64px, 8vh, 120px) clamp(20px, 4vw, 56px) clamp(80px, 10vh, 140px)",
      background: "#0A0A0A",
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "clamp(4px, 0.6vw, 10px)",
      }}>
        {projects.map((p, i) => (
          <WorkCard
            key={p.id}
            project={p}
            onOpen={onOpen}
            colIdx={i % 2}
          />
        ))}
      </div>
    </section>
  );
}
