"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Project } from "./ArchiveGallery";

const FONT = "'Funnel Display', 'Noto Sans KR', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtDate = (month: string, year: string) => `${MONTHS[parseInt(month,10)-1]}, ${year}`;

function getImages(project: Project): string[] {
  const base = [project.img, ...(project.images ?? [])];
  return Array.from({ length: 10 }, (_, i) => base[i % base.length]);
}

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&*";
const randomChar = () => SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];

function ScrambleText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  // Init with scrambled chars so we never flash the final text before scramble starts
  const [display, setDisplay] = useState(() =>
    text.split("").map(ch => ch === " " ? " " : randomChar()).join("")
  );
  useEffect(() => {
    let iter = 0;
    const K = 1.6;
    const total = Math.ceil(text.length * K);
    const id = setInterval(() => {
      iter++;
      setDisplay(
        text.split("").map((ch, i) => {
          if (ch === " ") return " ";
          if (iter > i * K) return ch;
          return randomChar();
        }).join("")
      );
      if (iter >= total) { clearInterval(id); onComplete?.(); }
    }, 36);
    return () => clearInterval(id);
  }, [text]);
  // Spacer (invisible real text) holds layout stable; scramble overlays absolutely
  return (
    <span aria-label={text} style={{ position: "relative", display: "block" }}>
      <span style={{ visibility: "hidden", userSelect: "none" }} aria-hidden="true">{text}</span>
      <span style={{ position: "absolute", top: 0, left: 0, right: 0, overflow: "hidden" }} aria-hidden="true">{display}</span>
    </span>
  );
}

/* 스크롤에 따라 blur ↔ clear 전환 / 진입 시 rotateY 15→0 (한 번만) */
function ProjectImage({ src, alt, index, onClick }: {
  src: string; alt: string; index: number; onClick: () => void;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-12% 0px -12% 0px" });

  return (
    <div style={{ perspective: "1400px" }}>
      <motion.div
        ref={ref}
        animate={{
          filter: isInView ? "blur(0px)" : "blur(7px)",
          opacity: isInView ? 1 : 0.55,
          rotateY: 0,
        }}
        initial={{ filter: "blur(14px)", opacity: 0, rotateY: 15 }}
        transition={{ delay: index * 0.06, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        onClick={onClick}
        style={{ borderRadius: "4px", overflow: "hidden", cursor: "zoom-in" }}
      >
        <img src={src} alt={alt} style={{ width: "100%", height: "auto", display: "block" }} />
      </motion.div>
    </div>
  );
}

export default function ProjectDetail({ project, onClose, onNext, onPrev }: { project: Project; onClose: () => void; onNext?: () => void; onPrev?: () => void }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [winW, setWinW] = useState(1280);
  const containerRef = useRef<HTMLDivElement>(null);
  const atBottom = useRef(false);
  const cooldown = useRef(false);
  const touchStartYRef = useRef(0);
  const onNextRef = useRef(onNext);
  useEffect(() => { onNextRef.current = onNext; }, [onNext]);
  const onPrevRef = useRef(onPrev);
  useEffect(() => { onPrevRef.current = onPrev; }, [onPrev]);
  const atTop = useRef(true);

  useEffect(() => {
    const update = () => {
      setIsMobile(window.innerWidth < 768);
      setWinW(window.innerWidth);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const [titleDone, setTitleDone] = useState(false);
  const images = getImages(project);
  const closeRight = Math.max((winW - 1200) / 2, 0) + 48;

  // 프로젝트 변경 시 스크롤 초기화
  useEffect(() => {
    cooldown.current = false;
    atBottom.current = false;
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [project.id]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    atTop.current = el.scrollTop < 20;
  };

  // 휠 이벤트: 맨 아래에서 추가로 내리면 다음 프로젝트
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (atBottom.current && e.deltaY > 0 && !cooldown.current && onNextRef.current) {
        cooldown.current = true;
        e.preventDefault();
        onNextRef.current();
      } else if (atTop.current && e.deltaY < 0 && !cooldown.current && onPrevRef.current) {
        cooldown.current = true;
        e.preventDefault();
        onPrevRef.current();
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // 터치: 맨 아래에서 추가로 위로 스와이프하면 다음 프로젝트
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onTouchStart = (e: TouchEvent) => { touchStartYRef.current = e.touches[0].clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      if (cooldown.current) return;
      const dy = touchStartYRef.current - e.changedTouches[0].clientY;
      if (atBottom.current && dy > 40 && onNextRef.current) {
        cooldown.current = true; onNextRef.current();
      } else if (atTop.current && dy < -40 && onPrevRef.current) {
        cooldown.current = true; onPrevRef.current();
      }
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const go = (dir: 1 | -1) =>
    setLightboxIdx(i => i === null ? null : (i + dir + images.length) % images.length);

  return (
    <motion.div
      ref={containerRef}
      onScroll={handleScroll}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      style={{
        position: "fixed", inset: 0, zIndex: 600,
        background: "radial-gradient(ellipse 70% 55% at 50% 52%, #0e0e18 0%, #060608 55%, #000 100%)",
        overflowY: "auto", color: "#fff", scrollbarWidth: "none",
      }}
    >
      {/* Close — ✕ only */}
      <button onClick={onClose} style={{
        position: "fixed", top: "22px", right: `${closeRight}px`,
        fontFamily: FONT, fontSize: "22px", fontWeight: 200, lineHeight: 1,
        background: "none", border: "none", cursor: "pointer",
        color: "rgba(255,255,255,0.3)", zIndex: 700, transition: "color 0.2s",
        padding: "4px",
      }}
        onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
      >✕</button>

      {/* ── HEADER: sticky — 이미지가 스크롤 올라오면서 덮음 ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 1,
        maxWidth: "1200px", margin: "0 auto",
        padding: isMobile ? "72px 24px 56px" : "90px 48px 72px",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(8, 1fr)",
        gap: isMobile ? "20px 0" : "0 28px",
        alignItems: "start",
        pointerEvents: "none",
      }}>
        {/* 제목 + 날짜 — 좌측 3칸 */}
        <div style={{ gridColumn: isMobile ? "1" : "1 / 4", pointerEvents: "auto" }}>
          <motion.h1
            initial={{ opacity: 0, filter: "blur(18px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: FONT,
              fontSize: isMobile ? "clamp(28px, 8vw, 48px)" : "clamp(28px, 3.8vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-0.03em", lineHeight: 1.0,
              color: "#fff", margin: "0 0 10px",
            }}
          >
            <ScrambleText text={project.title} onComplete={() => setTitleDone(true)} />
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, filter: "blur(8px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: FONT, fontSize: "clamp(13px, 1.4vw, 18px)", fontWeight: 300,
              letterSpacing: "-0.01em", color: "rgba(255,255,255,0.32)",
            }}
          >{fmtDate(project.month, project.year)}</motion.div>
        </div>

        {/* 설명 + 크레딧 — 우측 5칸 */}
        <div style={{ gridColumn: isMobile ? "1" : "4 / 9", pointerEvents: "auto" }}>
          <motion.p
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={titleDone ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 16, filter: "blur(8px)" }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: FONT, fontSize: "16px", fontWeight: 300,
              lineHeight: 1.65, color: "rgba(255,255,255,0.68)",
              margin: "0 0 36px", letterSpacing: "-0.005em",
            }}
          >{project.description}</motion.p>

          {project.coworkers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={titleDone ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 10, filter: "blur(6px)" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", gap: "36px", flexWrap: "wrap" }}
            >
              <div>
                <div style={{
                  fontFamily: FONT, fontSize: "8px", fontWeight: 400,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)", marginBottom: "7px",
                }}>Credits</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {project.coworkers.map(c => (
                    <span key={c} style={{
                      fontFamily: FONT, fontSize: "10px", fontWeight: 400,
                      letterSpacing: "0.03em", textTransform: "uppercase",
                      background: "rgba(255,255,255,0.07)", borderRadius: "100px",
                      padding: "4px 12px", color: "#fff",
                    }}>{c}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── 이미지: 텍스트 위로 스크롤 ── */}
      <div style={{
        position: "relative", zIndex: 2,
        maxWidth: "1200px", margin: "0 auto",
        padding: isMobile ? "0 16px 120px" : "0 48px 140px",
        display: "flex", flexDirection: "column", gap: "20px",
      }}>
        {images.map((src, i) => (
          <ProjectImage
            key={i}
            src={src}
            alt={`${project.title} — ${i + 1}`}
            index={i}
            onClick={() => setLightboxIdx(i)}
          />
        ))}
        {onNext && (
          <div style={{
            textAlign: "center", paddingTop: "48px",
            fontFamily: FONT, fontSize: "10px", letterSpacing: "0.1em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.18)",
          }}>↓</div>
        )}
      </div>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setLightboxIdx(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 800,
              background: "rgba(0,0,0,0.92)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={lightboxIdx}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                src={images[lightboxIdx]}
                alt=""
                onClick={e => e.stopPropagation()}
                style={{
                  maxWidth: "88vw", maxHeight: "88vh",
                  width: "auto", height: "auto",
                  objectFit: "contain", borderRadius: "4px", display: "block",
                }}
              />
            </AnimatePresence>

            {/* ← */}
            <button onClick={e => { e.stopPropagation(); go(-1); }} style={{
              position: "absolute", left: "32px", top: "50%", transform: "translateY(-50%)",
              fontSize: "28px", fontWeight: 200, lineHeight: 1,
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.45)", zIndex: 810, padding: "8px",
              transition: "color 0.18s", fontFamily: FONT,
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
            >‹</button>

            {/* › */}
            <button onClick={e => { e.stopPropagation(); go(1); }} style={{
              position: "absolute", right: "32px", top: "50%", transform: "translateY(-50%)",
              fontSize: "28px", fontWeight: 200, lineHeight: 1,
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.45)", zIndex: 810, padding: "8px",
              transition: "color 0.18s", fontFamily: FONT,
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
            >›</button>

            {/* counter */}
            <div style={{
              position: "absolute", bottom: "28px", left: "50%", transform: "translateX(-50%)",
              fontFamily: FONT, fontSize: "10px", letterSpacing: "0.06em",
              color: "rgba(255,255,255,0.32)",
            }}>{lightboxIdx + 1} / {images.length}</div>

            {/* close */}
            <button onClick={() => setLightboxIdx(null)} style={{
              position: "absolute", top: "22px", right: "32px",
              fontSize: "20px", fontWeight: 200, lineHeight: 1,
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.35)", zIndex: 810, padding: "4px",
              transition: "color 0.18s", fontFamily: FONT,
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
            >✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
