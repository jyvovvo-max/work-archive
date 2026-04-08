"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Project, SiteData, Lang } from "./types";
import { GUTTER, GRID_GAP } from "./layout";
import Footer from "./Footer";
import { RetryImg } from "./RetryImg";

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
function useExtractedColor(imgSrc: string) {
  const [avg, setAvg] = useState<[number, number, number]>([30, 30, 36]);
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
        setAvg([Math.round(r / n), Math.round(g / n), Math.round(b / n)]);
      } catch { /* keep default */ }
    };
    img.src = imgSrc;
  }, [imgSrc]);

  // Mix average color toward dark for readability (white text)
  const mix = (c: number, target: number, amount: number) => Math.round(c * amount + target * (1 - amount));
  const [r, g, b] = avg;
  const bg   = [r, g, b];
  const foot = [mix(r, 0, 0.90), mix(g, 0, 0.90), mix(b, 0, 0.90)];
  const hover = [mix(r, 40, 0.28), mix(g, 40, 0.28), mix(b, 44, 0.28)];
  const div  = [mix(r, 55, 0.22), mix(g, 55, 0.22), mix(b, 60, 0.22)];

  return {
    bg:          `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`,
    footerBg:    `rgb(${foot[0]}, ${foot[1]}, ${foot[2]})`,
    footerHover: `rgb(${hover[0]}, ${hover[1]}, ${hover[2]})`,
    divider:     `rgb(${div[0]}, ${div[1]}, ${div[2]})`,
  };
}

// Header is rendered by page.tsx — no local header needed here

// Convert image URL → video URL for auto-detection probe
const CLD_IMG_PREFIX  = "https://res.cloudinary.com/doyfzvsly/image/upload/f_auto,q_auto/";
const CLD_VID_PREFIX  = "https://res.cloudinary.com/doyfzvsly/video/upload/q_auto,f_auto/";
const toVideoUrl = (src: string) =>
  src.startsWith(CLD_IMG_PREFIX)
    ? src.replace(CLD_IMG_PREFIX, CLD_VID_PREFIX)
    : src;

// Gallery media — auto-detects video by probing video URL first, falls back to image on error
function GalleryImage({ src, alt, index, onLightbox }: {
  src: string; alt: string; index: number; onLightbox: () => void;
}) {
  const [isImg, setIsImg] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useInView(ref, { once: false, margin: "-12% 0px" });
  const videoSrc = toVideoUrl(src);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !muted;
    videoRef.current.muted = next;
    setMuted(next);
  };

  return (
    <motion.div
      ref={ref}
      animate={inView
        ? { filter: "blur(0px)", opacity: 1, y: 0 }
        : { filter: "blur(8px)", opacity: 0.5, y: 20 }
      }
      initial={{ filter: "blur(12px)", opacity: 0, y: 24 }}
      transition={{ duration: 0.95, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      onClick={isImg ? onLightbox : undefined}
      onMouseEnter={() => !isImg && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: isImg ? "zoom-in" : "default", position: "relative" }}
    >
      {isImg ? (
        <RetryImg src={src} alt={alt} style={{ width: "100%", height: "auto", display: "block" }} placeholderStyle={{ aspectRatio: "16/9" }} />
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            src={videoSrc}
            onCanPlay={() => setVideoReady(true)}
            onError={() => setIsImg(true)}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
          {/* Speaker icon — only after video ready; hover on desktop, always on mobile */}
          {videoReady && (hovered || isMobile) && (
            <div
              onClick={e => { e.stopPropagation(); toggleMute(); }}
              style={{
                position: "absolute",
                bottom: "12px",
                right: "12px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.18s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.65)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.45)")}
            >
              {muted ? (
                /* muted — speaker with X */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <line x1="23" y1="9" x2="17" y2="15"/>
                  <line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              ) : (
                /* unmuted — speaker with waves */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              )}
            </div>
          )}
        </>
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
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [prevHover, setPrevHover] = useState(false);
  const [nextHover, setNextHover] = useState(false);
  const colors = useExtractedColor(project.img);
  const prevColors = useExtractedColor(prevProject?.img ?? "");
  const nextColors = useExtractedColor(nextProject?.img ?? "");

  useEffect(() => {
    const u = () => setIsMobile(window.innerWidth < 768);
    u(); window.addEventListener("resize", u);
    return () => window.removeEventListener("resize", u);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [project.id]);

  const allImages = [project.img, ...(project.images ?? [])];
  const galleryImages = project.images ?? [];
  const rows = buildRows(galleryImages.length > 0 ? galleryImages : [project.img], project.pairs);

  const goLightbox = (dir: 1 | -1) =>
    setLightboxIdx(i => i === null ? null : (i + dir + allImages.length) % allImages.length);

  const hPad = GUTTER;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: colors.bg,
        transition: "background-color 0.8s ease",
        overflowX: "hidden",
        color: "#F0F0F0",
        minHeight: "100vh",
      }}
    >
      {/* ── Cover image — mobile: paddingTop 52px to clear fixed header ── */}
      <motion.div
        initial={{ filter: "blur(20px)", opacity: 0 }}
        animate={{ filter: "blur(0px)", opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ padding: isMobile ? `52px ${hPad} 0` : `0 ${hPad}` }}
      >
        <RetryImg
          src={project.img}
          alt={project.title}
          style={{ width: "100%", height: "auto", display: "block" }}
          placeholderStyle={{ aspectRatio: "16/9" }}
        />
      </motion.div>

      {/* ── Title + Meta ── */}
      {/* Mobile: paddingTop += 52px (header height) so content starts below fixed header */}
      <div style={{
        padding: isMobile
          ? `calc(52px + clamp(32px, 5vh, 56px)) ${hPad} clamp(32px, 5vh, 56px)`
          : `clamp(48px, 7vh, 80px) ${hPad}`,
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(7, 1fr)",
        columnGap: isMobile ? "0" : GRID_GAP,
        rowGap: isMobile ? "20px" : "0",
        alignItems: "start",
      }}>
        {/* Col 1–2: title + date */}
        <div style={{ gridColumn: isMobile ? "1" : "1 / 3" }}>
          <motion.h1
            initial={{ filter: "blur(16px)", opacity: 0 }}
            animate={{ filter: "blur(0px)", opacity: 1 }}
            transition={{ delay: 0.15, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: FONT,
              fontWeight: 300,
              fontSize: isMobile ? "clamp(27px, 8.76vw, 49px)" : "clamp(34px, 4.2vw, 61px)",
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              color: "#F0F0F0",
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
              color: "rgba(240,240,240,0.42)",
            }}
          >
            {String(project.id).padStart(3, "0")}-{MONTHS[Math.max(0, parseInt(project.month, 10) - 1)]}-{project.year}
          </motion.div>
        </div>

        {/* Col 3: intentional gap */}

        {/* Col 4–7: description + credits */}
        <div style={{ gridColumn: isMobile ? "1" : "4 / 8" }}>
          <motion.p
            initial={{ filter: "blur(10px)", opacity: 0, y: 12 }}
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: FONT_KR,
              fontWeight: 300,
              fontSize: isMobile ? "16.3px" : "clamp(17px, 1.39vw, 21px)",
              lineHeight: 1.75,
              color: "#F0F0F0",
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
                  fontFamily: "'Noto Sans KR', 'Noto Sans', sans-serif",
                  fontWeight: 300,
                  fontSize: isMobile ? "12px" : "13px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  background: "transparent",
                  border: "1.5px solid rgba(240,240,240,0.35)",
                  borderRadius: "100px",
                  padding: "4px 10px",
                  color: "rgba(240,240,240,0.75)",
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
            padding: `clamp(24px, 4vh, 40px) ${GUTTER}`,
            cursor: "pointer",
            borderRight: `1px solid ${colors.divider}`,
            background: prevHover ? prevColors.footerHover : prevColors.bg,
            transition: "background 0.22s ease",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <line x1="8" y1="2" x2="2" y2="8" stroke="rgba(240,240,240,0.28)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="2" y1="8" x2="8" y2="14" stroke="rgba(240,240,240,0.28)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span style={{
              fontFamily: FONT,
              fontWeight: 300,
              fontSize: "10px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(240,240,240,0.22)",
            }}>
              Previous
            </span>
          </div>
          <span style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: isMobile ? "17px" : "clamp(17px, 2vw, 24px)",
            letterSpacing: "-0.01em",
            color: prevProject ? "#F0F0F0" : "rgba(240,240,240,0.2)",
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
            padding: `clamp(24px, 4vh, 40px) ${GUTTER}`,
            cursor: "pointer",
            background: nextHover ? nextColors.footerHover : nextColors.bg,
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
              color: "rgba(240,240,240,0.22)",
            }}>
              Next
            </span>
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <line x1="2" y1="2" x2="8" y2="8" stroke="rgba(240,240,240,0.28)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="8" y1="8" x2="2" y2="14" stroke="rgba(240,240,240,0.28)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: isMobile ? "17px" : "clamp(17px, 2vw, 24px)",
            letterSpacing: "-0.01em",
            color: nextProject ? "#F0F0F0" : "rgba(240,240,240,0.2)",
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
                color: "rgba(240,240,240,0.4)", zIndex: 810, padding: "8px",
                transition: "color 0.18s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#F0F0F0")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,240,240,0.4)")}
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
                color: "rgba(240,240,240,0.4)", zIndex: 810, padding: "8px",
                transition: "color 0.18s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#F0F0F0")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,240,240,0.4)")}
            >
              <svg width="26" height="40" viewBox="0 0 26 40" fill="none">
                <polyline points="6,4 20,20 6,36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div style={{
              position: "absolute", bottom: "24px", left: "50%", transform: "translateX(-50%)",
              fontFamily: FONT, fontSize: "10px", letterSpacing: "0.06em",
              color: "rgba(240,240,240,0.28)",
            }}>
              {lightboxIdx + 1} / {allImages.length}
            </div>

            <button
              onClick={() => setLightboxIdx(null)}
              style={{
                position: "absolute", top: "20px", right: "28px",
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(240,240,240,0.3)", zIndex: 810,
                fontSize: "18px", fontFamily: FONT, fontWeight: 200,
                transition: "color 0.18s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#F0F0F0")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,240,240,0.3)")}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer siteData={siteData ?? null} lang={lang} overrideColors={{ bg: colors.footerBg, text: "rgba(240,240,240,0.55)", textHover: "#F0F0F0", border: colors.divider }} />
    </motion.div>
  );
}
