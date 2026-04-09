"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Project } from "./types";
import { GUTTER, GRID_COLS, SPACE_A, SPACE_B, FONT_SECTION_TITLE, FONT_HEADLINE, FONT_LABEL } from "./layout";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtCode = (id: number, month: string, year: string) =>
  `${String(id).padStart(3, "0")}-${MONTHS[Math.max(0, parseInt(month, 10) - 1)]}-${year}`;


function AwardRow({
  project,
  onOpen,
  isMobile,
  mobileFontSize,
}: {
  project: Project;
  onOpen: (p: Project) => void;
  isMobile: boolean;
  mobileFontSize?: string | null;
}) {
  const [hovered, setHovered] = useState(false);
  const [imgPos, setImgPos] = useState<{ left: number; top: number } | null>(null);
  const code = fmtCode(project.id, project.month, project.year);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const codeSup = e.currentTarget.querySelector("[data-code]") as HTMLElement;
    if (!codeSup) return;
    const codeRect = codeSup.getBoundingClientRect();

    setImgPos({
      left: codeRect.right + 8,
      top: codeRect.top + codeRect.height / 2,
    });
    setHovered(true);
  };

  return (
    <div style={{ padding: `0 ${GUTTER}`, position: "relative" }}>
      <div
        style={{
          cursor: "pointer",
          position: "relative",
          zIndex: 1,
          lineHeight: 1.6,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onOpen(project)}
      >
        <span data-title style={{
          fontFamily: FONT,
          fontWeight: 300,
          fontSize: isMobile ? (mobileFontSize || "clamp(28px, 7vw, 36px)") : FONT_HEADLINE,
          letterSpacing: "-0.03em",
          lineHeight: 1.6,
          color: "#0A0A0A",
          transition: "opacity 0.2s",
          opacity: hovered ? 0.6 : 1,
        }}>
          {project.title}
        </span>
        <sup data-code style={{
          fontFamily: FONT,
          fontWeight: 400,
          fontSize: isMobile ? "9px" : FONT_LABEL,
          letterSpacing: "0.06em",
          color: "rgba(10,10,10,0.3)",
          marginLeft: "4px",
          verticalAlign: "super",
          whiteSpace: "nowrap",
        }}>
          {project.award}
        </sup>
      </div>

      <AnimatePresence>
        {hovered && imgPos && !isMobile && (
          <motion.div
            initial={{ opacity: 1, filter: "blur(16px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              left: imgPos.left,
              top: imgPos.top,
              transform: "translateY(-50%)",
              width: `calc((100vw - ${GUTTER} - ${GUTTER}) / ${GRID_COLS})`,
              zIndex: 0,
              pointerEvents: "none",
              boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            }}
          >
            <img
              src={project.img}
              alt={project.title}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AwardsSectionProps {
  projects: Project[];
  onOpen: (p: Project) => void;
}

export default function AwardsSection({ projects, onOpen }: AwardsSectionProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileFontSize, setMobileFontSize] = useState<string | null>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const awardProjects = useMemo(
    () => projects.filter(p => !!p.award),
    [projects]
  );

  const longestTitle = useMemo(() => {
    if (awardProjects.length === 0) return "";
    return awardProjects.reduce((a, b) => a.title.length > b.title.length ? a : b).title;
  }, [awardProjects]);

  const calcMobileFont = useCallback(() => {
    if (!isMobile || !measureRef.current) return;
    const span = measureRef.current;
    const containerW = window.innerWidth - 40;
    const codeW = 80;
    const availW = containerW - codeW;
    const textW = span.getBoundingClientRect().width;
    if (textW > 0 && availW > 0) {
      const ratio = availW / textW;
      const base = parseFloat(getComputedStyle(span).fontSize);
      setMobileFontSize(`${Math.floor(base * ratio)}px`);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) { setMobileFontSize(null); return; }
    document.fonts.ready.then(calcMobileFont);
    window.addEventListener("resize", calcMobileFont);
    return () => window.removeEventListener("resize", calcMobileFont);
  }, [isMobile, calcMobileFont]);

  if (awardProjects.length === 0) return null;

  return (
    <section style={{ background: "#F0F0F0", position: "relative", paddingBottom: SPACE_B }}>
      {isMobile && (
        <span
          ref={measureRef}
          aria-hidden
          style={{
            position: "absolute",
            visibility: "hidden",
            whiteSpace: "nowrap",
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: "36px",
            letterSpacing: "-0.03em",
            pointerEvents: "none",
          }}
        >
          {longestTitle}
        </span>
      )}

      <div style={{
        height: "52px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: `0 ${GUTTER}`,
        borderTop: "1px solid rgba(0,0,0,0.15)",
        borderBottom: "1px solid rgba(0,0,0,0.15)",
        marginBottom: SPACE_A,
        position: "relative",
        zIndex: 1,
      }}>
        <span style={{
          fontFamily: FONT,
          fontWeight: 300,
          fontSize: FONT_SECTION_TITLE,
          letterSpacing: "-0.02em",
          color: "#0A0A0A",
        }}>
          Awards
        </span>
      </div>

      {awardProjects.map((p) => (
        <AwardRow
          key={p.id}
          project={p}
          onOpen={onOpen}
          isMobile={isMobile}
          mobileFontSize={mobileFontSize}
        />
      ))}
    </section>
  );
}
