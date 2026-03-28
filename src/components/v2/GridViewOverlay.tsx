"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Project } from "./types";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";

// id-seeded aspect ratio for visual variety
const RATIOS = ["4/3","3/4","16/9","1/1","2/3","5/4","3/2","4/5"];
const seedRatio = (id: number) => RATIOS[id % RATIOS.length];

interface GridViewProps {
  projects: Project[];
  categories: string[];
  onClose: () => void;
  onOpen: (p: Project) => void;
}

export default function GridViewOverlay({ projects, categories, onClose, onOpen }: GridViewProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory
    ? projects.filter(p => p.category === activeCategory)
    : projects;

  return (
    <motion.div
      key="grid-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 550,
        background: "#0A0A0A",
        overflowY: "auto",
        overflowX: "hidden",
        scrollbarWidth: "none",
        color: "#F0EDE8",
      }}
    >
      {/* Header bar */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "rgba(10,10,10,0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(240,237,232,0.07)",
        padding: "0 clamp(20px, 4vw, 56px)",
        height: "52px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "clamp(12px, 2vw, 24px)",
      }}>
        {/* Category filter */}
        <div style={{ display: "flex", gap: "clamp(10px, 1.8vw, 22px)", flexWrap: "wrap", overflow: "hidden" }}>
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
                  color: isActive ? "#F0EDE8" : "rgba(240,237,232,0.28)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 0",
                  transition: "color 0.18s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = "rgba(240,237,232,0.6)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = "rgba(240,237,232,0.28)"; }}
              >
                _{cat}
              </button>
            );
          })}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: "18px",
            lineHeight: 1,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(240,237,232,0.3)",
            padding: "4px",
            flexShrink: 0,
            transition: "color 0.18s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#F0EDE8")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,237,232,0.3)")}
        >
          ✕
        </button>
      </div>

      {/* Masonry grid using CSS columns */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory ?? "all"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          style={{
            padding: "clamp(24px, 3vw, 40px) clamp(20px, 4vw, 56px)",
            columnCount: 3,
            columnGap: "clamp(8px, 1.2vw, 16px)",
          }}
        >
          {filtered.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => { onClose(); onOpen(project); }}
              style={{
                breakInside: "avoid",
                marginBottom: "clamp(8px, 1.2vw, 16px)",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <div style={{ position: "relative", overflow: "hidden" }}>
                <motion.img
                  src={project.img}
                  alt={project.title}
                  whileHover={{ scale: 1.04 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    width: "100%",
                    aspectRatio: seedRatio(project.id),
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                {/* Hover overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(10,10,10,0.65)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: "10px 12px",
                    gap: "2px",
                  }}
                >
                  <span style={{
                    fontFamily: FONT,
                    fontWeight: 300,
                    fontSize: "11px",
                    letterSpacing: "0.02em",
                    color: "#F0EDE8",
                  }}>
                    {project.title}
                  </span>
                  <span style={{
                    fontFamily: FONT,
                    fontWeight: 300,
                    fontSize: "9px",
                    letterSpacing: "0.05em",
                    color: "rgba(240,237,232,0.45)",
                  }}>
                    {project.year}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
