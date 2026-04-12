// Shared layout constants — all sections align to these values
// GUTTER uses CSS var set in globals.css with media query
// Mobile (<768px): clamp(20px, 4vw, 56px)  |  Desktop: clamp(40px, 8vw, 112px)
export const GUTTER = "var(--gutter)";
export const GRID_GAP = "clamp(16px, 2vw, 32px)";
export const GRID_COLS = 7;

// Section spacing — A is base unit, B = 2×A, C = A×3/4, D = B×3/4 (+3% applied 2026-04-10)
export const SPACE_A = "clamp(25px, 3.4vh, 44px)";
export const SPACE_B = "clamp(49px, 6.8vh, 89px)";
export const SPACE_C = "clamp(19px, 2.55vh, 33px)";
export const SPACE_D = "clamp(37px, 5.1vh, 67px)";

// Typography — centralized font sizes (×0.95 applied 2026-04-10)
export const FONT_SECTION_TITLE = "clamp(16px, 1.92vw, 26px)";   // section title bars
export const FONT_HEADLINE = "clamp(29px, 2.57vw, 40px)";        // Awards project name, About headline
export const FONT_BODY = "clamp(15px, 1.3vw, 19px)";             // About bio text
export const FONT_LIST = "clamp(12px, 1.0vw, 15px)";             // Services, Experience items
export const FONT_LABEL = "clamp(10px, 0.8vw, 12px)";            // Services/Experience/Award caption titles
export const FONT_FOOTER = "clamp(12px, 0.9vw, 14px)";           // Footer — hierarchy lowest tier
export const FONT_FOOTER_BOTTOM = "clamp(11px, 0.75vw, 12px)";   // Footer bottom bar name
export const FONT_MODAL_TITLE = "clamp(18px, 2.2vw, 32px)";      // Modal section titles (Contact etc.)

// Optical right-edge correction (px) — tune each independently.
// Positive = element shifts further right past the GUTTER baseline.
export const RIGHT_OPT_PILL     = 0;    // KOR pill (Header)
export const RIGHT_OPT_SUBTITLE = -12;  // 랜딩 서브타이틀 (HeroSection)
export const RIGHT_OPT_TITLE    = 10;   // 랜딩 타이틀 컨테이너 (HeroSection)
