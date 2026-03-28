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
    // Always start at top on load/refresh
    window.scrollTo(0, 0);
    fetchProjects().then(setProjects);
    fetchSiteData().then(setSiteData);
  }, []);

  // Split comma-separated categories, deduplicate, sort
  const categories = useMemo(
    () => [...new Set(
      projects.flatMap(p =>
        p.category ? p.category.split(",").map(c => c.trim()).filter(Boolean) : []
      )
    )].sort(),
    [projects]
  );

  const selectedWorks = useMemo(
    () => projects.filter(p => p.selected),
    [projects]
  );

  const sortedSelectedWorks = useMemo(
    () => [...selectedWorks].sort((a, b) => {
      const da = parseInt(a.year) * 100 + parseInt(a.month);
      const db = parseInt(b.year) * 100 + parseInt(b.month);
      return db - da;
    }),
    [selectedWorks]
  );

  const gridProjects = useMemo(
    () => activeCategory
      ? sortedSelectedWorks.filter(p =>
          p.category?.split(",").map(c => c.trim()).includes(activeCategory)
        )
      : sortedSelectedWorks,
    [sortedSelectedWorks, activeCategory]
  );

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

  const scrollToTop  = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToAbout   = () => aboutRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToContact = () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });

  return (
    <div style={{ color: "#0A0A0A" }}>
      <Header
        onHome={scrollToTop}
        onViewAll={() => setGridOpen(true)}
        onAbout={scrollToAbout}
        onContact={scrollToContact}
      />

      {/* Hero — fixed background */}
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

      {/* Spacer */}
      <div style={{ height: "100vh" }} />

      {/* WorksGrid — z:2, slides over hero */}
      <div style={{ position: "relative", zIndex: 2, background: "#F0F0F0" }}>
        <WorksGrid
          projects={gridProjects.slice(0, 10)}
          onOpen={setSelected}
        />
      </div>

      {/* About + Footer — z:3, slides over WorksGrid */}
      <div style={{
        position: "relative",
        zIndex: 3,
        background: "#F0F0F0",
        boxShadow: "0 -12px 40px rgba(0,0,0,0.10)",
      }}>
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
