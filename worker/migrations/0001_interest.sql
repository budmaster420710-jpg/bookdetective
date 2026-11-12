CREATE TABLE IF NOT EXISTS interest_subscribers (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  status TEXT NOT NULL CHECK(status IN ('pending','active','unsubscribed')),
  consent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TEXT,
  unsubscribed_at TEXT,
  verification_token_hash TEXT,
  verification_expires_at TEXT,
  unsubscribe_token_hash TEXT
);

CREATE TABLE IF NOT EXISTS email_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires INTEGER NOT NULL
);
