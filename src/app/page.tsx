"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { AnimatePresence, useScroll } from "framer-motion";
import dynamic from "next/dynamic";
import { Project, SiteData } from "@/components/v2/types";
import { fetchProjects, fetchSiteData } from "@/components/v2/dataFetch";
import Header from "@/components/v2/Header";
import HeroSection from "@/components/v2/HeroSection";
import WorksGrid from "@/components/v2/WorksGrid";
import AboutSection from "@/components/v2/AboutSection";
import Footer from "@/components/v2/Footer";

const ProjectDetailV2 = dynamic(() => import("@/components/v2/ProjectDetailV2"), { ssr: false });
const GridViewOverlay = dynamic(() => import("@/components/v2/GridViewOverlay"), { ssr: false });

export default function Page() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [selected, setSelected] = useState<Project | null>(null);
  const [gridOpen, setGridOpen] = useState(false);
  const [gridAboutOpen, setGridAboutOpen] = useState(false);
  const [pendingDetailId, setPendingDetailId] = useState<number | null>(null);

  const heroWrapperRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLElement>(null);

  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroWrapperRef,
    offset: ["start start", "end start"],
  });

  useEffect(() => {
    if (typeof history !== "undefined") history.scrollRestoration = "manual";
    const hash = window.location.hash;
    if (hash.startsWith("#/detail/")) {
      const id = parseInt(hash.replace("#/detail/", ""));
      if (!isNaN(id)) setPendingDetailId(id);
    } else if (hash === "#/grid") {
      setGridOpen(true);
    } else {
      window.scrollTo(0, 0);
    }
    fetchProjects().then(setProjects);
    fetchSiteData().then(setSiteData);
  }, []);

  // Update URL hash when view changes
  useEffect(() => {
    if (selected) window.location.hash = `#/detail/${selected.id}`;
    else if (gridOpen) window.location.hash = "#/grid";
    else window.location.hash = "";
  }, [selected, gridOpen]);

  // Resolve pending detail once projects are loaded
  useEffect(() => {
    if (pendingDetailId !== null && projects.length > 0) {
      const project = projects.find(p => p.id === pendingDetailId);
      if (project) { setSelected(project); setPendingDetailId(null); }
    }
  }, [pendingDetailId, projects]);

  const categories = useMemo(
    () => [...new Set(
      projects.flatMap(p =>
        p.category ? p.category.split(",").map(c => c.trim()).filter(Boolean) : []
      )
    )].sort(),
    [projects]
  );

  const selectedWorks = useMemo(() => {
    const sel = projects.filter(p => p.selected);
    return sel.length > 0 ? sel : projects;
  }, [projects]);

  const [randomWorks, setRandomWorks] = useState<typeof projects>([]);
  const didShuffle = useRef(false);
  useEffect(() => {
    if (!didShuffle.current && projects.length > 0) {
      didShuffle.current = true;
      setRandomWorks([...projects].sort(() => Math.random() - 0.5).slice(0, 10));
    }
  }, [projects]);

  const sortedSelectedWorks = useMemo(
    () => [...selectedWorks].sort((a, b) => {
      const da = parseInt(a.year) * 100 + parseInt(a.month);
      const db = parseInt(b.year) * 100 + parseInt(b.month);
      return db - da;
    }),
    [selectedWorks]
  );

  const detailList = sortedSelectedWorks.length > 0 ? sortedSelectedWorks : projects;
  const detailIdx = selected ? detailList.findIndex(p => p.id === selected.id) : -1;

  const handleNext = () => { if (detailIdx >= 0) setSelected(detailList[(detailIdx + 1) % detailList.length]); };
  const handlePrev = () => { if (detailIdx >= 0) setSelected(detailList[(detailIdx - 1 + detailList.length) % detailList.length]); };

  const nextProject = detailIdx >= 0 ? detailList[(detailIdx + 1) % detailList.length] : undefined;
  const prevProject = detailIdx >= 0 ? detailList[(detailIdx - 1 + detailList.length) % detailList.length] : undefined;

  const handleCloseDetail = () => {
    setSelected(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCloseGrid = () => {
    setGridOpen(false);
    setGridAboutOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToTop = () => {
    setSelected(null);
    setGridOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToContact = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const handleAbout = () => {
    if (gridOpen) {
      setGridAboutOpen(o => !o);
    } else {
      setSelected(null);
      setGridOpen(false);
      setTimeout(() => aboutRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  // Header z-index and back button change per state
  const headerZIndex = selected ? 700 : gridOpen ? 560 : 500;
  const headerOnBack = selected ? handleCloseDetail : gridOpen ? handleCloseGrid : undefined;

  return (
    <div style={{ color: "#0A0A0A" }}>
      <Header
        onHome={scrollToTop}
        onViewAll={() => { handleCloseDetail(); setGridOpen(true); }}
        onAbout={handleAbout}
        onContact={scrollToContact}
        onBack={headerOnBack}
        zIndex={headerZIndex}
        alwaysVisible={gridOpen}
      />

      {/* Layer 1: Hero — sticky with 280vh scroll space */}
      <div ref={heroWrapperRef} style={{ position: "relative", height: "280vh" }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
          <HeroSection
            scrollProgress={heroScrollProgress}
            projects={randomWorks}
            siteData={siteData}
          />
        </div>
      </div>

      {/* Layer 2: Selected Works — slides over Hero */}
      <div style={{
        position: "relative",
        zIndex: 2,
        background: "#F0F0F0",
        boxShadow: "0 -40px 100px rgba(0,0,0,0.35)",
      }}>
        <WorksGrid projects={randomWorks} onOpen={setSelected} />
      </div>

      {/* Layer 3: About + Footer — slides over Selected Works */}
      <div style={{
        position: "relative",
        zIndex: 3,
        background: "#F0F0F0",
        boxShadow: "0 -40px 100px rgba(0,0,0,0.20)",
      }}>
        <AboutSection ref={aboutRef} siteData={siteData} />
        <Footer />
      </div>

      <AnimatePresence>
        {selected && (
          <ProjectDetailV2
            key={`detail-${selected.id}`}
            project={selected}
            onClose={handleCloseDetail}
            onNext={handleNext}
            onPrev={handlePrev}
            nextProject={nextProject}
            prevProject={prevProject}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gridOpen && (
          <GridViewOverlay
            key="grid-overlay"
            projects={projects}
            categories={categories}
            siteData={siteData}
            aboutExpanded={gridAboutOpen}
            onClose={handleCloseGrid}
            onOpen={p => { handleCloseGrid(); setSelected(p); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
