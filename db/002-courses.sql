CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  city text,
  state text,
  latitude double precision,
  longitude double precision,
  type text,
  par integer,
  phone text,
  website text,
  hole_count integer,
  scorecard jsonb,
  detail_fetched_at timestamptz,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS courses_state ON courses(state);
CREATE INDEX IF NOT EXISTS courses_name ON courses(lower(name) text_pattern_ops);
CREATE TABLE IF NOT EXISTS course_searches (
  query text PRIMARY KEY,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
