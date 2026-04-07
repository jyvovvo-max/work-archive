// Shared layout constants — all sections align to these values
export const GUTTER = "clamp(20px, 4vw, 56px)";
export const GRID_GAP = "clamp(16px, 2vw, 32px)";
export const GRID_COLS = 7;

// Optical right-edge correction (px) — tune each independently.
// Positive = element shifts further right past the GUTTER baseline.
export const RIGHT_OPT_PILL     = 0;   // KOR pill (Header)
export const RIGHT_OPT_SUBTITLE = -5;  // 랜딩 서브타이틀 (HeroSection)
export const RIGHT_OPT_TITLE    = 5;   // 랜딩 타이틀 컨테이너 (HeroSection)
