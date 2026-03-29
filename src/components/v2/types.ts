export interface Project {
  id: number;
  title: string;
  year: string;
  month: string;
  category: string;
  description: string;
  coworkers: string[];
  img: string;
  images?: string[];
  pairs?: string;
  videoUrl?: string;
  selected: boolean;
}

export interface SiteData {
  landingTitle: string;
  landingSubtitle: string;
  landingDescription: string;
  aboutBio: string[];
  services: string[];
  experience: string[];
  awards: string[];   // comma-separated in Sheets column "awards"
}
