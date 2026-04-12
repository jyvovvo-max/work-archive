"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface CardConfig {
  id: number;
  label: string;
  color: string;
  colSpan: number;
  initialX: number;
  initialY: number;
  amplitudeX: number;
  amplitudeY: number;
  freqX: number;
  freqY: number;
  phaseX: number;
  phaseY: number;
  period: number;
}

const COLORS = [
  "#2D2D2D",
  "#4A6741",
  "#8B6914",
  "#3B5998",
  "#6B3A5D",
  "#2E4057",
  "#7A4419",
  "#1A5276",
  "#4A235A",
  "#1B4F72",
];

const FREQ_RATIOS: [number, number][] = [
  [2, 3],
  [3, 4],
  [1, 2],
  [3, 2],
  [4, 3],
  [2, 1],
  [5, 4],
  [3, 5],
  [1, 3],
  [4, 5],
];

function generateCards(): CardConfig[] {
  const cards: CardConfig[] = [];
  const count = 10;

  for (let i = 0; i < count; i++) {
    const colSpan = 2 + Math.floor(Math.random() * 4); // 2-5
    const [rx, ry] = FREQ_RATIOS[i % FREQ_RATIOS.length];
    const period = 10 + Math.random() * 10; // 10-20s
    const baseFreq = (2 * Math.PI) / period;

    cards.push({
      id: i,
      label: `Card ${i + 1}`,
      color: COLORS[i % COLORS.length],
      colSpan,
      initialX: 5 + Math.random() * 70,
      initialY: 10 + Math.random() * 65,
      amplitudeX: 4 + Math.random() * 4,
      amplitudeY: 4 + Math.random() * 4,
      freqX: baseFreq * rx,
      freqY: baseFreq * ry,
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      period,
    });
  }

  return cards;
}

function OrbitalCard({
  card,
  index,
  isReady,
}: {
  card: CardConfig;
  index: number;
  isReady: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const startTime = useRef<number>(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    const timer = setTimeout(() => setVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [isReady, index]);

  useEffect(() => {
    if (!visible) return;

    startTime.current = performance.now();

    const animate = (now: number) => {
      const el = ref.current;
      if (!el) return;

      const t = (now - startTime.current) / 1000;

      const x = card.amplitudeX * Math.sin(card.freqX * t + card.phaseX);
      const y = card.amplitudeY * Math.sin(card.freqY * t + card.phaseY);

      // Rotation: ±2° synced with orbit
      const rotation =
        2 * Math.sin(card.freqX * t + card.phaseX) * 0.5 +
        2 * Math.cos(card.freqY * t + card.phaseY) * 0.5;

      // Scale breathing: 0.94 → 0.98
      const scale =
        0.96 + 0.02 * Math.sin((2 * Math.PI * t) / card.period);

      el.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`;

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [visible, card]);

  const colWidth = 100 / 16;
  const width = card.colSpan * colWidth;
  const height = 60 + card.colSpan * 20;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 1, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: `${card.initialX}%`,
        top: `${card.initialY}%`,
        width: `${width}vw`,
        height: `${height}px`,
        backgroundColor: card.color,
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "13px",
        color: "rgba(255, 255, 255, 0.7)",
        letterSpacing: "0.5px",
        willChange: "transform",
        cursor: "default",
        userSelect: "none",
      }}
    >
      <span style={{ opacity: 0.8 }}>{card.label}</span>
      <span
        style={{
          position: "absolute",
          bottom: 8,
          right: 12,
          fontSize: "10px",
          opacity: 0.4,
        }}
      >
        {card.colSpan}col
      </span>
    </motion.div>
  );
}

export default function TestHeroCPage() {
  const [cards] = useState<CardConfig[]>(() => generateCards());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#F0F0F0",
        overflow: "hidden",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <h1
        style={{
          position: "absolute",
          top: 24,
          left: 32,
          fontSize: "18px",
          fontWeight: 600,
          color: "#333",
          zIndex: 10,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "-0.3px",
        }}
      >
        C. Orbital (Lissajous)
      </h1>

      {cards.map((card, i) => (
        <OrbitalCard key={card.id} card={card} index={i} isReady={isReady} />
      ))}
    </div>
  );
}
