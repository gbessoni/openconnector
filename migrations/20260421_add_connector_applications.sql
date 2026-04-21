-- Connector applications (from the public referral_connector.html form).
-- Applied manually (no migration runner is configured in this project).

CREATE TABLE IF NOT EXISTS connector_applications (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  linkedin      TEXT NOT NULL,
  industry      TEXT,
  network       TEXT NOT NULL,
  referral      TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','declined')),
  review_note   TEXT,
  reviewer_id   INTEGER REFERENCES users(id),
  reviewed_at   TIMESTAMPTZ,
  created_user_id INTEGER REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connector_applications_status
  ON connector_applications (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_connector_applications_email_lower
  ON connector_applications (lower(email));
