"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Project } from "./ArchiveGallery";

const FONT = "Lexend, 'Noto Sans KR', sans-serif";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtDate = (month: string, year: string) => `${MONTHS[parseInt(month,10)-1]}, ${year}`;

function getImages(project: Project): string[] {
  return [project.img, ...(project.images ?? [])];
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// pairs = "2+3|6+7" → [[2,3],[6,7]] (1-based, cover=0 제외)
function buildRows(images: string[], pairs?: string): string[][] {
  const pairGroups: number[][] = pairs
    ? pairs.split("|").map(p => p.split("+").map(Number))
    : [];
  const pairedNums = new Set(pairGroups.flat());
  const used = new Set<number>();
  const rows: string[][] = [];

  images.forEach((img, i) => {
    if (used.has(i)) return;
    const fileNum = i; // cover=0, 001=1, 002=2 ...
    const group = pairGroups.find(g => g.includes(fileNum));
    if (group) {
      rows.push(group.map(n => images[n]).filter(Boolean));
      group.forEach(n => used.add(n));
    } else {
      if (!pairedNums.has(fileNum)) {
        rows.push([img]);
        used.add(i);
      }
    }
  });
  return rows;
}

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#@$%&*";
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
  // Each character is individually width-locked to prevent reflow during scramble
  const words = text.split(" ");
  let charIdx = 0;
  return (
    <span aria-label={text} style={{ display: "block" }}>
      {words.map((word, wi) => {
        const chars = word.split("");
        const startIdx = charIdx;
        charIdx += word.length + (wi < words.length - 1 ? 1 : 0);
        return (
          <span key={wi} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {chars.map((ch, ci) => {
              const idx = startIdx + ci;
              return (
                <span key={ci} style={{ position: "relative", display: "inline-block" }}>
                  <span style={{ visibility: "hidden", userSelect: "none" }} aria-hidden="true">{ch}</span>
                  <span style={{ position: "absolute", top: 0, left: 0 }} aria-hidden="true">{display[idx] ?? ch}</span>
                </span>
              );
            })}
            {wi < words.length - 1 && <span style={{ display: "inline-block", width: "0.28em" }} />}
          </span>
        );
      })}
    </span>
  );
}

/* 진입 시: blur+rotateY 5→0 / 퇴장 시: 이미지 bottom이 타이틀 bottom 만나는 순간 blur+opacity 0.7 동시 */
function ProjectImage({ src, alt, index, onClick, containerRef, titleRef, onDimensionLoad }: {
  src: string; alt: string; index: number; onClick: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  titleRef: React.RefObject<HTMLHeadingElement | null>;
  onDimensionLoad?: (w: number, h: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { margin: "-12% 0px -12% 0px" });
  const [dir, setDir] = useState<"below" | "above">("below");
  const [overTitle, setOverTitle] = useState(false);
  const isBelowRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    const el = ref.current;
    if (!container || !el) return;
    const handler = () => {
      // 방향 추적
      const below = el.getBoundingClientRect().top > container.getBoundingClientRect().top + container.getBoundingClientRect().height * 0.5;
      if (below !== isBelowRef.current) {
        isBelowRef.current = below;
        setDir(below ? "below" : "above");
      }
      // 이미지 bottom이 타이틀 second line bottom을 지나는 순간
      const title = titleRef.current;
      if (title) {
        setOverTitle(el.getBoundingClientRect().bottom <= title.getBoundingClientRect().bottom);
      }
    };
    container.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => container.removeEventListener("scroll", handler);
  }, [containerRef, titleRef]);

  const enterBlur = !isInView && dir === "below";
  const exitBlur  = dir === "above" && overTitle;

  const rotating = !(dir === "above" || isInView);

  return (
    <div style={{ perspective: "1400px", borderRadius: "4px", overflow: "hidden" }}>
      <motion.div
        ref={ref}
        animate={{
          filter:  enterBlur || exitBlur ? "blur(7px)" : "blur(0px)",
          opacity: exitBlur ? 0.7 : enterBlur ? 0.55 : 1,
          rotateY: rotating ? 5 : 0,
          scaleX:  rotating ? 1.05 : 1,
        }}
        initial={{ filter: "blur(14px)", opacity: 0, rotateY: 5, scaleX: 1.05 }}
        transition={{
          filter:  { delay: enterBlur ? index * 0.06 : 0, duration: exitBlur ? 1.1 : 0.65, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: exitBlur ? 0.9 : 0.65, ease: [0.16, 1, 0.3, 1] },
          rotateY: { delay: enterBlur ? index * 0.06 : 0, duration: 0.65, ease: [0.16, 1, 0.3, 1] },
          scaleX:  { delay: enterBlur ? index * 0.06 : 0, duration: 0.65, ease: [0.16, 1, 0.3, 1] },
        }}
        onClick={onClick}
        style={{ cursor: "zoom-in" }}
      >
        <img
          src={src} alt={alt}
          style={{ width: "100%", height: "auto", display: "block" }}
          onLoad={e => {
            const img = e.currentTarget;
            onDimensionLoad?.(img.naturalWidth, img.naturalHeight);
          }}
        />
      </motion.div>
    </div>
  );
}

function ParallelRow({ row, ri, images, projectTitle, setLightboxIdx, containerRef, titleRef }: {
  row: string[]; ri: number; images: string[]; projectTitle: string;
  setLightboxIdx: (i: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  titleRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const [ratios, setRatios] = useState<number[]>(() => row.map(() => 1));
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
      {row.map((src, ci) => (
        <div key={ci} style={{ flex: ratios[ci], minWidth: 0 }}>
          <ProjectImage
            src={src}
            alt={`${projectTitle} — ${ri + 1}-${ci + 1}`}
            index={ri}
            onClick={() => setLightboxIdx(images.indexOf(src))}
            containerRef={containerRef}
            titleRef={titleRef}
            onDimensionLoad={(w, h) => setRatios(prev => {
              const next = [...prev];
              next[ci] = w / h;
              return next;
            })}
          />
        </div>
      ))}
    </div>
  );
}

export default function ProjectDetail({ project, onClose, onNext, onPrev }: { project: Project; onClose: () => void; onNext?: () => void; onPrev?: () => void }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [winW, setWinW] = useState(1280);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const atBottom = useRef(false);
  const cooldown = useRef(false);
  const touchStartYRef = useRef(0);
  const onNextRef = useRef(onNext);
  useEffect(() => { onNextRef.current = onNext; }, [onNext]);
  const onPrevRef = useRef(onPrev);
  useEffect(() => { onPrevRef.current = onPrev; }, [onPrev]);
  const atTop = useRef(true);
  const overscrollBottom = useRef(0);
  const overscrollTop = useRef(0);
  const OVERSCROLL_THRESHOLD = 1920;

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

  // 프로젝트 변경 시 스크롤 잠금 + 초기화
  useEffect(() => {
    setTitleDone(false);
    cooldown.current = true;
    atBottom.current = false;
    overscrollBottom.current = 0;
    overscrollTop.current = 0;
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [project.id]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    atTop.current = el.scrollTop < 20;
  };

  // 휠 이벤트: 바닥/상단에서 1920px 누적 후 프로젝트 전환
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (cooldown.current) { e.preventDefault(); return; }

      if (atBottom.current && e.deltaY > 0 && onNextRef.current) {
        e.preventDefault();
        overscrollBottom.current += Math.abs(e.deltaY);
        if (overscrollBottom.current >= OVERSCROLL_THRESHOLD) {
          overscrollBottom.current = 0;
          cooldown.current = true;
          onNextRef.current();
        }
      } else if (atTop.current && e.deltaY < 0 && onPrevRef.current) {
        e.preventDefault();
        overscrollTop.current += Math.abs(e.deltaY);
        if (overscrollTop.current >= OVERSCROLL_THRESHOLD) {
          overscrollTop.current = 0;
          cooldown.current = true;
          onPrevRef.current();
        }
      } else {
        overscrollBottom.current = 0;
        overscrollTop.current = 0;
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
            ref={titleRef}
            initial={{ opacity: 0, filter: "blur(18px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: FONT,
              fontSize: isMobile ? "clamp(28px, 8vw, 48px)" : "clamp(28px, 3.8vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-0.03em", lineHeight: 1.1,
              color: "#fff", margin: "0 0 10px", wordBreak: "keep-all",
            }}
          >
            <ScrambleText text={project.title} onComplete={() => { setTitleDone(true); cooldown.current = false; }} />
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
              margin: "0 0 36px", letterSpacing: "-0.005em", wordBreak: "keep-all",
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
        {project.videoUrl && (() => {
          const vid = getYouTubeId(project.videoUrl);
          return vid ? (
            <div style={{ borderRadius: "4px", overflow: "hidden", aspectRatio: "16/9" }}>
              <iframe
                src={`https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              />
            </div>
          ) : null;
        })()}
        {buildRows(images, project.pairs).map((row, ri) =>
          row.length === 1 ? (
            <ProjectImage
              key={ri}
              src={row[0]}
              alt={`${project.title} — ${ri + 1}`}
              index={ri}
              onClick={() => setLightboxIdx(images.indexOf(row[0]))}
              containerRef={containerRef}
              titleRef={titleRef}
            />
          ) : (
            <ParallelRow
              key={ri}
              row={row} ri={ri} images={images}
              projectTitle={project.title}
              setLightboxIdx={setLightboxIdx}
              containerRef={containerRef}
              titleRef={titleRef}
            />
          )
        )}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingTop: "64px", paddingBottom: "8px",
        }}>
          <button
            onClick={() => { if (!cooldown.current && onPrev) { cooldown.current = true; onPrev(); } }}
            disabled={!onPrev}
            style={{
              fontFamily: FONT, fontSize: "13px", fontWeight: 400,
              letterSpacing: "0.08em", color: onPrev ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.08)",
              background: "none", border: "none", cursor: onPrev ? "pointer" : "default",
              padding: "8px 0",
            }}
          >← Previous Project</button>
          <button
            onClick={() => { if (containerRef.current) containerRef.current.scrollTo({ top: 0, behavior: "smooth" }); }}
            style={{
              fontFamily: FONT, fontSize: "13px", fontWeight: 400,
              letterSpacing: "0.08em", color: "rgba(255,255,255,0.28)",
              background: "none", border: "none", cursor: "pointer",
              padding: "8px 16px",
            }}
          >↑ Go to Top</button>
          <button
            onClick={() => { if (!cooldown.current && onNext) { cooldown.current = true; onNext(); } }}
            disabled={!onNext}
            style={{
              fontFamily: FONT, fontSize: "13px", fontWeight: 400,
              letterSpacing: "0.08em", color: onNext ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.08)",
              background: "none", border: "none", cursor: onNext ? "pointer" : "default",
              padding: "8px 0",
            }}
          >Next Project →</button>
        </div>

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
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.45)", zIndex: 810, padding: "8px",
              transition: "color 0.18s", display: "flex", alignItems: "center",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
            >
              <svg width="28" height="42" viewBox="0 0 28 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="22,4 6,21 22,38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* → */}
            <button onClick={e => { e.stopPropagation(); go(1); }} style={{
              position: "absolute", right: "32px", top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.45)", zIndex: 810, padding: "8px",
              transition: "color 0.18s", display: "flex", alignItems: "center",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
            >
              <svg width="28" height="42" viewBox="0 0 28 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="6,4 22,21 6,38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

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
