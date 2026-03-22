"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  motion, useMotionValue, useSpring, useTransform,
  AnimatePresence, animate, useMotionValueEvent,
} from "framer-motion";
import dynamic from "next/dynamic";
const ProjectDetail = dynamic(() => import("./ProjectDetail"), { ssr: false });

const F = "Lexend, 'Noto Sans KR', sans-serif";

const GRAIN_URL = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)'/%3E%3C/svg%3E")`;

/* ── 카테고리별 파티클 팔레트 ── */
const CATEGORY_PALETTES: Record<string, string[]> = {
  "System Design": ["180,200,255","140,170,240","200,220,255","160,185,250","220,235,255"],
  "Interaction":   ["120,220,255","80,190,240","160,230,255","100,200,240","200,245,255"],
  "Graphic":       ["200,180,255","170,150,240","220,200,255","190,170,250","240,225,255"],
  "Development":   ["255,160,100","240,130,80", "255,190,140","245,150,90", "255,210,170"],
  "Motion":        ["100,240,200","80,210,180", "140,250,220","100,225,195","180,255,235"],
  "UI/UX":         ["160,120,255","130,90,240", "190,160,255","150,110,250","220,200,255"],
  "3D Art":        ["255,200,80", "240,170,50", "255,220,120","245,190,70", "255,235,160"],
  "Experiment":    ["255,100,150","240,80,130", "255,140,180","245,90,140", "255,180,210"],
  "Branding":      ["255,140,80", "240,110,50", "255,170,120","245,130,70", "255,200,160"],
  "Type Design":   ["80,220,200", "60,195,175", "120,235,215","80,205,190", "160,245,230"],
  "Editorial":     ["200,160,120","175,135,95", "220,185,150","190,150,110","240,210,185"],
  "Data":          ["100,200,255","70,175,240", "140,215,255","90,190,245", "180,230,255"],
};
const DEFAULT_PALETTE = ["255,255,255","210,228,255","190,215,255","220,240,255","200,220,255"];

/* ── Starfield — 4단계: 부유/느림/보통/고속 ── */
function WarpTunnel({ velocity, originX, originY, scrollYMV, isMobile }: {
  velocity: any; originX: any; originY: any; scrollYMV: any; isMobile: boolean;
}) {
  useEffect(() => {
    const canvas = document.getElementById("warpCanvas") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const cores = navigator.hardwareConcurrency ?? 4;
    const isLowPerf = isMobile || cores <= 4;
    const BASE_COUNT = isLowPerf ? 80 : 200;
    const MAX_STARS  = isLowPerf ? 80 : 2000;
    const FRAME_MS   = isLowPerf ? 1000 / 30 : 1000 / 60;
    let lastFrameTime = 0;

    const getPalette = () => {
      const idx = Math.round(Math.max(0, scrollYMV.get()) / CARD_TRAVEL);
      const proj = PROJECTS[Math.min(idx, PROJECTS.length - 1)];
      return CATEGORY_PALETTES[proj?.category] ?? DEFAULT_PALETTE;
    };

    const newStar = (palette: string[]) => ({
      x: Math.random() * w - w / 2,
      y: Math.random() * h - h / 2,
      z: Math.random() * w,
      o: Math.random() * 0.45 + 0.3,
      c: palette[Math.floor(Math.random() * palette.length)],
    });

    const initPalette = getPalette();
    const stars: any[] = Array.from({ length: BASE_COUNT }, () => newStar(initPalette));

    // idle + 3단계 워프 (느림 제거: idle / 보통 / 빠름 / 아주빠름)
    const THRESHOLDS  = [3, 15, 40];
    const Z_SPEEDS    = [0.05, 2.0, 5.0, 11.0];
    const TRAIL_ALPHA = [0.05, 0.12, 0.18, 0.26];

    let smoothedVel = 0;
    let prevRaw = 0;
    let lastGrowthTime = performance.now();
    let animationFrame: number;

    const render = (now: number = 0) => {
      if (isMobile && now - lastFrameTime < FRAME_MS) {
        animationFrame = requestAnimationFrame(render);
        return;
      }
      lastFrameTime = now;
      const rawVel = velocity.get();
      if (rawVel === prevRaw) {
        smoothedVel *= 0.80;
      } else {
        const damp = rawVel >= 0 ? 1.0 : 0.28;
        smoothedVel = smoothedVel * 0.55 + rawVel * damp * 0.45;
      }
      prevRaw = rawVel;

      const absSmooth = Math.abs(smoothedVel);
      const direction = smoothedVel >= 0 ? 1 : -1;
      let stage = 0;
      for (let i = 0; i < THRESHOLDS.length; i++) {
        if (absSmooth > THRESHOLDS[i]) stage = i + 1;
      }
      const vel = direction * Z_SPEEDS[stage];
      const palette = getPalette();

      // idle: 3초마다 별 x1.1 증가 (모바일 비활성화)
      if (!isLowPerf && stage === 0 && stars.length < MAX_STARS) {
        const now = performance.now();
        if (now - lastGrowthTime >= 1000) {
          const target = Math.min(Math.floor(stars.length * 1.2), MAX_STARS);
          while (stars.length < target) {
            const ns = newStar(palette);
            ns.z = w * 0.3 + Math.random() * w * 0.7;
            ns.o = Math.random() * 0.3 + 0.1;
            stars.push(ns);
          }
          lastGrowthTime = now;
        }
      }

      ctx.fillStyle = `rgba(0,0,0,${TRAIL_ALPHA[stage]})`;
      ctx.fillRect(0, 0, w, h);
      ctx.translate(originX.get() * w, originY.get() * h);

      for (let s of stars) {
        s.z -= vel;
        if (s.z <= 0) { Object.assign(s, newStar(palette)); s.z = w; }
        if (s.z > w)  { Object.assign(s, newStar(palette)); s.z = 1; }

        const px = s.x / (s.z / w);
        const py = s.y / (s.z / w);
        const depth = 1 - s.z / w;
        const size = Math.max(0.3, depth * 1.1);

        if (stage >= 3) {
          const trailMult = vel * 4.5;
          const prevX = s.x / ((s.z + trailMult) / w);
          const prevY = s.y / ((s.z + trailMult) / w);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(prevX, prevY);
          ctx.strokeStyle = `rgba(${s.c},${s.o * Math.min(0.9, absSmooth / 80)})`;
          ctx.lineWidth = Math.max(0.3, size * 0.6);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${s.c},${s.o * (0.3 + depth * 0.7)})`;
          ctx.fill();
        }
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      animationFrame = requestAnimationFrame(render);
    };

    const handleResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", handleResize);
    animationFrame = requestAnimationFrame(render);
    return () => { window.removeEventListener("resize", handleResize); cancelAnimationFrame(animationFrame); };
  }, []);

  return <canvas id="warpCanvas" style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.9 }} />;
}

export interface Project {
  id: number; title: string; year: string; month: string; category: string;
  coworkers: string[]; description: string; img: string;
  images?: string[];
}

// ── Cloudinary base ──
const CLD = "https://res.cloudinary.com/doyfzvsly/image/upload/portfolio-images/";
const cldImgs = (folder: string, count: number) =>
  Array.from({length: count}, (_, i) => `${CLD}${folder}/${String(i+1).padStart(3,"0")}`);

// ── Projects ──
const PROJECTS: Project[] = [
  { id:21, title:"Shinsegae Market",               year:"2025", month:"02", category:"Branding", coworkers:["MUCCA","RMS"], description:"신세계의 브랜드 아이덴티티와 헤리티지를 바탕으로 럭셔리 및 프리미엄 브랜드 이미지를 식품관 영역으로 확장했습니다. 이 과정에서 신세계 마켓의 브랜드 비주얼과 패키지를 통합적으로 개발하여 프리미엄 식품관으로서의 브랜드 포지셔닝을 강화했습니다.", img:`${CLD}shinsegae-market/cover`, images:cldImgs("shinsegae-market",10) },
  { id:22, title:"Shinsegae Market Open Campaign",  year:"2025", month:"02", category:"Branding", coworkers:["MUCCA","RMS"], description:"신세계의 브랜드 아이덴티티와 헤리티지를 바탕으로 럭셔리 및 프리미엄 브랜드 이미지를 식품관 영역으로 확장했습니다. 이 과정에서 신세계 마켓의 브랜드 비주얼과 패키지를 통합적으로 개발하여 프리미엄 식품관으로서의 브랜드 포지셔닝을 강화했습니다.", img:`${CLD}shinsegae-market-open-campaign/cover`, images:cldImgs("shinsegae-market-open-campaign",6) },
  { id:1,  title:"Nexus Archive",    year:"2024", month:"11", category:"System Design", coworkers:["Studio Arc","Kim S."],        description:"A modular archive system for distributed knowledge management. Explores relational data structures across spatial contexts.", img:"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&w=900",
    images:["https://images.unsplash.com/photo-1558591710-4b4a1ae0f7b4?auto=format&w=1200","https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&w=800","https://images.unsplash.com/photo-1617791160588-241658ad7617?auto=format&w=1400","https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&w=600"] },
  { id:2,  title:"Hyper Flow",       year:"2024", month:"08", category:"Interaction",   coworkers:["Lee H."],                     description:"Real-time interaction design exploring haptic feedback loops and ambient interface patterns for wearable contexts.",         img:"https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&w=900",
    images:["https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&w=1200","https://images.unsplash.com/photo-1543286386-2e659306cd6c?auto=format&w=700","https://images.unsplash.com/photo-1618556450991-2f1af64e8191?auto=format&w=1000"] },
  { id:3,  title:"Mono Grid",        year:"2023", month:"12", category:"Graphic",       coworkers:["Park J.","Atelier M"],        description:"A systematic typographic grid study reduced to monochromatic constraints. Inspired by Swiss rationalist tradition.",          img:"https://images.unsplash.com/photo-1614850523296-e8c0a97323bc?auto=format&w=900",
    images:["https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&w=1400","https://images.unsplash.com/photo-1563986768711-b3bde3dc821e?auto=format&w=800","https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&w=900","https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&w=600","https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&w=1200"] },
  { id:4,  title:"Vibe Engine",      year:"2023", month:"09", category:"Development",   coworkers:["Choi Y."],                    description:"Generative audio-visual engine translating live telemetry data into immersive spatial soundscapes and particle systems.",   img:"https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&w=900" },
  { id:5,  title:"Archive-05",       year:"2023", month:"06", category:"Motion",        coworkers:["Studio Wave"],                description:"Long-form motion piece exploring digital entropy — compression artifacts as a visual language.",                           img:"https://images.unsplash.com/photo-1618556450991-2f1af64e8191?auto=format&w=900",
    images:["https://images.unsplash.com/photo-1617791160588-241658ad7617?auto=format&w=1200","https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&w=900"] },
  { id:6,  title:"Cloud Folder",     year:"2023", month:"03", category:"UI/UX",         coworkers:["Jung M.","Blank Co."],        description:"Minimal file management interface built for collaborators across timezones. Emphasis on ambient awareness over notification.", img:"https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&w=900" },
  { id:7,  title:"Dark Matter",      year:"2022", month:"11", category:"3D Art",        coworkers:["Kim T."],                     description:"3D sculptural explorations inspired by astrophysical phenomena. Rendered with custom GLSL shaders.",                       img:"https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&w=900",
    images:["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&w=1200","https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&w=700","https://images.unsplash.com/photo-1543286386-2e659306cd6c?auto=format&w=1400"] },
  { id:8,  title:"Signal Lost",      year:"2022", month:"08", category:"Experiment",    coworkers:[],                             description:"Experimental research into the semiotics of broken communication — lost packets as found poetry.",                       img:"https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&w=900" },
  { id:9,  title:"Void Sessions",    year:"2022", month:"05", category:"Branding",      coworkers:["Oh S.","Studio Null"],        description:"Brand identity for an underground electronic music collective. Visual language from negative space and silence.",          img:"https://images.unsplash.com/photo-1617791160588-241658ad7617?auto=format&w=900" },
  { id:10, title:"Grid Theorem",     year:"2022", month:"02", category:"Type Design",   coworkers:["Kwon J."],                    description:"Variable typeface around mathematical grid constraints. Five axes: weight, width, slant, optical size, grid tension.",      img:"https://images.unsplash.com/photo-1558591710-4b4a1ae0f7b4?auto=format&w=900" },
  { id:11, title:"Field Notes",      year:"2021", month:"10", category:"Editorial",     coworkers:["Shin B.","Long Form Studio"], description:"Editorial project documenting fieldwork across 12 cities. Photography, essay and data visualization.",                   img:"https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&w=900",
    images:["https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&w=1200","https://images.unsplash.com/photo-1614850523296-e8c0a97323bc?auto=format&w=800","https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&w=600","https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&w=1400"] },
  { id:12, title:"Pulse Check",      year:"2021", month:"07", category:"Data",          coworkers:[],                             description:"Real-time biometric data visualization. Dense information presented with minimal cognitive load.",                         img:"https://images.unsplash.com/photo-1543286386-2e659306cd6c?auto=format&w=900" },
  { id:13, title:"Skin System",      year:"2021", month:"04", category:"System Design", coworkers:["Yoo A."],                     description:"Themeable design system for a SaaS platform serving 200+ brands. Tokens, components, documentation.",                     img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&w=900" },
  { id:14, title:"Zero Margin",      year:"2020", month:"12", category:"Graphic",       coworkers:["Studio Zero"],                description:"Poster series on the tension between negative space and meaning. 24 prints interrogating a single concept each.",          img:"https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&w=900" },
  { id:15, title:"Counter Form",     year:"2020", month:"09", category:"Type Design",   coworkers:["Im J."],                      description:"Display typeface built from the negative spaces (counters) of existing letterforms. Form through absence.",              img:"https://images.unsplash.com/photo-1563986768711-b3bde3dc821e?auto=format&w=900" },
  { id:16, title:"Cascade",          year:"2020", month:"05", category:"Interaction",   coworkers:["Cho H.","Digital Lab"],       description:"Scroll-driven narrative experience for a cultural institution. Layered time-based media with adaptive pacing.",          img:"https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&w=900" },
  { id:17, title:"Minimal Object",   year:"2019", month:"11", category:"3D Art",        coworkers:[],                             description:"Rendered objects stripped to essential geometric form. Influenced by Brancusi and John McCracken.",                      img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&w=900" },
  { id:18, title:"Echo Chamber",     year:"2019", month:"08", category:"Experiment",    coworkers:["Woo S."],                     description:"Participatory sound installation mapping social media discourse to physical space through distributed speakers.",         img:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&w=900" },
  { id:19, title:"First Principles", year:"2019", month:"04", category:"Branding",      coworkers:["Nam K.","Baseline Studio"],   description:"Brand identity for an architecture firm. Wordmark, space grammar, material palette, print collateral.",                 img:"https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&w=900" },
  { id:20, title:"Year Zero",        year:"2019", month:"01", category:"Editorial",     coworkers:["Lee M."],                     description:"Self-initiated editorial cataloguing all work from the foundational year. Printed in a single colour on newsprint.",     img:"https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&w=900" },
];

const CARD_TRAVEL  = 260;
const YEARS = [...new Set(PROJECTS.map(p => p.year))].sort((a,b) => +b - +a);

// Editorial grid: varied aspect ratios per card (id-seeded, stable)
const GRID_RATIOS = ["4/3", "3/4", "16/9", "1/1", "2/3", "5/4", "3/2", "4/5"];
const gridRatio = (id: number) => GRID_RATIOS[id % GRID_RATIOS.length];

// Grid scatter: genuinely varied — different rotate, x, y per card
const GRID_SCATTER = PROJECTS.map((_, i) => ({
  rotate: ((i * 137 + 41) % 71) - 35,   // -35..+35
  x:      ((i * 83  + 17) % 160) - 80,  // -80..+80px
  y:      ((i * 61  + 29) % 100) - 50,  // -50..+50px
}));

// Random fade delay per card (seeded, 0–0.7s)

/* ── Mobile Feed ───────────────────────────────────────────── */
function MobileFeed({ projects, onOpen }: { projects: Project[]; onOpen: (p: Project) => void }) {
  return (
    <div style={{
      position: "absolute", inset: 0, overflowY: "auto",
      paddingTop: "104px", paddingBottom: "60px",
      paddingLeft: "16px", paddingRight: "16px",
      boxSizing: "border-box", scrollbarWidth: "none",
      zIndex: 1,
    }}>
      {projects.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => onOpen(p)}
          style={{ marginBottom: "28px", cursor: "pointer" }}
        >
          <div style={{ borderRadius: "4px", overflow: "hidden", aspectRatio: "16/9" }}>
            <img src={p.img} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          <div style={{ paddingTop: "8px", display: "flex", justifyContent: "center", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontFamily: F, fontSize: "13px", fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>{p.title}</span>
            <span style={{ fontFamily: F, fontSize: "11px", fontWeight: 300, color: "rgba(255,255,255,0.4)", letterSpacing: "0.03em" }}>{fmtDate(p.month, p.year)}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function Grain({ op = 0.04, z = 10 }: { op?: number; z?: number }) {
  return (
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none", zIndex: z,
      backgroundImage: GRAIN_URL, backgroundSize: "256px 256px", opacity: op,
      mixBlendMode: "overlay",
    }} />
  );
}


export default function ArchiveGallery() {
  const [view, setView]           = useState<"coverflow"|"grid">("coverflow");
  const [tilting, setTilting]     = useState(false);
  const [activeYear, setActiveYear] = useState<string|null>(null);
  const [selected, setSelected]   = useState<Project|null>(null);
  const selectedRef = useRef<Project|null>(null);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [anyCardHovered, setAnyCardHovered] = useState(false);
  const [popup, setPopup] = useState<"info"|"contact"|"ig"|null>(null);

  const [windowWidth, setWindowWidth] = useState(1200);
  useEffect(() => {
    const update = () => setWindowWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const isMobile = windowWidth < 768;
  const isLarge  = windowWidth >= 1440;
  const gridCols = windowWidth >= 1600 ? 5 : windowWidth >= 1200 ? 4 : windowWidth >= 900 ? 3 : windowWidth >= 600 ? 2 : 1;
  const selectedIdx = selected ? PROJECTS.findIndex(p => p.id === selected.id) : -1;
  const shuffledIds = PROJECTS.map(p => p.id);

  const isMobileRef    = useRef(isMobile);
  useEffect(() => { isMobileRef.current = isMobile; }, [isMobile]);
  const targetIdxRef   = useRef(0);
  const lastScrollTime = useRef(0);
  const touchStartY    = useRef(0);
  const swipingRef     = useRef(false);

  const rawScroll = useMotionValue(0);
  const scrollY   = useSpring(rawScroll, { stiffness: 280, damping: 30, restDelta: 0.5 });
  const scrollVel = useMotionValue(0);

  // 소실점 고정 (마우스 트래킹 제거)
  const originX = useMotionValue(0.5);
  const originY = useMotionValue(0.34);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const idx = Math.round(latest / CARD_TRAVEL);
    setActiveCardIdx(Math.max(0, Math.min(PROJECTS.length - 1, idx)));
  });

  useEffect(() => {
    let lastS = rawScroll.get();
    const unsubscribe = rawScroll.on("change", (v) => {
        scrollVel.set(v - lastS);
        lastS = v;
    });
    const stepCard = (dir: 1 | -1) => {
      const now = Date.now();
      if (now - lastScrollTime.current < 160) return;
      lastScrollTime.current = now;
      targetIdxRef.current = Math.max(0, Math.min(PROJECTS.length - 1, targetIdxRef.current + dir));
      animate(rawScroll, targetIdxRef.current * CARD_TRAVEL, { type: "spring", stiffness: 220, damping: 26 });
    };

    const onWheel = (e: WheelEvent) => {
      if (view !== "coverflow" || selectedRef.current || isMobileRef.current) return;
      e.preventDefault();
      stepCard(e.deltaY > 0 ? 1 : -1);
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      swipingRef.current = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (selectedRef.current || isMobileRef.current) return;
      if (Math.abs(e.touches[0].clientY - touchStartY.current) > 12) {
        swipingRef.current = true;
        if (view === "coverflow") e.preventDefault();
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (view !== "coverflow" || selectedRef.current || isMobileRef.current) return;
      const dy = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(dy) >= 30) {
        stepCard(dy > 0 ? 1 : -1);
      }
      // 스와이프 플래그를 짧게 유지해 click 이벤트 차단
      setTimeout(() => { swipingRef.current = false; }, 350);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
        unsubscribe();
    };
  }, [view, rawScroll]);


  const goHome = () => {
    setView("coverflow"); setTilting(false); setActiveYear(null);
    targetIdxRef.current = 0;
    animate(rawScroll, 0, { type: "spring", stiffness: 55, damping: 20 });
  };

  const jumpToYear = (y: string | null) => {
    setActiveYear(y);
    if (view === "grid") return;
    setView("coverflow");
    const idx = y === null ? 0 : PROJECTS.findIndex(p => p.year === y);
    if (idx >= 0) {
      targetIdxRef.current = idx;
      animate(rawScroll, idx * CARD_TRAVEL, { type: "spring", stiffness: 55, damping: 20 });
    }
  };

  // Grid transition: tilt cards slightly slower
  const openGrid = useCallback(() => {
    if (view === "grid" || isMobile) return;
    setTilting(true);
    // Grid appears after cards start tilting
    setTimeout(() => setView("grid"), 150);
    // Allow more time for the tilt animation to feel "intentional"
    setTimeout(() => setTilting(false), 900);
  }, [view]);

  const openArchive = useCallback(() => {
    setView("coverflow"); setTilting(false);
  }, []);



  const gridProjects = shuffledIds
    .map(id => PROJECTS.find(p => p.id === id)!)
    .filter(p => !activeYear || p.year === activeYear);

  return (
    <div style={{
      position: "relative", width: "100%", height: "100vh", overflow: "hidden",
      background: "#000",
      userSelect: "none",
    }}>
      <WarpTunnel velocity={scrollVel} originX={originX} originY={originY} scrollYMV={scrollY} isMobile={isMobile} />
      <div style={{ position:"absolute", inset:0, background: "radial-gradient(ellipse 80% 60% at 50% 38%, rgba(12,12,26,0.5) 0%, rgba(4,4,8,0.7) 48%, #000 100%)", pointerEvents: "none" }} />

      {/* ── Header ──────────────────────────────────────── */}
      <motion.header
        animate={{
          opacity: anyCardHovered ? 0.18 : 1,
          filter: anyCardHovered ? "blur(5px)" : "blur(0px)",
        }}
        transition={{ duration: 0.22 }}
        style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "60px",
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr auto" : "1fr auto 1fr",
          alignItems: "center",
          padding: isMobile ? "0 20px" : "0 40px",
          zIndex: 300, boxSizing: "border-box",
        }}
      >
        <button onClick={goHome} style={{
          fontFamily: F, fontSize: isMobile ? "16px" : "18px", fontWeight: 700,
          letterSpacing: "-0.02em", color: "#fff",
          background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left",
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.5")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >Deep Field</button>

        {!isMobile && (
          <nav style={{ display: "flex", border: "1px solid rgba(255,255,255,0.22)", borderRadius: "100px", padding: "3px" }}>
            {([["coverflow", "Archive", openArchive], ["grid", "Grid", openGrid]] as const).map(([mode, label, fn]) => (
              <button key={mode} onClick={fn} style={{
                fontFamily: F, fontSize: "12px", fontWeight: view === mode ? 700 : 400,
                letterSpacing: "0.01em",
                background: "none", border: "none", cursor: "pointer",
                padding: "5px 20px", borderRadius: "100px",
                color: view === mode ? "#fff" : "rgba(255,255,255,0.28)", transition: "color 0.25s",
              }}>{label}</button>
            ))}
          </nav>
        )}

        <div style={{ display: "flex", gap: isMobile ? "16px" : "24px", justifyContent: "flex-end", alignItems: "center" }}>
          {(["info","contact","ig"] as const).map(l => (
            <button key={l} onClick={() => setPopup(l)} style={{
              fontFamily: F, fontSize: "11px", fontWeight: 500,
              letterSpacing: "0.02em",
              color: "rgba(255,255,255,0.28)", background: "none",
              border: "none", cursor: "pointer", padding: 0, transition: "color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.28)")}
            >{l === "ig" ? "IG" : l.charAt(0).toUpperCase() + l.slice(1)}</button>
          ))}
        </div>
      </motion.header>

      {/* ── Year Filter — Sidebar (desktop) / Topbar (mobile) ── */}
      <AnimatePresence mode="wait">
        {!isMobile ? (
          <motion.div key="year-sidebar"
            initial={{ opacity: 0, x: -12 }}
            animate={{
              opacity: anyCardHovered ? 0.12 : 1,
              x: 0,
              filter: anyCardHovered ? "blur(5px)" : "blur(0px)",
            }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.22 }}
            style={{
              position: "fixed", left: "40px", top: "60px", bottom: 0,
              zIndex: 200, display: "flex", alignItems: "center",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {[null, ...YEARS].map((y) => {
                const active = activeYear === y;
                return (
                  <button key={y ?? "recent"} onClick={() => jumpToYear(y)} style={{
                    fontFamily: F, fontSize: "10px", fontWeight: 400, letterSpacing: "0.02em",
                    background: "none", cursor: "pointer",
                    border: active ? "1px solid rgba(255,255,255,0.38)" : "1px solid transparent",
                    borderRadius: "100px", color: "rgba(255,255,255,0.42)",
                    textAlign: "center", padding: "4px 10px", transition: "border-color 0.2s",
                    marginBottom: y === null ? "4px" : 0,
                  }}>{y === null ? "Recent" : y}</button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div key="year-topbar"
            initial={{ opacity: 0, y: -10 }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            style={{
              position: "fixed", top: "60px", left: 0, right: 0, zIndex: 200,
              display: "flex", flexDirection: "row", alignItems: "center",
              justifyContent: "center", gap: "2px", padding: "6px 16px",
            }}
          >
            {[null, ...YEARS].map((y) => {
              const active = activeYear === y;
              return (
                <button key={y ?? "recent"} onClick={() => jumpToYear(y)} style={{
                  fontFamily: F, fontSize: "10px", fontWeight: 400, letterSpacing: "0.02em",
                  background: "none", cursor: "pointer", whiteSpace: "nowrap",
                  border: active ? "1px solid rgba(255,255,255,0.38)" : "1px solid transparent",
                  borderRadius: "100px", color: "rgba(255,255,255,0.42)",
                  textAlign: "center", padding: "4px 10px", transition: "border-color 0.2s",
                }}>{y === null ? "Recent" : y}</button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Card Title Overlay ───────────────────────────── */}
      {(view === "coverflow" || tilting) && !isMobile && (
        <motion.div
          animate={{ opacity: anyCardHovered ? 0.22 : 1, filter: anyCardHovered ? "blur(5px)" : "blur(0px)" }}
          transition={{ duration: 0.22 }}
          style={{
            position: "fixed",
            ...(isMobile ? { top: "120px" } : { bottom: "72px" }),
            left: 0, right: 0,
            textAlign: "center", zIndex: 200, pointerEvents: "none",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={activeCardIdx}
              initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{
                opacity: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                y:       { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                filter:  { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
              }}
              style={{ fontFamily: F, fontSize: "clamp(10px,1.1vw,13px)", fontWeight: 400, letterSpacing: "0.02em", color: "#fff", display: "inline-flex", alignItems: "baseline", gap: "10px" }}
            >
              <span>
                <ScrambleText text={PROJECTS[activeCardIdx]?.title ?? ""} />
              </span>
              <span style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.85em", letterSpacing: "0.04em" }}>
                {fmtDate(PROJECTS[activeCardIdx]?.month ?? "1", PROJECTS[activeCardIdx]?.year ?? "")}
              </span>
            </motion.span>
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Coverflow Stage (desktop only) ─────────────── */}
      {!isMobile && (
        <motion.div
          onPointerLeave={() => setAnyCardHovered(false)}
          style={{
            position: "absolute",
            top: "60px", left: 0, right: 0, bottom: 0,
            display: (view === "coverflow" || tilting) ? "flex" : "none",
            alignItems: "center", justifyContent: "center",
            perspective: "2000px",
            perspectiveOrigin: "50% 34%",
            overflow: "visible",
            zIndex: 1,
            pointerEvents: view === "coverflow" ? "auto" : "none",
          }}>
          {PROJECTS.map((project, index) => (
            <QueueCard
              key={project.id} project={project} index={index}
              scrollY={scrollY} isTilting={tilting}
              scatter={GRID_SCATTER[index]}
              onOpen={() => setSelected(project)}
              onHoverChange={setAnyCardHovered}
              swipingRef={swipingRef}
              isMobile={false}
              isLarge={isLarge}
            />
          ))}
        </motion.div>
      )}

      {/* ── Mobile Feed ─────────────────────────────────── */}
      {isMobile && (
        <MobileFeed
          projects={PROJECTS.filter(p => !activeYear || p.year === activeYear)}
          onOpen={setSelected}
        />
      )}

      {/* ── Grid View — z-index 2, always above coverflow ── */}
      <AnimatePresence>
        {view === "grid" && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{
              position: "absolute", inset: 0, overflowY: "auto",
              padding: isMobile ? "104px 16px 40px 16px" : "72px 40px 40px 120px", boxSizing: "border-box", scrollbarWidth: "none",
              background: "radial-gradient(ellipse 80% 60% at 50% 38%, #0c0c1a 0%, #040408 48%, #000 100%)",
              zIndex: 2,
            }}
          >
            <Grain op={0.042} z={10} />

            <div style={{
              columns: gridCols, columnGap: "12px",
              maxWidth: "1800px", margin: "0 auto",
            }}>
              {gridProjects.map((p) => (
                <GridItem
                  key={p.id} p={p} onOpen={() => setSelected(p)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <ProjectDetail
            key="detail"
            project={selected}
            onClose={() => setSelected(null)}
            onNext={selectedIdx < PROJECTS.length - 1 ? () => setSelected(PROJECTS[selectedIdx + 1]) : undefined}
            onPrev={selectedIdx > 0 ? () => setSelected(PROJECTS[selectedIdx - 1]) : undefined}
          />
        )}
      </AnimatePresence>

      {/* ── Popups: Info / Contact / IG ─────────────────── */}
      <AnimatePresence>
        {popup && (
          <motion.div
            key={popup}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setPopup(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 900,
              background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              style={{
                background: "rgba(14,14,24,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px", padding: "48px 52px 44px",
                maxWidth: "480px", width: "90vw", position: "relative", color: "#fff",
              }}
            >
              <button onClick={() => setPopup(null)} style={{
                position: "absolute", top: "20px", right: "22px",
                fontFamily: F, fontSize: "20px", fontWeight: 200,
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.3)", lineHeight: 1,
                transition: "color 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
              >✕</button>

              {popup === "info" && (
                <>
                  <p style={{ fontFamily: F, fontSize: "10px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "20px" }}>Info</p>
                  <h2 style={{ fontFamily: F, fontSize: "clamp(20px,3vw,30px)", fontWeight: 700, letterSpacing: "-0.03em", textTransform: "uppercase", lineHeight: 1, marginBottom: "20px" }}>Deep Field</h2>
                  <p style={{ fontFamily: F, fontSize: "15px", fontWeight: 300, lineHeight: 1.7, color: "rgba(255,255,255,0.6)", margin: 0 }}>
                    A portfolio by a brand designer with 10 years of experience. Named after the Hubble Deep Field — the idea that looking into empty space reveals more galaxies than you can imagine.
                  </p>
                </>
              )}

              {popup === "contact" && (
                <>
                  <p style={{ fontFamily: F, fontSize: "10px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "20px" }}>Contact</p>
                  <h2 style={{ fontFamily: F, fontSize: "clamp(20px,3vw,30px)", fontWeight: 700, letterSpacing: "-0.03em", textTransform: "uppercase", lineHeight: 1, marginBottom: "24px" }}>Get In Touch</h2>
                  <a href="mailto:hello@deepfield.work" style={{
                    fontFamily: F, fontSize: "16px", fontWeight: 300, color: "#fff",
                    textDecoration: "none", display: "block", marginBottom: "12px",
                    letterSpacing: "-0.01em", transition: "opacity 0.2s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.5")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >hello@deepfield.work</a>
                </>
              )}

              {popup === "ig" && (
                <>
                  <p style={{ fontFamily: F, fontSize: "10px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "20px" }}>Instagram</p>
                  <h2 style={{ fontFamily: F, fontSize: "clamp(20px,3vw,30px)", fontWeight: 700, letterSpacing: "-0.03em", textTransform: "uppercase", lineHeight: 1, marginBottom: "24px" }}>@deepfield</h2>
                  <a href="https://instagram.com/deepfield" target="_blank" rel="noopener noreferrer" style={{
                    fontFamily: F, fontSize: "11px", fontWeight: 500,
                    letterSpacing: "0.06em", textTransform: "uppercase",
                    color: "#fff", textDecoration: "none",
                    border: "1px solid rgba(255,255,255,0.28)", borderRadius: "100px",
                    padding: "10px 24px", display: "inline-block", transition: "border-color 0.2s",
                  }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = "#fff")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.28)")}
                  >Visit Instagram →</a>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   QUEUE CARD — simple image card, no landing card special cases
   - Hover: lift only
   - Click: tilt + open detail
   - isTilting: fast snap-tilt when switching to grid
══════════════════════════════════════════════════════════════ */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtDate = (month: string, year: string) => `${MONTHS[parseInt(month, 10) - 1]}, ${year}`;

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&*";
function ScrambleText({ text }: { text: string }) {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    let iter = 0;
    const K = 1.6; // stagger factor per character
    const total = Math.ceil(text.length * K);
    const id = setInterval(() => {
      iter++;
      setDisplay(
        text.split("").map((ch, i) => {
          if (ch === " ") return " ";
          if (iter > i * K) return ch;
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }).join("")
      );
      if (iter >= total) clearInterval(id);
    }, 36);
    return () => clearInterval(id);
  }, [text]);
  return <>{display}</>;
}

function QueueCard({ project, index, scrollY, isTilting, scatter, onOpen, onHoverChange, swipingRef, isMobile, isLarge }: {
  project: Project; index: number; scrollY: any;
  isTilting: boolean; scatter: { rotate: number; x: number; y: number };
  onOpen: () => void; onHoverChange: (h: boolean) => void;
  swipingRef: React.RefObject<boolean>; isMobile: boolean; isLarge: boolean;
}) {
  const [hovered,  setHovered]  = useState(false);
  const [clicking, setClicking] = useState(false);


  const queueStep = useTransform(scrollY, (s: number) => (index * CARD_TRAVEL - s) / CARD_TRAVEL);

  // Y: 데스크탑 - 선형, 위쪽으로 스택 / 모바일 - top-aligned, 아래로 스택
  const yPos = useTransform(queueStep, (q: number) => {
    if (!isMobile) {
      if (q <= 0) return -q * 260;
      return -(30 * q);
    }
    // 모바일: align-items flex-start 기준, q=0이 stage 상단 고정
    if (q <= 0) return q * 260; // 위로 빠르게 사라짐
    return q * 44;              // 아래로 44px 간격 스택
  });

  const MOBILE_CARDS = 12;
  const DESK_LIMIT   = isLarge ? 7 : 5;
  const cardScale = useTransform(queueStep, (q: number) => {
    if (q <= 0) return Math.min(1.05, 1 - q * 0.08);
    if (isMobile) return Math.max(0.95, 1 - q * (0.05 / (MOBILE_CARDS - 1)));
    return Math.max(0.60, 1 - q * (isLarge ? 0.04 : 0.07));
  });

  const cardOp = useTransform(queueStep, (q: number) => {
    if (q < -0.5) return 0; if (q < 0) return 1 + q * 2;
    const limit = isMobile ? MOBILE_CARDS : DESK_LIMIT;
    if (q > limit) return Math.max(0, limit + 1 - q); return 1;
  });

  // 퇴장 기울기: 데스크탑 — 앞으로 넘어가며 사라짐 / 모바일 — 위로 슬라이드, 기울기 없음
  const exitRotateX = useTransform(queueStep, (q: number) => {
    if (q >= 0 || isMobile) return 0;
    return Math.max(-28, q * 55);
  });

  const zIdx = useTransform(queueStep, (q: number) => Math.max(0, Math.round(100 - q*7)));

  const handleClick = () => {
    if (swipingRef.current) return;
    setClicking(true);
    setTimeout(() => onOpen(), 480);
    setTimeout(() => setClicking(false), 700);
  };

  const animTarget =
    isTilting ? { y: scatter.y - 16, x: scatter.x, rotate: scatter.rotate, scale: 0.88, opacity: 0.2 } :
    clicking  ? { y: scatter.y - 60, x: scatter.x * 0.4, rotate: scatter.rotate, opacity: 0 } :
    hovered   ? { y: -42, x: 0, rotate: 0 } :
                { y: 0,   x: 0, rotate: 0, opacity: 1, scale: 1 };

  // Fast snap when tilting for grid transition; spring for regular interactions
  const animTransition = isTilting
    ? { type: "spring" as const, stiffness: 45, damping: 20 } // Slower, intentional tilt
    : { type: "spring" as const, stiffness: 260, damping: 24 };

  return (
    <motion.div style={{
      position: "absolute",
      y: yPos, scale: cardScale, opacity: cardOp, zIndex: zIdx,
      rotateX: exitRotateX,
      width: isLarge ? "clamp(240px, 54.6vw, 903px)" : "clamp(240px, 52vw, 860px)",
    }}>
      {/* 랜딩 reveal wrapper */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, filter: "blur(18px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.7, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          onHoverStart={() => { setHovered(true); onHoverChange(true); }}
          onHoverEnd={() => { setHovered(false); onHoverChange(false); }}
          onClick={handleClick}
          animate={animTarget}
          transition={animTransition}
          style={{ position: "relative", cursor: "pointer" }}
        >
          {/* 카드 이미지 영역 */}
          <div style={{ width: "100%", aspectRatio: "16/9" }}>
            <div style={{
              position: "relative", width: "100%", height: "100%",
              borderRadius: "4px", overflow: "hidden",
              background: "#06060a",
            }}>
              <img src={project.img} alt={project.title}
                style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                draggable={false} />

              {/* Hover overlay */}
              <motion.div
                animate={{ opacity: hovered ? 1 : 0 }}
                transition={{ duration: 0.18 }}
                style={{ position:"absolute", inset:0, background:"linear-gradient(175deg, rgba(0,0,0,0.7) 0%, transparent 50%, rgba(0,0,0,0.35) 100%)", pointerEvents:"none", zIndex:4 }}
              />

              {/* Hover labels */}
              <AnimatePresence>
                {hovered && (
                  <>
                    <motion.div key="t"
                      initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
                      transition={{ duration:0.18, ease:[0.22,1,0.36,1] }}
                      style={{ position:"absolute", top:"20px", left:"22px", right:"90px", pointerEvents:"none", zIndex:10 }}>
                      <h3 style={{ fontFamily:F, fontSize:"clamp(16px,2.8vw,36px)", fontWeight:600, letterSpacing:"-0.02em", color:"#fff", lineHeight:0.92, margin:0, textShadow:"0 1px 6px rgba(0,0,0,0.35)" }}>{project.title}</h3>
                    </motion.div>
                    <motion.div key="y"
                      initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
                      transition={{ duration:0.18, ease:[0.22,1,0.36,1], delay:0.04 }}
                      style={{ position:"absolute", top:"22px", right:"22px", pointerEvents:"none", zIndex:10 }}>
                      <span style={{ fontFamily:F, fontSize:"clamp(9px,1.4vw,16px)", fontWeight:300, letterSpacing:"0.06em", color:"rgba(255,255,255,0.65)", textShadow:"0 2px 12px rgba(0,0,0,0.8)" }}>{fmtDate(project.month, project.year)}</span>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ── Grid Card ─────────────────────────────────────────────── */
/* ── Grid Item ────────────────────────────────────────────────── */
function GridItem({ p, onOpen }: { p: Project; onOpen: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onOpen}
      style={{ cursor: "pointer", breakInside: "avoid", marginBottom: "12px", display: "block" }}
    >
      <div style={{ position: "relative", aspectRatio: gridRatio(p.id), borderRadius: "4px", overflow: "hidden" }}>
        <motion.img
          src={p.images && p.images.length > 0 ? p.images[p.id % p.images.length] : p.img} alt={p.title}
          animate={{ scale: hovered ? 1.06 : 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
      <div style={{ paddingTop: "8px", textAlign: "center", display: "flex", justifyContent: "center", alignItems: "baseline", gap: "8px", flexWrap: "nowrap" }}>
        <span style={{
          fontFamily: F, fontSize: "13px", fontWeight: 600,
          letterSpacing: "-0.01em", color: "#fff",
        }}>
          {hovered ? <ScrambleText text={p.title} /> : p.title}
        </span>
        <span style={{
          fontFamily: F, fontSize: "11px", fontWeight: 300,
          letterSpacing: "0.03em", color: "rgba(255,255,255,0.4)",
        }}>
          {fmtDate(p.month, p.year)}
        </span>
      </div>
    </motion.div>
  );
}
