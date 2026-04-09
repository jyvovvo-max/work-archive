"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Project, SiteData, Lang } from "@/components/v2/types";
import { fetchProjects, fetchSiteData, FALLBACK_SITE } from "@/components/v2/dataFetch";
import Header from "@/components/v2/Header";
import Footer from "@/components/v2/Footer";
import ContactModal from "@/components/v2/ContactModal";
import { RetryImg } from "@/components/v2/RetryImg";

const FONT = "'JetBrains Mono', 'Noto Sans KR', monospace";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtDate = (month: string, year: string) =>
  `${MONTHS[Math.max(0, parseInt(month, 10) - 1)]}, ${year}`;

// ── Category filter bar ─────────────────────────────────────────
function CategoryBar({ categories, active, onChange }: {
  categories: string[];
  active: string | null;
  onChange: (c: string | null) => void;
}) {
  if (categories.length === 0) return null;
  const allCats = ["All", ...categories];
  return (
    <div style={{
      padding: "clamp(12px, 1.8vw, 20px) clamp(12px, 2vw, 24px)",
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      borderBottom: "1px solid rgba(0,0,0,0.08)",
    }}>
      {allCats.map((cat, i) => {
        const isAll = cat === "All";
        const isActive = isAll ? active === null : active === cat;
        return (
          <motion.button
            key={cat}
            initial={{ opacity: 0, scale: 0.85, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 + i * 0.035, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => onChange(isAll ? null : cat)}
            style={{
              fontFamily: FONT,
              fontWeight: isActive ? 400 : 300,
              fontSize: "clamp(11px, 1.4vw, 18px)",
              letterSpacing: "0.02em",
              background: isActive ? "#0A0A0A" : "rgba(255,255,255,0.70)",
              border: `1px solid ${isActive ? "#0A0A0A" : "rgba(0,0,0,0.12)"}`,
              borderRadius: "100px",
              padding: "clamp(4px, 0.6vh, 7px) clamp(12px, 1.6vw, 22px)",
              color: isActive ? "#F0F0F0" : "rgba(0,0,0,0.55)",
              cursor: "pointer",
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              transition: "background 0.18s, color 0.18s, border-color 0.18s",
            }}
            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.95)"; e.currentTarget.style.color = "#0A0A0A"; } }}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.70)"; e.currentTarget.style.color = "rgba(0,0,0,0.55)"; } }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Grid card ───────────────────────────────────────────────────
function GridCard({ project, onOpen, isExiting }: {
  project: Project;
  onOpen: (p: Project) => void;
  isExiting?: boolean;
  idx?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const [isCentered, setIsCentered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [imgRetry, setImgRetry] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  // Separate random delays for entry and exit
  const imgDelay  = useRef(Math.random() * 0.75).current;
  const exitDelay = useRef(Math.random() * 0.28).current;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsCentered(entry.isIntersecting),
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isMobile]);

  const scaled = (!isMobile && hovered) || (isMobile && isCentered);

  return (
    <div
      ref={cardRef}
      onClick={() => onOpen(project)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: "pointer", position: "relative", overflow: "hidden" }}
    >
      {/* Placeholder — always visible, gives grid its structure */}
      <div style={{ width: "100%", aspectRatio: "16/9", position: "relative", background: "rgba(160,160,160,0.10)" }}>
        <motion.div
          initial={{ opacity: 0, filter: "blur(16px)" }}
          animate={isExiting
            ? { opacity: 0, filter: "blur(16px)" }
            : { opacity: 1, filter: "blur(0px)" }
          }
          transition={isExiting
            ? { delay: exitDelay, duration: 0.4, ease: [0.55, 0, 1, 0.6] }
            : { delay: imgDelay,  duration: 0.9, ease: [0.55, 0, 1, 0.6] }
          }
          style={{ position: "absolute", inset: 0 }}
        >
          {imgFailed ? (
            <div style={{ width: "100%", height: "100%", background: "rgba(120,120,120,0.12)" }} />
          ) : (
            <RetryImg
              key={imgRetry}
              src={project.img}
              alt={project.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transform: scaled ? "scale(1.04)" : "scale(1)",
                transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
              }}
              onError={() => {
                if (imgRetry < 2) setTimeout(() => setImgRetry(r => r + 1), 800 * (imgRetry + 1));
                else setImgFailed(true);
              }}
            />
          )}
        </motion.div>
      </div>

      {/* Hover title overlay */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <motion.div
          animate={{ y: scaled ? "0%" : "-100%" }}
          initial={{ y: "-100%" }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "absolute", top: 0, left: 0, right: 0,
            padding: "8px 12px",
            background: "rgba(255,255,255,0.30)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px",
          }}
        >
          <span style={{ fontFamily: FONT, fontWeight: 300, fontSize: "12px", letterSpacing: "-0.01em", color: "#0A0A0A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {project.title}
          </span>
          <span style={{ fontFamily: FONT, fontWeight: 300, fontSize: "10px", color: "rgba(0,0,0,0.45)", flexShrink: 0 }}>
            {fmtDate(project.month, project.year)}
          </span>
        </motion.div>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────
export default function WorkPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [siteData, setSiteData] = useState<SiteData>(FALLBACK_SITE);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("ko");
  const [cols, setCols] = useState(3);
  const [isExiting, setIsExiting] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("portfolio-lang") as Lang | null;
    if (saved) setLang(saved);
    Promise.all([
      fetchProjects().then(setProjects),
      fetchSiteData().then(setSiteData),
    ]).then(() => setReady(true));
  }, []);

  useEffect(() => {
    const update = () => setCols(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const handleBack = async () => {
    setIsExiting(true);
    await new Promise(r => setTimeout(r, 750));
    router.back();
  };

  const handleAbout = async () => {
    setIsExiting(true);
    await new Promise(r => setTimeout(r, 750));
    router.push("/about");
  };

  const categories = useMemo(() => [...new Set(
    projects.flatMap(p => p.category ? p.category.split(",").map(c => c.trim()).filter(Boolean) : [])
  )].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })), [projects]);

  const filtered = useMemo(() => (activeCategory
    ? projects.filter(p => p.category?.split(",").map(c => c.trim()).includes(activeCategory))
    : projects
  ).slice().sort((a, b) => {
    const ay = parseInt(a.year) || 0, by = parseInt(b.year) || 0;
    if (by !== ay) return by - ay;
    return (parseInt(b.month) || 0) - (parseInt(a.month) || 0);
  }), [projects, activeCategory]);

  const openProject = (p: Project) => router.push(`/project/${p.id}`);

  return (
    <div style={{ background: "#F0F0F0", color: "#0A0A0A", minHeight: "100vh" }}>
      <Header
        onHome={handleBack}
        onViewAll={() => {}}
        onAbout={handleAbout}
        onContact={() => setContactOpen(true)}
        onBack={handleBack}
        zIndex={500}
        alwaysVisible
        siteData={siteData}
        lang={lang}
      />

      {/* Entry wrapper — waits for data, then reveals all at once */}
      <motion.div
        initial={{ opacity: 0, filter: "blur(12px)", y: 14 }}
        animate={ready
          ? { opacity: 1, filter: "blur(0px)", y: 0 }
          : { opacity: 0.3, filter: "blur(12px)", y: 14 }
        }
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ paddingTop: "52px" }}
      >
        <CategoryBar categories={categories} active={activeCategory} onChange={setActiveCategory} />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory ?? "all"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gap: "clamp(3px, 0.4vw, 6px)",
              padding: "clamp(3px, 0.4vw, 6px)",
            }}
          >
            {filtered.map((project) => (
              <GridCard
                key={project.id}
                project={project}
                onOpen={openProject}
                isExiting={isExiting}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Footer siteData={siteData} lang={lang} />
        </motion.div>
      </motion.div>

      <ContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        email={siteData?.footerEmail ?? ""}
        igHandle={siteData?.footerInstagramHandle ?? ""}
        igUrl={siteData?.footerInstagramUrl ?? ""}
      />
    </div>
  );
}
