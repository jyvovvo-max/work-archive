"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";

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
    fontFamily: FONT, fontWeight: 400, fontSize: "13px",
    letterSpacing: "0.02em", lineHeight: 1.7,
    color: "#0A0A0A", background: "rgba(0,0,0,0.03)",
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 0, padding: "10px 16px",
    outline: "none", width: "100%", boxSizing: "border-box",
    transition: "border-color 0.18s",
  };

  const btnBase: React.CSSProperties = {
    fontFamily: FONT, fontWeight: 500,
    fontSize: "11px", letterSpacing: "0.1em",
    textTransform: "uppercase",
    border: "none", borderRadius: 0,
    padding: "10px 24px", cursor: "pointer",
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
            background: "rgba(10,10,10,0.55)",
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
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
              // White acrylic glass
              background: "rgba(240,240,240,0.48)",
              backdropFilter: "blur(36px) saturate(180%)",
              WebkitBackdropFilter: "blur(36px) saturate(180%)",
              // Header-style border
              border: "1px solid rgba(0,0,0,0.12)",
              // Sharp corners
              borderRadius: 0,
              padding: "clamp(28px, 4vh, 48px) clamp(24px, 4vw, 44px)",
              width: "100%", maxWidth: "480px",
              display: "flex", flexDirection: "column", gap: "20px",
              position: "relative",
              // Tilt
              rotateX,
              rotateY,
              transformPerspective: 800,
            }}
          >
            {/* Subtle inner highlight line — top edge */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "1px",
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 30%, rgba(255,255,255,0.6) 70%, transparent 100%)",
              pointerEvents: "none",
            }} />

            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{
                fontFamily: FONT, fontWeight: 500,
                fontSize: "11px", letterSpacing: "0.12em",
                textTransform: "uppercase", color: "rgba(10,10,10,0.45)",
              }}>Contact</span>
              <button
                onClick={onClose}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: FONT, fontWeight: 300, fontSize: "18px",
                  color: "rgba(10,10,10,0.25)", lineHeight: 1,
                  transition: "color 0.15s", padding: 0,
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#0A0A0A")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(10,10,10,0.25)")}
              >✕</button>
            </div>

            {/* Divider */}
            <div style={{
              height: "1px",
              background: "rgba(0,0,0,0.08)",
            }} />

            {/* To */}
            <div style={{
              fontFamily: FONT, fontWeight: 400, fontSize: "13px",
              color: "rgba(10,10,10,0.35)", letterSpacing: "0.02em",
            }}>
              To: {email}
            </div>

            {/* From */}
            <input
              type="email"
              value={from}
              onChange={e => setFrom(e.target.value)}
              placeholder="Your email"
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.25)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.10)")}
            />

            {/* Message */}
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="메시지를 입력하세요"
              rows={6}
              style={{ ...inputStyle, padding: "14px 16px", resize: "none" }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.25)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.10)")}
            />

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <button
                onClick={handleSend}
                disabled={status === "sending" || !message.trim()}
                style={{
                  ...btnBase,
                  color: "#F0EDE8",
                  background: "#0A0A0A",
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
                style={{ ...btnBase, color: "#0A0A0A", background: "transparent", border: "1px solid rgba(0,0,0,0.15)" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.5)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)")}
              >
                DM {igHandle}
              </button>
              {status === "sent" && (
                <span style={{
                  fontFamily: FONT, fontSize: "11px", letterSpacing: "0.08em",
                  textTransform: "uppercase", color: "rgba(160,220,160,0.85)",
                }}>
                  메시지 전송됨
                </span>
              )}
              {status === "error" && (
                <span style={{
                  fontFamily: FONT, fontSize: "11px", letterSpacing: "0.08em",
                  textTransform: "uppercase", color: "rgba(230,140,140,0.85)",
                }}>
                  전송 실패. 다시 시도해 주세요
                </span>
              )}
            </div>

            {/* Bottom line */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: "1px",
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.4) 70%, transparent 100%)",
              pointerEvents: "none",
            }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
