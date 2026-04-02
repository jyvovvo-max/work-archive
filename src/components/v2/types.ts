export interface Project {
  id: number;
  title: string;
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
}

export type Lang = "ko" | "en";

export interface SiteData {
  siteName: string;
  landingTitle: string;
  landingSubtitle: string;
  landingDescription: string;
  aboutHeadline: string;
  aboutBio: string[];
  services: string[];
  experience: string[];
  awards: string[];
  footerHeadline: string;
  footerLocation: string;
  footerEmail: string;
  footerInstagramHandle: string;
  footerInstagramUrl: string;
  footerName: string;
}
