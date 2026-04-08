"use client";
import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";

// ── Character-level disintegration ──
function ParticleText({
  text,
  fontSize = "calc((100vw - 112px) / 7)",
  color = "#0A0A0A",
  style,
}: {
  text: string;
  fontSize?: string;
  color?: string;
  style?: React.CSSProperties;
}) {
  const [exploded, setExploded] = useState(false);
  const seedRef = useRef<{ x: number; y: number; r: number }[]>([]);

  // Generate random offsets once per character
  if (seedRef.current.length !== text.length) {
    seedRef.current = text.split("").map(() => ({
      x: (Math.random() - 0.5) * 600,
      y: (Math.random() - 0.5) * 400,
      r: (Math.random() - 0.5) * 180,
    }));
  }
  const seeds = seedRef.current;

  return (
    <div
      onMouseEnter={() => setExploded(true)}
      onMouseLeave={() => setExploded(false)}
      style={{
        cursor: "pointer",
        display: "inline-block",
        position: "relative",
        ...style,
      }}
    >
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          animate={exploded ? {
            x: seeds[i].x,
            y: seeds[i].y,
            rotate: seeds[i].r,
            opacity: 0,
            scale: 0.3,
          } : {
            x: 0,
            y: 0,
            rotate: 0,
            opacity: 1,
            scale: 1,
          }}
          transition={{
            duration: exploded ? 0.8 : 0.5,
            delay: exploded ? i * 0.015 : (text.length - i) * 0.008,
            ease: exploded ? [0.32, 0, 0.67, 0] : [0.16, 1, 0.3, 1],
          }}
          style={{
            display: "inline-block",
            fontFamily: FONT,
            fontWeight: 300,
            fontSize,
            letterSpacing: "-0.045em",
            lineHeight: 0.88,
            color,
            whiteSpace: "pre",
          }}
        >
          {char}
        </motion.span>
      ))}
    </div>
  );
}

// ── Pixel-level disintegration via Canvas ──
function PixelParticleText({
  text,
  fontSize = 80,
  color = "#0A0A0A",
}: {
  text: string;
  fontSize?: number;
  color?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<{ x: number; y: number; tx: number; ty: number }[]>([]);
  const [exploded, setExploded] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const didInit = useRef(false);

  const init = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas || didInit.current) return;
    didInit.current = true;
    canvasRef.current = canvas;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.font = `300 ${fontSize}px JetBrains Mono, monospace`;
    ctx.fillStyle = color;
    const metrics = ctx.measureText(text);
    const w = Math.ceil(metrics.width) + 20;
    const h = fontSize * 1.4;
    canvas.width = w;
    canvas.height = h;
    setSize({ w, h });

    ctx.font = `300 ${fontSize}px JetBrains Mono, monospace`;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";
    ctx.fillText(text, 0, fontSize * 0.15);

    const imgData = ctx.getImageData(0, 0, w, h);
    const pts: { x: number; y: number; tx: number; ty: number }[] = [];
    const step = 3; // sample every 3px for performance
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const idx = (y * w + x) * 4;
        if (imgData.data[idx + 3] > 80) {
          pts.push({
            x, y,
            tx: x + (Math.random() - 0.5) * 500,
            ty: y + (Math.random() - 0.5) * 350,
          });
        }
      }
    }
    setParticles(pts);
  }, [text, fontSize, color]);

  return (
    <div
      onMouseEnter={() => setExploded(true)}
      onMouseLeave={() => setExploded(false)}
      style={{ position: "relative", cursor: "pointer", width: size.w || "auto", height: size.h || fontSize * 1.4 }}
    >
      {/* Hidden canvas for text measurement */}
      <canvas ref={init} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />

      {/* Particles */}
      <svg width={size.w || 1} height={size.h || 1} style={{ display: "block" }}>
        {particles.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={1.2}
            fill={color}
            animate={exploded ? {
              cx: p.tx,
              cy: p.ty,
              opacity: 0,
              r: 0.4,
            } : {
              cx: p.x,
              cy: p.y,
              opacity: 1,
              r: 1.2,
            }}
            transition={{
              duration: exploded ? 1.0 : 0.6,
              delay: exploded ? Math.random() * 0.3 : Math.random() * 0.2,
              ease: exploded ? [0.32, 0, 0.67, 0] : [0.16, 1, 0.3, 1],
            }}
          />
        ))}
      </svg>
    </div>
  );
}

// ── Test page ──
export default function TestParticle() {
  const [perfStart, setPerfStart] = useState<number | null>(null);
  const [perfTime, setPerfTime] = useState<string>("");

  const measure = (fn: () => void) => {
    const start = performance.now();
    fn();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPerfTime(`${(performance.now() - start).toFixed(1)}ms`);
      });
    });
  };

  return (
    <div style={{ background: "#F0F0F0", minHeight: "100vh", padding: "80px 56px" }}>
      <div style={{ fontFamily: FONT, fontSize: "12px", color: "rgba(0,0,0,0.4)", marginBottom: "40px" }}>
        Hover each text to test disintegration. Performance: {perfTime || "—"}
      </div>

      {/* Test 1: Character-level */}
      <div style={{ marginBottom: "80px" }}>
        <div style={{ fontFamily: FONT, fontSize: "11px", color: "rgba(0,0,0,0.35)", marginBottom: "16px", letterSpacing: "0.06em" }}>
          METHOD 1 — CHARACTER LEVEL
        </div>
        <ParticleText
          text="Work Archive"
          fontSize="clamp(60px, 8vw, 120px)"
        />
      </div>

      {/* Test 2: Character-level description */}
      <div style={{ marginBottom: "80px" }}>
        <div style={{ fontFamily: FONT, fontSize: "11px", color: "rgba(0,0,0,0.35)", marginBottom: "16px", letterSpacing: "0.06em" }}>
          METHOD 1 — DESCRIPTION TEXT
        </div>
        <ParticleText
          text="Hello, I'm Jinyoung Hwang, a brand designer."
          fontSize="clamp(14px, 1.6vw, 22px)"
          color="rgba(0,0,0,0.6)"
        />
      </div>

      {/* Test 3: Pixel-level */}
      <div style={{ marginBottom: "80px" }}>
        <div style={{ fontFamily: FONT, fontSize: "11px", color: "rgba(0,0,0,0.35)", marginBottom: "16px", letterSpacing: "0.06em" }}>
          METHOD 2 — PIXEL LEVEL (heavier)
        </div>
        <PixelParticleText text="Work Archive" fontSize={100} />
      </div>

      {/* Test 4: Pixel-level small */}
      <div style={{ marginBottom: "80px" }}>
        <div style={{ fontFamily: FONT, fontSize: "11px", color: "rgba(0,0,0,0.35)", marginBottom: "16px", letterSpacing: "0.06em" }}>
          METHOD 2 — DESCRIPTION (pixel)
        </div>
        <PixelParticleText text="Hello, I'm Jinyoung Hwang, a brand designer." fontSize={20} color="rgba(0,0,0,0.6)" />
      </div>
    </div>
  );
}
