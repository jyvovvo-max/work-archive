"use client";
import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
const ProjectDetail = dynamic(() => import("./ProjectDetail"), { ssr: false });

/* ── Types ─────────────────────────────────────────────────── */
export interface Project {
  id: number; title: string; year: string; category: string;
  coworkers: string[]; description: string;
  img: string; images?: string[];
}

/* ── Data ──────────────────────────────────────────────────── */
const PROJECTS: Project[] = [
  { id:1,  title:"Nexus Archive",    year:"2024", category:"System Design",    coworkers:["Studio Arc","Kim S."],         description:"A modular archive system for distributed knowledge management. Explores relational data structures across spatial contexts.",       img:"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&w=900" },
  { id:2,  title:"Hyper Flow",       year:"2024", category:"Interaction",      coworkers:["Lee H."],                       description:"Real-time interaction design exploring haptic feedback loops and ambient interface patterns for wearable contexts.",               img:"https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&w=900" },
  { id:3,  title:"Mono Grid",        year:"2023", category:"Graphic",          coworkers:["Park J.","Atelier M"],          description:"A systematic typographic grid study reduced to monochromatic constraints. Inspired by Swiss rationalist tradition.",               img:"https://images.unsplash.com/photo-1614850523296-e8c0a97323bc?auto=format&w=900" },
  { id:4,  title:"Vibe Engine",      year:"2023", category:"Development",      coworkers:["Choi Y."],                      description:"Generative audio-visual engine translating live telemetry data into immersive spatial soundscapes and particle systems.",          img:"https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&w=900" },
  { id:5,  title:"Archive-05",       year:"2023", category:"Motion",           coworkers:["Studio Wave"],                  description:"A long-form motion piece exploring digital entropy — compression artifacts as a visual language.",                                  img:"https://images.unsplash.com/photo-1618556450991-2f1af64e8191?auto=format&w=900" },
  { id:6,  title:"Cloud Folder",     year:"2023", category:"UI/UX",            coworkers:["Jung M.","Blank Co."],          description:"Minimal file management interface built for collaborators across timezones. Emphasis on ambient awareness over notification.",      img:"https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&w=900" },
  { id:7,  title:"Dark Matter",      year:"2022", category:"3D Art",           coworkers:["Kim T."],                       description:"3D sculptural explorations inspired by astrophysical phenomena. Rendered with custom GLSL shaders.",                               img:"https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&w=900" },
  { id:8,  title:"Signal Lost",      year:"2022", category:"Experiment",       coworkers:[],                               description:"Experimental research into the semiotics of broken communication — lost packets as found poetry.",                                 img:"https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&w=900" },
  { id:9,  title:"Void Sessions",    year:"2022", category:"Branding",         coworkers:["Oh S.","Studio Null"],          description:"Brand identity for an underground electronic music collective. Visual language from negative space and silence.",                   img:"https://images.unsplash.com/photo-1617791160588-241658ad7617?auto=format&w=900" },
  { id:10, title:"Grid Theorem",     year:"2022", category:"Type Design",      coworkers:["Kwon J."],                      description:"Variable typeface around mathematical grid constraints. Five axes: weight, width, slant, optical size, grid tension.",             img:"https://images.unsplash.com/photo-1558591710-4b4a1ae0f7b4?auto=format&w=900" },
  { id:11, title:"Field Notes",      year:"2021", category:"Editorial",        coworkers:["Shin B.","Long Form Studio"],   description:"Editorial project documenting fieldwork across 12 cities. Photography, essay and data visualization in one publication.",         img:"https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&w=900" },
  { id:12, title:"Pulse Check",      year:"2021", category:"Data",             coworkers:[],                               description:"Real-time biometric data visualization. Dense information presented with minimal cognitive load.",                                  img:"https://images.unsplash.com/photo-1543286386-2e659306cd6c?auto=format&w=900" },
  { id:13, title:"Skin System",      year:"2021", category:"System Design",    coworkers:["Yoo A."],                       description:"Themeable design system for a SaaS platform serving 200+ brands. Tokens, components, documentation.",                              img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&w=900" },
  { id:14, title:"Zero Margin",      year:"2020", category:"Graphic",          coworkers:["Studio Zero"],                  description:"Poster series on the tension between negative space and meaning. 24 prints interrogating a single concept each.",                 img:"https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&w=900" },
  { id:15, title:"Counter Form",     year:"2020", category:"Type Design",      coworkers:["Im J."],                        description:"Display typeface built from the negative spaces (counters) of existing letterforms. Form through absence.",                        img:"https://images.unsplash.com/photo-1563986768711-b3bde3dc821e?auto=format&w=900" },
  { id:16, title:"Cascade",          year:"2020", category:"Interaction",      coworkers:["Cho H.","Digital Lab"],         description:"Scroll-driven narrative experience for a cultural institution. Layered time-based media with adaptive pacing.",                    img:"https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&w=900" },
  { id:17, title:"Minimal Object",   year:"2019", category:"3D Art",           coworkers:[],                               description:"Rendered objects stripped to essential geometric form. Influenced by Brancusi and John McCracken.",                                  img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&w=900" },
  { id:18, title:"Echo Chamber",     year:"2019", category:"Experiment",       coworkers:["Woo S."],                       description:"Participatory sound installation mapping social media discourse to physical space through distributed speakers.",                   img:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&w=900" },
  { id:19, title:"First Principles", year:"2019", category:"Branding",         coworkers:["Nam K.","Baseline Studio"],     description:"Brand identity for an architecture firm. Wordmark, space grammar, material palette, print collateral.",                             img:"https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&w=900" },
  { id:20, title:"Year Zero",        year:"2019", category:"Editorial",        coworkers:["Lee M."],                       description:"Self-initiated editorial cataloguing all work from the foundational year. Printed in a single colour on newsprint.",               img:"https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&w=900" },
];

/* ── Constants ─────────────────────────────────────────────── */
const CARD_TRAVEL   = 260;
const TOTAL_SCROLL  = (PROJECTS.length - 1) * CARD_TRAVEL;
const QUEUE_VISIBLE = 14;
const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MN = "'Courier New', Courier, monospace";
const YEARS = [...new Set(PROJECTS.map(p => p.year))].sort((a,b) => +b - +a);

/* ── Root ──────────────────────────────────────────────────── */
export default function ArchiveGallery() {
  const [view, setView]         = useState<"coverflow"|"grid">("coverflow");
  const [activeYear, setActiveYear] = useState<string|null>(null);
  const [selected, setSelected] = useState<Project|null>(null);

  const rawScroll = useMotionValue(0);
  const scrollY   = useSpring(rawScroll, { stiffness: 55, damping: 22, restDelta: 0.3 });

  // Wheel scroll in coverflow mode
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (view !== "coverflow") return;
      e.preventDefault();
      rawScroll.set(Math.max(0, Math.min(TOTAL_SCROLL, rawScroll.get() + e.deltaY * 0.75)));
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [view, rawScroll]);

  // Year filter = scroll to first card of that year (no filtering)
  const jumpToYear = (y: string | null) => {
    setActiveYear(y);
    if (y === null) { rawScroll.set(0); return; }
    const idx = PROJECTS.findIndex(p => p.year === y);
    if (idx >= 0) rawScroll.set(idx * CARD_TRAVEL);
  };

  return (
    <div style={{
      position: "relative", width: "100%", height: "100vh", overflow: "hidden",
      // Deep Field background: radial light from center on deep dark
      background: "radial-gradient(ellipse 70% 55% at 50% 52%, #1a1a1f 0%, #080808 55%, #000 100%)",
      userSelect: "none",
    }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <header style={{
        position: "fixed", top: 0, left: 0, width: "100%", height: "60px",
        display: "grid", gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center", padding: "0 40px", zIndex: 300,
        boxSizing: "border-box",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* Left: Title */}
        <span style={{
          fontFamily: HN, fontSize: "15px", fontWeight: 900,
          letterSpacing: "0.22em", textTransform: "uppercase", color: "#fff",
        }}>
          Deep Field
        </span>

        {/* Center: Archive / Grid — outline pill, no fill */}
        <nav style={{
          display: "flex", gap: "0",
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: "100px", padding: "3px",
        }}>
          {(["coverflow", "grid"] as const).map((m) => (
            <button key={m} onClick={() => setView(m)} style={{
              fontFamily: HN, fontSize: "10px", fontWeight: view === m ? 700 : 400,
              letterSpacing: "0.22em", textTransform: "uppercase",
              background: "none", border: "none", cursor: "pointer",
              padding: "5px 20px", borderRadius: "100px",
              color: view === m ? "#fff" : "rgba(255,255,255,0.28)",
              transition: "color 0.25s, font-weight 0.1s",
            }}>
              {m === "coverflow" ? "Archive" : "Grid"}
            </button>
          ))}
        </nav>

        {/* Right: Nav */}
        <div style={{ display: "flex", gap: "28px", justifyContent: "flex-end" }}>
          {(["Info","Contact"] as const).map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{
              fontFamily: HN, fontSize: "10px", fontWeight: 700,
              letterSpacing: "0.22em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.28)", textDecoration: "none",
              transition: "color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.28)")}
            >{l}</a>
          ))}
        </div>
      </header>

      {/* ── Year Sidebar ────────────────────────────────────── */}
      <div style={{
        position: "fixed", left: "40px", top: "50%", transform: "translateY(-50%)",
        zIndex: 200, display: "flex", flexDirection: "column", gap: "2px",
      }}>
        {[null, ...YEARS].map(y => {
          const label = y ?? "All";
          const active = activeYear === y;
          return (
            <button key={label} onClick={() => jumpToYear(y)} style={{
              fontFamily: active ? HN : MN,
              fontSize: active ? "11px" : "10px",
              fontWeight: active ? 800 : 400,
              letterSpacing: active ? "0.08em" : "0.12em",
              background: "none", border: "none", cursor: "pointer",
              color: active ? "#fff" : "rgba(255,255,255,0.22)",
              textAlign: "left", padding: "4px 0",
              transition: "all 0.2s",
            }}>{label}</button>
          );
        })}
      </div>

      {/* ── Coverflow Stage ─────────────────────────────────── */}
      <div style={{
        position: "absolute", inset: 0,
        display: view === "coverflow" ? "flex" : "none",
        alignItems: "center", justifyContent: "center",
        perspective: "1800px",
        perspectiveOrigin: "50% 12%",  // high vanishing point = deep queue visible
        overflow: "visible",
        pointerEvents: view === "coverflow" ? "auto" : "none",
      }}>
        {PROJECTS.map((project, index) => (
          <QueueCard
            key={project.id}
            project={project}
            index={index}
            scrollY={scrollY}
            onOpen={() => setSelected(project)}
          />
        ))}
      </div>

      {/* ── Grid View ───────────────────────────────────────── */}
      <AnimatePresence>
        {view === "grid" && (
          <div
            style={{
              position: "absolute", inset: 0, overflowY: "auto",
              padding: "72px 40px 40px", boxSizing: "border-box",
              scrollbarWidth: "none",
            }}
            className="no-scrollbar"
          >
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
              maxWidth: "1400px", margin: "0 auto",
            }}>
              {PROJECTS.map((p, i) => {
                // Each card "flies out" from the coverflow stack position
                // Stack is near center — cards spread upward, so start from center+small offset
                const stackY   = -Math.min(i, 10) * 22;       // simulate coverflow stack y
                const spreadX  = (i % 2 === 0 ? -1 : 1) * (40 + (i * 37) % 120);
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: spreadX, y: stackY, scale: 0.35, rotate: (i%2===0?-1:1)*(3+(i*7)%10) }}
                    animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
                    exit={{    opacity: 0, x: spreadX/2, y: stackY/2, scale: 0.35 }}
                    transition={{ delay: i * 0.04, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => setSelected(p)}
                    whileHover="hover"
                    style={{ cursor: "pointer", position: "relative", aspectRatio: "16/9", borderRadius: "12px", overflow: "hidden" }}
                  >
                    {/* Image */}
                    <motion.img
                      src={p.img} alt={p.title}
                      variants={{ hover: { scale: 1.07 } }}
                      transition={{ duration: 0.5 }}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />

                    {/* Overlay: always dim at bottom, full hover */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)",
                      pointerEvents: "none",
                    }} />

                    {/* Bottom title — always visible */}
                    <div style={{
                      position: "absolute", bottom: "12px", left: "14px", right: "14px",
                      pointerEvents: "none",
                    }}>
                      <div style={{ fontFamily: HN, fontSize: "10px", fontWeight: 700,
                        letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff", lineHeight: 1 }}>
                        {p.title}
                      </div>
                    </div>

                    {/* Hover: description overlay */}
                    <motion.div
                      variants={{ hover: { opacity: 1 } }}
                      initial={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{
                        position: "absolute", inset: 0,
                        background: "rgba(0,0,0,0.72)",
                        display: "flex", flexDirection: "column",
                        justifyContent: "flex-end", padding: "16px",
                        pointerEvents: "none",
                      }}
                    >
                      <div style={{ fontFamily: HN, fontSize: "8px", fontWeight: 700,
                        letterSpacing: "0.35em", textTransform: "uppercase",
                        color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>
                        {p.category} — {p.year}
                      </div>
                      <div style={{ fontFamily: HN, fontSize: "10px", fontWeight: 700,
                        letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff",
                        marginBottom: "8px", lineHeight: 1.2 }}>
                        {p.title}
                      </div>
                      <p style={{ fontFamily: HN, fontSize: "10px", color: "rgba(255,255,255,0.6)",
                        lineHeight: 1.6, margin: 0,
                        display: "-webkit-box", WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {p.description}
                      </p>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Detail Overlay ──────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <ProjectDetail key="detail" project={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Queue Card ─────────────────────────────────────────────── */
function QueueCard({ project, index, scrollY, onOpen }: {
  project: Project; index: number; scrollY: any; onOpen: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const queueStep = useTransform(scrollY, (s: number) =>
    (index * CARD_TRAVEL - s) / CARD_TRAVEL
  );

  // Y spacing: `-q * 55` so approx 1/15 of the next card's top is visible
  const yScroll = useTransform(queueStep, (q: number) => {
    if (q <= 0) return -q * 290;   // passed: snap below
    return -q * 55;                // queued: 55px step ≈ 1/15 card height visible
  });

  const scale = useTransform(queueStep, (q: number) => {
    if (q <= 0) return Math.max(0.05, 1 + q * 0.45);
    return Math.max(0.18, 1 - q * 0.052);
  });

  // Opacity: fade out gracefully at the far back
  const opacityVal = useTransform(queueStep, (q: number) => {
    if (q < -0.3) return 0;
    if (q < 0)    return 1 + q * 3.3;
    if (q > QUEUE_VISIBLE) return 0;
    if (q > QUEUE_VISIBLE - 2) return (QUEUE_VISIBLE - q) / 2;
    return 1;
  });

  // Brightness — dims queue, restores on hover
  const dimFilter = useTransform(queueStep, (q: number) => {
    if (q <= 0) return "brightness(1)";
    return `brightness(${Math.max(0.2, 1 - q * 0.07)})`;
  });

  const zIdx = useTransform(queueStep, (q: number) =>
    Math.max(0, Math.round(100 - q * 8))
  );

  return (
    <motion.div style={{
      position: "absolute", y: yScroll, scale, opacity: opacityVal, zIndex: zIdx,
      width: "min(84vw, 880px)", aspectRatio: "16/9",
    }}>
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onClick={onOpen}
        animate={{ y: hovered ? -26 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        style={{ width: "100%", height: "100%", cursor: "pointer" }}
      >
        {/* Apply dim filter here, restore on hover */}
        <motion.div style={{ width: "100%", height: "100%", filter: hovered ? "brightness(1.05)" : dimFilter }}>
          <div style={{
            position: "relative", width: "100%", height: "100%",
            borderRadius: "12px", overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)",
          }}>
            <img src={project.img} alt={project.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              draggable={false} />

            {/* Hover: gradient + title slides up */}
            <motion.div
              animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration: 0.22 }}
              style={{ position: "absolute", inset: 0,
                background: "linear-gradient(140deg, rgba(0,0,0,0.78) 0%, transparent 52%)",
                pointerEvents: "none" }}
            />
            <AnimatePresence>
              {hovered && (
                <motion.div key="lbl"
                  initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.22, ease: [0.22,1,0.36,1] }}
                  style={{ position: "absolute", top: "20px", left: "24px", pointerEvents: "none" }}>
                  <div style={{ fontFamily: HN, fontSize: "8px", fontWeight: 700,
                    letterSpacing: "0.45em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.45)", marginBottom: "6px" }}>
                    {project.category} — {project.year}
                  </div>
                  <h3 style={{ fontFamily: HN, fontSize: "clamp(16px, 2.8vw, 34px)", fontWeight: 900,
                    letterSpacing: "-0.02em", textTransform: "uppercase",
                    color: "#fff", lineHeight: 1, margin: 0 }}>
                    {project.title}
                  </h3>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
