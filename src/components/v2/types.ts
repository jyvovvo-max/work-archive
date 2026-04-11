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
  // 1-based slot numbers that are videos (not images).
  // Parsed from the sheet `Video` column, comma-separated (e.g. "2" or "1,5").
  // - Selected Works card uses the FIRST slot as the thumbnail loop.
  // - Project detail gallery renders ALL listed slots as videos.
  videoSlots?: number[];
  selected: boolean;
  award?: string;
}

export type Lang = "ko" | "en";

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
  footerEmailHandle: string;
  footerEmail: string;
  footerInstagramHandle: string;
  footerInstagramUrl: string;
  footerName: string;
}
