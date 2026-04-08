export interface Project {
  id: number;
  title: string;
  titleEn?: string;
  year: string;
  month: string;
  category: string;
  description: string;
  descriptionEn?: string;
  coworkers: string[];
  img: string;
  images?: string[];
  pairs?: string;
  videoUrl?: string;
  selected: boolean;
  award?: string;
}

export type Lang = "ko" | "en";

export const getTitle = (p: { title: string; titleEn?: string }, lang: Lang = "ko") =>
  (lang === "en" && p.titleEn) ? p.titleEn : p.title;

export interface SiteData {
  siteName: string;
  landingTitle: string;
  landingSubtitle: string;
  landingDescription: string;
  landingDescriptionEn?: string;
  aboutHeadline: string;
  aboutBio: string[];
  aboutBioEn?: string[];
  services: string[];
  experience: string[];
  awards: string[];
  footerHeadline: string;
  footerHeadlineEn?: string;
  footerLocation: string;
  footerEmail: string;
  footerInstagramHandle: string;
  footerInstagramUrl: string;
  footerName: string;
}
