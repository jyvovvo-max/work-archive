"use client";
import { motion } from "framer-motion";
import { Project } from "./ArchiveGallery";

const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MN = "'Courier New', Courier, monospace";

export default function ProjectDetail({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "fixed", inset: 0, zIndex: 600,
        background: "radial-gradient(ellipse 70% 55% at 50% 52%, #1a1a1f 0%, #080808 55%, #000 100%)",
        overflowY: "auto", color: "#fff",
      }}
    >
      {/* Close */}
      <button onClick={onClose} style={{
        position: "fixed", top: "22px", right: "40px",
        fontFamily: HN, fontSize: "10px", fontWeight: 700,
        letterSpacing: "0.25em", textTransform: "uppercase",
        background: "none", border: "none", cursor: "pointer",
        color: "rgba(255,255,255,0.3)", zIndex: 700, transition: "color 0.2s",
      }}
        onMouseEnter={e => (e.currentTarget.style.color="#fff")}
        onMouseLeave={e => (e.currentTarget.style.color="rgba(255,255,255,0.3)")}
      >✕ Close</button>

      {/* Hero */}
      <div style={{ width: "100%", aspectRatio: "21/9", overflow: "hidden" }}>
        <img src={project.img} alt={project.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      {/* 4-column body */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 0.15fr 1fr 1fr",
        gap: "0 48px", maxWidth: "1400px", margin: "0 auto",
        padding: "64px 48px 100px",
      }}>
        {/* Col 1 – Meta */}
        <div>
          <h1 style={{
            fontFamily: HN, fontSize: "clamp(26px, 4vw, 54px)", fontWeight: 900,
            letterSpacing: "-0.03em", textTransform: "uppercase", lineHeight: 1,
            color: "#fff", margin: "0 0 48px",
          }}>
            {project.title}
          </h1>

          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div>
              <div style={{ fontFamily: MN, fontSize: "8px", letterSpacing: "0.4em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "6px" }}>Year</div>
              <div style={{ fontFamily: HN, fontSize: "14px", fontWeight: 600 }}>{project.year}</div>
            </div>
            <div>
              <div style={{ fontFamily: MN, fontSize: "8px", letterSpacing: "0.4em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "8px" }}>Category</div>
              <span style={{
                fontFamily: HN, fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                border: "1px solid rgba(255,255,255,0.3)", borderRadius: "100px", padding: "4px 14px",
                color: "#fff",
              }}>{project.category}</span>
            </div>
            {project.coworkers.length > 0 && (
              <div>
                <div style={{ fontFamily: MN, fontSize: "8px", letterSpacing: "0.4em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "8px" }}>With</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {project.coworkers.map(c => (
                    <span key={c} style={{
                      fontFamily: HN, fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em",
                      textTransform: "uppercase", background: "rgba(255,255,255,0.07)",
                      borderRadius: "100px", padding: "4px 12px", color: "#fff",
                    }}>{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Col 2 – spacer */}
        <div />

        {/* Col 3 – Description */}
        <div style={{ paddingTop: "8px" }}>
          <p style={{ fontFamily: HN, fontSize: "15px", lineHeight: 1.8,
            color: "rgba(255,255,255,0.7)", margin: 0 }}>
            {project.description}
          </p>
        </div>

        {/* Col 4 – Images */}
        <div style={{ paddingTop: "8px" }}>
          {project.images?.map((src, i) => (
            <div key={i} style={{ borderRadius: "10px", overflow: "hidden", marginBottom: "16px" }}>
              <img src={src} alt="" style={{ width: "100%", display: "block", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
