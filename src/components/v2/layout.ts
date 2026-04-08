// Shared layout constants — all sections align to these values
export const GUTTER = "clamp(20px, 4vw, 56px)";
export const GRID_GAP = "clamp(16px, 2vw, 32px)";
export const GRID_COLS = 7;

// Section spacing — A is base unit, B = 2×A, C = A/3, D = B/3
export const SPACE_A = "clamp(40px, 5.5vh, 72px)";
export const SPACE_B = "clamp(80px, 11vh, 144px)";
export const SPACE_C = "clamp(13px, 1.83vh, 24px)";
export const SPACE_D = "clamp(27px, 3.67vh, 48px)";

// Optical right-edge correction (px) — tune each independently.
// Positive = element shifts further right past the GUTTER baseline.
export const RIGHT_OPT_PILL     = 0;    // KOR pill (Header)
export const RIGHT_OPT_SUBTITLE = -12;  // 랜딩 서브타이틀 (HeroSection)
export const RIGHT_OPT_TITLE    = 10;   // 랜딩 타이틀 컨테이너 (HeroSection)
