"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Project } from "./types";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";
const FONT_KR = "'Noto Sans KR', 'JetBrains Mono', sans-serif";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtDate = (m: string, y: string) => `${MONTHS[Math.max(0,parseInt(m,10)-1)]}, ${y}`;

// Reused from v1 — pairs parser
function buildRows(images: string[], pairs?: string): string[][] {
  const pairGroups: number[][] = pairs
    ? pairs.split("|").map(p => p.split("+").map(Number))
    : [];
  const pairedNums = new Set(pairGroups.flat());
  const used = new Set<number>();
  const rows: string[][] = [];
  images.forEach((img, i) => {
    if (used.has(i)) return;
    const group = pairGroups.find(g => g.includes(i));
    if (group) {
      rows.push(group.map(n => images[n]).filter(Boolean));
      group.forEach(n => used.add(n));
    } else {
      if (!pairedNums.has(i)) { rows.push([img]); used.add(i); }
    }
  });
  return rows;
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// Gallery image with blur-to-clean scroll effect
function GalleryImage({ src, alt, index, onLightbox }: {
  src: string; alt: string; index: number; onLightbox: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-12% 0px" });

  return (
    <motion.div
      ref={ref}
      animate={inView
        ? { filter: "blur(0px)", opacity: 1, y: 0 }
        : { filter: "blur(8px)", opacity: 0.5, y: 20 }
      }
      initial={{ filter: "blur(12px)", opacity: 0, y: 24 }}
      transition={{ duration: 0.95, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      onClick={onLightbox}
      style={{ cursor: "zoom-in" }}
    >
      <img src={src} alt={alt} style={{ width: "100%", height: "auto", display: "block" }} />
    </motion.div>
  );
}

// Parallel row with dynamic aspect-ratio flex
function ParallelRow({ row, ri, onLightbox }: {
  row: string[]; ri: number; onLightbox: (idx: number) => void;
}) {
  const [ratios, setRatios] = useState<number[]>(() => row.map(() => 1));
  return (
    <div style={{ display: "flex", gap: "clamp(8px, 1.2vw, 16px)", alignItems: "flex-start" }}>
      {row.map((src, ci) => (
        <div key={ci} style={{ flex: ratios[ci], minWidth: 0 }}>
          <GalleryImage
            src={src}
            alt={`${ri}-${ci}`}
            index={ri + ci}
            onLightbox={() => onLightbox(ci)}
          />
          {/* Hidden img to read natural ratio */}
          <img
            src={src}
            alt=""
            aria-hidden
            style={{ display: "none" }}
            onLoad={e => {
              const img = e.currentTarget;
              setRatios(prev => {
                const next = [...prev];
                next[ci] = img.naturalWidth / img.naturalHeight;
                return next;
              });
            }}
          />
        </div>
      ))}
    </div>
  );
}

interface Props {
  project: Project;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  nextProject?: Project;
  prevProject?: Project;
}

export default function ProjectDetailV2({
  project, onClose, onNext, onPrev, nextProject, prevProject,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const atBottom = useRef(false);
  const atTop = useRef(true);
  const cooldown = useRef(false);
  const touchStartY = useRef(0);
  const overBottom = useRef(0);
  const overTop = useRef(0);
  const OVER_THRESH = 1600;

  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);
  useEffect(() => { onNextRef.current = onNext; }, [onNext]);
  useEffect(() => { onPrevRef.current = onPrev; }, [onPrev]);

  useEffect(() => {
    const u = () => setIsMobile(window.innerWidth < 768);
    u(); window.addEventListener("resize", u);
    return () => window.removeEventListener("resize", u);
  }, []);

  // Reset on project change
  useEffect(() => {
    cooldown.current = true;
    atBottom.current = false;
    overBottom.current = 0;
    overTop.current = 0;
    if (containerRef.current) containerRef.current.scrollTop = 0;
    // Short cooldown to allow scroll reset
    setTimeout(() => { cooldown.current = false; }, 400);
  }, [project.id]);

  // Scroll tracking
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    atTop.current = el.scrollTop < 20;
  };

  // Wheel overscroll → project switch
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (cooldown.current) { e.preventDefault(); return; }
      if (atBottom.current && e.deltaY > 0) {
        e.preventDefault();
        overBottom.current += Math.abs(e.deltaY);
        if (overBottom.current >= OVER_THRESH) {
          overBottom.current = 0;
          cooldown.current = true;
          onNextRef.current();
        }
      } else if (atTop.current && e.deltaY < 0) {
        e.preventDefault();
        overTop.current += Math.abs(e.deltaY);
        if (overTop.current >= OVER_THRESH) {
          overTop.current = 0;
          cooldown.current = true;
          onPrevRef.current();
        }
      } else {
        overBottom.current = 0;
        overTop.current = 0;
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // Touch overscroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
    const onEnd = (e: TouchEvent) => {
      if (cooldown.current) return;
      const dy = touchStartY.current - e.changedTouches[0].clientY;
      if (atBottom.current && dy > 40) { cooldown.current = true; onNextRef.current(); }
      else if (atTop.current && dy < -40) { cooldown.current = true; onPrevRef.current(); }
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => { el.removeEventListener("touchstart", onStart); el.removeEventListener("touchend", onEnd); };
  }, []);

  const allImages = [project.img, ...(project.images ?? [])];
  const galleryImages = project.images ?? []; // exclude cover from gallery rows
  const rows = buildRows(galleryImages.length > 0 ? galleryImages : [project.img], project.pairs);

  const goLightbox = (dir: 1 | -1) =>
    setLightboxIdx(i => i === null ? null : (i + dir + allImages.length) % allImages.length);

  const pad = isMobile ? "0 clamp(16px, 4vw, 32px)" : "0 clamp(32px, 5vw, 72px)";

  return (
    <motion.div
      ref={containerRef}
      onScroll={handleScroll}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 600,
        background: "#0A0A0A",
        overflowY: "auto",
        overflowX: "hidden",
        scrollbarWidth: "none",
        color: "#F0EDE8",
      }}
    >
      {/* ── Close button ── */}
      <button
        onClick={onClose}
        style={{
          position: "fixed",
          top: "22px",
          right: "clamp(20px, 4vw, 56px)",
          zIndex: 700,
          fontFamily: FONT,
          fontWeight: 300,
          fontSize: "20px",
          lineHeight: 1,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(240,237,232,0.3)",
          transition: "color 0.2s",
          padding: "4px",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "#F0EDE8")}
        onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,237,232,0.3)")}
      >
        ✕
      </button>

      {/* ── Cover image (full-width) ── */}
      <motion.div
        initial={{ filter: "blur(20px)", opacity: 0 }}
        animate={{ filter: "blur(0px)", opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: "100%", overflow: "hidden" }}
      >
        <img
          src={project.img}
          alt={project.title}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </motion.div>

      {/* ── Title + Meta ── */}
      <div style={{
        padding: isMobile
          ? "clamp(32px, 5vh, 56px) clamp(16px, 4vw, 32px)"
          : "clamp(48px, 7vh, 80px) clamp(32px, 5vw, 72px)",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: isMobile ? "20px" : "clamp(24px, 4vw, 60px)",
        alignItems: "start",
      }}>
        {/* Left: title + date + category */}
        <div>
          <motion.h1
            initial={{ filter: "blur(16px)", opacity: 0 }}
            animate={{ filter: "blur(0px)", opacity: 1 }}
            transition={{ delay: 0.15, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: FONT,
              fontWeight: 300,
              fontSize: isMobile ? "clamp(24px, 7vw, 40px)" : "clamp(28px, 3.5vw, 52px)",
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              color: "#F0EDE8",
              margin: "0 0 12px",
              wordBreak: "keep-all",
            }}
          >
            {project.title}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.7 }}
            style={{
              fontFamily: FONT,
              fontWeight: 300,
              fontSize: "11px",
              letterSpacing: "0.08em",
              color: "rgba(240,237,232,0.28)",
              display: "flex",
              gap: "16px",
            }}
          >
            <span>{fmtDate(project.month, project.year)}</span>
            {project.category && <span>_{project.category}</span>}
          </motion.div>
        </div>

        {/* Right: description + credits */}
        <div>
          <motion.p
            initial={{ filter: "blur(10px)", opacity: 0, y: 12 }}
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: FONT_KR,
              fontWeight: 300,
              fontSize: isMobile ? "14px" : "clamp(13px, 1.1vw, 16px)",
              lineHeight: 1.75,
              color: "rgba(240,237,232,0.6)",
              margin: "0 0 28px",
              wordBreak: "keep-all",
            }}
          >
            {project.description}
          </motion.p>
          {project.coworkers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.7 }}
              style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}
            >
              {project.coworkers.map(c => (
                <span key={c} style={{
                  fontFamily: FONT,
                  fontWeight: 300,
                  fontSize: "9px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  background: "rgba(240,237,232,0.06)",
                  borderRadius: "100px",
                  padding: "4px 10px",
                  color: "rgba(240,237,232,0.5)",
                }}>
                  {c}
                </span>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Gallery ── */}
      <div style={{
        padding: pad,
        display: "flex",
        flexDirection: "column",
        gap: "clamp(12px, 1.8vw, 20px)",
      }}>
        {project.videoUrl && (() => {
          const vid = getYouTubeId(project.videoUrl!);
          return vid ? (
            <div style={{ borderRadius: "2px", overflow: "hidden", aspectRatio: "16/9" }}>
              <iframe
                src={`https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              />
            </div>
          ) : null;
        })()}

        {rows.map((row, ri) =>
          row.length === 1 ? (
            <GalleryImage
              key={ri}
              src={row[0]}
              alt={`${project.title} — ${ri + 1}`}
              index={ri}
              onLightbox={() => setLightboxIdx(allImages.indexOf(row[0]))}
            />
          ) : (
            <ParallelRow
              key={ri}
              row={row}
              ri={ri}
              onLightbox={ci => setLightboxIdx(allImages.indexOf(row[ci]))}
            />
          )
        )}
      </div>

      {/* ── Bottom navigation: split screen ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        marginTop: "clamp(64px, 8vh, 120px)",
        borderTop: "1px solid rgba(240,237,232,0.07)",
      }}>
        {/* Prev */}
        <motion.div
          onClick={onPrev}
          whileHover={{ backgroundColor: "rgba(240,237,232,0.03)" }}
          transition={{ duration: 0.2 }}
          style={{
            padding: isMobile
              ? "clamp(24px, 4vh, 40px) clamp(16px, 3vw, 32px)"
              : "clamp(32px, 5vh, 56px) clamp(32px, 5vw, 72px)",
            cursor: "pointer",
            borderRight: "1px solid rgba(240,237,232,0.07)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <span style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(240,237,232,0.25)",
          }}>
            ← Previous
          </span>
          <span style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: isMobile ? "14px" : "clamp(14px, 1.6vw, 20px)",
            letterSpacing: "-0.01em",
            color: prevProject ? "#F0EDE8" : "rgba(240,237,232,0.2)",
            wordBreak: "keep-all",
          }}>
            {prevProject?.title || "—"}
          </span>
        </motion.div>

        {/* Next */}
        <motion.div
          onClick={onNext}
          whileHover={{ backgroundColor: "rgba(240,237,232,0.03)" }}
          transition={{ duration: 0.2 }}
          style={{
            padding: isMobile
              ? "clamp(24px, 4vh, 40px) clamp(16px, 3vw, 32px)"
              : "clamp(32px, 5vh, 56px) clamp(32px, 5vw, 72px)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "10px",
          }}
        >
          <span style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(240,237,232,0.25)",
          }}>
            Next →
          </span>
          <span style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: isMobile ? "14px" : "clamp(14px, 1.6vw, 20px)",
            letterSpacing: "-0.01em",
            color: nextProject ? "#F0EDE8" : "rgba(240,237,232,0.2)",
            textAlign: "right",
            wordBreak: "keep-all",
          }}>
            {nextProject?.title || "—"}
          </span>
        </motion.div>
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setLightboxIdx(null)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 800,
              background: "rgba(0,0,0,0.94)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={lightboxIdx}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                src={allImages[lightboxIdx]}
                alt=""
                onClick={e => e.stopPropagation()}
                style={{
                  maxWidth: "88vw",
                  maxHeight: "88vh",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  borderRadius: "2px",
                  display: "block",
                }}
              />
            </AnimatePresence>

            {/* Prev arrow */}
            <button
              onClick={e => { e.stopPropagation(); goLightbox(-1); }}
              style={{
                position: "absolute", left: "24px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(240,237,232,0.4)", zIndex: 810, padding: "8px",
                transition: "color 0.18s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#F0EDE8")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,237,232,0.4)")}
            >
              <svg width="26" height="40" viewBox="0 0 26 40" fill="none">
                <polyline points="20,4 6,20 20,36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Next arrow */}
            <button
              onClick={e => { e.stopPropagation(); goLightbox(1); }}
              style={{
                position: "absolute", right: "24px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(240,237,232,0.4)", zIndex: 810, padding: "8px",
                transition: "color 0.18s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#F0EDE8")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,237,232,0.4)")}
            >
              <svg width="26" height="40" viewBox="0 0 26 40" fill="none">
                <polyline points="6,4 20,20 6,36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Counter */}
            <div style={{
              position: "absolute", bottom: "24px", left: "50%", transform: "translateX(-50%)",
              fontFamily: FONT, fontSize: "10px", letterSpacing: "0.06em",
              color: "rgba(240,237,232,0.28)",
            }}>
              {lightboxIdx + 1} / {allImages.length}
            </div>

            {/* Close */}
            <button
              onClick={() => setLightboxIdx(null)}
              style={{
                position: "absolute", top: "20px", right: "28px",
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(240,237,232,0.3)", zIndex: 810,
                fontSize: "18px", fontFamily: FONT, fontWeight: 200,
                transition: "color 0.18s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#F0EDE8")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,237,232,0.3)")}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
