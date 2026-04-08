// Shared layout constants — all sections align to these values
// GUTTER uses CSS var set in globals.css with media query
// Mobile (<768px): clamp(20px, 4vw, 56px)  |  Desktop: clamp(40px, 8vw, 112px)
export const GUTTER = "var(--gutter)";
export const GRID_GAP = "clamp(16px, 2vw, 32px)";
export const GRID_COLS = 7;

// Section spacing — A is base unit, B = 2×A, C = A×3/4, D = B×3/4
export const SPACE_A = "clamp(24px, 3.3vh, 43px)";
export const SPACE_B = "clamp(48px, 6.6vh, 86px)";
export const SPACE_C = "clamp(18px, 2.48vh, 32px)";
export const SPACE_D = "clamp(36px, 4.95vh, 65px)";

// Typography — centralized font sizes
export const FONT_SECTION_TITLE = "clamp(17px, 2.02vw, 27px)";   // section title bars (90% of original)
export const FONT_HEADLINE = "clamp(30px, 2.7vw, 42px)";         // Awards project name, About headline

// Optical right-edge correction (px) — tune each independently.
// Positive = element shifts further right past the GUTTER baseline.
export const RIGHT_OPT_PILL     = 0;    // KOR pill (Header)
export const RIGHT_OPT_SUBTITLE = -12;  // 랜딩 서브타이틀 (HeroSection)
export const RIGHT_OPT_TITLE    = 10;   // 랜딩 타이틀 컨테이너 (HeroSection)
