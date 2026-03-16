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
  { id:1,  title:"Nexus Archive",    year:"2024", category:"System Design",
    coworkers:["Studio Arc","Kim S."], description:"A modular archive system designed for distributed knowledge management. The project explores relational data structures across spatial contexts.",
    img:"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&w=900",
    images:["https://images.unsplash.com/photo-1558591710-4b4a1ae0f7b4?auto=format&w=600"] },
  { id:2,  title:"Hyper Flow",       year:"2024", category:"Interaction",
    coworkers:["Lee H."], description:"Real-time interaction design exploring haptic feedback loops and ambient interface patterns for wearable contexts.",
    img:"https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&w=900" },
  { id:3,  title:"Mono Grid",        year:"2023", category:"Graphic",
    coworkers:["Park J.","Atelier M"], description:"A systematic typographic grid study reduced to monochromatic constraints. Inspired by Swiss rationalist tradition.",
    img:"https://images.unsplash.com/photo-1614850523296-e8c0a97323bc?auto=format&w=900" },
  { id:4,  title:"Vibe Engine",      year:"2023", category:"Development",
    coworkers:["Choi Y."], description:"Generative audio-visual engine that translates live telemetry data into immersive spatial soundscapes and particle systems.",
    img:"https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&w=900" },
  { id:5,  title:"Archive-05",       year:"2023", category:"Motion",
    coworkers:["Studio Wave"], description:"A long-form motion piece exploring the aesthetics of digital entropy — compression artifacts as a visual language.",
    img:"https://images.unsplash.com/photo-1618556450991-2f1af64e8191?auto=format&w=900" },
  { id:6,  title:"Cloud Folder",     year:"2023", category:"UI/UX",
    coworkers:["Jung M.","Blank Co."], description:"A minimal file management interface built for collaborators across timezones. Emphasis on ambient awareness over notification.",
    img:"https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&w=900" },
  { id:7,  title:"Dark Matter",      year:"2022", category:"3D Art",
    coworkers:["Kim T."], description:"A series of 3D sculptural explorations inspired by astrophysical phenomena. Rendered with custom GLSL shaders.",
    img:"https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&w=900" },
  { id:8,  title:"Signal Lost",      year:"2022", category:"Experiment",
    coworkers:[], description:"An experimental research project investigating the semiotics of broken communication — lost packets as found poetry.",
    img:"https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&w=900" },
  { id:9,  title:"Void Sessions",    year:"2022", category:"Branding",
    coworkers:["Oh S.","Studio Null"], description:"Brand identity for an underground electronic music collective. Builds a visual language from negative space and silence.",
    img:"https://images.unsplash.com/photo-1617791160588-241658ad7617?auto=format&w=900" },
  { id:10, title:"Grid Theorem",     year:"2022", category:"Type Design",
    coworkers:["Kwon J."], description:"Variable typeface designed around mathematical grid constraints. Five axes of variation: weight, width, slant, optical size, grid tension.",
    img:"https://images.unsplash.com/photo-1558591710-4b4a1ae0f7b4?auto=format&w=900" },
  { id:11, title:"Field Notes",      year:"2021", category:"Editorial",
    coworkers:["Shin B.","Long Form Studio"], description:"An editorial project documenting fieldwork across 12 cities. Photography, essay and data visualization in a single publication.",
    img:"https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&w=900" },
  { id:12, title:"Pulse Check",      year:"2021", category:"Data",
    coworkers:[], description:"Real-time biometric data visualization for a health-tech client. Dense information presented with minimal cognitive load.",
    img:"https://images.unsplash.com/photo-1543286386-2e659306cd6c?auto=format&w=900" },
  { id:13, title:"Skin System",      year:"2021", category:"System Design",
    coworkers:["Yoo A."], description:"A themeable design system for a SaaS platform serving 200+ brands. Tokens, components, and documentation.",
    img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&w=900" },
  { id:14, title:"Zero Margin",      year:"2020", category:"Graphic",
    coworkers:["Studio Zero"], description:"Poster series exploring the tension between negative space and meaning. 24 prints, each interrogating a single concept.",
    img:"https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&w=900" },
  { id:15, title:"Counter Form",     year:"2020", category:"Type Design",
    coworkers:["Im J."], description:"Display typeface built from the negative spaces (counters) of existing letterforms. Form through absence.",
    img:"https://images.unsplash.com/photo-1563986768711-b3bde3dc821e?auto=format&w=900" },
  { id:16, title:"Cascade",          year:"2020", category:"Interaction",
    coworkers:["Cho H.","Digital Lab"], description:"Scroll-driven narrative experience for a cultural institution. Layered time-based media with adaptive pacing.",
    img:"https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&w=900" },
  { id:17, title:"Minimal Object",   year:"2019", category:"3D Art",
    coworkers:[], description:"A series of rendered objects stripped to their essential geometric form. Influenced by Brancusi and John McCracken.",
    img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&w=900" },
  { id:18, title:"Echo Chamber",     year:"2019", category:"Experiment",
    coworkers:["Woo S."], description:"Participatory sound installation that maps social media discourse to physical space through distributed speakers.",
    img:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&w=900" },
  { id:19, title:"First Principles", year:"2019", category:"Branding",
    coworkers:["Nam K.","Baseline Studio"], description:"Brand identity system built from scratch for an architecture firm. Wordmark, space grammar, material palette, print collateral.",
    img:"https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&w=900" },
  { id:20, title:"Year Zero",        year:"2019", category:"Editorial",
    coworkers:["Lee M."], description:"A self-initiated editorial piece cataloguing all work from the foundational year. Printed in a single colour on newsprint.",
    img:"https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&w=900" },
];

/* ── Constants ─────────────────────────────────────────────── */
const CARD_TRAVEL  = 260;
const QUEUE_VISIBLE = 12;   // max visible in queue (fixes last-card bug)
const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MN = "'Courier New', Courier, monospace";
const YEARS = [...new Set(PROJECTS.map((p) => p.year))].sort((a, b) => +b - +a);

// Subtle horizontal rule colour
const RULE = "rgba(0,0,0,0.08)";

/* ── Root ──────────────────────────────────────────────────── */
export default function ArchiveGallery() {
  const [view, setView]         = useState<"coverflow"|"grid">("coverflow");
  const [yearFilter, setYear]   = useState<string|null>(null);
  const [selected, setSelected] = useState<Project|null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  const rawScroll = useMotionValue(0);
  const scrollY   = useSpring(rawScroll, { stiffness: 55, damping: 22, restDelta: 0.3 });

  const filtered = yearFilter ? PROJECTS.filter((p) => p.year === yearFilter) : PROJECTS;
  const current  = filtered[currentIdx] ?? filtered[0];

  // Track "active" card index from scroll
  useEffect(() => {
    const unsub = scrollY.on("change", (s) => {
      const idx = Math.min(Math.round(s / CARD_TRAVEL), filtered.length - 1);
      setCurrentIdx(idx);
    });
    return unsub;
  }, [scrollY, filtered.length]);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (view !== "coverflow") return;
      e.preventDefault();
      const max = (filtered.length - 1) * CARD_TRAVEL;
      rawScroll.set(Math.max(0, Math.min(max, rawScroll.get() + e.deltaY * 0.75)));
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [view, filtered.length, rawScroll]);

  const switchYear = (y: string|null) => { setYear(y); rawScroll.set(0); setCurrentIdx(0); };

  return (
    <div style={{ position:"relative", width:"100%", height:"100vh", background:"#fff", overflow:"hidden", userSelect:"none" }}>

      {/* ═══ HEADER — grid rule ═══════════════════════════════ */}
      <header style={{
        position:"fixed", top:0, left:0, width:"100%", height:"56px",
        display:"grid", gridTemplateColumns:"1fr auto 1fr",
        alignItems:"center", padding:"0 40px", zIndex:300, boxSizing:"border-box",
        borderBottom: `1px solid ${RULE}`, background:"#fff",
      }}>
        {/* Left */}
        <div style={{ display:"flex", flexDirection:"column", gap:"1px" }}>
          <span style={{ fontFamily:HN, fontSize:"12px", fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase" }}>
            Deep Field
          </span>
          <span style={{ fontFamily:HN, fontSize:"9px", fontWeight:400, letterSpacing:"0.25em", textTransform:"uppercase", opacity:0.3 }}>
            Hwang Jin Young
          </span>
        </div>

        {/* Center — Pill toggle */}
        <nav style={{
          display:"flex", border:"1.5px solid #000", borderRadius:"100px",
          overflow:"hidden", padding:"2px",
        }}>
          {(["coverflow","grid"] as const).map((m) => (
            <motion.button key={m} onClick={() => setView(m)}
              animate={{ background: view===m ? "#000" : "transparent", color: view===m ? "#fff" : "#000" }}
              transition={{ duration:0.22 }}
              style={{ fontFamily:HN, fontSize:"10px", fontWeight:700, letterSpacing:"0.2em",
                textTransform:"uppercase", border:"none", cursor:"pointer", padding:"5px 18px", borderRadius:"100px" }}>
              {m==="coverflow" ? "Archive" : "Grid"}
            </motion.button>
          ))}
        </nav>

        {/* Right */}
        <div style={{ display:"flex", gap:"24px", justifyContent:"flex-end" }}>
          {(["Info","Contact"] as const).map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{
              fontFamily:HN, fontSize:"10px", fontWeight:700, letterSpacing:"0.2em",
              textTransform:"uppercase", color:"#000", textDecoration:"none", opacity:0.25,
              transition:"opacity 0.2s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity="1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity="0.25")}
            >{l}</a>
          ))}
        </div>
      </header>

      {/* ═══ YEAR SIDEBAR — editorial vertical rule ═══════════ */}
      <div style={{
        position:"fixed", left:0, top:"56px", bottom:"56px", width:"100px",
        borderRight:`1px solid ${RULE}`, zIndex:200,
        display:"flex", flexDirection:"column", justifyContent:"center",
        padding:"0 0 0 24px", gap:"0",
      }}>
        {/* "YEAR" micro label */}
        <div style={{ fontFamily:MN, fontSize:"8px", letterSpacing:"0.3em", textTransform:"uppercase",
          opacity:0.25, marginBottom:"16px", writingMode:"horizontal-tb" }}>
          Filter
        </div>

        {[null, ...YEARS].map((y) => {
          const active = yearFilter === y;
          const label = y ?? "All";
          return (
            <button key={label} onClick={() => switchYear(y)} style={{
              fontFamily: active ? HN : MN,
              fontSize: active ? "12px" : "11px",
              fontWeight: active ? 900 : 400,
              letterSpacing: active ? "0.05em" : "0.1em",
              background:"none", border:"none", cursor:"pointer",
              color:"#000", opacity: active ? 1 : 0.3,
              textAlign:"left", padding:"5px 0",
              transition:"all 0.2s",
              borderLeft: active ? "2px solid #000" : "2px solid transparent",
              paddingLeft: "8px",
              marginLeft:"-2px",
            }}>{label}</button>
          );
        })}
      </div>

      {/* ═══ GHOST YEAR — large background typography ══════════ */}
      <AnimatePresence mode="wait">
        {view==="coverflow" && (
          <motion.div
            key={current?.year}
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            transition={{ duration:0.4 }}
            style={{
              position:"fixed", right:"-2vw", top:"50%", transform:"translateY(-50%)",
              fontFamily:HN, fontSize:"38vw", fontWeight:900, letterSpacing:"-0.04em",
              color:"rgba(0,0,0,0.04)", lineHeight:1, pointerEvents:"none", zIndex:1,
              userSelect:"none",
            }}
          >
            {current?.year}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ COVERFLOW STAGE ══════════════════════════════════ */}
      <div style={{
        position:"absolute", top:"56px", bottom:"56px", left:"100px", right:0,
        display: view==="coverflow" ? "flex" : "none",
        alignItems:"center", justifyContent:"center",
        perspective:"1800px", perspectiveOrigin:"50% 14%",
        overflow:"visible",
        pointerEvents: view==="coverflow" ? "auto" : "none",
      }}>
        {filtered.map((project, index) => (
          <QueueCard
            key={project.id}
            project={project}
            index={index}
            total={filtered.length}
            scrollY={scrollY}
            onOpen={() => setSelected(project)}
          />
        ))}
      </div>

      {/* ═══ GRID VIEW ════════════════════════════════════════ */}
      <AnimatePresence>
        {view==="grid" && (
          <div style={{
            position:"absolute", top:"56px", bottom:"56px", left:"100px", right:0,
            overflowY:"auto", overflowX:"hidden",
            padding:"40px 40px 40px 40px", boxSizing:"border-box", scrollbarWidth:"none",
          }}>
            {/* Grid header label */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline",
              marginBottom:"24px", borderBottom:`1px solid ${RULE}`, paddingBottom:"12px" }}>
              <span style={{ fontFamily:HN, fontSize:"10px", fontWeight:700, letterSpacing:"0.25em",
                textTransform:"uppercase", opacity:0.35 }}>
                Works {yearFilter ? `— ${yearFilter}` : `— All`}
              </span>
              <span style={{ fontFamily:MN, fontSize:"10px", opacity:0.3 }}>
                {String(filtered.length).padStart(2,"0")} Projects
              </span>
            </div>

            <div style={{
              display:"grid", gridTemplateColumns:"repeat(4, 1fr)",
              gap:"1px", background:RULE,
              border:`1px solid ${RULE}`,
            }}>
              {filtered.map((p, i) => {
                const startX = (i%2===0 ? -1 : 1) * (60+(i*31)%80);
                const startY = -100 - (i*17)%60;
                const startR = (i%2===0 ? 1 : -1) * (3+(i*11)%8);
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity:0, x:startX, y:startY, scale:0.6, rotate:startR }}
                    animate={{ opacity:1, x:0, y:0, scale:1, rotate:0 }}
                    exit={{ opacity:0, x:startX/2, y:-50, scale:0.6 }}
                    transition={{ delay:i*0.03, duration:0.5, ease:[0.16,1,0.3,1] }}
                    onClick={() => setSelected(p)}
                    whileHover="hover"
                    style={{ cursor:"pointer", background:"#fff", position:"relative" }}
                  >
                    <motion.div
                      variants={{ hover: { scaleY:1.02 } }}
                      transition={{ duration:0.3 }}
                    >
                      <div style={{ aspectRatio:"16/9", overflow:"hidden", background:"#f5f5f5" }}>
                        <motion.img src={p.img} alt={p.title}
                          variants={{ hover: { scale:1.05 } }}
                          transition={{ duration:0.5 }}
                          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                      </div>

                      {/* Grid cell footer — editorial style */}
                      <div style={{ padding:"10px 12px", borderTop:`1px solid ${RULE}`,
                        display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                        <span style={{ fontFamily:HN, fontSize:"10px", fontWeight:700,
                          letterSpacing:"0.06em", textTransform:"uppercase", lineHeight:1 }}>
                          {p.title}
                        </span>
                        <span style={{ fontFamily:MN, fontSize:"9px", color:"#999", whiteSpace:"nowrap", marginLeft:"8px" }}>
                          {p.year}
                        </span>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ BOTTOM INFO BAR — coverflow metadata strip ════════ */}
      <div style={{
        position:"fixed", bottom:0, left:"100px", right:0, height:"56px",
        borderTop:`1px solid ${RULE}`, background:"#fff",
        display:"flex", alignItems:"center", padding:"0 40px",
        justifyContent:"space-between", zIndex:200,
        opacity: view==="coverflow" ? 1 : 0,
        transition:"opacity 0.3s",
        pointerEvents:"none",
      }}>
        <span style={{ fontFamily:MN, fontSize:"10px", color:"#000", opacity:0.3, letterSpacing:"0.1em" }}>
          {String(currentIdx+1).padStart(2,"0")} — {String(filtered.length).padStart(2,"0")}
        </span>
        <AnimatePresence mode="wait">
          <motion.span key={current?.title}
            initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
            transition={{ duration:0.2 }}
            style={{ fontFamily:HN, fontSize:"12px", fontWeight:700, letterSpacing:"0.12em",
              textTransform:"uppercase", position:"absolute", left:"50%", transform:"translateX(-50%)" }}>
            {current?.title}
          </motion.span>
        </AnimatePresence>
        <span style={{ fontFamily:HN, fontSize:"9px", fontWeight:700, letterSpacing:"0.3em",
          textTransform:"uppercase", opacity:0.3 }}>
          {current?.category}
        </span>
      </div>

      {/* ═══ DETAIL OVERLAY ══════════════════════════════════ */}
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
  project: Project; index: number; total: number; scrollY: any; onOpen: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const queueStep = useTransform(scrollY, (s: number) =>
    (index * CARD_TRAVEL - s) / CARD_TRAVEL
  );

  // Tighter vertical stacking so 10-12 cards are simultaneously visible
  const yScroll = useTransform(queueStep, (q: number) => {
    if (q <= 0) return -q * 290;    // passed: fall below quickly
    return -q * 22;                 // queued: very tight stack
  });

  const scale = useTransform(queueStep, (q: number) => {
    if (q <= 0) return Math.max(0.05, 1 + q * 0.45);
    return Math.max(0.15, 1 - q * 0.055);
  });

  // Opacity — fixed: fade starts at QUEUE_VISIBLE-2 so last card never pops out
  const opacityVal = useTransform(queueStep, (q: number) => {
    if (q < -0.3) return 0;
    if (q < 0)    return 1 + q * 3;
    if (q > QUEUE_VISIBLE) return 0;
    if (q > QUEUE_VISIBLE - 2) return (QUEUE_VISIBLE - q) / 2;
    return 1;
  });

  const dimFilter = useTransform(queueStep, (q: number) => {
    if (q <= 0) return "brightness(1)";
    return `brightness(${Math.max(0.25, 1 - q * 0.07)})`;
  });

  const zIdx = useTransform(queueStep, (q: number) => Math.max(0, Math.round(100 - q * 8)));

  return (
    <motion.div style={{
      position:"absolute", y:yScroll, scale, opacity:opacityVal, zIndex:zIdx,
      width:"min(82vw, 860px)", aspectRatio:"16/9",
    }}>
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onClick={onOpen}
        animate={{ y: hovered ? -24 : 0 }}
        transition={{ type:"spring", stiffness:260, damping:22 }}
        style={{ width:"100%", height:"100%", cursor:"pointer" }}
      >
        <motion.div style={{ width:"100%", height:"100%", filter: hovered ? "brightness(1)" : dimFilter }}>
          <div style={{ position:"relative", width:"100%", height:"100%",
            borderRadius:"12px", overflow:"hidden",
            border:"1px solid rgba(0,0,0,0.06)",
            boxShadow:"0 24px 80px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.04)" }}>
            <img src={project.img} alt={project.title}
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
              draggable={false} />

            {/* Hover: gradient + title */}
            <motion.div
              animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration:0.22 }}
              style={{ position:"absolute", inset:0,
                background:"linear-gradient(140deg, rgba(0,0,0,0.78) 0%, transparent 48%)",
                pointerEvents:"none" }}
            />
            <AnimatePresence>
              {hovered && (
                <motion.div key="lbl"
                  initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:10 }}
                  transition={{ duration:0.22, ease:[0.22,1,0.36,1] }}
                  style={{ position:"absolute", top:"20px", left:"24px", pointerEvents:"none" }}>
                  <div style={{ fontFamily:HN, fontSize:"8px", fontWeight:700,
                    letterSpacing:"0.45em", textTransform:"uppercase",
                    color:"rgba(255,255,255,0.45)", marginBottom:"6px" }}>
                    {project.category} — {project.year}
                  </div>
                  <h3 style={{ fontFamily:HN, fontSize:"clamp(16px, 2.8vw, 34px)", fontWeight:900,
                    letterSpacing:"-0.02em", textTransform:"uppercase",
                    color:"#fff", lineHeight:1, margin:0 }}>
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
