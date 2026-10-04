CREATE TABLE IF NOT EXISTS rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code varchar(8) NOT NULL UNIQUE,
  name varchar(80) NOT NULL,
  course varchar(100) NOT NULL,
  hole_count integer NOT NULL CHECK (hole_count IN (9,18)),
  host_user_id text NOT NULL REFERENCES "user"(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed')),
  revision integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE TABLE IF NOT EXISTS holes (
  round_id uuid NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  number integer NOT NULL CHECK (number BETWEEN 1 AND 18),
  par integer NOT NULL DEFAULT 4 CHECK (par BETWEEN 3 AND 6),
  PRIMARY KEY(round_id, number)
);
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  user_id text REFERENCES "user"(id),
  guest_token_hash varchar(64),
  nickname varchar(30) NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR guest_token_hash IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS participant_user ON participants(round_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS participant_guest ON participants(round_id, guest_token_hash) WHERE guest_token_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS participant_nickname ON participants(round_id, lower(nickname));
CREATE INDEX IF NOT EXISTS participant_history ON participants(user_id, joined_at DESC);
CREATE TABLE IF NOT EXISTS scores (
  round_id uuid NOT NULL,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  hole_number integer NOT NULL,
  strokes integer NOT NULL CHECK (strokes BETWEEN 1 AND 30),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(participant_id, hole_number),
  FOREIGN KEY(round_id, hole_number) REFERENCES holes(round_id, number) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  hits integer NOT NULL DEFAULT 1,
  expires_at timestamptz NOT NULL
);
