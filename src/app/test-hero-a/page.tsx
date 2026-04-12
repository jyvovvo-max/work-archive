"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

// --- Card Data ---
const CARDS = [
  { id: 1, colSpan: 3, color: "#2D2D2D", top: 8, left: 5 },
  { id: 2, colSpan: 5, color: "#4A90D9", top: 12, left: 35 },
  { id: 3, colSpan: 2, color: "#D94A4A", top: 6, left: 72 },
  { id: 4, colSpan: 4, color: "#3DAA6D", top: 32, left: 10 },
  { id: 5, colSpan: 3, color: "#9B59B6", top: 28, left: 55 },
  { id: 6, colSpan: 5, color: "#E67E22", top: 50, left: 25 },
  { id: 7, colSpan: 2, color: "#1ABC9C", top: 55, left: 70 },
  { id: 8, colSpan: 4, color: "#34495E", top: 72, left: 8 },
  { id: 9, colSpan: 3, color: "#C0392B", top: 68, left: 50 },
  { id: 10, colSpan: 2, color: "#8E44AD", top: 45, left: 80 },
];

// Pre-generate random parameters per card (deterministic per id)
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49979;
  return x - Math.floor(x);
}

const CARD_PARAMS = CARDS.map((card) => ({
  ...card,
  freqX: 8 + seededRandom(card.id * 1) * 7, // 8-15s period
  freqY: 8 + seededRandom(card.id * 2) * 7,
  phaseX: seededRandom(card.id * 3) * Math.PI * 2,
  phaseY: seededRandom(card.id * 4) * Math.PI * 2,
  ampX: 3 + seededRandom(card.id * 5) * 3, // 3-6px
  ampY: 3 + seededRandom(card.id * 6) * 3,
  breathPhase: seededRandom(card.id * 7) * Math.PI * 2,
  width: (card.colSpan / 16) * 100, // percentage of viewport
}));

// --- Floating Card Component ---
function FloatingCard({
  card,
  index,
}: {
  card: (typeof CARD_PARAMS)[0];
  index: number;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(0.95);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000; // seconds

      // Sine float on x and y
      const nx =
        Math.sin((elapsed * Math.PI * 2) / card.freqX + card.phaseX) *
        card.ampX;
      const ny =
        Math.cos((elapsed * Math.PI * 2) / card.freqY + card.phaseY) *
        card.ampY;

      // Scale breathing: 0.95 -> 0.97 -> 0.95, ~10s cycle
      const s =
        0.96 +
        0.01 *
          Math.sin((elapsed * Math.PI * 2) / 10 + card.breathPhase);

      x.set(nx);
      y.set(ny);
      scale.set(s);

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [x, y, scale, card]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 1,
        delay: index * 0.1,
        ease: "easeOut",
      }}
      style={{
        position: "absolute",
        top: `${card.top}%`,
        left: `${card.left}%`,
        width: `${card.width}vw`,
        aspectRatio: "16 / 10",
        x,
        y,
        scale,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: card.color,
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.10), 0 1px 6px rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 14,
          color: "rgba(255,255,255,0.7)",
          letterSpacing: 1,
          userSelect: "none",
        }}
      >
        CARD-{String(card.id).padStart(2, "0")}
      </div>
    </motion.div>
  );
}

// --- Page ---
export default function TestHeroAPage() {
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#F0F0F0",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* Title */}
      <h1
        style={{
          position: "absolute",
          top: 32,
          left: 40,
          margin: 0,
          fontSize: 28,
          fontWeight: 600,
          color: "#222",
          zIndex: 10,
          letterSpacing: -0.5,
        }}
      >
        A. Sine Float
      </h1>

      {/* Floating cards */}
      {CARD_PARAMS.map((card, i) => (
        <FloatingCard key={card.id} card={card} index={i} />
      ))}
    </div>
  );
}
