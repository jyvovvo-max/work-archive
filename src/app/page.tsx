"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Project, SiteData, Lang } from "@/components/v2/types";
import { fetchProjects, fetchSiteData, FALLBACK_SITE } from "@/components/v2/dataFetch";
import Header from "@/components/v2/Header";
import HeroSection from "@/components/v2/HeroSection";
import WorksGrid from "@/components/v2/WorksGrid";
import AboutSection from "@/components/v2/AboutSection";
import Footer from "@/components/v2/Footer";
import ContactModal from "@/components/v2/ContactModal";

const ProjectDetailV2 = dynamic(() => import("@/components/v2/ProjectDetailV2"), { ssr: false });

export default function Page() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [siteData, setSiteData] = useState<SiteData>(FALLBACK_SITE);
  const [selected, setSelected] = useState<Project | null>(null);
  const [lang, setLang] = useState<Lang>("ko");
  const [contactOpen, setContactOpen] = useState(false);
  const [pendingDetailId, setPendingDetailId] = useState<number | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const aboutRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof history !== "undefined") {
      history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
    }
    const saved = localStorage.getItem("portfolio-lang") as Lang | null;
    if (saved) setLang(saved);

    const hash = window.location.hash;
    if (hash.startsWith("#/detail/")) {
      const id = parseInt(hash.replace("#/detail/", ""));
      if (!isNaN(id)) setPendingDetailId(id);
    }
    fetchProjects().then(setProjects);
    fetchSiteData().then(setSiteData);
    const interval = setInterval(() => {
      fetchProjects().then(setProjects);
      fetchSiteData().then(setSiteData);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update URL hash for detail view
  const didMountHash = useRef(false);
  useEffect(() => {
    if (!didMountHash.current) { didMountHash.current = true; return; }
    if (selected) window.location.hash = `#/detail/${selected.id}`;
    else window.location.hash = "";
  }, [selected]);

  // Resolve pending detail once projects are loaded
  useEffect(() => {
    if (pendingDetailId !== null && projects.length > 0) {
      const project = projects.find(p => p.id === pendingDetailId);
      if (project) { setSelected(project); setPendingDetailId(null); }
    }
  }, [pendingDetailId, projects]);

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

  const detailList = [...projects].sort((a, b) => a.id - b.id);
  const detailIdx = selected ? detailList.findIndex(p => p.id === selected.id) : -1;
  const handleNext = () => { if (detailIdx >= 0) setSelected(detailList[(detailIdx + 1) % detailList.length]); };
  const handlePrev = () => { if (detailIdx >= 0) setSelected(detailList[(detailIdx - 1 + detailList.length) % detailList.length]); };
  const nextProject = detailIdx >= 0 ? detailList[(detailIdx + 1) % detailList.length] : undefined;
  const prevProject = detailIdx >= 0 ? detailList[(detailIdx - 1 + detailList.length) % detailList.length] : undefined;

  const handleCloseDetail = () => {
    setSelected(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToTop = () => {
    setSelected(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAbout = () => {
    setSelected(null);
    setTimeout(() => aboutRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleViewAll = async () => {
    setIsExiting(true);
    await new Promise(r => setTimeout(r, 350));
    router.push("/work");
  };

  const handleLangToggle = () => {
    setLang(l => {
      const next = l === "ko" ? "en" : "ko";
      localStorage.setItem("portfolio-lang", next);
      return next;
    });
  };

  const headerZIndex = selected ? 700 : 500;
  const headerOnBack = selected ? handleCloseDetail : undefined;

  return (
    <div style={{ color: "#0A0A0A", background: "#F0F0F0" }}>
      {/* Exit overlay — opacity fade only, avoids breaking position:fixed Hero */}
      {isExiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#F0F0F0" }}
        />
      )}
      <Header
        onHome={scrollToTop}
        onViewAll={handleViewAll}
        onAbout={handleAbout}
        onContact={() => setContactOpen(true)}
        onBack={headerOnBack}
        zIndex={headerZIndex}
        siteData={siteData}
        lang={lang}
        onLangToggle={handleLangToggle}
      />

      {/* Layer 1: Hero — fixed behind */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "100vh", zIndex: 1 }}>
        <HeroSection
          projects={shuffledWorks}
          siteData={siteData}
          onOpen={setSelected}
          lang={lang}
        />
      </div>

      {/* Spacer */}
      <div style={{ height: "calc(100vh + 440px)" }} />

      {/* Layer 2: Selected Works */}
      <div style={{
        position: "relative",
        zIndex: 2,
        background: "#F0F0F0",
        borderTop: "1px solid rgba(0,0,0,0.12)",
      }}>
        <WorksGrid projects={shuffledWorks} onOpen={setSelected} />
      </div>

      {/* Layer 3: About + Footer */}
      <div style={{
        position: "relative",
        zIndex: 3,
        background: "#F0F0F0",
        borderTop: "1px solid rgba(0,0,0,0.08)",
      }}>
        <AboutSection ref={aboutRef} siteData={siteData} lang={lang} />
        <Footer siteData={siteData} lang={lang} />
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
            siteData={siteData}
            lang={lang}
          />
        )}
      </AnimatePresence>

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
