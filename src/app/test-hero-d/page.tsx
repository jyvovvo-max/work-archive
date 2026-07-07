"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  AnimatePresence,
  animate,
} from "framer-motion";
import { useRouter } from "next/navigation";
import { Project, SiteData } from "@/components/v2/types";
import { fetchProjects, fetchSiteData, FALLBACK_SITE } from "@/components/v2/dataFetch";
import Header from "@/components/v2/Header";
import ContactModal from "@/components/v2/ContactModal";
import { GUTTER, SPACE_B, FONT_SECTION_TITLE } from "@/components/v2/layout";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtDate = (month: string, year: string) =>
  `${MONTHS[Math.max(0, parseInt(month, 10) - 1)]}, ${year}`;

// ── Globe hero (시안 D v4) — 카메라가 구 안에 있다 ──
// 회전은 100% CSS 키프레임(GPU), 스크롤은 motion value — 프레임당 JS 없음.
// 스크롤 연출: 소개문이 타이틀 바로 아래 붙을 때까지 타이틀은 고정,
// 붙는 순간부터 함께 밀려 올라간다. 이미지 구는 카메라를 관통해 지나가고,
// Selected Works 카드들이 좌우에서 셔플 역재생되듯 그리드 자리를 찾아온다.
const PERSPECTIVE_DESKTOP = 900;
const PERSPECTIVE_MOBILE = 520;
const FLY_RANGE = 1400; // 플라이스루 스크롤 길이(px)

// R(vw)·y(vh)·w(vw), T = 공전 주기(초). 위도별 링이 구를 이룬다.
type Ring = { count: number; R: number; y: number; w: number; T: number; reverse?: boolean };

// 가운데 3줄 구성 — 화면 중앙을 꽉 채우는 밴드, 무한 공전.
// 링당 개수는 둘레(2πR) 기준: 호 간격이 이미지 폭의 절반 이하가 되도록 산출
// 링을 빽빽하게(호 간격 ≈ 이미지 폭의 1/4) — 회전해도 빈 구간이 보이지 않는 연속 띠
const DESKTOP_RINGS: Ring[] = [
  { count: 22, R: 52, y: -26, w: 12, T: 48 },
  { count: 22, R: 55, y: 0,   w: 13, T: 42 },
  { count: 22, R: 52, y: 26,  w: 12, T: 48 },
];
const MOBILE_RINGS: Ring[] = [
  { count: 12, R: 62, y: -24, w: 27, T: 44 },
  { count: 12, R: 68, y: 0,   w: 29, T: 39 },
  { count: 12, R: 62, y: 24,  w: 27, T: 44 },
];

function OrbitImage({
  project,
  ring,
  idxInRing,
  globalIdx,
  paused,
  onHoverChange,
  onOpen,
}: {
  project: Project;
  ring: Ring;
  idxInRing: number;
  globalIdx: number;
  paused: boolean;
  onHoverChange: (hover: boolean) => void;
  onOpen: (p: Project) => void;
}) {
  const delay = -(idxInRing / ring.count) * ring.T;
  const dir = ring.reverse ? "reverse" : "normal";
  const spinAnim = `heroDSpin ${ring.T}s linear ${delay}s infinite ${dir}`;
  // 반곡률 레이어는 주기 2T — 접선 기울기의 절반만 유지 (delay 동일 위상)
  const faceAnim = `heroDFace ${ring.T * 2}s linear ${delay}s infinite ${dir}`;
  const playState = paused ? "paused" : "running";
  const [warping, setWarping] = useState(false);
  // 등장 순서를 줄 단위가 아니라 전체에 골고루 흩뿌린다 (해시 스태거)
  const entranceDelay = 0.35 + ((globalIdx * 17) % 42) * 0.05;
  // GPU 텍스처 절감 — 히어로는 원본(1920px) 대신 800px 변환본 사용
  const heroSrc = project.img.replace("/upload/f_auto,q_auto/", "/upload/f_auto,q_auto,w_800/");

  // CRT 파동: displacement가 감쇠 진동(밖으로 불룩 ↔ 안으로 수축)하며 잦아든다
  const startWarp = () => {
    if (window.matchMedia("(hover: none)").matches) return;
    const disp = document.getElementById("heroCrtDisp");
    if (!disp) return;
    setWarping(true);
    animate(0, 1, {
      duration: 0.7,
      ease: "linear",
      onUpdate: v =>
        disp.setAttribute(
          "scale",
          (0.18 * Math.exp(-2.4 * v) * Math.sin(Math.PI * 4 * v)).toFixed(4)
        ),
      onComplete: () => {
        disp.setAttribute("scale", "0");
        setWarping(false);
      },
    });
  };

  return (
    // 중심 배치 (transform 미사용 — spin 키프레임과 충돌 방지)
    <div
      style={{
        position: "absolute",
        left: `calc(50% - ${ring.w / 2}vw)`,
        top: `calc(50% + ${ring.y}vh - ${ring.w * 0.28}vw)`,
        width: `${ring.w}vw`,
        transformStyle: "preserve-3d",
        pointerEvents: "none",
      }}
    >
      {/* 공전 */}
      <div style={{ animation: spinAnim, animationPlayState: playState, transformStyle: "preserve-3d" }}>
        {/* 반경 오프셋 */}
        <div style={{ transform: `translateZ(${ring.R}vw)`, transformStyle: "preserve-3d" }}>
          {/* 반곡률 보정 — 먼 벽은 정면, 가장자리는 접선의 절반만 기울어진다 */}
          <div style={{ animation: faceAnim, animationPlayState: playState, transformStyle: "preserve-3d" }}>
            <motion.div
              onClick={() => {
                // 클릭: 불룩 파동을 한 번 더 치고 상세로 전환 (터치는 즉시 이동)
                if (window.matchMedia("(hover: none)").matches) { onOpen(project); return; }
                startWarp();
                setTimeout(() => onOpen(project), 400);
              }}
              onHoverStart={() => { onHoverChange(true); startWarp(); }}
              onHoverEnd={() => onHoverChange(false)}
              initial={{ opacity: 0, filter: "blur(20px)" }}
              animate={{
                opacity: 1,
                filter: "blur(0px)",
                // 등장 후 필터 레이어를 완전히 해제해 GPU 부담 제거
                transitionEnd: { filter: "none" },
              }}
              whileHover={{
                scaleX: [1, 1.14, 1.02, 1.11, 1.1],
                scaleY: [1, 1.05, 1.14, 1.04, 1.1],
              }}
              transition={{
                opacity: { delay: entranceDelay, duration: 1.3, ease: [0.16, 1, 0.3, 1] },
                filter: { delay: entranceDelay, duration: 1.3, ease: [0.16, 1, 0.3, 1] },
                scaleX: { duration: 0.65, times: [0, 0.3, 0.55, 0.8, 1], ease: "easeOut" },
                scaleY: { duration: 0.65, times: [0, 0.3, 0.55, 0.8, 1], ease: "easeOut" },
              }}
              style={{
                position: "relative",
                cursor: "pointer",
                pointerEvents: "auto",
                backfaceVisibility: "hidden",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "-14px",
                  right: "1px",
                  fontFamily: FONT,
                  fontSize: "10.5px",
                  fontWeight: 300,
                  letterSpacing: "0.1em",
                  color: "rgba(10,10,10,0.35)",
                  lineHeight: 1,
                  pointerEvents: "none",
                }}
              >
                #{String(project.id).padStart(3, "0")}
              </span>
              <div style={{ filter: warping ? "url(#heroCrt)" : undefined }}>
                <img
                  src={heroSrc}
                  alt={project.title}
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    borderRadius: "2px",
                    boxShadow: "0 18px 50px rgba(0,0,0,0.16)",
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Selected Works — 횡스크롤 쇼케이스 ──
// 세로 스크롤을 가로 이동으로 전환(스크럽). 슬라이드가 화면 밖에서 밀려 들어오고,
// 슬라이드가 넘어갈 때마다 좌측 하단에 타이틀이 블러인으로 하나씩 등장한다.
function HScrollWorks({ projects, onOpen }: { projects: Project[]; onOpen: (p: Project) => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // 거터 정렬 픽셀 지오메트리 — 슬라이드 좌우 라인이 GUTTER(=좌하단 타이틀 라인)에 맞는다.
  // 세로가 넘치지 않도록 뷰포트 높이 기준 캡도 적용.
  const [dims, setDims] = useState<{ g: number; w: number; gap: number; vw: number } | null>(null);
  useEffect(() => {
    const calc = () => {
      const mobile = window.innerWidth < 768;
      const g = mobile
        ? Math.min(Math.max(20, window.innerWidth * 0.04), 56)
        : Math.min(Math.max(42, window.innerWidth * 0.084), 118);
      const wByGutter = window.innerWidth - g * 2;
      const wByHeight = (window.innerHeight * 0.58) * (16 / 9);
      const w = Math.min(wByGutter, wByHeight);
      // 다음 슬라이드가 텍스트 컬럼을 지나 우측 거터 라인에서 대기하도록 간격 산출
      const gap = Math.max(w * 0.036, window.innerWidth - g * 2 - w);
      setDims({ g, w, gap, vw: window.innerWidth });
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const N = Math.max(1, projects.length);
  const step = dims ? dims.w + dims.gap : 0;

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"],
  });
  // 스냅 매핑 — 정렬 위치에서 35%씩 머물고(dwell), 30% 구간에서 넘어간다.
  // 슬라이드당 스크롤 길이(85vh)와 함께 전환 속도를 늦춰 끈적함 유지 + 느린 이동
  const x = useTransform(scrollYProgress, p => {
    const t = Math.min(N - 1, Math.max(0, p * (N - 1)));
    const i = Math.floor(t);
    const f = t - i;
    const core = f < 0.35 ? 0 : f > 0.65 ? 1 : (f - 0.35) / 0.3;
    const s = core * core * (3 - 2 * core);
    return -(i + s) * step;
  });

  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", v => {
    setActive(Math.min(N - 1, Math.max(0, Math.round(v * (N - 1)))));
  });

  // 데이터·지오메트리 준비 전에도 ref는 항상 DOM에 붙어 있어야 함 (useScroll target 요구)
  if (projects.length === 0 || !dims) return <div ref={wrapRef} style={{ minHeight: "100vh" }} />;
  const current = projects[Math.min(active, N - 1)];
  const slideH = dims.w * (9 / 16);

  const sideX = dims.g + dims.w + 28;          // 우측 정보 컬럼 시작
  const sideSpace = dims.vw - sideX - dims.g;  // 사용 가능한 우측 폭
  const hasSide = sideSpace >= 220;            // 좁으면 이미지 아래로 폴백

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative", height: `${100 + (N - 1) * 85}vh`, background: "#0A0A0A" }}
    >
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        {/* 소제목 — 헤더(52px)와 겹치지 않는 높이에서 시작 */}
        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ margin: "-10% 0px", once: true }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: `64px ${GUTTER} 27px`,
            fontSize: FONT_SECTION_TITLE,
            zIndex: 3,
          }}
        >
          <span style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: "1.4em",
            letterSpacing: "-0.02em",
            color: "#F0EDE8",
          }}>
            Selected Work
          </span>
        </motion.div>

        {/* 슬라이드 트랙 — 화면 밖에서 밀려 들어온다 */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${dims.g}px`,
            transform: "translateY(-50%)",
          }}
        >
          <motion.div style={{ x, display: "flex", gap: `${dims.gap}px` }}>
            {projects.map((p, i) => (
              <motion.div
                key={p.id}
                onClick={() => onOpen(p)}
                animate={{ filter: i === active ? "blur(0px)" : "blur(7px)" }}
                whileHover={{
                  scaleX: [1, 1.05, 0.99, 1.035, 1.03],
                  scaleY: [1, 1.015, 1.05, 1.01, 1.03],
                }}
                transition={{
                  filter: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                  scaleX: { duration: 0.6, times: [0, 0.3, 0.55, 0.8, 1], ease: "easeOut" },
                  scaleY: { duration: 0.6, times: [0, 0.3, 0.55, 0.8, 1], ease: "easeOut" },
                }}
                style={{ width: `${dims.w}px`, flexShrink: 0, cursor: "pointer" }}
              >
                <img
                  src={p.img}
                  alt={p.title}
                  draggable={false}
                  style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    objectFit: "cover",
                    display: "block",
                    borderRadius: "2px",
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* 프로젝트 정보 — 우측 상단 여백(공간이 좁으면 이미지 아래로 폴백) */}
        <div
          style={hasSide
            ? {
                position: "absolute",
                left: `${sideX}px`,
                right: `${dims.g}px`,
                top: `calc(50% - ${slideH / 2}px)`,
                zIndex: 5,
                pointerEvents: "none",
              }
            : {
                position: "absolute",
                left: `${dims.g}px`,
                right: `${dims.g}px`,
                top: `calc(50% + ${slideH / 2 + 14}px)`,
                zIndex: 5,
                pointerEvents: "none",
              }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(6px)", transition: { duration: 0.22 } }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{
                fontFamily: FONT,
                fontWeight: 300,
                fontSize: "clamp(19px, 1.9vw, 32px)",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                color: "#F0EDE8",
                wordBreak: "keep-all",
              }}>
                {current.title}
              </div>
              <div style={{
                fontFamily: FONT,
                fontWeight: 300,
                fontSize: "clamp(11px, 0.95vw, 14px)",
                letterSpacing: "0.06em",
                color: "rgba(240,237,232,0.45)",
                marginTop: "8px",
              }}>
                #{String(current.id).padStart(3, "0")} — {fmtDate(current.month, current.year)}
              </div>
              {hasSide && current.description && (
                <p style={{
                  fontFamily: "'Noto Sans KR', 'JetBrains Mono', sans-serif",
                  fontWeight: 300,
                  fontSize: "clamp(12px, 0.95vw, 15px)",
                  lineHeight: 1.7,
                  color: "rgba(240,237,232,0.78)",
                  margin: "22px 0 0",
                  wordBreak: "keep-all",
                }}>
                  {current.description}
                </p>
              )}
              {hasSide && current.descriptionEn && (
                <p style={{
                  fontFamily: "'Noto Sans KR', 'JetBrains Mono', sans-serif",
                  fontWeight: 300,
                  fontSize: "clamp(11.5px, 0.9vw, 14px)",
                  lineHeight: 1.65,
                  color: "rgba(240,237,232,0.55)",
                  margin: "14px 0 0",
                }}>
                  {current.descriptionEn}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function TestHeroD() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [siteData, setSiteData] = useState<SiteData>(FALLBACK_SITE);
  const [isMobile, setIsMobile] = useState(false);
  // 어떤 이미지든 호버 중이면 글로브 공전 일시정지
  const [orbitPaused, setOrbitPaused] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    if (typeof history !== "undefined") {
      history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
    }
    fetchProjects().then(setProjects);
    fetchSiteData().then(setSiteData);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // CRT displacement map — 중심에서 방사형으로 부풀리는 맵을 런타임에 1회 생성
  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const im = ctx.createImageData(128, 128);
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const dx = x / 127 - 0.5;
        const dy = y / 127 - 0.5;
        const f = Math.min(1, (dx * dx + dy * dy) * 2.2);
        const i = (y * 128 + x) * 4;
        im.data[i]     = Math.round(255 * (0.5 - dx * f * 0.55));
        im.data[i + 1] = Math.round(255 * (0.5 - dy * f * 0.55));
        im.data[i + 2] = 128;
        im.data[i + 3] = 255;
      }
    }
    ctx.putImageData(im, 0, 0);
    document.getElementById("heroCrtMap")?.setAttribute("href", c.toDataURL());
  }, []);

  const shuffled = useMemo(
    () => [...projects].sort(() => Math.random() - 0.5),
    [projects]
  );
  const rings = isMobile ? MOBILE_RINGS : DESKTOP_RINGS;
  const selectedWorks = useMemo(() => {
    const sel = projects.filter(p => p.selected);
    return sel.length > 0 ? sel : projects;
  }, [projects]);

  const { scrollY } = useScroll();

  // 카메라는 구 내부에서 시작 → 스크롤 시 구 전체가 카메라를 관통해 지나간다
  const persp = isMobile ? PERSPECTIVE_MOBILE : PERSPECTIVE_DESKTOP;
  // 카메라를 더 뒤로(z0 감소) — 구의 가시 호가 넓어져 루프 공백이 줄어든다
  const globeZ = useTransform(
    scrollY,
    [0, FLY_RANGE],
    isMobile ? [240, 1150] : [470, 2000]
  );
  // 종반 페이드는 늦게·짧게 — 복귀 스크롤에서 구가 반투명한 구간을 최소화
  const stageOpacity = useTransform(scrollY, [FLY_RANGE * 0.7, FLY_RANGE * 0.95], [1, 0]);

  // ── 타이틀 래치: 소개문이 타이틀 바로 아래 붙을 때까지 타이틀은 고정 ──
  // latch = 소개문이 타이틀 하단(+간격)까지 올라가야 하는 거리(px), 런타임 측정.
  // 소개문은 속도 S로 상승, 타이틀은 소개문이 붙은 뒤부터 같은 속도로 밀려난다.
  const titleBoxRef = useRef<HTMLDivElement>(null);
  const descBoxRef = useRef<HTMLDivElement>(null);
  const latchRef = useRef(320);
  const speedRef = useRef(0.5);
  useEffect(() => {
    const measure = () => {
      const t = titleBoxRef.current?.getBoundingClientRect();
      const d = descBoxRef.current?.getBoundingClientRect();
      if (!t || !d || window.scrollY > 4) return; // transform 0인 초기 상태에서만 측정
      const dist = Math.max(80, d.top - t.bottom - 12);
      latchRef.current = dist;
      speedRef.current = dist / (FLY_RANGE * 0.5); // 스크롤 절반 지점에서 도킹
    };
    // 폰트 로드/타이틀 핏 후 측정
    const timer = setTimeout(() => document.fonts.ready.then(measure), 100);
    window.addEventListener("resize", measure);
    return () => { clearTimeout(timer); window.removeEventListener("resize", measure); };
  }, [siteData, isMobile]);

  const descY = useTransform(scrollY, v => -(v * speedRef.current));
  const titleY = useTransform(scrollY, v => -Math.max(0, v * speedRef.current - latchRef.current));
  const textOpacity = useTransform(scrollY, [FLY_RANGE * 0.62, FLY_RANGE * 0.9], [1, 0]);

  const openProject = (p: Project) => router.push(`/project/${p.id}`);

  const title = siteData?.landingTitle || "Work Archive";
  const subtitle = siteData?.landingSubtitle || "2015–Present";
  const desc = siteData?.landingDescriptionEn || siteData?.landingDescription || "";

  // 타이틀 폭 맞춤 (기존 방식 유지)
  const measureRef = useRef<HTMLSpanElement>(null);
  const [titleFontSize, setTitleFontSize] = useState("11vw");
  useEffect(() => {
    const fit = () => {
      const span = measureRef.current;
      const box = titleBoxRef.current;
      if (!span || !box) return;
      const textW = span.getBoundingClientRect().width;
      if (textW === 0 || box.offsetWidth === 0) return;
      setTitleFontSize(`${(box.offsetWidth / textW) * 100}px`);
    };
    document.fonts.ready.then(fit);
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [siteData]);

  let runningIdx = 0;

  return (
    <div style={{ color: "#0A0A0A", background: "#F0F0F0" }}>
      <Header
        onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        onViewAll={() => router.push("/work")}
        onAbout={() => router.push("/about")}
        onContact={() => setContactOpen(true)}
        zIndex={500}
        siteData={siteData}
        lang="ko"
      />
      <style>{`
        @keyframes heroDSpin {
          from { transform: rotateY(0deg); }
          to   { transform: rotateY(360deg); }
        }
        /* 반(半)곡률 보정 — 공전 주기의 2배로 돌며 접선 기울기의 절반만 남긴다 */
        @keyframes heroDFace {
          from { transform: rotateY(270deg); }
          to   { transform: rotateY(-90deg); }
        }
        /* 글로벌 리듬 — 글로브 전체를 하나의 레이어가 통째로 밀었다 놓는다.
           모든 이미지가 같은 순간에 빨라지고 느려진다 (개별 위상 무관). */
        @keyframes heroDPulse {
          0%   { transform: rotateY(0deg); }
          50%  { transform: rotateY(12deg); }
          100% { transform: rotateY(0deg); }
        }
      `}</style>

      {/* CRT 봉긋 왜곡 필터 (호버 펄스 시에만 적용) */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        {/* primitiveUnits=objectBoundingBox — feImage가 대상 박스에 정확히 맞아
            이미지가 어긋나 이중 레이어처럼 보이던 문제를 없앤다 */}
        <filter id="heroCrt" x="-15%" y="-15%" width="130%" height="130%" primitiveUnits="objectBoundingBox" colorInterpolationFilters="sRGB">
          <feImage id="heroCrtMap" result="map" x="0" y="0" width="1" height="1" preserveAspectRatio="none" />
          <feDisplacementMap id="heroCrtDisp" in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* ── Layer 1: 고정 히어로 ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          height: "100vh",
          overflow: "hidden",
          zIndex: 1,
          background: "#F0F0F0",
        }}
      >
        {/* perspective 스테이지 — 종반 페이드 담당 */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            perspective: `${persp}px`,
            perspectiveOrigin: "50% 50%",
            opacity: stageOpacity,
            zIndex: 2,
            // 카메라가 구 안에 있으면 스테이지/컨테이너의 투명 판이 눈앞에 놓여
            // 히트테스트를 전부 가로챈다 — none으로 뚫고 카드에서만 auto
            pointerEvents: "none",
          }}
        >
          {/* 글로브 — 스크롤 전진 */}
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              transformStyle: "preserve-3d",
              z: globeZ,
              pointerEvents: "none",
            }}
          >
            {/* 랜딩 스윙 — 첫 등장 때 구 전체가 크게 돌며 감속해 자리를 잡는다 */}
            <motion.div
              initial={{ rotateY: -75 }}
              animate={{ rotateY: 0 }}
              transition={{ duration: 3.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}
            >
            {/* 글로벌 리듬 레이어 — 구 전체가 한 몸으로 맥박친다 */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                transformStyle: "preserve-3d",
                animation: "heroDPulse 9s ease-in-out infinite",
                animationPlayState: orbitPaused ? "paused" : "running",
              }}
            >
              {shuffled.length > 0 && rings.map((ring, ri) => {
                const start = runningIdx;
                runningIdx += ring.count;
                // 프로젝트 수가 링 슬롯보다 적으면 순환 충당해 구를 꽉 채운다
                return Array.from({ length: ring.count }, (_, i) => (
                  <OrbitImage
                    key={`${ri}-${i}`}
                    project={shuffled[(start + i) % shuffled.length]}
                    ring={ring}
                    idxInRing={i}
                    globalIdx={start + i}
                    paused={orbitPaused}
                    onHoverChange={setOrbitPaused}
                    onOpen={openProject}
                  />
                ));
              })}
            </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* 타이틀 — difference 블렌드, 소개문이 붙은 뒤 함께 퇴장 */}
        <motion.div
          ref={titleBoxRef}
          style={{
            position: "absolute",
            top: isMobile ? "58px" : "67px",
            left: GUTTER,
            right: GUTTER,
            zIndex: 20,
            pointerEvents: "none",
            mixBlendMode: "difference",
            y: titleY,
            opacity: textOpacity,
          }}
        >
          <span
            ref={measureRef}
            aria-hidden
            style={{
              position: "absolute",
              visibility: "hidden",
              whiteSpace: "nowrap",
              fontFamily: FONT,
              fontWeight: 300,
              fontSize: "100px",
              letterSpacing: "-0.045em",
            }}
          >
            {title}
          </span>
          <motion.h1
            initial={{ filter: "blur(24px)", opacity: 0 }}
            animate={{ filter: "blur(0px)", opacity: 1 }}
            transition={{ duration: 1.4, delay: 1.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: FONT,
              fontWeight: 300,
              fontSize: titleFontSize,
              letterSpacing: "-0.045em",
              lineHeight: 0.88,
              color: "#FFFFFF",
              margin: 0,
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 2.2 }}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              margin: 0,
              fontFamily: FONT,
              fontWeight: 300,
              fontSize: "clamp(12px, 1.6vw, 24px)",
              lineHeight: 0.88,
              color: "rgba(255,255,255,0.5)",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </motion.p>
        </motion.div>

        {/* 소개문 — 하단에서 올라와 타이틀 아래 도킹 */}
        {desc && (
          <motion.div
            ref={descBoxRef}
            style={{
              position: "absolute",
              top: "72vh",
              left: GUTTER,
              right: GUTTER,
              zIndex: 20,
              pointerEvents: "none",
              mixBlendMode: "difference",
              y: descY,
              opacity: textOpacity,
            }}
          >
            <motion.p
              initial={{ filter: "blur(16px)", opacity: 0 }}
              animate={{ filter: "blur(0px)", opacity: 1 }}
              transition={{ duration: 1.4, delay: 2.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontFamily: FONT,
                fontWeight: 300,
                fontSize: isMobile ? "clamp(13px, 3.7vw, 19px)" : "clamp(10px, 2.5vw, 40px)",
                color: "#FFFFFF",
                lineHeight: 1.36,
                margin: 0,
              }}
            >
              {desc}
            </motion.p>
          </motion.div>
        )}
      </div>

      {/* ── 스크롤 트랙 — 이미지가 다 빠지기 전에 다음 섹션이 올라와 겹치도록 짧게 ── */}
      <div style={{ height: `calc(100vh + ${Math.round(FLY_RANGE * 0.72)}px)` }} />

      {/* ── Layer 2: Selected Works — 셔플 역재생 정렬 ── */}
      <div
        style={{
          position: "relative",
          zIndex: 30,
          background: "#F0F0F0",
        }}
      >
        <HScrollWorks projects={selectedWorks} onOpen={openProject} />
        <div style={{ height: SPACE_B }} />
      </div>

      <ContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        email={siteData?.footerEmail ?? ""}
        igHandle={siteData?.footerInstagramHandle ?? ""}
        igUrl={siteData?.footerInstagramUrl ?? ""}
      />
    </div>
  );
}
