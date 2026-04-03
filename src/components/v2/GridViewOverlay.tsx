"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Project, SiteData, Lang } from "./types";
import AboutSection from "./AboutSection";
import Footer from "./Footer";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtDate = (month: string, year: string) =>
  `${MONTHS[Math.max(0, parseInt(month, 10) - 1)]}, ${year}`;

interface GridViewProps {
  projects: Project[];
  categories: string[];
  siteData: SiteData | null;
  aboutExpanded: boolean;
  onClose: () => void;
  onOpen: (p: Project) => void;
  lang?: Lang;
}

// Category filter pills — sticky bar, sits below always-visible header (top: 52px)
function CategoryBar({ categories, active, onChange }: {
  categories: string[];
  active: string | null;
  onChange: (c: string | null) => void;
}) {
  if (categories.length === 0) return null;
  return (
    <div style={{
      padding: "clamp(12px, 1.8vw, 20px) clamp(12px, 2vw, 24px)",
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      background: "rgba(240,240,240,0.88)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      borderBottom: "1px solid rgba(0,0,0,0.08)",
    }}>
      {["All", ...categories].map(cat => {
        const isAll = cat === "All";
        const isActive = isAll ? active === null : active === cat;
        return (
          <button
            key={cat}
            onClick={() => onChange(isAll ? null : cat)}
            style={{
              fontFamily: FONT,
              fontWeight: isActive ? 400 : 300,
              fontSize: "clamp(11px, 1.4vw, 18px)",
              letterSpacing: "0.02em",
              background: isActive ? "#0A0A0A" : "rgba(255,255,255,0.70)",
              border: `1px solid ${isActive ? "#0A0A0A" : "rgba(0,0,0,0.12)"}`,
              borderRadius: "100px",
              padding: "clamp(4px, 0.6vh, 7px) clamp(12px, 1.6vw, 22px)",
              color: isActive ? "#F0F0F0" : "rgba(0,0,0,0.55)",
              cursor: "pointer",
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              transition: "background 0.18s, color 0.18s, border-color 0.18s",
            }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.95)"; e.currentTarget.style.color = "#0A0A0A"; } }}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.70)"; e.currentTarget.style.color = "rgba(0,0,0,0.55)"; } }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        );
      })}
    </div>
  );
}

function GridCard({ project, onClose, onOpen, idx }: {
  project: Project;
  onClose: () => void;
  onOpen: (p: Project) => void;
  idx: number;
}) {
  const [hovered, setHovered] = useState(false);
  const [isCentered, setIsCentered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsCentered(entry.isIntersecting),
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isMobile]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.02, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => { onClose(); onOpen(project); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: "pointer", position: "relative", overflow: "hidden" }}
    >
      {/* Image — scales on hover */}
      <motion.img
        src={project.img}
        alt={project.title}
        animate={{ scale: hovered ? 1.04 : 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }}
      />

      {/* White acrylic bar — centered on mobile, hover on desktop */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <motion.div
          animate={{ y: isCentered || (!isMobile && hovered) ? "0%" : "-100%" }}
          initial={{ y: "-100%" }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            padding: "8px 12px",
            background: "rgba(255,255,255,0.30)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
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
            {fmtDate(project.month, project.year)}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function GridViewOverlay({
  projects,
  categories,
  siteData,
  aboutExpanded,
  onClose,
  onOpen,
  lang = "ko",
}: GridViewProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cols, setCols] = useState(3);
  const aboutRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aboutExpanded) return;
    const t = setTimeout(() => {
      aboutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(t);
  }, [aboutExpanded]);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setCols(w >= 1024 ? 3 : w >= 640 ? 2 : 1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

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
      id="grid-overlay-scroll"
      style={{
        position: "fixed", inset: 0, zIndex: 550,
        background: "#F0F0F0",
        overflowY: "auto", overflowX: "hidden",
        scrollbarWidth: "none", color: "#0A0A0A",
        paddingTop: "52px",
      }}
    >
      {/* Category filter pills — sticky below header */}
      <CategoryBar
        categories={categories}
        active={activeCategory}
        onChange={setActiveCategory}
      />

      {/* Grid */}
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

      {/* About — expands between grid and footer when aboutExpanded */}
      <AnimatePresence>
        {aboutExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden", borderTop: "1px solid rgba(0,0,0,0.08)" }}
          >
            <AboutSection siteData={siteData} ref={aboutRef} lang={lang} />
          </motion.div>
        )}
      </AnimatePresence>

      <Footer siteData={siteData} />
    </motion.div>
  );
}
