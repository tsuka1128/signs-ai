ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS slack_msg_ai_summary     TEXT,
  ADD COLUMN IF NOT EXISTS slack_msg_anomaly_alert  TEXT,
  ADD COLUMN IF NOT EXISTS slack_msg_voice_check    TEXT,
  ADD COLUMN IF NOT EXISTS slack_msg_kpi_reminder   TEXT;
