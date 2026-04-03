"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";

interface Props {
  open: boolean;
  onClose: () => void;
  email: string;
}

export default function ContactModal({ open, onClose, email }: Props) {
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSend = () => {
    const body = from ? `From: ${from}\n\n${message}` : message;
    window.location.href = `mailto:${email}?body=${encodeURIComponent(body)}`;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 900,
            background: "rgba(10,10,10,0.72)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            style={{
              background: "#1A1A1A",
              border: "1px solid rgba(240,237,232,0.1)",
              borderRadius: "4px",
              padding: "clamp(28px, 4vh, 48px) clamp(24px, 4vw, 44px)",
              width: "100%",
              maxWidth: "480px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{
                fontFamily: FONT, fontWeight: 300,
                fontSize: "11px", letterSpacing: "0.12em",
                textTransform: "uppercase", color: "rgba(240,237,232,0.4)",
              }}>
                Contact
              </span>
              <button
                onClick={onClose}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: FONT, fontWeight: 200, fontSize: "18px",
                  color: "rgba(240,237,232,0.3)", lineHeight: 1,
                  transition: "color 0.15s", padding: 0,
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#F0EDE8")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,237,232,0.3)")}
              >
                ✕
              </button>
            </div>

            {/* To */}
            <div style={{
              fontFamily: FONT, fontWeight: 300, fontSize: "13px",
              color: "rgba(240,237,232,0.3)", letterSpacing: "0.02em",
            }}>
              To: {email}
            </div>

            {/* From */}
            <input
              type="email"
              value={from}
              onChange={e => setFrom(e.target.value)}
              placeholder="Your email"
              style={{
                fontFamily: FONT, fontWeight: 300, fontSize: "13px",
                letterSpacing: "0.02em", lineHeight: 1.7,
                color: "#F0EDE8", background: "rgba(240,237,232,0.04)",
                border: "1px solid rgba(240,237,232,0.1)",
                borderRadius: "2px", padding: "10px 16px",
                outline: "none", width: "100%", boxSizing: "border-box",
                transition: "border-color 0.18s",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(240,237,232,0.3)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(240,237,232,0.1)")}
            />

            {/* Message */}
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="메시지를 입력하세요"
              rows={6}
              style={{
                fontFamily: FONT, fontWeight: 300, fontSize: "13px",
                letterSpacing: "0.02em", lineHeight: 1.7,
                color: "#F0EDE8", background: "rgba(240,237,232,0.04)",
                border: "1px solid rgba(240,237,232,0.1)",
                borderRadius: "2px", padding: "14px 16px",
                resize: "none", outline: "none", width: "100%",
                boxSizing: "border-box",
                transition: "border-color 0.18s",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(240,237,232,0.3)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(240,237,232,0.1)")}
            />

            {/* Send */}
            <button
              onClick={handleSend}
              style={{
                fontFamily: FONT, fontWeight: 300,
                fontSize: "11px", letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#1A1A1A", background: "#F0EDE8",
                border: "none", borderRadius: "100px",
                padding: "10px 24px", cursor: "pointer",
                alignSelf: "flex-start",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              Send via Mail App
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
