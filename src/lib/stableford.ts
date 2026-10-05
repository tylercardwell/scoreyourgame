/** Strokes a player receives on a hole, from their playing handicap and the hole's stroke index. */
export function strokesReceived(handicap: number, strokeIndex: number, holes: number) {
  const h = Math.max(0, Math.round(handicap));
  return Math.floor(h / holes) + (strokeIndex <= h % holes ? 1 : 0);
}

/** Net Stableford points for one hole. A blank (0) score is a pick-up and earns 0 points. */
export function holePoints(par: number, gross: number, received: number) {
  if (!gross) return 0;
  return Math.max(0, 2 + par - (gross - received));
}
