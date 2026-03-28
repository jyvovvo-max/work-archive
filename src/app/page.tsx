"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const aboutRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetchProjects().then(setProjects);
    fetchSiteData().then(setSiteData);
  }, []);

  const categories = useMemo(
    () => [...new Set(projects.map(p => p.category).filter(Boolean))].sort(),
    [projects]
  );

  // Selected works for hero + main grid
  const selectedWorks = useMemo(
    () => projects.filter(p => p.selected),
    [projects]
  );

  // Sort selected works by year+month descending (최신순)
  const sortedSelectedWorks = useMemo(
    () => [...selectedWorks].sort((a, b) => {
      const da = parseInt(a.year) * 100 + parseInt(a.month);
      const db = parseInt(b.year) * 100 + parseInt(b.month);
      return db - da;
    }),
    [selectedWorks]
  );

  // Grid filtered by category
  const gridProjects = useMemo(
    () => activeCategory
      ? sortedSelectedWorks.filter(p => p.category === activeCategory)
      : sortedSelectedWorks,
    [sortedSelectedWorks, activeCategory]
  );

  // Project detail navigation — loops within the current view
  const detailList = gridProjects.length > 0 ? gridProjects : sortedSelectedWorks;
  const detailIdx = selected ? detailList.findIndex(p => p.id === selected.id) : -1;

  const handleNext = () => {
    if (detailIdx < 0) return;
    setSelected(detailList[(detailIdx + 1) % detailList.length]);
  };
  const handlePrev = () => {
    if (detailIdx < 0) return;
    setSelected(detailList[(detailIdx - 1 + detailList.length) % detailList.length]);
  };

  const nextProject = detailIdx >= 0 ? detailList[(detailIdx + 1) % detailList.length] : undefined;
  const prevProject = detailIdx >= 0 ? detailList[(detailIdx - 1 + detailList.length) % detailList.length] : undefined;

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToContact = () => {
    // Footer is at the bottom — just scroll to bottom
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  return (
    <div style={{ color: "#F0EDE8" }}>
      <Header
        onViewAll={() => setGridOpen(true)}
        onAbout={scrollToAbout}
        onContact={scrollToContact}
      />

      {/* Hero — fixed in background, always at z:0 */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "100vh", zIndex: 0 }}>
        <HeroSection
          projects={sortedSelectedWorks}
          siteData={siteData}
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onOpenProject={setSelected}
        />
      </div>

      {/* Spacer — reserves 100vh so scroll starts below hero */}
      <div style={{ height: "100vh" }} />

      {/* Scrolling content — z:2, background covers the fixed hero as it slides up */}
      <div style={{ position: "relative", zIndex: 2, background: "#0A0A0A" }}>
        <WorksGrid
          projects={gridProjects}
          onOpen={setSelected}
        />

        <AboutSection ref={aboutRef} siteData={siteData} />

        <Footer />
      </div>

      <AnimatePresence>
        {selected && (
          <ProjectDetailV2
            key={`detail-${selected.id}`}
            project={selected}
            onClose={() => setSelected(null)}
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
            onClose={() => setGridOpen(false)}
            onOpen={p => { setGridOpen(false); setSelected(p); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
