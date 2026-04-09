"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Project, SiteData, Lang } from "@/components/v2/types";
import { fetchProjects, fetchSiteData, FALLBACK_SITE } from "@/components/v2/dataFetch";
import Header from "@/components/v2/Header";
import HeroSection from "@/components/v2/HeroSection";
import WorksGrid from "@/components/v2/WorksGrid";
import Footer from "@/components/v2/Footer";
import ContactModal from "@/components/v2/ContactModal";
import { SPACE_B } from "@/components/v2/layout";

export default function Page() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [siteData, setSiteData] = useState<SiteData>(FALLBACK_SITE);
  const [lang, setLang] = useState<Lang>("ko");
  const [contactOpen, setContactOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (typeof history !== "undefined") {
      history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
    }
    const saved = localStorage.getItem("portfolio-lang") as Lang | null;
    if (saved) setLang(saved);

    // Legacy hash redirect → /project/{id}
    const hash = window.location.hash;
    if (hash.startsWith("#/detail/")) {
      const id = parseInt(hash.replace("#/detail/", ""));
      if (!isNaN(id)) { router.replace(`/project/${id}`); return; }
    }
    fetchProjects().then(setProjects);
    fetchSiteData().then(setSiteData);
    const interval = setInterval(() => {
      fetchProjects().then(setProjects);
      fetchSiteData().then(setSiteData);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const openProject = (p: Project) => router.push(`/project/${p.id}`);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAbout = async () => {
    setIsExiting(true);
    await new Promise(r => setTimeout(r, 350));
    router.push("/about");
  };

  const handleViewAll = async () => {
    setIsExiting(true);
    await new Promise(r => setTimeout(r, 350));
    router.push("/work");
  };


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
        zIndex={500}
        siteData={siteData}
        lang={lang}
      />

      {/* Layer 1: Hero — fixed behind */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "100vh", zIndex: 1 }}>
        <HeroSection
          projects={shuffledWorks}
          siteData={siteData}
          onOpen={openProject}
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
        <WorksGrid projects={shuffledWorks} onOpen={openProject} />
        <div style={{ height: SPACE_B }} />
      </div>

      {/* Layer 3: Footer */}
      <div style={{
        position: "relative",
        zIndex: 3,
        background: "#F0F0F0",
        borderTop: "none",
      }}>
        <Footer siteData={siteData} lang={lang} />
      </div>

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
