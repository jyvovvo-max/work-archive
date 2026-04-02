"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Project, SiteData, Lang } from "./types";
import Footer from "./Footer";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";
const FONT_KR = "'Noto Sans KR', 'JetBrains Mono', sans-serif";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtDate = (m: string, y: string) => `${MONTHS[Math.max(0,parseInt(m,10)-1)]}, ${y}`;

// pairs: 1-based index matching file numbering (001, 002, ...)
function buildRows(images: string[], pairs?: string): string[][] {
  const pairGroups: number[][] = pairs
    ? pairs.split("|").map(p => p.split("+").map(n => Number(n) - 1))
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

// ── Color extraction from cover image ──
function rgbToHue(r: number, g: number, b: number): number {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 220;
  const d = max - min;
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return Math.round(h / 6 * 360);
}

function useExtractedColor(imgSrc: string) {
  const [hue, setHue] = useState(220);
  useEffect(() => {
    if (!imgSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = c.height = 60;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 60, 60);
        const d = ctx.getImageData(0, 0, 60, 60).data;
        let r = 0, g = 0, b = 0;
        const n = d.length / 4;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i+1]; b += d[i+2]; }
        setHue(rgbToHue(r / n, g / n, b / n));
      } catch { /* keep default */ }
    };
    img.src = imgSrc;
  }, [imgSrc]);
  return {
    bg:          `hsl(${hue}, 22%, 9%)`,
    footerBg:    `hsl(${hue}, 18%, 13%)`,
    footerHover: `hsl(${hue}, 18%, 18%)`,
    divider:     `hsl(${hue}, 14%, 22%)`,
  };
}

// Header is rendered by page.tsx — no local header needed here

const isVideoUrl = (src: string) => src.includes("/video/upload/");

// Gallery media — image or video depending on URL
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
      onClick={isVideoUrl(src) ? undefined : onLightbox}
      style={{ cursor: isVideoUrl(src) ? "default" : "zoom-in" }}
    >
      {isVideoUrl(src) ? (
        <video
          src={src}
          autoPlay
          muted
          loop
          playsInline
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      ) : (
        <img src={src} alt={alt} style={{ width: "100%", height: "auto", display: "block" }} />
      )}
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
  siteData?: SiteData | null;
  lang?: Lang;
}

export default function ProjectDetailV2({
  project, onClose, onNext, onPrev, nextProject, prevProject, siteData, lang = "ko",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [prevHover, setPrevHover] = useState(false);
  const [nextHover, setNextHover] = useState(false);
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

  const colors = useExtractedColor(project.img);

  useEffect(() => {
    const u = () => setIsMobile(window.innerWidth < 768);
    u(); window.addEventListener("resize", u);
    return () => window.removeEventListener("resize", u);
  }, []);

  useEffect(() => {
    cooldown.current = true;
    atBottom.current = false;
    overBottom.current = 0;
    overTop.current = 0;
    if (containerRef.current) containerRef.current.scrollTop = 0;
    setTimeout(() => { cooldown.current = false; }, 400);
  }, [project.id]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    atTop.current = el.scrollTop < 20;
  };

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
  const galleryImages = project.images ?? [];
  const rows = buildRows(galleryImages.length > 0 ? galleryImages : [project.img], project.pairs);

  const goLightbox = (dir: 1 | -1) =>
    setLightboxIdx(i => i === null ? null : (i + dir + allImages.length) % allImages.length);

  const hPad = isMobile ? "clamp(16px, 4vw, 32px)" : "clamp(32px, 5vw, 72px)";

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
        background: colors.bg,
        transition: "background-color 0.8s ease",
        overflowY: "auto",
        overflowX: "hidden",
        scrollbarWidth: "none",
        color: "#F0EDE8",
      }}
    >
      {/* ── Cover image — same horizontal padding as gallery ── */}
      {/* Mobile: paddingTop 0 (full bleed under header is intentional) */}
      <motion.div
        initial={{ filter: "blur(20px)", opacity: 0 }}
        animate={{ filter: "blur(0px)", opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ padding: `0 ${hPad}` }}
      >
        <img
          src={project.img}
          alt={project.title}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </motion.div>

      {/* ── Title + Meta ── */}
      {/* Mobile: paddingTop += 52px (header height) so content starts below fixed header */}
      <div style={{
        padding: isMobile
          ? `calc(52px + clamp(32px, 5vh, 56px)) ${hPad} clamp(32px, 5vh, 56px)`
          : `clamp(48px, 7vh, 80px) ${hPad}`,
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
              fontSize: isMobile ? "clamp(26px, 8.5vw, 48px)" : "clamp(32px, 4vw, 58px)",
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
              fontSize: "clamp(20px, 1.8vw, 25px)",
              letterSpacing: "0.02em",
              color: "rgba(240,237,232,0.28)",
            }}
          >
            {String(project.id).padStart(3, "0")}-{MONTHS[Math.max(0, parseInt(project.month, 10) - 1)]}-{project.year}
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
              fontSize: isMobile ? "15px" : "clamp(14px, 1.2vw, 18px)",
              lineHeight: 1.75,
              color: "rgba(240,237,232,0.6)",
              margin: "0 0 28px",
              wordBreak: lang === "ko" ? "keep-all" : "normal",
            }}
          >
            {lang === "en" && project.descriptionEn
              ? project.descriptionEn
              : project.description}
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
        padding: `0 ${hPad}`,
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

      {/* ── Bottom navigation ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        marginTop: "clamp(64px, 8vh, 120px)",
        borderTop: `1px solid ${colors.divider}`,
      }}>
        {/* Prev */}
        <div
          onClick={onPrev}
          onMouseEnter={() => setPrevHover(true)}
          onMouseLeave={() => setPrevHover(false)}
          style={{
            padding: isMobile
              ? `clamp(24px, 4vh, 40px) clamp(16px, 3vw, 32px)`
              : `clamp(32px, 5vh, 56px) clamp(32px, 5vw, 72px)`,
            cursor: "pointer",
            borderRight: `1px solid ${colors.divider}`,
            background: prevHover ? colors.footerHover : colors.footerBg,
            transition: "background 0.22s ease",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <line x1="8" y1="2" x2="2" y2="8" stroke="rgba(240,237,232,0.28)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="2" y1="8" x2="8" y2="14" stroke="rgba(240,237,232,0.28)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span style={{
              fontFamily: FONT,
              fontWeight: 300,
              fontSize: "10px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(240,237,232,0.22)",
            }}>
              Previous
            </span>
          </div>
          <span style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: isMobile ? "17px" : "clamp(17px, 2vw, 24px)",
            letterSpacing: "-0.01em",
            color: prevProject ? "#F0EDE8" : "rgba(240,237,232,0.2)",
            wordBreak: "keep-all",
          }}>
            {prevProject?.title || "—"}
          </span>
        </div>

        {/* Next */}
        <div
          onClick={onNext}
          onMouseEnter={() => setNextHover(true)}
          onMouseLeave={() => setNextHover(false)}
          style={{
            padding: isMobile
              ? `clamp(24px, 4vh, 40px) clamp(16px, 3vw, 32px)`
              : `clamp(32px, 5vh, 56px) clamp(32px, 5vw, 72px)`,
            cursor: "pointer",
            background: nextHover ? colors.footerHover : colors.footerBg,
            transition: "background 0.22s ease",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              fontFamily: FONT,
              fontWeight: 300,
              fontSize: "10px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(240,237,232,0.22)",
            }}>
              Next
            </span>
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <line x1="2" y1="2" x2="8" y2="8" stroke="rgba(240,237,232,0.28)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="8" y1="8" x2="2" y2="14" stroke="rgba(240,237,232,0.28)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: isMobile ? "17px" : "clamp(17px, 2vw, 24px)",
            letterSpacing: "-0.01em",
            color: nextProject ? "#F0EDE8" : "rgba(240,237,232,0.2)",
            textAlign: "right",
            wordBreak: "keep-all",
          }}>
            {nextProject?.title || "—"}
          </span>
        </div>
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

            <div style={{
              position: "absolute", bottom: "24px", left: "50%", transform: "translateX(-50%)",
              fontFamily: FONT, fontSize: "10px", letterSpacing: "0.06em",
              color: "rgba(240,237,232,0.28)",
            }}>
              {lightboxIdx + 1} / {allImages.length}
            </div>

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

      <Footer siteData={siteData ?? null} />
    </motion.div>
  );
}
