"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Project } from "./types";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";

interface GridViewProps {
  projects: Project[];
  categories: string[];
  onClose: () => void;
  onOpen: (p: Project) => void;
}

function GridCard({ project, onClose, onOpen, idx }: {
  project: Project;
  onClose: () => void;
  onOpen: (p: Project) => void;
  idx: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.02, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => { onClose(); onOpen(project); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: "pointer", position: "relative", overflow: "hidden" }}
    >
      <img
        src={project.img}
        alt={project.title}
        style={{ width: "100%", height: "auto", display: "block" }}
      />
      {/* White acrylic hover bar slides from top */}
      <motion.div
        animate={{ y: hovered ? "0%" : "-100%" }}
        initial={{ y: "-100%" }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          padding: "8px 12px",
          background: "rgba(255,255,255,0.70)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
          pointerEvents: "none",
        }}
      >
        <span style={{
          fontFamily: FONT, fontWeight: 300, fontSize: "12px",
          letterSpacing: "-0.01em", color: "#0A0A0A",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {project.title}
        </span>
        <span style={{
          fontFamily: FONT, fontWeight: 300, fontSize: "10px",
          color: "rgba(0,0,0,0.45)", flexShrink: 0,
        }}>
          {project.year}
        </span>
      </motion.div>
    </motion.div>
  );
}

export default function GridViewOverlay({ projects, categories, onClose, onOpen }: GridViewProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
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

  // Filter: match comma-separated categories
  const filtered = activeCategory
    ? projects.filter(p =>
        p.category?.split(",").map(c => c.trim()).includes(activeCategory)
      )
    : projects;

  return (
    <motion.div
      key="grid-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: "fixed", inset: 0, zIndex: 550,
        background: "#F0F0F0",
        overflowY: "auto", overflowX: "hidden",
        scrollbarWidth: "none", color: "#0A0A0A",
      }}
    >
      {/* Sticky header: [←] flush-left + category filters */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(240,240,240,0.82)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(0,0,0,0.15)",
        height: "52px",
        display: "flex",
        alignItems: "center",
        gap: "clamp(12px, 2vw, 24px)",
      }}>
        {/* Back button — flush to left edge, full header height */}
        <button
          onClick={onClose}
          style={{
            width: "52px",
            height: "52px",
            flexShrink: 0,
            border: "none",
            borderRight: "1px solid rgba(0,0,0,0.15)",
            background: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.04)")}
          onMouseLeave={e => (e.currentTarget.style.background = "none")}
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <line x1="8" y1="2" x2="2" y2="8" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="2" y1="8" x2="8" y2="14" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Category filters */}
        <div style={{
          display: "flex",
          gap: "clamp(10px, 1.8vw, 22px)",
          flexWrap: "wrap",
          overflow: "hidden",
          flex: 1,
          paddingRight: "clamp(20px, 4vw, 56px)",
        }}>
          {["All", ...categories].map(cat => {
            const isAll = cat === "All";
            const isActive = isAll ? activeCategory === null : activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(isAll ? null : cat)}
                style={{
                  fontFamily: FONT,
                  fontWeight: 300,
                  fontSize: "10px",
                  letterSpacing: "0.06em",
                  color: isActive ? "#0A0A0A" : "rgba(0,0,0,0.28)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 0",
                  transition: "color 0.18s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = "rgba(0,0,0,0.65)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = "rgba(0,0,0,0.28)"; }}
              >
                _{cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid — 3/2/1 columns, natural image ratios */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory ?? "all"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: "clamp(3px, 0.4vw, 6px)",
            padding: "clamp(3px, 0.4vw, 6px)",
          }}
        >
          {filtered.map((project, i) => (
            <GridCard
              key={project.id}
              project={project}
              onClose={onClose}
              onOpen={onOpen}
              idx={i}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
