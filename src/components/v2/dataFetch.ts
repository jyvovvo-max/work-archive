import { Project, SiteData } from "./types";

export const CLD       = "https://res.cloudinary.com/doyfzvsly/image/upload/f_auto,q_auto/portfolio-images/";
export const CLD_VIDEO = "https://res.cloudinary.com/doyfzvsly/video/upload/portfolio-images/";

export const cldImgs = (folder: string, count: number, videoSlots: number[] = []) =>
  Array.from({ length: count }, (_, i) => {
    const slot = i + 1;
    const num  = String(slot).padStart(3, "0");
    return videoSlots.includes(slot)
      ? `${CLD_VIDEO}${folder}/${num}`
      : `${CLD}${folder}/${num}`;
  });

// Sheet 1: projects
const SHEETS_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSOFxt3PRlK8ifjXZ1qXOM9HI4zL4J0z2eHu7mTquwXzBoS7RPhSNC0EjUVC_wWt5iyXK14rB_48W_3/pub?gid=0&single=true&output=csv";

// Sheet 2: about/site data
// 구글시트에서 두 번째 탭 생성 후 gid로 교체하세요.
// 컬럼 구조: key | value
// 필요 키: landing_title, landing_subtitle, landing_description,
//          about_bio (파이프 | 로 문단 구분), services (콤마 구분), experience (콤마 구분)
const ABOUT_CSV =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSOFxt3PRlK8ifjXZ1qXOM9HI4zL4J0z2eHu7mTquwXzBoS7RPhSNC0EjUVC_wWt5iyXK14rB_48W_3/pub?gid=444601329&single=true&output=csv";

function parseCSVRow(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (!inQ && c === ',') {
      fields.push(cur); cur = "";
    } else {
      cur += c;
    }
  }
  fields.push(cur);
  return fields;
}

function parseCSV(text: string): Record<string, string>[] {
  const rows: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { inQ = !inQ; cur += c; }
    else if (!inQ && c === '\r' && text[i + 1] === '\n') { i++; if (cur.trim()) rows.push(cur); cur = ""; }
    else if (!inQ && c === '\n') { if (cur.trim()) rows.push(cur); cur = ""; }
    else { cur += c; }
  }
  if (cur.trim()) rows.push(cur);
  if (rows.length < 2) return [];
  const headers = parseCSVRow(rows[0]).map(h => h.trim());
  return rows.slice(1).map(line => {
    const values = parseCSVRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (values[i] ?? "").trim(); });
    return obj;
  });
}

function rowToProject(row: Record<string, string>): Project | null {
  const id = parseInt(row.id);
  if (!id || !row.title || !row.folder) return null;
  const imageCount  = parseInt(row.imageCount) || 0;
  const videoSlots  = (row.videos ?? "").split(",").map(n => parseInt(n)).filter(n => !isNaN(n) && n > 0);
  return {
    id,
    title: row.title,
    year: row.year ?? "",
    month: row.month ?? "1",
    category: row.category ?? "",
    description: row.description_ko ?? row.description ?? "",
    descriptionEn: row.description_en || undefined,
    coworkers: row.coworkers
      ? row.coworkers.split(",").map(s => s.trim()).filter(Boolean)
      : [],
    img: `${CLD}${row.folder}/cover`,
    images: imageCount > 0 ? cldImgs(row.folder, imageCount, videoSlots) : undefined,
    pairs: row.pairs || undefined,
    videoUrl: row.videoUrl || undefined,
    selected: row.selected?.toUpperCase() === "TRUE",
  };
}

const FALLBACK_PROJECTS: Project[] = [
  {
    id: 21, title: "Shinsegae Market", year: "2025", month: "02",
    category: "Branding", selected: true,
    coworkers: ["SHINSEGAE BRAND DESIGN TEAM", "MUCCA", "RMS"],
    description: "신세계의 브랜드 아이덴티티와 헤리티지를 바탕으로 럭셔리 및 프리미엄 브랜드 이미지를 식품관 영역으로 확장했습니다. 신세계 마켓의 브랜드 비주얼과 패키지를 통합적으로 개발하여 프리미엄 식품관으로서의 브랜드 포지셔닝을 강화했습니다.",
    img: `${CLD}shinsegae-market/cover`,
    images: cldImgs("shinsegae-market", 10),
    pairs: "3+4|9+10",
  },
  {
    id: 22, title: "Shinsegae Market Open Campaign", year: "2025", month: "03",
    category: "Campaign", selected: true,
    coworkers: ["SHINSEGAE BRAND DESIGN TEAM", "MUCCA", "RMS"],
    description: "신세계 마켓 오픈을 알리는 캠페인 비주얼 디렉션. 브랜드 런칭의 임팩트를 극대화하기 위한 통합 커뮤니케이션 시스템을 개발했습니다.",
    img: `${CLD}shinsegae-market-open-campaign/cover`,
    images: cldImgs("shinsegae-market-open-campaign", 6),
    pairs: "3+4",
  },
];

// rowToSiteData already reads map.awards below
export const FALLBACK_SITE: SiteData = {
  siteName: "Jinyoung Hwang",
  landingTitle: "Work Archive",
  landingSubtitle: "2015–Present",
  landingDescription:
    "Hello, Jinyoung Hwang here. I am a brand designer at the SHINSEGAE Brand Design Team. This archive records my work at SHINSEGAE, covering a broad spectrum from branding and packaging to signage, visual direction, and seasonal campaigns.",
  aboutHeadline: "Brand Designer at\nSHINSEGAE.",
  aboutBio: [
    "Jinyoung Hwang is a brand designer with 10 years of experience at SHINSEGAE Brand Design Team, one of Korea's leading retail groups.",
    "The work spans brand identity, packaging, signage, visual direction, and seasonal campaigns — always grounded in strategic thinking and meticulous craft.",
  ],
  services: [
    "Brand Identity", "Brand Strategy", "Art Direction", "Campaign",
    "Packaging", "Signage & Wayfinding", "Visual Direction",
    "Seasonal Campaign", "Graphic Design",
  ],
  experience: [
    "Luxury & Retail", "Fashion & Beauty", "Food & Beverage",
    "Culture & Arts", "Corporate Identity",
  ],
  awards: [],
  footerHeadline: "I would love to hear from you!",
  footerLocation: "Korea",
  footerEmail: "jyvovvo@gmail.com",
  footerInstagramHandle: "@jyvovvo",
  footerInstagramUrl: "https://instagram.com/jyvovvo",
  footerName: "Jinyoung Hwang",
};

export async function fetchProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${SHEETS_CSV}&_=${Date.now()}`, { cache: "no-store" });
    const text = await res.text();
    const rows = parseCSV(text);
    const parsed = rows.map(rowToProject).filter((p): p is Project => p !== null);
    return parsed.length > 0 ? parsed : FALLBACK_PROJECTS;
  } catch {
    return FALLBACK_PROJECTS;
  }
}

export async function fetchSiteData(): Promise<SiteData> {
  if (ABOUT_CSV.includes("REPLACE_WITH")) return FALLBACK_SITE;
  try {
    const res = await fetch(`${ABOUT_CSV}&_=${Date.now()}`, { cache: "no-store" });
    const text = await res.text();
    const rows = parseCSV(text);
    const map: Record<string, string> = {};
    rows.forEach(r => { if (r.key) map[r.key] = r.value ?? ""; });
    return {
      siteName: map.site_name || FALLBACK_SITE.siteName,
      landingTitle: map.landing_title || FALLBACK_SITE.landingTitle,
      landingSubtitle: map.landing_subtitle || FALLBACK_SITE.landingSubtitle,
      landingDescription: map.landing_description || FALLBACK_SITE.landingDescription,
      aboutHeadline: map.about_headline || FALLBACK_SITE.aboutHeadline,
      aboutBio: map.about_bio
        ? map.about_bio.split("|").map(s => s.trim()).filter(Boolean)
        : FALLBACK_SITE.aboutBio,
      services: map.services
        ? map.services.split(",").map(s => s.trim()).filter(Boolean)
        : FALLBACK_SITE.services,
      experience: map.experience
        ? map.experience.split(",").map(s => s.trim()).filter(Boolean)
        : FALLBACK_SITE.experience,
      awards: map.awards
        ? map.awards.split(",").map(s => s.trim()).filter(Boolean)
        : FALLBACK_SITE.awards,
      footerHeadline: map.footer_headline || FALLBACK_SITE.footerHeadline,
      footerLocation: map.footer_location || FALLBACK_SITE.footerLocation,
      footerEmail: map.footer_email || FALLBACK_SITE.footerEmail,
      footerInstagramHandle: map.footer_instagram_handle || FALLBACK_SITE.footerInstagramHandle,
      footerInstagramUrl: map.footer_instagram_url || FALLBACK_SITE.footerInstagramUrl,
      footerName: map.footer_name || FALLBACK_SITE.footerName,
    };
  } catch {
    return FALLBACK_SITE;
  }
}
