"use client";
import { useEffect, useState } from "react";
import WorksGridV3 from "@/components/v2/WorksGridV3";
import { fetchProjects } from "@/components/v2/dataFetch";
import { Project } from "@/components/v2/types";

export default function TestLayoutPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetchProjects().then(all => {
      const selected = all.filter(p => p.selected);
      setProjects(selected.length > 0 ? selected : all.slice(0, 6));
    });
  }, []);

  return (
    <main style={{ background: "#F0F0F0", minHeight: "100vh", paddingTop: "60px" }}>
      <WorksGridV3
        projects={projects}
        onOpen={(p) => alert(`Open: ${p.title}`)}
      />
    </main>
  );
}
