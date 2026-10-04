export type Player = {
  id: string;
  nickname: string;
  scores: Record<string, number>;
  isHost: boolean;
};
export type Round = {
  id: string;
  inviteCode: string;
  name: string;
  course: string;
  holeCount: number;
  status: 'active' | 'completed';
  revision: number;
  createdAt: string;
  completedAt: string | null;
  holes: { number: number; par: number }[];
  players: Player[];
  viewerId: string;
  isHost: boolean;
};
export type RoundSummary = {
  id: string;
  name: string;
  course: string;
  holeCount: number;
  status: 'active' | 'completed';
  createdAt: string;
  playerCount: number;
  strokes: number | null;
  played: number;
  toPar: number | null;
};
export function total(player: Player, holes: Round['holes']) {
  const played = holes.filter((h) => player.scores[h.number] !== undefined);
  const strokes = played.reduce((n, h) => n + player.scores[h.number], 0);
  const par = played.reduce((n, h) => n + h.par, 0);
  return { strokes, played: played.length, toPar: strokes - par };
}
export function relative(value: number) {
  return value === 0 ? 'E' : value > 0 ? `+${value}` : String(value);
}
