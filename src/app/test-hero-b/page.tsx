"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// ─── Inline 2D Simplex Noise ────────────────────────────────────────────────
// Based on Stefan Gustavson's simplex noise algorithm.
// Produces smooth, non-repeating pseudo-random values in [-1, 1].

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

const GRAD3: [number, number][] = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

// Permutation table (doubled to avoid wrapping)
const perm: number[] = [];
const permSeed = [
  151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,
  140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,
  247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,
  57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,
  74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,
  60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,
  65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,
  200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,
  52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,
  207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,
  119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,
  129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,
  218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,
  81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,
  184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,
  222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180,
];
for (let i = 0; i < 256; i++) perm[i] = permSeed[i];
for (let i = 256; i < 512; i++) perm[i] = perm[i - 256];

function simplex2(xin: number, yin: number): number {
  const s = (xin + yin) * F2;
  const i = Math.floor(xin + s);
  const j = Math.floor(yin + s);
  const t = (i + j) * G2;
  const X0 = i - t;
  const Y0 = j - t;
  const x0 = xin - X0;
  const y0 = yin - Y0;

  let i1: number, j1: number;
  if (x0 > y0) { i1 = 1; j1 = 0; }
  else { i1 = 0; j1 = 1; }

  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2;
  const y2 = y0 - 1 + 2 * G2;

  const ii = i & 255;
  const jj = j & 255;

  const dot2 = (g: [number, number], x: number, y: number) => g[0] * x + g[1] * y;

  let n0 = 0, n1 = 0, n2 = 0;

  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 >= 0) {
    t0 *= t0;
    const gi0 = perm[ii + perm[jj]] % 8;
    n0 = t0 * t0 * dot2(GRAD3[gi0], x0, y0);
  }

  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 >= 0) {
    t1 *= t1;
    const gi1 = perm[ii + i1 + perm[jj + j1]] % 8;
    n1 = t1 * t1 * dot2(GRAD3[gi1], x1, y1);
  }

  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 >= 0) {
    t2 *= t2;
    const gi2 = perm[ii + 1 + perm[jj + 1]] % 8;
    n2 = t2 * t2 * dot2(GRAD3[gi2], x2, y2);
  }

  // Scale to [-1, 1]
  return 70 * (n0 + n1 + n2);
}

// ─── Card Data ──────────────────────────────────────────────────────────────

interface CardData {
  id: number;
  label: string;
  color: string;
  colSpan: number;       // 2-5 columns in 16-col grid
  gridCol: number;       // starting column (1-based)
  gridRow: number;       // rough row placement
  noiseOffsetX: number;
  noiseOffsetY: number;
  noiseOffsetScale: number;
}

const COLORS = [
  "#2D2D2D", "#4A90D9", "#D94A4A", "#4AD97A",
  "#D9A84A", "#7A4AD9", "#4AD9D9", "#D94A90",
  "#8B8B00", "#008B8B",
];

const cards: CardData[] = [
  { id: 1, label: "IMG_001", color: COLORS[0], colSpan: 3, gridCol: 1,  gridRow: 0, noiseOffsetX: 0,    noiseOffsetY: 3.7,  noiseOffsetScale: 7.1  },
  { id: 2, label: "IMG_002", color: COLORS[1], colSpan: 4, gridCol: 5,  gridRow: 0, noiseOffsetX: 1.3,  noiseOffsetY: 5.2,  noiseOffsetScale: 11.4 },
  { id: 3, label: "IMG_003", color: COLORS[2], colSpan: 2, gridCol: 10, gridRow: 0, noiseOffsetX: 2.7,  noiseOffsetY: 8.1,  noiseOffsetScale: 15.9 },
  { id: 4, label: "IMG_004", color: COLORS[3], colSpan: 5, gridCol: 13, gridRow: 0, noiseOffsetX: 4.1,  noiseOffsetY: 11.3, noiseOffsetScale: 20.2 },
  { id: 5, label: "IMG_005", color: COLORS[4], colSpan: 3, gridCol: 2,  gridRow: 1, noiseOffsetX: 5.5,  noiseOffsetY: 14.6, noiseOffsetScale: 24.8 },
  { id: 6, label: "IMG_006", color: COLORS[5], colSpan: 4, gridCol: 6,  gridRow: 1, noiseOffsetX: 6.9,  noiseOffsetY: 17.9, noiseOffsetScale: 29.3 },
  { id: 7, label: "IMG_007", color: COLORS[6], colSpan: 2, gridCol: 11, gridRow: 1, noiseOffsetX: 8.3,  noiseOffsetY: 21.2, noiseOffsetScale: 33.7 },
  { id: 8, label: "IMG_008", color: COLORS[7], colSpan: 3, gridCol: 14, gridRow: 1, noiseOffsetX: 9.7,  noiseOffsetY: 24.5, noiseOffsetScale: 38.1 },
  { id: 9, label: "IMG_009", color: COLORS[8], colSpan: 5, gridCol: 3,  gridRow: 2, noiseOffsetX: 11.1, noiseOffsetY: 27.8, noiseOffsetScale: 42.6 },
  { id: 10,label: "IMG_010", color: COLORS[9], colSpan: 4, gridCol: 9,  gridRow: 2, noiseOffsetX: 12.5, noiseOffsetY: 31.1, noiseOffsetScale: 47.0 },
];

// ─── Drifting Card Component ────────────────────────────────────────────────

function DriftingCard({ card, index }: { card: CardData; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const [visible, setVisible] = useState(false);

  // Staggered fade-in
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  // Noise-driven drift via rAF
  useEffect(() => {
    if (!visible) return;

    const SPEED = 0.00015; // very slow time progression
    const AMP_X = 6;       // px amplitude
    const AMP_Y = 5;
    const SCALE_MIN = 0.94;
    const SCALE_MAX = 0.98;

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - startTime) * SPEED;

      const nx = simplex2(elapsed + card.noiseOffsetX, card.noiseOffsetX);
      const ny = simplex2(elapsed + card.noiseOffsetY, card.noiseOffsetY + 100);
      const ns = simplex2(elapsed * 0.7 + card.noiseOffsetScale, card.noiseOffsetScale + 200);

      const dx = nx * AMP_X;
      const dy = ny * AMP_Y;
      const scale = SCALE_MIN + ((ns + 1) / 2) * (SCALE_MAX - SCALE_MIN);

      if (ref.current) {
        ref.current.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${scale.toFixed(4)})`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible, card]);

  const colWidth = `calc(${(card.colSpan / 16) * 100}% - 16px)`;
  const leftPos = `calc(${((card.gridCol - 1) / 16) * 100}% + 8px)`;
  const topPos = `calc(${card.gridRow * 220 + 120}px)`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: leftPos,
        top: topPos,
        width: colWidth,
      }}
    >
      <div
        ref={ref}
        style={{
          width: "100%",
          height: 180,
          backgroundColor: card.color,
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: "0.05em",
          willChange: "transform",
          cursor: "default",
          userSelect: "none",
        }}
      >
        {card.label}
      </div>
    </motion.div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function TestHeroBPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F0F0F0",
        fontFamily: "'JetBrains Mono', monospace",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Title */}
      <h1
        style={{
          position: "absolute",
          top: 36,
          left: 40,
          fontSize: 28,
          fontWeight: 700,
          color: "#1A1A1A",
          margin: 0,
          zIndex: 10,
          letterSpacing: "-0.02em",
        }}
      >
        B. Perlin Noise Drift
      </h1>

      {/* Subtitle */}
      <p
        style={{
          position: "absolute",
          top: 72,
          left: 40,
          fontSize: 13,
          color: "#888",
          margin: 0,
          zIndex: 10,
        }}
      >
        Simplex noise &middot; 10 cards &middot; independent drift
      </p>

      {/* Cards container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          padding: "0 24px",
          boxSizing: "border-box",
        }}
      >
        {cards.map((card, i) => (
          <DriftingCard key={card.id} card={card} index={i} />
        ))}
      </div>
    </div>
  );
}
