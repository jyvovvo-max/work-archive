"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Project } from "./ArchiveGallery";

const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export default function ProjectDetail({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "fixed", inset: 0, zIndex: 600,
        background: "#fff", overflowY: "auto",
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: "fixed", top: "24px", right: "40px",
          fontFamily: HN, fontSize: "11px", fontWeight: 700,
          letterSpacing: "0.25em", textTransform: "uppercase",
          background: "none", border: "none", cursor: "pointer",
          color: "#000", opacity: 0.4, zIndex: 700,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.4")}
      >
        ✕ Close
      </button>

      {/* Hero Image */}
      <div style={{ width: "100%", aspectRatio: "21/9", overflow: "hidden" }}>
        <img
          src={project.img}
          alt={project.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* 4-column body */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 0.1fr 1fr 1fr",
          gap: "0 40px",
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "60px 40px 80px",
        }}
      >
        {/* Col 1 – Meta */}
        <div>
          <h1
            style={{
              fontFamily: HN, fontSize: "clamp(28px, 4vw, 56px)",
              fontWeight: 900, letterSpacing: "-0.03em", textTransform: "uppercase",
              lineHeight: 1, margin: "0 0 40px",
            }}
          >
            {project.title}
          </h1>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Year */}
            <div>
              <div style={{ fontFamily: HN, fontSize: "9px", fontWeight: 700,
                letterSpacing: "0.35em", textTransform: "uppercase", opacity: 0.35, marginBottom: "6px" }}>
                Year
              </div>
              <div style={{ fontFamily: HN, fontSize: "14px", fontWeight: 600 }}>
                {project.year}
              </div>
            </div>

            {/* Category */}
            <div>
              <div style={{ fontFamily: HN, fontSize: "9px", fontWeight: 700,
                letterSpacing: "0.35em", textTransform: "uppercase", opacity: 0.35, marginBottom: "6px" }}>
                Category
              </div>
              <span style={{
                display: "inline-block",
                fontFamily: HN, fontSize: "11px", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                border: "1.5px solid #000", borderRadius: "100px",
                padding: "4px 14px",
              }}>
                {project.category}
              </span>
            </div>

            {/* Coworkers */}
            {project.coworkers.length > 0 && (
              <div>
                <div style={{ fontFamily: HN, fontSize: "9px", fontWeight: 700,
                  letterSpacing: "0.35em", textTransform: "uppercase", opacity: 0.35, marginBottom: "8px" }}>
                  With
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {project.coworkers.map((c) => (
                    <span key={c} style={{
                      fontFamily: HN, fontSize: "10px", fontWeight: 700,
                      letterSpacing: "0.08em", textTransform: "uppercase",
                      background: "#f4f4f4", borderRadius: "100px",
                      padding: "4px 12px",
                    }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Col 2 – Spacer */}
        <div />

        {/* Col 3 – Description */}
        <div style={{ paddingTop: "8px" }}>
          <p style={{
            fontFamily: HN, fontSize: "15px", lineHeight: 1.8,
            color: "#333", margin: 0,
          }}>
            {project.description}
          </p>
        </div>

        {/* Col 4 – Extra content / images */}
        <div style={{ paddingTop: "8px" }}>
          {project.images?.map((src, i) => (
            <div
              key={i}
              style={{ borderRadius: "10px", overflow: "hidden", marginBottom: "16px" }}
            >
              <img src={src} alt="" style={{ width: "100%", display: "block", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
