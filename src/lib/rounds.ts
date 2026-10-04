import { db } from './db';
import { Actor, ApiError } from './api';
import type { Round, Player, RoundSummary } from './types';
import type { PoolClient } from 'pg';

export async function membership(id: string, who: Actor, client: PoolClient | typeof db = db) {
  const { rows } = await client.query(
    `SELECT p.id, p.user_id, r.host_user_id, r.status FROM participants p
    JOIN rounds r ON r.id=p.round_id WHERE p.round_id=$1 AND
    ((p.user_id=$2 AND $2 IS NOT NULL) OR (p.guest_token_hash=$3 AND $3 IS NOT NULL))
    ORDER BY (p.user_id=$2) DESC NULLS LAST LIMIT 1`,
    [id, who.userId, who.guestHash],
  );
  if (!rows[0]) throw new ApiError(403, 'Join this round to see its scorecard.');
  return {
    id: rows[0].id as string,
    isHost: who.userId !== null && rows[0].host_user_id === who.userId,
    status: rows[0].status as string,
  };
}
export async function snapshot(id: string, who: Actor): Promise<Round> {
  // One SQL statement gives a consistent snapshot even during simultaneous scoring.
  const { rows } = await db.query(
    `SELECT r.*,
    (SELECT json_agg(json_build_object('number',h.number,'par',h.par) ORDER BY h.number) FROM holes h WHERE h.round_id=r.id) AS holes,
    (SELECT json_agg(json_build_object('id',p.id,'nickname',p.nickname,'isHost',p.user_id=r.host_user_id,
      'scores',COALESCE((SELECT json_object_agg(s.hole_number,s.strokes) FROM scores s WHERE s.participant_id=p.id),'{}'::json)) ORDER BY p.joined_at)
      FROM participants p WHERE p.round_id=r.id) AS players,
    (SELECT p.id FROM participants p WHERE p.round_id=r.id AND ((p.user_id=$2 AND $2 IS NOT NULL) OR
      (p.guest_token_hash=$3 AND $3 IS NOT NULL)) ORDER BY (p.user_id=$2) DESC NULLS LAST LIMIT 1) AS viewer_id
    FROM rounds r WHERE r.id=$1`,
    [id, who.userId, who.guestHash],
  );
  const r = rows[0];
  if (!r) throw new ApiError(404, 'This round could not be found.');
  if (!r.viewer_id) throw new ApiError(403, 'Join this round to see its scorecard.');
  return {
    id: r.id,
    inviteCode: r.invite_code,
    name: r.name,
    course: r.course,
    holeCount: r.hole_count,
    status: r.status,
    revision: r.revision,
    createdAt: r.created_at.toISOString(),
    completedAt: r.completed_at?.toISOString() ?? null,
    holes: r.holes,
    players: r.players as Player[],
    viewerId: r.viewer_id,
    isHost: !!who.userId && r.host_user_id === who.userId,
  };
}
export async function history(who: Actor): Promise<RoundSummary[]> {
  const { rows } = await db.query(
    `SELECT r.id,r.name,r.course,r.hole_count,r.status,r.created_at,
    (SELECT count(*)::int FROM participants WHERE round_id=r.id) AS player_count,
    count(s.hole_number)::int AS played, sum(s.strokes)::int AS strokes, sum(s.strokes-h.par)::int AS to_par
    FROM participants p JOIN rounds r ON r.id=p.round_id
    LEFT JOIN scores s ON s.participant_id=p.id LEFT JOIN holes h ON h.round_id=r.id AND h.number=s.hole_number
    WHERE (p.user_id=$1 AND $1 IS NOT NULL) OR (p.guest_token_hash=$2 AND $2 IS NOT NULL)
    GROUP BY r.id ORDER BY r.created_at DESC LIMIT 50`,
    [who.userId, who.guestHash],
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    course: r.course,
    holeCount: r.hole_count,
    status: r.status,
    createdAt: r.created_at.toISOString(),
    playerCount: r.player_count,
    strokes: r.strokes,
    played: r.played,
    toPar: r.to_par,
  }));
}
export async function mutateRound<T>(
  id: string,
  who: Actor,
  mutation: (client: PoolClient, member: Awaited<ReturnType<typeof membership>>) => Promise<T>,
) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const locked = await client.query('SELECT id FROM rounds WHERE id=$1 FOR UPDATE', [id]);
    if (!locked.rowCount) throw new ApiError(404, 'This round could not be found.');
    const member = await membership(id, who, client);
    if (member.status !== 'active')
      throw new ApiError(409, 'This round is finished. The scorecard is read-only.');
    const result = await mutation(client, member);
    await client.query('UPDATE rounds SET revision=revision+1 WHERE id=$1', [id]);
    await client.query("SELECT pg_notify('round_updates',$1)", [id]);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
