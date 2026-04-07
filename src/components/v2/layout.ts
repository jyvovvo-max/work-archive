// Shared layout constants — all sections align to these values
export const GUTTER = "clamp(20px, 4vw, 56px)";
export const GRID_GAP = "clamp(16px, 2vw, 32px)";
export const GRID_COLS = 7;

// Optical right-edge correction (px): KOR pill, landing subtitle, and landing title
// all share this single offset so their right edges stay pixel-perfectly aligned.
// Increase to shift all three further right; decrease to pull them back.
export const RIGHT_OPT_PX = 1;
