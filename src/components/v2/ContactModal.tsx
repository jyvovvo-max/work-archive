"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FONT_MODAL_TITLE, FONT_BODY } from "./layout";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";
const K85 = "#262626";

interface Props {
  open: boolean;
  onClose: () => void;
  email: string;
  igHandle: string;
  igUrl: string;
}

type SendStatus = "idle" | "sending" | "sent" | "error";

export default function ContactModal({ open, onClose, email, igHandle, igUrl }: Props) {
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<SendStatus>("idle");
  const cardRef = useRef<HTMLDivElement>(null);

  // Tilt
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [1.5, -1.5]), { stiffness: 260, damping: 24 });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-1.5, 1.5]), { stiffness: 260, damping: 24 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setStatus("idle"), 400);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleSend = async () => {
    if (!message.trim() || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, message }),
      });
      if (res.ok) {
        setStatus("sent");
        setFrom("");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const handleInstagram = () => {
    const username = igHandle.replace("@", "");
    const deepLink = `instagram://user?username=${username}`;
    const webUrl = igUrl || `https://instagram.com/${username}`;
    const start = Date.now();
    window.location.href = deepLink;
    setTimeout(() => {
      if (Date.now() - start < 1500) window.open(webUrl, "_blank");
    }, 1000);
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: FONT, fontWeight: 300, fontSize: FONT_BODY,
    letterSpacing: "0.01em", lineHeight: 1.7,
    color: "#000000", background: "transparent",
    border: `1px solid ${K85}`,
    borderRadius: 0, padding: "12px 16px",
    outline: "none", width: "100%", boxSizing: "border-box",
    transition: "border-color 0.18s",
  };

  const btnBase: React.CSSProperties = {
    fontFamily: FONT, fontWeight: 400,
    fontSize: FONT_BODY, letterSpacing: "0.04em",
    textTransform: "uppercase",
    borderRadius: 0,
    padding: "12px 28px", cursor: "pointer",
    transition: "opacity 0.15s, background 0.18s",
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 900,
            background: "rgba(0,0,0,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
          }}
        >
          <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              // Translucent white acrylic — background bleeds through
              background: "linear-gradient(180deg, rgba(248,248,248,0.42) 0%, rgba(236,236,236,0.48) 100%)",
              backdropFilter: "blur(40px) saturate(160%)",
              WebkitBackdropFilter: "blur(40px) saturate(160%)",
              // Glassmorphism edge highlights
              boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.8), inset 0 -1px 0 0 rgba(255,255,255,0.2), inset 1px 0 0 0 rgba(255,255,255,0.4), inset -1px 0 0 0 rgba(255,255,255,0.4), 0 25px 60px rgba(0,0,0,0.12)",
              border: "none",
              borderRadius: 0,
              padding: "clamp(32px, 5vh, 56px) clamp(28px, 5vw, 52px)",
              width: "100%", maxWidth: "520px",
              display: "flex", flexDirection: "column", gap: "24px",
              position: "relative",
              overflow: "hidden",
              // Tilt
              rotateX,
              rotateY,
              transformPerspective: 800,
            }}
          >
            {/* Heavy grain texture overlay */}
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: "200px 200px",
              opacity: 0.22,
              mixBlendMode: "multiply",
              pointerEvents: "none",
            }} />

            {/* Close — top right */}
            <button
              onClick={onClose}
              style={{
                position: "absolute", top: "clamp(16px, 2vh, 28px)", right: "clamp(20px, 3vw, 36px)",
                background: "none", border: "none", cursor: "pointer",
                fontFamily: FONT, fontWeight: 300, fontSize: "20px",
                color: K85, lineHeight: 1, zIndex: 1,
                transition: "color 0.15s", padding: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#000")}
              onMouseLeave={e => (e.currentTarget.style.color = K85)}
            >✕</button>

            {/* Title — centered, bold scale */}
            <div style={{ textAlign: "center", position: "relative" }}>
              <span style={{
                fontFamily: FONT, fontWeight: 300,
                fontSize: FONT_MODAL_TITLE, letterSpacing: "0.08em",
                textTransform: "uppercase", color: "#000000",
              }}>Contact</span>
            </div>

            {/* Divider — K85 */}
            <div style={{ height: "1px", background: K85, position: "relative" }} />

            {/* To */}
            <div style={{
              fontFamily: FONT, fontWeight: 300, fontSize: FONT_BODY,
              color: "rgba(0,0,0,0.45)", letterSpacing: "0.02em",
              position: "relative",
            }}>
              To: {email}
            </div>

            {/* From */}
            <input
              type="email"
              value={from}
              onChange={e => setFrom(e.target.value)}
              placeholder="Your email"
              style={{ ...inputStyle, position: "relative" }}
              onFocus={e => (e.currentTarget.style.borderColor = "#000")}
              onBlur={e => (e.currentTarget.style.borderColor = K85)}
            />

            {/* Message */}
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="메시지를 입력하세요"
              rows={6}
              style={{ ...inputStyle, padding: "14px 16px", resize: "none", position: "relative" }}
              onFocus={e => (e.currentTarget.style.borderColor = "#000")}
              onBlur={e => (e.currentTarget.style.borderColor = K85)}
            />

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", position: "relative" }}>
              <button
                onClick={handleSend}
                disabled={status === "sending" || !message.trim()}
                style={{
                  ...btnBase,
                  color: "#F0EDE8",
                  background: "#0A0A0A",
                  border: `1px solid ${K85}`,
                  opacity: status === "sending" || !message.trim() ? 0.35 : 1,
                  cursor: status === "sending" || !message.trim() ? "default" : "pointer",
                }}
                onMouseEnter={e => {
                  if (status !== "sending" && message.trim()) e.currentTarget.style.opacity = "0.8";
                }}
                onMouseLeave={e => {
                  if (status !== "sending" && message.trim()) e.currentTarget.style.opacity = "1";
                }}
              >
                {status === "sending" ? "Sending…" : "Send"}
              </button>
              <button
                onClick={handleInstagram}
                style={{ ...btnBase, color: "#0A0A0A", background: "transparent", border: `1px solid ${K85}` }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#000")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = K85)}
              >
                DM {igHandle}
              </button>
              {status === "sent" && (
                <span style={{
                  fontFamily: FONT, fontSize: "11px", letterSpacing: "0.08em",
                  textTransform: "uppercase", color: "#1a6b1a",
                }}>
                  메시지 전송됨
                </span>
              )}
              {status === "error" && (
                <span style={{
                  fontFamily: FONT, fontSize: "11px", letterSpacing: "0.08em",
                  textTransform: "uppercase", color: "#8b1a1a",
                }}>
                  전송 실패. 다시 시도해 주세요
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
