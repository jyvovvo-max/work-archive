"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Project, SiteData, Lang } from "./types";
import { GUTTER, GRID_GAP } from "./layout";
import { CLD_VER } from "./dataFetch";
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
  const bg   = [Math.round(r * 0.85), Math.round(g * 0.85), Math.round(b * 0.85)];
  const foot = [mix(r, 0, 0.90), mix(g, 0, 0.90), mix(b, 0, 0.90)];
  const hover = [mix(r, 40, 0.28), mix(g, 40, 0.28), mix(b, 44, 0.28)];
  const div  = [mix(r, 55, 0.22), mix(g, 55, 0.22), mix(b, 60, 0.22)];

  // Relative luminance of bg — below threshold → use dark (black) text
  const lum = (0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]) / 255;
  const isDark = lum < 0.45; // dark bg → white text, light bg → black text

  return {
    avg,
    isDark,
    bg:          `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`,
    footerBg:    `rgb(${foot[0]}, ${foot[1]}, ${foot[2]})`,
    footerHover: `rgb(${hover[0]}, ${hover[1]}, ${hover[2]})`,
    divider:     `rgb(${div[0]}, ${div[1]}, ${div[2]})`,
  };
}

// Header is rendered by page.tsx — no local header needed here

// Convert image URL → video URL for slots flagged as videos via the sheet `Video` column.
// f_auto intentionally omitted from video prefix: the Cloudinary auto-format pipeline
// occasionally fails on specific source encodings (e.g. puuvilla_society/001), returning
// 404 even when the raw asset exists. q_auto alone is safe across all sources.
// Cache-bust: CLD_VER 은 빌드 시점 기준 일자 태그. 이미지 교체 후 재배포 시 즉시 반영.
const CLD_IMG_PREFIX  = `https://res.cloudinary.com/doyfzvsly/image/upload/f_auto,q_auto/${CLD_VER}/`;
const CLD_VID_PREFIX  = `https://res.cloudinary.com/doyfzvsly/video/upload/q_auto/${CLD_VER}/`;
const toVideoUrl = (src: string) =>
  src.startsWith(CLD_IMG_PREFIX)
    ? src.replace(CLD_IMG_PREFIX, CLD_VID_PREFIX)
    : src;

// Gallery media — explicit: `isVideo` is set by the parent from `project.videoSlots`.
// No auto-detection: the sheet `Video` column is the single source of truth. This avoids
// ambiguity when Cloudinary's dual image/video namespace holds stale image assets at the
// same public_id (see shinsegae-market/002 incident).
function GalleryImage({ src, alt, index, isVideo, onLightbox, onRatio }: {
  src: string; alt: string; index: number;
  isVideo: boolean;
  onLightbox: () => void;
  onRatio?: (ratio: number) => void;
}) {
  const [failed, setFailed] = useState(false);
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

  const clickable = !isVideo && !failed;

  return (
    <motion.div
      ref={ref}
      animate={inView
        ? { filter: "blur(0px)", opacity: 1, y: 0 }
        : { filter: "blur(8px)", opacity: 0.5, y: 20 }
      }
      initial={{ filter: "blur(12px)", opacity: 0, y: 24 }}
      transition={{ duration: 0.95, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      onClick={clickable ? onLightbox : undefined}
      onMouseEnter={() => isVideo && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: clickable ? "zoom-in" : "default", position: "relative" }}
    >
      {failed ? (
        <div style={{ background: "rgba(120,120,120,0.12)", width: "100%", aspectRatio: "16/9" }} />
      ) : !isVideo ? (
        <img
          src={src}
          alt={alt}
          onLoad={e => {
            const img = e.currentTarget;
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              onRatio?.(img.naturalWidth / img.naturalHeight);
            }
          }}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            src={videoSrc}
            onLoadedMetadata={e => {
              const v = e.currentTarget;
              if (v.videoWidth > 0 && v.videoHeight > 0) {
                onRatio?.(v.videoWidth / v.videoHeight);
              }
            }}
            onCanPlay={() => setVideoReady(true)}
            onError={() => setFailed(true)}
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

// Parallel row with dynamic aspect-ratio flex.
// Ratios are reported by each GalleryImage via onRatio (from img.naturalWidth
// or video.videoWidth once metadata loads), so no hidden probe image is needed.
function ParallelRow({ row, ri, videoUrlSet, onLightbox }: {
  row: string[]; ri: number;
  videoUrlSet: Set<string>;
  onLightbox: (idx: number) => void;
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
            isVideo={videoUrlSet.has(src)}
            onLightbox={() => onLightbox(ci)}
            onRatio={r => setRatios(prev => {
              if (prev[ci] === r) return prev;
              const next = [...prev];
              next[ci] = r;
              return next;
            })}
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
  onContact?: () => void;
}

export default function ProjectDetailV2({
  project, onClose, onNext, onPrev, nextProject, prevProject, siteData, lang = "ko", onContact,
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
  // Resolve videoSlots (1-based slot numbers from sheet "Video" column) to the
  // actual gallery image URLs at those slots, so GalleryImage can check membership.
  const videoUrlSet = new Set(
    (project.videoSlots ?? [])
      .map(slot => galleryImages[slot - 1])
      .filter((url): url is string => !!url)
  );
  const rows = buildRows(galleryImages.length > 0 ? galleryImages : [project.img], project.pairs);

  const goLightbox = (dir: 1 | -1) =>
    setLightboxIdx(i => i === null ? null : (i + dir + allImages.length) % allImages.length);

  const hPad = GUTTER;

  // Adaptive text colors based on background luminance
  const T = colors.isDark
    ? { solid: "#F0F0F0", mid: "rgba(240,240,240,0.75)", dim: "rgba(240,240,240,0.42)", faint: "rgba(240,240,240,0.4)", nav: "rgba(240,240,240,0.4)", navHover: "#F0F0F0", footer: "rgba(240,240,240,0.55)", footerFaint: "rgba(240,237,232,0.35)" }
    : { solid: "#0A0A0A", mid: "rgba(0,0,0,0.65)", dim: "rgba(0,0,0,0.42)", faint: "rgba(0,0,0,0.35)", nav: "rgba(0,0,0,0.35)", navHover: "#0A0A0A", footer: "rgba(0,0,0,0.55)", footerFaint: "rgba(0,0,0,0.35)" };

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
        color: T.solid,
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
      {/* Mobile: paddingTop matches the 28px description→credits gap for a consistent vertical rhythm */}
      <div style={{
        padding: isMobile
          ? `28px ${hPad} clamp(32px, 5vh, 56px)`
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
              fontSize: isMobile ? "clamp(22px, 7.1vw, 40px)" : "clamp(31px, 3.78vw, 55px)",
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              color: T.solid,
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
              color: T.dim,
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
              fontSize: isMobile ? "13.9px" : "clamp(14px, 1.18vw, 18px)",
              lineHeight: 1.75,
              color: T.solid,
              margin: "0 0 28px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {project.description && (
              <span style={{ wordBreak: "keep-all" }}>{project.description}</span>
            )}
            {project.descriptionEn && (
              <span>{project.descriptionEn}</span>
            )}
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
                  border: `1.5px solid ${T.faint}`,
                  borderRadius: "100px",
                  padding: "4px 10px",
                  color: T.mid,
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
              isVideo={videoUrlSet.has(row[0])}
              onLightbox={() => setLightboxIdx(allImages.indexOf(row[0]))}
            />
          ) : (
            <ParallelRow
              key={ri}
              row={row}
              ri={ri}
              videoUrlSet={videoUrlSet}
              onLightbox={ci => setLightboxIdx(allImages.indexOf(row[ci]))}
            />
          )
        )}
      </div>

      {/* ── Bottom navigation ── */}
      {(() => {
        const mx = (a: number, b: number) => Math.round(a * 0.7 + b * 0.3);
        const darken = (v: number, amt: number) => Math.max(Math.round(v - amt), 0);
        const lighten = (v: number, amt: number) => Math.min(Math.round(v + amt), 255);
        const [cr, cg, cb] = colors.avg;
        const [pr, pg, pb] = prevColors.avg;
        const [nr, ng, nb] = nextColors.avg;
        const prevBase = [mx(cr, pr), mx(cg, pg), mx(cb, pb)];
        const nextBase = [mx(cr, nr), mx(cg, ng), mx(cb, nb)];
        // Previous: darken by 30, Next: lighten by 30 — ensures contrast with main bg
        const prevBg = prevBase.map(v => darken(v, 30));
        const nextBg = nextBase.map(v => lighten(v, 30));
        const prevBgStr = `rgb(${prevBg[0]}, ${prevBg[1]}, ${prevBg[2]})`;
        const nextBgStr = `rgb(${nextBg[0]}, ${nextBg[1]}, ${nextBg[2]})`;
        const prevHoverBg = `rgb(${darken(prevBg[0], 15)}, ${darken(prevBg[1], 15)}, ${darken(prevBg[2], 15)})`;
        const nextHoverBg = `rgb(${lighten(nextBg[0], 15)}, ${lighten(nextBg[1], 15)}, ${lighten(nextBg[2], 15)})`;
        return (
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        marginTop: "clamp(64px, 8vh, 120px)",
        borderTop: "none",
      }}>
        {/* Prev */}
        <div
          onClick={onPrev}
          onMouseEnter={() => setPrevHover(true)}
          onMouseLeave={() => setPrevHover(false)}
          style={{
            padding: `clamp(24px, 4vh, 40px) ${GUTTER}`,
            cursor: "pointer",
            borderRight: "none",
            background: prevHover ? prevHoverBg : prevBgStr,
            transition: "background 0.22s ease",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="15" height="24" viewBox="0 0 10 16" fill="none">
              <line x1="8" y1="2" x2="2" y2="8" stroke={T.nav} strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="2" y1="8" x2="8" y2="14" stroke={T.nav} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span style={{
              fontFamily: FONT,
              fontWeight: 300,
              fontSize: "clamp(12px, 2.4vw, 18px)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: T.nav,
            }}>
              Previous
            </span>
          </div>
          <span style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: "clamp(18px, 5vw, 34px)",
            letterSpacing: "-0.01em",
            color: prevProject ? T.solid : T.faint,
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
            background: nextHover ? nextHoverBg : nextBgStr,
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
              fontSize: "clamp(12px, 2.4vw, 18px)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: T.nav,
            }}>
              Next
            </span>
            <svg width="15" height="24" viewBox="0 0 10 16" fill="none">
              <line x1="2" y1="2" x2="8" y2="8" stroke={T.nav} strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="8" y1="8" x2="2" y2="14" stroke={T.nav} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: "clamp(18px, 5vw, 34px)",
            letterSpacing: "-0.01em",
            color: nextProject ? T.solid : T.faint,
            textAlign: "right",
            wordBreak: "keep-all",
          }}>
            {nextProject?.title || "—"}
          </span>
        </div>
      </div>
        ); })()}

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
            {/* Image + close button wrapper */}
            <div style={{ position: "relative", display: "inline-flex" }} onClick={e => e.stopPropagation()}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={lightboxIdx}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  src={allImages[lightboxIdx]}
                  alt=""
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
                onClick={() => setLightboxIdx(null)}
                style={{
                  position: "absolute", top: "-32px", right: "0px",
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
            </div>

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
          </motion.div>
        )}
      </AnimatePresence>

      <Footer siteData={siteData ?? null} lang={lang} overrideColors={{ bg: colors.footerBg, text: T.footer, textStrong: T.solid, textFaint: T.footerFaint, textHover: T.navHover, border: colors.divider }} onContact={onContact} />
    </motion.div>
  );
}
