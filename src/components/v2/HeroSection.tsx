"use client";
import { useState, useEffect, useRef } from "react";
import {
  motion,
  useTransform,
  useMotionValue,
  useSpring,
  useAnimationControls,
  MotionValue,
} from "framer-motion";
import { Project, SiteData } from "./types";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";

type ScatterPos = { left: string; top: string; w: string; rotate: number };

// 5 columns × 2 rows: each image gets its own zone → even fill, no clustering
function makeScatter(): ScatterPos[] {
  const positions: ScatterPos[] = [];
  const COLS = 5, ROWS = 2;
  const zoneW = 74 / COLS; // ~14.8vw per column; total span 3–77vw left edge

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const baseLeft = 3 + col * zoneW;
      const baseTop = row === 0 ? 25 : 50; // row 0: 25–41vh, row 1: 50–66vh
      positions.push({
        left: `${baseLeft + Math.random() * (zoneW * 0.82)}vw`,
        top: `${baseTop + Math.random() * 16}vh`,
        w: `${14 + Math.random() * 8}vw`, // 14–22vw
        rotate: (Math.random() - 0.5) * 30, // ±15°
      });
    }
  }
  // Shuffle so z-order isn't always left-to-right
  return positions.sort(() => Math.random() - 0.5);
}

// Individual collage image — separate component so hooks are called per image
function CollageImage({
  src,
  pos,
  idx,
  total,
  scrollProgress,
  mouseX,
  mouseY,
}: {
  src: string;
  pos: ScatterPos;
  idx: number;
  total: number;
  scrollProgress: MotionValue<number>;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}) {
  // Each image's scroll-out range: starts at 0.08 + (i/total)*0.55, ends start+0.20
  const start = 0.08 + (idx / total) * 0.55;
  const end = start + 0.20;
  const opacityEnd = start + 0.20 * 0.6; // at 60% of range opacity hits 0

  const y = useTransform(scrollProgress, [start, end], ["0vh", "-85vh"]);
  const opacity = useTransform(scrollProgress, [start, opacityEnd], [1, 0]);
  const blurRaw = useTransform(scrollProgress, [start, end], [0, 18]);
  const filter = useTransform(blurRaw, (v: number) => `blur(${v}px)`);

  // Mouse tilt: max ±8 deg
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 + idx * 0.07, duration: 0.5, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: pos.left,
        top: pos.top,
        width: pos.w,
        minWidth: "80px",
        maxWidth: "380px",
        zIndex: 10,
        perspective: "600px",
      }}
    >
      <motion.div
        style={{
          y,
          opacity,
          filter,
          rotate: pos.rotate,
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          borderRadius: "2px",
          overflow: "hidden",
          boxShadow: "0 4px 18px rgba(0,0,0,0.16)",
        }}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </motion.div>
    </motion.div>
  );
}

// Description text with blur-in entrance
function DescriptionText({
  text,
  scrollProgress,
}: {
  text: string;
  scrollProgress: MotionValue<number>;
}) {
  const controls = useAnimationControls();

  useEffect(() => {
    controls.start({
      filter: "blur(0px)",
      opacity: 1,
      transition: { duration: 1.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const y = useTransform(scrollProgress, [0.62, 0.92], ["0px", "-57vh"]);

  return (
    <motion.div
      style={{
        position: "absolute",
        top: "74vh",
        left: "clamp(20px, 4vw, 56px)",
        right: "clamp(20px, 4vw, 56px)",
        maxWidth: "clamp(280px, 42vw, 580px)",
        zIndex: 5,
        pointerEvents: "none",
        y,
      }}
    >
      <motion.p
        initial={{ filter: "blur(20px)", opacity: 0 }}
        animate={controls}
        style={{
          fontFamily: FONT,
          fontWeight: 300,
          fontSize: "clamp(12px, 1vw, 15px)",
          color: "rgba(10,10,10,0.42)",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {text}
      </motion.p>
    </motion.div>
  );
}

interface HeroProps {
  scrollProgress: MotionValue<number>;
  projects: Project[];
  siteData: SiteData | null;
}

export default function HeroSection({ scrollProgress, projects, siteData }: HeroProps) {
  const [scatter] = useState<ScatterPos[]>(() => makeScatter());

  // Mouse tracking for tilt
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);
  const mouseX = useSpring(rawMouseX, { stiffness: 50, damping: 20 });
  const mouseY = useSpring(rawMouseY, { stiffness: 50, damping: 20 });

  const titleControls = useAnimationControls();

  useEffect(() => {
    titleControls.start({
      filter: "blur(0px)",
      opacity: 1,
      transition: { duration: 1.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] },
    });

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to -0.5 .. 0.5
      rawMouseX.set(e.clientX / window.innerWidth - 0.5);
      rawMouseY.set(e.clientY / window.innerHeight - 0.5);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = siteData?.landingTitle || "Work Archive";
  const subtitle = siteData?.landingSubtitle || "2015–Present";
  const desc = siteData?.landingDescription || "";
  const heroProjects = projects.slice(0, 10);
  const total = heroProjects.length;

  const infoTextStyle: React.CSSProperties = {
    fontFamily: FONT,
    fontStyle: "italic",
    fontWeight: 300,
    fontSize: "clamp(11px, 0.85vw, 13px)",
    color: "rgba(10,10,10,0.35)",
    letterSpacing: "0em",
    margin: 0,
  };

  return (
    <section
      style={{
        position: "absolute",
        inset: 0,
        background: "#F0F0F0",
        overflow: "hidden",
      }}
    >
      {/* ── Title area ── */}
      <div
        style={{
          position: "absolute",
          top: "clamp(56px, 7vh, 80px)",
          left: "clamp(20px, 4vw, 56px)",
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <motion.h1
          initial={{ filter: "blur(28px)", opacity: 0 }}
          animate={titleControls}
          style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: "calc((100vw - clamp(48px, 8vw, 112px)) / 7)",
            letterSpacing: "-0.045em",
            lineHeight: 0.88,
            color: "#0A0A0A",
            margin: 0,
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </motion.h1>

        {/* 4-column info grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 0.3fr 1fr 1fr",
            marginTop: "clamp(10px, 1.2vh, 18px)",
            maxWidth: "clamp(320px, 55vw, 720px)",
          }}
        >
          <p style={infoTextStyle}>{subtitle}</p>
          <div />
          <p style={infoTextStyle}>Brand design</p>
          <p style={infoTextStyle}>Visual design</p>
        </div>
      </div>

      {/* ── Collage images ── */}
      {heroProjects.map((project, i) => (
        <CollageImage
          key={project.id}
          src={project.img}
          pos={scatter[i % scatter.length]}
          idx={i}
          total={total}
          scrollProgress={scrollProgress}
          mouseX={mouseX}
          mouseY={mouseY}
        />
      ))}

      {/* ── Description ── */}
      {desc && (
        <DescriptionText text={desc} scrollProgress={scrollProgress} />
      )}
    </section>
  );
}
