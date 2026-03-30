"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
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
  const aboutRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof history !== "undefined") history.scrollRestoration = "auto";
    const hash = window.location.hash;
    if (hash.startsWith("#/detail/")) {
      const id = parseInt(hash.replace("#/detail/", ""));
      if (!isNaN(id)) setPendingDetailId(id);
    } else if (hash === "#/grid") {
      setGridOpen(true);
    }
    fetchProjects().then(setProjects);
    fetchSiteData().then(setSiteData);
    const interval = setInterval(() => {
      fetchProjects().then(setProjects);
      fetchSiteData().then(setSiteData);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update URL hash when view changes (skip initial mount to preserve scroll restoration)
  const didMountHash = useRef(false);
  useEffect(() => {
    if (!didMountHash.current) { didMountHash.current = true; return; }
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

  const [shuffledWorks, setShuffledWorks] = useState<Project[]>([]);
  const didShuffle = useRef(false);
  useEffect(() => {
    if (!didShuffle.current && selectedWorks.length > 0) {
      didShuffle.current = true;
      setShuffledWorks([...selectedWorks].sort(() => Math.random() - 0.5));
    }
  }, [selectedWorks]);

  const detailList = shuffledWorks.length > 0 ? shuffledWorks : projects;
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
    <div style={{ color: "#0A0A0A", background: "#F0F0F0" }}>
      <Header
        onHome={scrollToTop}
        onViewAll={() => { handleCloseDetail(); setGridOpen(true); }}
        onAbout={handleAbout}
        onContact={scrollToContact}
        onBack={headerOnBack}
        zIndex={headerZIndex}
        alwaysVisible={gridOpen}
        siteData={siteData}
      />

      {/* Layer 1: Hero — fixed behind */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "100vh", zIndex: 1 }}>
        <HeroSection
          projects={shuffledWorks}
          siteData={siteData}
          onOpen={setSelected}
        />
      </div>

      {/* Spacer — Selected Works slides over after desc finishes at ~500px */}
      <div style={{ height: "calc(100vh + 550px)" }} />

      {/* Layer 2: Selected Works — slides over Hero */}
      <div style={{
        position: "relative",
        zIndex: 2,
        background: "#F0F0F0",
        borderTop: "1px solid rgba(0,0,0,0.12)",
      }}>
        <WorksGrid projects={shuffledWorks} onOpen={setSelected} />
      </div>

      {/* Layer 3: About + Footer — slides over Selected Works */}
      <div style={{
        position: "relative",
        zIndex: 3,
        background: "#F0F0F0",
        borderTop: "1px solid rgba(0,0,0,0.08)",
      }}>
        <AboutSection ref={aboutRef} siteData={siteData} />
        <Footer siteData={siteData} />
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
