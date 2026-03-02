-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  UNIQUE NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  DEFAULT 'user',   -- 'user' | 'admin'
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ANALYSES TABLE (each prompt analysis is one row)
CREATE TABLE IF NOT EXISTS analyses (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
  prompt_text     TEXT         NOT NULL,
  attack_type     VARCHAR(50),                  -- 'safe'|'direct'|'jailbreak'|'obfuscated'|'hidden'
  threat_level    VARCHAR(20)  NOT NULL,         -- 'safe'|'warning'|'danger'
  threat_score    SMALLINT     NOT NULL,         -- 0-100
  confidence      SMALLINT     NOT NULL,         -- 0-100
  verdict         VARCHAR(100) NOT NULL,
  explanation     TEXT         NOT NULL,
  layer_results   JSONB        NOT NULL,         -- detection layer breakdown
  pipeline_steps  JSONB        NOT NULL,         -- pipeline status array
  is_blocked      BOOLEAN      DEFAULT FALSE,
  analyzed_at     TIMESTAMPTZ  DEFAULT NOW()
);

-- DETECTION_RULES TABLE (admin-configurable heuristic rules)
CREATE TABLE IF NOT EXISTS detection_rules (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  pattern     TEXT         NOT NULL,            -- regex pattern string
  attack_type VARCHAR(50)  NOT NULL,
  severity    VARCHAR(20)  NOT NULL,            -- 'low'|'medium'|'high'|'critical'
  is_active   BOOLEAN      DEFAULT TRUE,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action     VARCHAR(100) NOT NULL,             -- 'ANALYZE'|'LOGIN'|'REGISTER'|'DELETE'
  details    JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_analyses_user_id    ON analyses(user_id);
CREATE INDEX idx_analyses_threat     ON analyses(threat_level);
CREATE INDEX idx_analyses_attack     ON analyses(attack_type);
CREATE INDEX idx_analyses_date       ON analyses(analyzed_at DESC);
CREATE INDEX idx_audit_user          ON audit_logs(user_id);

-- SEED RULES
INSERT INTO detection_rules (name, pattern, attack_type, severity) VALUES
  ('Direct Override',       'ignore.*(previous|all|prior).*instruction', 'direct',     'critical'),
  ('System Prompt Leak',    'reveal.*system.*prompt|show.*system.*prompt','direct',    'critical'),
  ('Developer Mode',        'developer mode|jailbreak mode',             'direct',     'high'),
  ('DAN Jailbreak',         'act as dan|do anything now',                'jailbreak',  'high'),
  ('Persona Override',      'you are now|pretend you are|roleplay as',   'jailbreak',  'medium'),
  ('Base64 Encoded',        '[a-zA-Z0-9+/]{30,}={0,2}',                 'obfuscated', 'high'),
  ('ROT13 Pattern',         'rot13|cerivbhf|vafgehpgvbaf',               'obfuscated', 'medium'),
  ('HTML Comment Inject',   '<!--.*?-->',                                'hidden',     'high'),
  ('Hidden Bracket Block',  '\[hidden.*?\]|\[system.*?\]',               'hidden',     'high'),
  ('Admin Escalation',      'admin mode|root access|sudo|escalat',       'direct',     'critical');
