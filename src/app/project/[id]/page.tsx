"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Project, SiteData, Lang } from "@/components/v2/types";
import { fetchProjects, fetchSiteData, FALLBACK_SITE } from "@/components/v2/dataFetch";
import Header from "@/components/v2/Header";
import ContactModal from "@/components/v2/ContactModal";
import ProjectDetailV2 from "@/components/v2/ProjectDetailV2";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string);

  const [projects, setProjects] = useState<Project[]>([]);
  const [siteData, setSiteData] = useState<SiteData>(FALLBACK_SITE);
  const [lang, setLang] = useState<Lang>("ko");
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("portfolio-lang") as Lang | null;
    if (saved) setLang(saved);
    fetchProjects().then(setProjects);
    fetchSiteData().then(setSiteData);
  }, []);

  const detailList = useMemo(() => [...projects].sort((a, b) => a.id - b.id), [projects]);
  const detailIdx = detailList.findIndex(p => p.id === projectId);
  const project = detailIdx >= 0 ? detailList[detailIdx] : null;
  const nextProject = detailIdx >= 0 ? detailList[(detailIdx + 1) % detailList.length] : undefined;
  const prevProject = detailIdx >= 0 ? detailList[(detailIdx - 1 + detailList.length) % detailList.length] : undefined;

  const handleNext = () => {
    if (detailIdx >= 0) {
      const next = detailList[(detailIdx + 1) % detailList.length];
      router.push(`/project/${next.id}`);
    }
  };
  const handlePrev = () => {
    if (detailIdx >= 0) {
      const prev = detailList[(detailIdx - 1 + detailList.length) % detailList.length];
      router.push(`/project/${prev.id}`);
    }
  };
  const handleClose = () => router.back();

  if (!project) {
    return (
      <div style={{ background: "#F0F0F0", minHeight: "100vh" }}>
        <Header
          onHome={() => router.push("/")}
          onViewAll={() => router.push("/work")}
          onAbout={() => router.push("/about")}
          onContact={() => setContactOpen(true)}
          onBack={handleClose}
          zIndex={700}
          alwaysVisible
          siteData={siteData}
          lang={lang}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ minHeight: "100vh" }}
    >
      <Header
        onHome={() => router.push("/")}
        onViewAll={() => router.push("/work")}
        onAbout={() => router.push("/about")}
        onContact={() => setContactOpen(true)}
        onBack={handleClose}
        zIndex={700}
        siteData={siteData}
        lang={lang}
      />

      <ProjectDetailV2
        project={project}
        onClose={handleClose}
        onNext={handleNext}
        onPrev={handlePrev}
        nextProject={nextProject}
        prevProject={prevProject}
        siteData={siteData}
        lang={lang}
        onContact={() => setContactOpen(true)}
      />

      <ContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        email={siteData?.footerEmail ?? ""}
        igHandle={siteData?.footerInstagramHandle ?? ""}
        igUrl={siteData?.footerInstagramUrl ?? ""}
      />
    </motion.div>
  );
}
