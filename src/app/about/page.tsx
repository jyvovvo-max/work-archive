"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Project, SiteData, Lang } from "@/components/v2/types";
import { fetchProjects, fetchSiteData, FALLBACK_SITE } from "@/components/v2/dataFetch";
import Header from "@/components/v2/Header";
import AboutSection from "@/components/v2/AboutSection";
import AwardsSection from "@/components/v2/AwardsSection";
import Footer from "@/components/v2/Footer";
import ContactModal from "@/components/v2/ContactModal";

export default function AboutPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [siteData, setSiteData] = useState<SiteData>(FALLBACK_SITE);
  const [lang, setLang] = useState<Lang>("ko");
  const [contactOpen, setContactOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("portfolio-lang") as Lang | null;
    if (saved) setLang(saved);
    Promise.all([
      fetchProjects().then(setProjects),
      fetchSiteData().then(setSiteData),
    ]).then(() => setReady(true));
  }, []);

  const handleBack = async () => {
    setIsExiting(true);
    await new Promise(r => setTimeout(r, 350));
    router.back();
  };

  const openProject = (p: Project) => router.push(`/project/${p.id}`);

  return (
    <div style={{ background: "#F0F0F0", color: "#0A0A0A", minHeight: "100vh" }}>
      {isExiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#F0F0F0" }}
        />
      )}

      <Header
        onHome={() => router.push("/")}
        onViewAll={() => router.push("/work")}
        onAbout={() => {}}
        onContact={() => setContactOpen(true)}
        onBack={handleBack}
        zIndex={500}
        alwaysVisible
        siteData={siteData}
        lang={lang}
      />

      <motion.div
        initial={{ opacity: 0, filter: "blur(12px)", y: 14 }}
        animate={ready
          ? { opacity: 1, filter: "blur(0px)", y: 0 }
          : { opacity: 0.3, filter: "blur(12px)", y: 14 }
        }
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ paddingTop: "52px" }}
      >
        <AboutSection siteData={siteData} lang={lang} skipAnimation />
        <AwardsSection projects={projects} onOpen={openProject} />
        <Footer siteData={siteData} lang={lang} />
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
